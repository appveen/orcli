const fs = require('fs');
const path = require('path');
const chalk = require('chalk');
const shell = require('shelljs');
const jsonfile = require('jsonfile');

/**
 * @type {[{name:string,url:string,node:boolean,short:string,dependency:string[]}]}
 */
const repoList = jsonfile.readFileSync(path.join(__dirname, 'repo-list.json'));

function trigger(answers) {
    shell.rm('-rf', 'ODP_RELEASE');
    shell.rm('-rf', 'BRANCH');
    const ODP_RELEASE = answers.release;
    shell.exec(`echo ${ODP_RELEASE} > ODP_RELEASE`);
    shell.exec(`echo dev > BRANCH`);
    shell.pwd()
    for (let repo of repoList) {
        console.log(chalk.cyan('***********************************'));
        console.log(chalk.green(`PROCESS STARTED FOR :: ${repo.name}`));
        console.log(chalk.cyan('***********************************'));
        // if (repo.dependency && repo.dependency.length > 0) {
        //     for (let i = 0; i < repo.dependency.length; i++) {
        //         shell.cd(answers.workspace);
        //         const dep = repo.dependency[i];
        //         console.log(chalk.cyan('***********************************'));
        //         console.log(chalk.green(`BUILD STARTED FOR DEPENDENCY :: ${dep}`));
        //         console.log(chalk.cyan('***********************************'));
        //         const tempRepo = repoList.find(e => e.name === dep);
        //         buildImage(tempRepo, answers);
        //         console.log(chalk.cyan('***********************************'));
        //         console.log(chalk.green(`BUILD ENDED FOR DEPENDENCY :: ${dep}`));
        //         console.log(chalk.cyan('***********************************'));
        //     }
        // }
        shell.cd(answers.workspace);
        buildImage(repo, answers);
        console.log(chalk.cyan('***********************************'));
        console.log(chalk.green(`PROCESS ENDED FOR :: ${repo.name}`));
        console.log(chalk.cyan('***********************************'));
    }
}

/**
 * 
 * @param {{name:string,url:string,node:boolean,short:string,dependency:string[]}} repo 
 * @param {*} answers 
 */
function buildImage(repo, answers) {
    const ODP_RELEASE = answers.release;
    if (repo.short && repo.short !== 'B2B') {
        shell.touch(`CLEAN_BUILD_${repo.short}`)
    }
    if (fs.existsSync(repo.name)) {
        let lastPull;
        if (fs.existsSync(`LAST_PULL_${repo.name.toUpperCase()}`)) {
            lastPull = shell.cat(`LAST_PULL_${repo.name.toUpperCase()}`);
        }
        shell.cd(repo.name);
        shell.env['WORKSPACE'] = shell.pwd();
        shell.exec(`git stash`);
        shell.exec(`git checkout dev`);
        shell.exec(`git pull`);
        if (lastPull) {
            console.log(chalk.cyan(''));
            console.log(chalk.cyan('***********************************'));
            console.log(chalk.green(`Changes found`));
            console.log(chalk.cyan('***********************************'));
            shell.exec(`git log --pretty=oneline --since="${lastPull}"`);
            console.log(chalk.cyan('***********************************'));
            console.log(chalk.cyan(''));
        }
        shell.exec(`echo ${new Date().toISOString()} > ../LAST_PULL_${repo.name.toUpperCase()}`);
    } else {
        shell.exec(`git clone ${repo.url}`);
        shell.cd(repo.name);
        shell.env['WORKSPACE'] = shell.pwd();
        shell.exec(`git checkout dev`);
        shell.exec(`echo ${new Date().toISOString()} > ../LAST_PULL_${repo.name.toUpperCase()}`);
    }
    if (repo.node) {
        shell.exec(`npm i`);
    }
    if (fs.existsSync('scripts/build_image.sh')) {
        shell.exec(`sh scripts/build_image.sh ${ODP_RELEASE}`);
        shell.cd(answers.saveLocation);
        const imageName = `odp:${repo.short.toLowerCase()}.${ODP_RELEASE}`;
        const tarName = `odp_${repo.short.toLowerCase()}.${ODP_RELEASE}.tar`;
        if (fs.existsSync(`${tarName}`)) {
            shell.rm('-rf', `${tarName}`);
        }
        if (fs.existsSync(`${tarName}.bz2`)) {
            shell.rm('-rf', `${tarName}.bz2`);
        }
        shell.exec(`docker save -o ${tarName} ${imageName}`)
            .exec(`bzip2 odp_${repo.short.toLowerCase()}.${ODP_RELEASE}.tar`);
        if (repo.short === 'SM') {
            shell.exec(`docker save -o odp_base.${ODP_RELEASE}.tar odp:base.${ODP_RELEASE}`)
                .exec(`bzip2 odp_base.${ODP_RELEASE}.tar`);
        }
        if (repo.short === 'B2B') {
            shell.exec(`docker save -o odp_b2b.runner.${ODP_RELEASE}.tar odp:b2b.runner.${ODP_RELEASE}`)
                .exec(`bzip2 odp_b2b.runner.${ODP_RELEASE}.tar`);
        }
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

module.exports.trigger = trigger;