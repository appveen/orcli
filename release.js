const os = require('os');
const fs = require('fs');
const path = require('path');
const chalk = require('chalk');
const shell = require('shelljs');

/**
 * @type {[{name:string,url:string,node:boolean,short:string}]}
 */
const repoList = JSON.parse(fs.readFileSync(path.join(__dirname, 'repo-list.json'), 'utf8'));

function trigger(answers) {
    shell.rm('-rf', 'ODP_RELEASE');
    shell.rm('-rf', 'BRANCH');
    const ODP_RELEASE = answers.release;
    shell.exec(`echo ${ODP_RELEASE} > ODP_RELEASE`);
    shell.exec(`echo dev > BRANCH`);
    shell.pwd()
    for (let repo of repoList) {
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
            if (answers.releaseType !== 'New Release') {
                shell.exec(`git checkout ${answers.branch}`);
            } else {
                shell.exec(`git checkout dev`);
            }
            shell.exec(`git pull ${repo.url}`);
        } else {
            shell.exec(`git clone ${repo.url}`);
            shell.cd(repo.name);
            shell.env['WORKSPACE'] = shell.pwd();
            shell.exec(`git checkout dev`);
        }
        if (repo.node) {
            shell.exec(`npm i`);
        }
        if (fs.existsSync('scripts/build_image.sh')) {
            shell.exec(`sh scripts/build_image.sh ${ODP_RELEASE}`);
            shell.cd(answers.saveLocation);
            console.log(`docker save -o odp_${repo.short.toLowerCase()}.${ODP_RELEASE}.tar odp:${repo.short.toLowerCase()}.${ODP_RELEASE}`);
            shell.exec(`docker save -o odp_${repo.short.toLowerCase()}.${ODP_RELEASE}.tar odp:${repo.short.toLowerCase()}.${ODP_RELEASE}`)
            .exec(`bzip2 odp_${repo.short.toLowerCase()}.${ODP_RELEASE}.tar`);
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
}

module.exports.trigger = trigger;