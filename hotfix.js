const fs = require('fs');
const path = require('path');
const chalk = require('chalk');
const shell = require('shelljs');

/**
 * @type {[{name:string,url:string,node:boolean,short:string,dependency:string[]}]}
 */
const repoList = JSON.parse(fs.readFileSync(path.join(__dirname, 'repo-list.json'), 'utf8'));

function trigger(answers) {
    shell.rm('-rf', 'ODP_RELEASE');
    shell.rm('-rf', 'BRANCH');
    const ODP_RELEASE = answers.patch || answers.branch;
    shell.exec(`echo ${ODP_RELEASE} > ODP_RELEASE`);
    shell.exec(`echo ${answers.branch} > BRANCH`);
    shell.pwd()
    const repo = repoList.find(e => e.name === answers.repo);
    shell.cd(answers.workspace);
    if (repo.dependency && repo.dependency.length > 0) {
        for (let i = 0; i < repo.dependency.length; i++) {
            const dep = repo.dependency[i];
            console.log(chalk.cyan('***********************************'));
            console.log(chalk.green(`BUILD STARTED FOR DEPENDENCY :: ${dep}`));
            console.log(chalk.cyan('***********************************'));
            const tempRepo = repoList.find(e => e.name === dep);
            buildImage(tempRepo, answers);
            console.log(chalk.cyan('***********************************'));
            console.log(chalk.green(`BUILD ENDED FOR DEPENDENCY :: ${dep}`));
            console.log(chalk.cyan('***********************************'));
        }
    }
    console.log(chalk.cyan('***********************************'));
    console.log(chalk.green(`PROCESS STARTED FOR :: ${repo.name}`));
    console.log(chalk.cyan('***********************************'));
    buildImage(repo, answers);
    console.log(chalk.cyan('***********************************'));
    console.log(chalk.green(`PROCESS ENDED FOR :: ${repo.name}`));
    console.log(chalk.cyan('***********************************'));
}

function buildImage(repo, answers) {
    const ODP_RELEASE = answers.patch || answers.branch;
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
    if (repo.short) {
        const yamlFile = `${repo.short.toLowerCase()}.${ODP_RELEASE}-hotfix-${answers.hotfix}.yaml`;
        const yamlPath = path.join(answers.saveLocation, 'yamls', yamlFile);
        shell.cp(`${repo.short.toLowerCase()}.yaml`, yamlPath);
        shelljs.sed('-i', '__release_tag__', `'${ODP_RELEASE}'`, yamlPath);
        shelljs.sed('-i', '__release__', `${ODP_RELEASE}-hotfix-${answers.hotfix}`, yamlPath);
    }
    if (fs.existsSync('scripts/build_image.sh')) {
        shell.exec(`sh scripts/build_image.sh ${ODP_RELEASE} hotfix-${answers.hotfix}`);
        shell.cd(answers.saveLocation);
        shell.exec(`docker save -o odp_${repo.short.toLowerCase()}.${ODP_RELEASE}-hotfix-${answers.hotfix}.tar odp:${repo.short.toLowerCase()}.${ODP_RELEASE}-hotfix-${answers.hotfix}`)
            .exec(`bzip2 odp_${repo.short.toLowerCase()}.${ODP_RELEASE}-hotfix-${answers.hotfix}.tar`);
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