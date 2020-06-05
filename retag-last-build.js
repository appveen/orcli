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
    const repo = repoList.find(e => e.name === answers.repo);
    shell.cd(answers.workspace);
    console.log(chalk.cyan('***********************************'));
    console.log(chalk.green(`PROCESS STARTED FOR :: ${repo.name}`));
    console.log(chalk.cyan('***********************************'));
    reTagImage(repo, answers);
    console.log(chalk.cyan('***********************************'));
    console.log(chalk.green(`PROCESS ENDED FOR :: ${repo.name}`));
    console.log(chalk.cyan('***********************************'));
}

/**
 * 
 * @param {{name:string,url:string,node:boolean,short:string,dependency:string[]}} repo 
 * @param {*} answers 
 */
function reTagImage(repo, answers) {
    const TAG = answers.tag;
    let LATEST_FILE = `LATEST_${repo.short.toUpperCase()}`;
    if (repo.short && repo.short.toUpperCase() == 'NGINX') {
        LATEST_FILE = `LATEST_PROXY`;
    }
    if (!TAG) {
        console.log(chalk.red('***********************************'));
        console.log(chalk.red(`New TAG Not Found`));
        console.log(chalk.red('***********************************'));
        process.exit(0);
    }
    console.log(chalk.cyan('***********************************'));
    console.log(chalk.green(`WORKSPACE :: ${answers.workspace}`));
    console.log(chalk.cyan('***********************************'));
    shell.cd(answers.workspace);
    if (repo.short && fs.existsSync(LATEST_FILE)) {
        const latest = shell.cat(LATEST_FILE);
        const oldTag = `odp:${repo.short.toLowerCase()}.${latest}`.trim('\n').trim(' ');
        const newTag = `odp:${repo.short.toLowerCase()}.${TAG}`.trim('\n').trim(' ');
        const newTar = `odp_${repo.short.toLowerCase()}.${TAG}.tar`.trim('\n').trim(' ');
        const yamlFile = `${repo.short.toLowerCase()}.${TAG}.yaml`.trim('\n').trim(' ');
        const yamlPath = path.join(answers.saveLocation, 'yamls', yamlFile);
        shell.rm('-rf', `${yamlPath}`);
        shell.cd(repo.name);
        shell.cp(`${repo.short.toLowerCase()}.yaml`, yamlPath);
        shell.sed('-i', '__release_tag__', `'${answers.release}'`, yamlPath);
        shell.sed('-i', '__release__', `${TAG}`, yamlPath);
        shell.cd(answers.saveLocation);
        shell.exec(`docker tag ${oldTag} ${newTag}`)
            .exec(`docker save -o ${newTar} ${newTag}`)
            .exec(`bzip2 ${newTar}`);
        if(repo.short === 'SM'){
            shell.exec(`docker save -o odp_base.${answers.release} odp:base.${answers.release}`)
            .exec(`bzip2 odp_base.${answers.release}`);
        }
        if(repo.short === 'B2B'){
            shell.exec(`docker save -o odp_b2b.runner.${answers.release} odp:b2b.runner.${answers.release}`)
            .exec(`bzip2 odp_b2b.runner.${answers.release}`);
        }
    } else {
        console.log(chalk.red('***********************************'));
        console.log(chalk.red(`${LATEST_FILE} Not Found, Please build new Image`));
        console.log(chalk.red('***********************************'));
        process.exit(0);
    }
}

module.exports.trigger = trigger;