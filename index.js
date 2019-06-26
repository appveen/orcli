const fs = require('fs');
const path = require('path');
const chalk = require('chalk');
const shell = require('shelljs');
const inquirer = require('inquirer');

if (!process.env.JAVA_HOME) {
    console.log(chalk.cyan('***********************************'));
    console.log(chalk.red('JAVA_HOME not found, please set JAVA_HOME'));
    console.log(chalk.cyan('***********************************'));
}

if (!process.env.MAVEN_HOME) {
    console.log(chalk.cyan('***********************************'));
    console.log(chalk.red('MAVEN_HOME not found, please set MAVEN_HOME'));
    console.log(chalk.cyan('***********************************'));
}

if (!process.env.M2_HOME) {
    console.log(chalk.cyan('***********************************'));
    console.log(chalk.red('M2_HOME not found, please set M2_HOME'));
    console.log(chalk.cyan('***********************************'));
}

/**
 * @type {[{name:string,url:string,node:boolean}]}
 */
const repoList = JSON.parse(fs.readFileSync('repo-list.json', 'utf8'));

console.log(chalk.cyan('***********************************'));
console.log(chalk.green('Welcome to ODP Release CLI'));
console.log(chalk.cyan('***********************************'));
console.log('');
inquirer
    .prompt([
        {
            type: 'list',
            name: 'releaseType',
            message: 'Please select release type',
            choices: [
                'New Release',
                'Patch Relase',
                'Hotfix'
            ]
        }, {
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
        }, {
            when: function (response) {
                return response.releaseType === 'Hotfix';
            },
            type: 'list',
            name: 'repo',
            message: 'Please select a repo for hotfix',
            choices: repoList
        }, {
            when: function (response) {
                return response.releaseType === 'Hotfix';
            },
            type: 'input',
            name: 'hotfix',
            message: 'Please enter hotfix number'
        }, {
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
        const workspace = path.join(process.cwd(), '../workspace');
        if (!fs.existsSync(workspace)) {
            fs.mkdirSync(workspace);
        }
        shell.cd(workspace);
        shell.rm('-rf', 'ODP_RELEASE');
        shell.rm('-rf', 'BRANCH');
        if (answers.releaseType == 'New Release') {
            shell.exec(`echo ${answers.release} > ODP_RELEASE`);
            shell.exec(`echo dev > BRANCH`);
        } else {
            shell.exec(`echo ${answers.patch} > ODP_RELEASE`);
            shell.exec(`echo ${answers.branch} > BRANCH`);
        }
        for (let repo of repoList) {
            if (fs.existsSync(repo.name)) {
                if (answers.releaseType !== 'New Release') {
                    shell.exec(`git checkout ${answers.branch}`);
                } else {
                    shell.exec(`git checkout dev`);
                }
                shell.exec(`git pull ${repo.url}`);
            } else {
                shell.exec(`git clone ${repo.url}`);
                if (answers.releaseType !== 'New Release') {
                    shell.exec(`git checkout ${answers.branch}`);
                } else {
                    shell.exec(`git checkout dev`);
                }
            }
            shell.exec(`cd ${repo.name}`);
            if (repo.node) {
                shell.exec(`npm i`);
            }
            shell.exec(`export WORKSPACE=pwd`);
            if (fs.existsSync('scripts/build_image.sh')) {
                shell.exec(`sh scripts/build_image.sh`);
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
        }
    });