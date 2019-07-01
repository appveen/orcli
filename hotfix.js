const os = require('os');
const fs = require('fs');
const path = require('path');
const chalk = require('chalk');
const shell = require('shelljs');
const makeDir = require('make-dir');

/**
 * @type {[{name:string,url:string,node:boolean,short:string}]}
 */
const repoList = JSON.parse(fs.readFileSync(path.join(__dirname, 'repo-list.json'), 'utf8'));

function trigger(answers) {
    shell.rm('-rf', 'ODP_RELEASE');
    shell.rm('-rf', 'BRANCH');
    const ODP_RELEASE = answers.patch;
    shell.exec(`echo ${ODP_RELEASE} > ODP_RELEASE`);
    shell.exec(`echo ${answers.branch} > BRANCH`);
    shell.pwd()
    const repo = repoList.find(e => e.name === answers.repo);
    shell.cd(answers.workspace);
    console.log(chalk.cyan('***********************************'));
    console.log(chalk.green(`PROCESS STARTED FOR :: ${repo.name}`));
    console.log(chalk.cyan('***********************************'));
    if (repo.short) {
        shell.touch(`CLEAN_BUILD_${repo.short}`)
    }
    if (fs.existsSync(repo.name)) {
        shell.cd(repo.name);
        shell.env['WORKSPACE'] = shell.pwd();
        shell.exec(`git reset --hard`);
        shell.exec(`git stash`);
        shell.exec(`git checkout ${answers.branch}`);
        shell.exec(`git pull ${repo.url}`);
    } else {
        shell.exec(`git clone ${repo.url}`);
        shell.cd(repo.name);
        shell.env['WORKSPACE'] = shell.pwd();
        shell.exec(`git checkout ${answers.branch}`);
    }
    if (repo.node) {
        shell.exec(`npm i`);
    }
    if (fs.existsSync('scripts/build_image.sh')) {
        shell.exec(`sh scripts/build_image.sh ${ODP_RELEASE} hotfix-${answers.hotfix}`);
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

module.exports.trigger = trigger;