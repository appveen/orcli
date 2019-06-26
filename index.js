const os = require('os');
const fs = require('fs');
const path = require('path');
const chalk = require('chalk');
const shell = require('shelljs');
const makeDir = require('make-dir');
const inquirer = require('inquirer');

if (!process.env.JAVA_HOME) {
    console.log(chalk.cyan('***********************************'));
    console.log(chalk.red('JAVA_HOME not found, please set JAVA_HOME'));
    console.log(chalk.cyan('***********************************'));
    process.exit();
}

if (!process.env.MAVEN_HOME) {
    console.log(chalk.cyan('***********************************'));
    console.log(chalk.red('MAVEN_HOME not found, please set MAVEN_HOME'));
    console.log(chalk.cyan('***********************************'));
    process.exit();
}

if (!process.env.M2_HOME) {
    console.log(chalk.cyan('***********************************'));
    console.log(chalk.red('M2_HOME not found, please set M2_HOME'));
    console.log(chalk.cyan('***********************************'));
    process.exit();
}

/**
 * @type {[{name:string,url:string,node:boolean,short:string}]}
 */
const repoList = JSON.parse(fs.readFileSync('repo-list.json', 'utf8'));

const config = JSON.parse(fs.readFileSync('config.json', 'utf8'));

console.log(chalk.cyan('***********************************'));
console.log(chalk.green('Welcome to ODP Release CLI'));
console.log(chalk.cyan('***********************************'));
console.log('');
inquirer
    .prompt([
        {
            type: 'input',
            name: 'workspace',
            message: 'Please enter workspace location',
            default: path.join(os.homedir(), 'orcli/workspace'),
            when: function (response) {
                if (config.workspace && config.workspace.trim()) {
                    return false;
                }
                return true;
            }
        },
        {
            type: 'list',
            name: 'releaseType',
            message: 'Please select release type',
            choices: [
                'New Release',
                'Patch Relase',
                'Hotfix'
            ]
        },
        {
            when: function (response) {
                return response.releaseType === 'New Release';
            },
            type: 'input',
            name: 'release',
            message: 'Please enter release version'
        }, {
            when: function (response) {
                return response.releaseType === 'Patch Relase' || response.releaseType === 'Hotfix';
            },
            type: 'input',
            name: 'branch',
            message: 'Please enter branch'
        },
        {
            when: function (response) {
                return response.releaseType === 'Hotfix';
            },
            type: 'list',
            name: 'repo',
            message: 'Please select a repo for hotfix',
            choices: repoList
        },
        {
            when: function (response) {
                return response.releaseType === 'Hotfix';
            },
            type: 'input',
            name: 'hotfix',
            message: 'Please enter hotfix number'
        },
        {
            when: function (response) {
                return response.releaseType === 'Patch Relase';
            },
            type: 'input',
            name: 'patch',
            message: 'Please enter patch version'
        }
    ])
    .then(answers => {
        console.log(answers);
        const workspace = path.join(__dirname, path.relative(__dirname, answers.workspace));
        // if (!fs.existsSync(workspace)) {
            
        // }
        makeDir.sync(workspace);
        shell.cd(workspace);
        shell.rm('-rf', 'ODP_RELEASE');
        shell.rm('-rf', 'BRANCH');
        let ODP_RELEASE;
        if (answers.releaseType == 'New Release') {
            ODP_RELEASE = answers.release;
            shell.exec(`echo ${answers.release} > ODP_RELEASE`);
            shell.exec(`echo dev > BRANCH`);
        } else {
            ODP_RELEASE = answers.patch;
            shell.exec(`echo ${answers.patch} > ODP_RELEASE`);
            shell.exec(`echo ${answers.branch} > BRANCH`);
        }
        shell.pwd()
        for (let repo of repoList) {
            shell.cd(workspace);
            console.log(chalk.cyan('***********************************'));
            console.log(chalk.green(`PROCESS STARTED FOR :: ${repo.name}`));
            console.log(chalk.cyan('***********************************'));
            if(repo.short){
                shell.touch(`CLEAN_BUILD_${repo.short}`)
            }
            if (fs.existsSync(repo.name)) {
                shell.cd(repo.name);
                shell.env['WORKSPACE'] = shell.pwd();
                shell.exec(`git reset --hard`);
                if (answers.releaseType !== 'New Release') {
                    shell.exec(`git checkout ${answers.branch}`);
                } else {
                    shell.exec(`git checkout dev`);
                }
                shell.exec(`git pull ${repo.url}`);
            } else {
                shell.exec(`git clone ${repo.url}`);
                shell.cd(repo.name);
                if (answers.releaseType !== 'New Release') {
                    shell.exec(`git checkout ${answers.branch}`);
                } else {
                    shell.exec(`git checkout dev`);
                }
            }
            if (repo.node) {
                shell.exec(`npm i`);
            }
            if (fs.existsSync('scripts/build_image.sh')) {
                shell.exec(`sh scripts/build_image.sh ${ODP_RELEASE}`);
            } else {
                if (fs.existsSync('scripts/build_jar.sh')) {
                    shell.exec(`sh scripts/build_jar.sh`);
                }
                if (fs.existsSync('scripts/setup.sh')) {
                    shell.exec(`sh scripts/setup.sh`);
                }
                if (fs.existsSync('scripts/build_executables.sh')) {
                    shell.exec(`sh scripts/build_executables.sh`);
                }
            }
            console.log(chalk.cyan('***********************************'));
            console.log(chalk.green(`PROCESS ENDED FOR :: ${repo.name}`));
            console.log(chalk.cyan('***********************************'));
        }
    });