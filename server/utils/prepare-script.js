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
    script.push(`cDate=\`date +%Y.%m.%d.%H.%M\` #Current date and time`);
    script.push(`mkdir -p ${answers.workspace}`);
    script.push(`mkdir -p ${answers.saveLocation}`);
    script.push(`mkdir -p ${path.join(answers.saveLocation, 'yamls')}`);
    script.push(`cd ${answers.workspace}`);
    script.push(`rm -rf ODP_RELEASE`);
    script.push(`rm -rf BRANCH`);
    script.push(`rm -rf CICD`);
    script.push(`rm -rf ODP_NAMESPACE`);
    script.push(`echo ${ODP_RELEASE} > ODP_RELEASE`);
    script.push(`echo ${answers.branch} > BRANCH`);
    if (answers.deploy) {
        script.push(`echo ${answers.namespace} > ODP_NAMESPACE`);
    }
    script.push(`cwd=$pwd`);
    const repo = repoList.find(e => e.name === answers.repo);
    if (repo.dependency && repo.dependency.length > 0) {
        for (let i = 0; i < repo.dependency.length; i++) {
            script.push(`cd ${answers.workspace}`);
            const dep = repo.dependency[i];
            script.push(`echo "${chalk.bold.green('***********************************')}"`);
            script.push(`echo "${chalk.bold.green(`BUILD STARTED FOR DEPENDENCY :: ${dep}`)}"`);
            script.push(`echo "${chalk.bold.green('***********************************')}"`);
            const tempRepo = repoList.find(e => e.name === dep);
            buildImage(tempRepo, answers, script);
            script.push(`echo "${chalk.bold.green('***********************************')}"`);
            script.push(`echo "${chalk.bold.green(`BUILD ENDED FOR DEPENDENCY :: ${dep}`)}"`);
            script.push(`echo "${chalk.bold.green('***********************************')}"`);
        }
    }
    script.push(`cd ${answers.workspace}`);
    script.push(`echo "${chalk.bold.green('***********************************')}"`);
    script.push(`echo "${chalk.bold.green(`PROCESS STARTED FOR :: ${repo.name}`)}"`);
    script.push(`echo "${chalk.bold.green('***********************************')}"`);
    buildImage(repo, answers, script);
    if (answers.upload) {
        script.push(`echo "${chalk.bold.blue('***********************************')}"`);
        script.push(`echo "${chalk.bold.blue(`UPLOADING TO E-DELIVERY :: ${repo.name}`)}"`);
        script.push(`echo "${chalk.bold.blue('***********************************')}"`);
        script.push(`cd ${answers.saveLocation}`);
        script.push(`rsync -Pav "ssh -i /home/ubuntu/edelivery-key" odp_${repo.short.toLowerCase()}.$TAG.tar.bz2 ubuntu@edelivery.capiot.com:~/e-delivery/Releases/ODP/${answers.branch}/Hotfix/${repo.short}/${repo.short}-hotfix-${answers.hotfix}/`);
        script.push(`rsync -Pav "ssh -i /home/ubuntu/edelivery-key" yamls/${repo.short.toLowerCase()}.$TAG.yaml ubuntu@edelivery.capiot.com:~/e-delivery/Releases/ODP/${answers.branch}/Hotfix/${repo.short}/${repo.short}-hotfix-${answers.hotfix}/.`);
        script.push(`echo "${chalk.bold.blue('***********************************')}"`);
        script.push(`echo "${chalk.bold.blue(`UPLOADED TO E-DELIVERY :: ${repo.name}`)}"`);
        script.push(`echo "${chalk.bold.blue('***********************************')}"`);
    }
    script.push(`echo "${chalk.bold.green('***********************************')}"`);
    script.push(`echo "${chalk.bold.green(`PROCESS ENDED FOR :: ${repo.name}`)}"`);
    script.push(`echo "${chalk.bold.green('***********************************')}"`);
    script.push(`exit 0`);
    return script.join('\n');
}

/**
 * 
 * @param {{name:string,url:string,node:boolean,short:string,dependency:string[]}} repo 
 * @param {*} answers 
 */
function buildImage(repo, answers, script) {
    if (!repo.short) {
        repo.short = '';
    }
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
    script.push(`\tlastPull=$(<LAST_PULL_${repo.name.toUpperCase()})`);
    script.push(`\tcd ${repo.name}`);
    // script.push(`\texport WORKSPACE=$cwd`);
    script.push(`\tgit stash`);
    script.push(`\tgit checkout ${answers.branch}`);
    // script.push(`\tssh-agent bash -c 'ssh-add ../${repo.name.toUpperCase()}-KEY; git pull origin ${answers.branch}'`);
    script.push(`\tgit pull origin ${answers.branch}`);
    script.push(`\techo "${chalk.bold.green('***********************************')}"`);
    script.push(`\techo "${chalk.bold.green('Changes found')}"`);
    script.push(`\techo "${chalk.bold.green('***********************************')}"`);
    script.push(`\tif [ $lastPull ]; then`);
    script.push(`\t\tgit log --pretty=oneline --since=$lastPull`);
    script.push(`\tfi`);
    script.push(`\techo "${chalk.bold.green('***********************************')}"`);
    script.push(`else`);
    // script.push(`\tssh-agent bash -c 'ssh-add ./${repo.name.toUpperCase()}-KEY; git clone ${repo.url}'`);
    script.push(`\tgit clone ${repo.url}`);
    script.push(`\tcd ${repo.name}`);
    script.push(`\tgit checkout ${answers.branch}`);
    script.push(`fi`);
    script.push(`echo \`date -Is\` > ../LAST_PULL_${repo.name.toUpperCase()}`);
    script.push(`export WORKSPACE=${path.join(answers.workspace, repo.name)}`);
    script.push(`if [ -f ${repo.short.toLowerCase()}.yaml ]; then`);
    script.push(`\trm -rf ${yamlPath}`);
    script.push(`\tcp ${repo.short.toLowerCase()}.yaml ${yamlPath}`);
    script.push(`\tsed -i.bak s/__release_tag__/"'${ODP_RELEASE}'"/  ${yamlPath}`);
    script.push(`\tsed -i.bak s#__release__#${ODP_RELEASE}-hotfix-${answers.hotfix}#  ${yamlPath}`);
    script.push(`fi`);
    if (answers.deploy && repo.short) {
        script.push(`TAG=${ODP_RELEASE}-hotfix-${answers.hotfix}"_"$cDate`);
    } else {
        script.push(`TAG=${ODP_RELEASE}-hotfix-${answers.hotfix}`);
    }
    script.push(`if [ -f scripts/build_image.sh ]; then`);
    if (answers.deploy && repo.short) {
        script.push(`\tsh scripts/build_image.sh ${ODP_RELEASE} hotfix-${answers.hotfix}"_"$cDate`);
    } else {
        script.push(`\tsh scripts/build_image.sh ${ODP_RELEASE} hotfix-${answers.hotfix}`);
    }
    script.push(`\tif [ -f ${repo.short.toLowerCase()}.yaml ]; then`);
    script.push(`\t\tcd ${answers.saveLocation}`);
    script.push(`\t\trm -rf ${tarName}`);
    script.push(`\t\trm -rf ${tarName}.bz2`);
    script.push(`\t\tdocker save -o ${tarName} ${imageName}`);
    script.push(`\t\tbzip2 ${tarName}`);
    if (answers.deploy && repo.short) {
        script.push(`\t\tkubectl set image deployment/${repo.short.toLowerCase()} ${repo.short.toLowerCase()}=odp:${repo.short.toLowerCase()}.$TAG -n ${answers.namespace} --record=true`);
    }
    script.push(`\tfi`);
    script.push(`else`);
    script.push(`\tif [ -f scripts/build_jar.sh ]; then`);
    script.push(`\t\tsh scripts/build_jar.sh`);
    script.push(`\tfi`);
    script.push(`\tif [ -f scripts/setup.sh ]; then`);
    script.push(`\t\tsh scripts/setup.sh`);
    script.push(`\tfi`);
    script.push(`\tif [ -f scripts/build_executables.sh ]; then`);
    script.push(`\t\tsh scripts/build_executables.sh`);
    script.push(`\tfi`);
    script.push(`fi`);
}


module.exports.hotfixScript = hotfixScript;