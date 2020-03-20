const path = require('path');
const chalk = require('chalk');
const jsonfile = require('jsonfile');

/**
 * @type {[{name:string,url:string,node:boolean,short:string,dependency:string[]}]}
 */
const repoList = jsonfile.readFileSync(path.join(process.cwd(), 'repo-list.json'));

function hotfixScript(answers) {
    const script = [];
    const ODP_RELEASE = answers.patch || answers.branch;
    script.push(`#!/bin/bash`);
    script.push(`SET -e`);
    // script.push(`if [ ! -d ${answers.workspace} ]; then`);
    script.push(`\t mkdir -p ${answers.workspace}`);
    // script.push(`fi`);
    // script.push(`if [ ! -d ${answers.saveLocation} ]; then`);
    script.push(`\t mkdir -p ${answers.saveLocation}`);
    // script.push(`fi`);
    // script.push(`if [ ! -d ${path.join(answers.saveLocation, 'yamls')} ]; then`);
    script.push(`\t mkdir -p ${path.join(answers.saveLocation, 'yamls')}`);
    // script.push(`fi`);
    script.push(`cd ${answers.workspace}`);
    script.push(`rm -rf ODP_RELEASE`);
    script.push(`rm -rf BRANCH`);
    script.push(`rm -rf CICD`);
    script.push(`rm -rf ODP_NAMESPACE`);
    script.push(`echo ${ODP_RELEASE} > ODP_RELEASE`);
    script.push(`echo ${answers.branch} > BRANCH`);
    if(answers.deploy){
        script.push(`echo ${answers.namespace} > ODP_NAMESPACE`);
        script.push(`echo true > CICD`);
    }
    script.push(`cwd=$pwd`);
    const repo = repoList.find(e => e.name === answers.repo);
    if (repo.dependency && repo.dependency.length > 0) {
        for (let i = 0; i < repo.dependency.length; i++) {
            script.push(`cd ${answers.workspace}`);
            const dep = repo.dependency[i];
            script.push(`echo "${chalk.green('***********************************')}"`);
            script.push(`echo "${chalk.green(`BUILD STARTED FOR DEPENDENCY :: ${dep}`)}"`);
            script.push(`echo "${chalk.green('***********************************')}"`);
            const tempRepo = repoList.find(e => e.name === dep);
            buildImage(tempRepo, answers, script);
            script.push(`echo "${chalk.green('***********************************')}"`);
            script.push(`echo "${chalk.green(`BUILD ENDED FOR DEPENDENCY :: ${dep}`)}"`);
            script.push(`echo "${chalk.green('***********************************')}"`);
        }
    }
    script.push(`cd ${answers.workspace}`);
    script.push(`echo "${chalk.green('***********************************')}"`);
    script.push(`echo "${chalk.green(`PROCESS STARTED FOR :: ${repo.name}`)}"`);
    script.push(`echo "${chalk.green('***********************************')}"`);
    buildImage(repo, answers, script);
    script.push(`echo "${chalk.green('***********************************')}"`);
    script.push(`echo "${chalk.green(`PROCESS ENDED FOR :: ${repo.name}`)}"`);
    script.push(`echo "${chalk.green('***********************************')}"`);
    script.push(`exit 0`);
    return script.join('\n');
}

/**
 * 
 * @param {{name:string,url:string,node:boolean,short:string,dependency:string[]}} repo 
 * @param {*} answers 
 */
function buildImage(repo, answers, script) {
    const ODP_RELEASE = answers.patch || answers.branch;
    const yamlFile = `${repo.short.toLowerCase()}.${ODP_RELEASE}-hotfix-${answers.hotfix}.yaml`;
    const yamlPath = path.join(answers.saveLocation, 'yamls', yamlFile);
    const imageName = `odp:${repo.short.toLowerCase()}.${ODP_RELEASE}-hotfix-${answers.hotfix}`;
    const tarName = `odp_${repo.short.toLowerCase()}.${ODP_RELEASE}-hotfix-${answers.hotfix}.tar`;
    if (repo.short && answers.cleanBuild) {
        script.push(`touch CLEAN_BUILD_${repo.short}`);
    }
    script.push(`cd ${answers.workspace}`);
    // script.push(`echo ${repo.key} > ${repo.name.toUpperCase()}-KEY`);
    // script.push(`chmod 600 ${repo.name.toUpperCase()}-KEY`);
    script.push(`if [ -d ${repo.name} ]; then`);
    script.push(`\t lastPull=$(<LAST_PULL_${repo.name.toUpperCase()})`);
    script.push(`\t cd ${repo.name}`);
    // script.push(`\t export WORKSPACE=$cwd`);
    script.push(`\t git stash`);
    script.push(`\t git checkout ${answers.branch}`);
    // script.push(`\t ssh-agent bash -c 'ssh-add ../${repo.name.toUpperCase()}-KEY; git pull origin ${answers.branch}'`);
    script.push(`\t git pull origin ${answers.branch}`);
    script.push(`\t echo "${chalk.green('***********************************')}"`);
    script.push(`\t echo "${chalk.green('Changes found')}"`);
    script.push(`\t echo "${chalk.green('***********************************')}"`);
    script.push(`\t if [ $lastPull ]; then`);
    script.push(`\t\t git log --pretty=oneline --since=$lastPull`);
    script.push(`\t fi`);
    script.push(`\t echo "${chalk.green('***********************************')}"`);
    script.push(`else`);
    // script.push(`\t ssh-agent bash -c 'ssh-add ./${repo.name.toUpperCase()}-KEY; git clone ${repo.url}'`);
    script.push(`\t git clone ${repo.url}`);
    script.push(`\t cd ${repo.name}`);
    script.push(`\t git checkout ${answers.branch}`);
    script.push(`fi`);
    script.push(`echo \`date\` > ../LAST_PULL_${repo.name.toUpperCase()}`);
    script.push(`export WORKSPACE=${path.join(answers.workspace, repo.name)}`);
    script.push(`if [ -f ${repo.short.toLowerCase()}.yaml ]; then`);
    script.push(`\t rm -rf ${yamlPath}`);
    script.push(`\t cp ${repo.short.toLowerCase()}.yaml ${yamlPath}`);
    script.push(`\t sed -i.bak s/__release_tag__/"'${ODP_RELEASE}'"/  ${yamlPath}`);
    script.push(`\t sed -i.bak s#__release__#${ODP_RELEASE}-hotfix-${answers.hotfix}#  ${yamlPath}`);
    script.push(`fi`);
    script.push(`if [ -f scripts/build_image.sh ]; then`);
    script.push(`\t sh scripts/build_image.sh ${ODP_RELEASE} hotfix-${answers.hotfix}`);
    script.push(`\t if [ -f ${repo.short.toLowerCase()}.yaml ]; then`);
    script.push(`\t\t  cd ${answers.saveLocation}`);
    script.push(`\t\t  rm -rf ${tarName}`);
    script.push(`\t\t  rm -rf ${tarName}.bz2`);
    script.push(`\t\t  docker save -o ${tarName} ${imageName}`);
    script.push(`\t\t  bzip2 ${tarName}`);
    script.push(`\t fi`);
    script.push(`else`);
    script.push(`\t if [ -f scripts/build_jar.sh ]; then`);
    script.push(`\t\t sh scripts/build_jar.sh`);
    script.push(`\t fi`);
    script.push(`\t if [ -f scripts/setup.sh ]; then`);
    script.push(`\t\t sh scripts/setup.sh`);
    script.push(`\t fi`);
    script.push(`\t if [ -f scripts/build_executables.sh ]; then`);
    script.push(`\t\t sh scripts/build_executables.sh`);
    script.push(`\t fi`);
    script.push(`fi`);
}


module.exports.hotfixScript = hotfixScript;