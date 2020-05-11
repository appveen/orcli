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
    if(!TAG){
        console.log(chalk.red('***********************************'));
        console.log(chalk.red(`New TAG Not Found`));
        console.log(chalk.red('***********************************'));
        process.exit(0);
    }
    if (repo.short && fs.existsSync(`LATEST_${repo.short.toUpperCase()}`)) {
        const latest = shell.cat(`LATEST_${repo.short.toUpperCase()}`);
        const oldTag = `odp:${repo.short.toLowerCase()}.${latest}`;
        const newTag = `odp:${repo.short.toLowerCase()}.${TAG}`;
        const newTar = `odp_${repo.short.toLowerCase()}.${TAG}.tar`;
        shell.cd(answers.saveLocation);
        shell.exec(`docker tag  ${oldTag} ${newTag}`)
            .exec(`docker save -o ${newTar} ${newTag}`)
            .exec(`bzip2 ${newTar}`);
    } else {
        console.log(chalk.red('***********************************'));
        console.log(chalk.red(`LATEST_${repo.short.toUpperCase()} Not Found, Please build new Image`));
        console.log(chalk.red('***********************************'));
        process.exit(0);
    }
}

module.exports.trigger = trigger;