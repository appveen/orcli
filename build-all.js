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
    let ODP_BRANCH = answers.patch || answers.branch;
    let ODP_RELEASE;
    if (ODP_BRANCH.split('/').length > 1) {
        ODP_RELEASE = ODP_BRANCH.split('/').pop();
    } else {
        ODP_RELEASE = ODP_BRANCH;
        if (ODP_BRANCH !== 'dev' && ODP_BRANCH !== 'perf') {
            ODP_BRANCH = 'release/' + ODP_BRANCH;
        }
    }
    shell.exec(`echo ${ODP_RELEASE} > ODP_RELEASE`);
    shell.exec(`echo ${ODP_BRANCH} > BRANCH`);
    shell.pwd()
    repoList.filter(e => !e.disabled).reduce((prev, repo) => {
        return prev.then(() => {
            return new Promise((resolve, reject) => {
                // const repo = repoList.find(e => e.name === answers.repo);
                try {
                    if (repo.dependency && repo.dependency.length > 0) {
                        for (let i = 0; i < repo.dependency.length; i++) {
                            shell.cd(answers.workspace);
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
                    shell.cd(answers.workspace);
                    console.log(chalk.cyan('***********************************'));
                    console.log(chalk.green(`PROCESS STARTED FOR :: ${repo.name}`));
                    console.log(chalk.cyan('***********************************'));
                    buildImage(repo, answers);
                    console.log(chalk.cyan('***********************************'));
                    console.log(chalk.green(`PROCESS ENDED FOR :: ${repo.name}`));
                    console.log(chalk.cyan('***********************************'));
                    resolve();
                } catch (e) {
                    console.error(chalk.red(e));
                    reject(e);
                }
            });
        });
    }, Promise.resolve());
}

/**
 * 
 * @param {{name:string,url:string,node:boolean,short:string,dependency:string[]}} repo 
 * @param {*} answers 
 */
function buildImage(repo, answers) {
    const ODP_BRANCH = answers.patch || answers.branch;
    let ODP_RELEASE;
    if (ODP_BRANCH.split('/').length > 1) {
        ODP_RELEASE = ODP_BRANCH.split('/').pop();
    } else {
        ODP_RELEASE = ODP_BRANCH;
    }
    let tag = ODP_RELEASE;
    if (answers.tag) {
        tag = answers.tag;
    }
    if (repo.short && answers.cleanBuild) {
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
        shell.exec(`git checkout ${ODP_BRANCH}`);
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
        shell.exec(`git checkout ${ODP_BRANCH}`);
        shell.exec(`echo ${new Date().toISOString()} > ../LAST_PULL_${repo.name.toUpperCase()}`);
    }
    if (repo.short) {
        const yamlFile = `${repo.short.toLowerCase()}.${tag}.yaml`;
        const yamlPath = path.join(answers.saveLocation, 'yamls', yamlFile);
        shell.rm('-rf', `${yamlPath}`);
        shell.cp(`${repo.short.toLowerCase()}.yaml`, yamlPath);
        shell.sed('-i', '__release_tag__', `'${ODP_RELEASE}'`, yamlPath);
        shell.sed('-i', '__release__', `${tag}`, yamlPath);
    }
    if (fs.existsSync('scripts/build_image.sh')) {
        shell.exec(`sh scripts/build_image.sh ${tag}`);
        shell.cd(answers.saveLocation);
        if (repo.short) {
            const imageName = `odp:${repo.short.toLowerCase()}.${tag}`;
            const tarName = `odp_${repo.short.toLowerCase()}.${tag}.tar`;
            shell.rm('-rf', `${tarName}`);
            shell.rm('-rf', `${tarName}.bz2`);
            shell.exec(`docker save -o ${tarName} ${imageName}`)
                .exec(`bzip2 ${tarName}`);
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