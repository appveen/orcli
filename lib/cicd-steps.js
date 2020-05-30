const fs = require('fs');
const path = require('path');
const chalk = require('chalk');
const { Observable } = require('rxjs');
const { exec, execSync } = require('child_process');

/**
 * 
 * @typedef {object} Repo The Repo Details
 * @property {string} name
 * @property {string} folder
 * @property {string} url
 * @property {string} sshKey
 * @property {string[]} dependencies
 * 
 */


/**
 * 
 * @typedef {object} Options The Build Options
 * @property {Repo} repo
 * @property {string} workspace
 * @property {string} saveLocation
 * @property {string} repoFolder
 * @property {string} module
 * @property {string} branch
 * @property {string} release
 * @property {string} tag
 * @property {string} hotfix
 * @property {string} deploy
 * @property {string} clean
 * @property {string} namespace
 * 
 */


/**
* 
* @param {Options} options 
*/
function pullRepo(options) {
    const CWD = process.cwd();
    try {
        let lastPull;
        const LAST_PULL_FILE = 'LAST_PULL_' + options.repo.name;
        process.chdir(options.workspace);
        if (!fs.existsSync(options.repo.name)) {
            console.log(chalk.green('****************** Repo not found pulling ******************'));
            const data = execSync(`git clone ${options.repo.url}`);
            console.log(data);
        }
        if (fs.existsSync(LAST_PULL_FILE)) {
            lastPull = fs.readFileSync(LAST_PULL_FILE, 'utf-8');
        }
        process.chdir(options.depo.folder);
        console.log(execSync(`git checkout ${options.branch}`));
        console.log(execSync(`git pull origin ${options.branch}`));
        fs.writeFileSync(path.join(process.cwd(), '../', LAST_PULL_FILE), new Date().toISOString(), 'utf-8');
        if (lastPull) {
            console.log(chalk.green('****************** Changes Found ******************'));
            console.log(execSync(`git log --pretty=oneline --since="${lastPull}"`));
            console.log(chalk.green('***************************************************'));
        }
    } catch (e) {
        throw e;
    } finally {
        process.chdir(CWD);
    }
}



/**
 * 
 * @param {Options} options 
 */
function buildImage(options) {
    return new Observable(observe => {
        const timestamp = Date.now();
        if (!options.tag) {
            options.tag = `${options.release}`;
            if (options.hotfix) {
                options.tag += `.hotfix-${options.hotfix}`;
            }
        }
        if (options.deploy) {
            options.tag += `_${timestamp}`;
        }
        let buildCmd = `docker build -t odp:${options.module}.${options.tag} .`;
        if (options.clean) {
            buildCmd = `docker build --no-cache -t odp:${options.module}.${options.tag} .`
        }
        const cp = exec(buildCmd, {
            cwd: options.depo.folder,
            env: {
                WORKSPACE: options.depo.folder
            }
        });
        cp.stderr.on('data', (chunk) => {
            console.log(chunk);
        });
        cp.stderr.on('error', (err) => {
            observe.error(chunk);
        });
        cp.stdout.on('data', (chunk) => {
            console.log(chunk);
        });
        cp.stdout.on('error', (err) => {
            observe.error(chunk);
        });
        cp.on('close', () => {
            process.chdir(options.workspace);
            fs.writeFileSync('LATEST_' + options.module.toUpperCase(), options.tag, 'utf-8');
            observe.next(null);
            observe.complete();
        });
        cp.on('exit', () => {
            fs.writeFileSync('LATEST_' + options.module.toUpperCase(), options.tag, 'utf-8');
            observe.next(null);
            observe.complete();
        });
    });
}

/**
 * 
 * @param {Options} options 
 */
function saveImage(options) {
    return new Observable(observe => {
        const cp = exec(`docker save -o odp_${options.module}.${options.tag}.tar odp:${options.module}.${options.tag} && bzip2 odp_${options.module}.${options.tag}.tar`, {
            cwd: options.saveLocation
        });
        cp.stderr.on('data', (chunk) => {
            console.log(chunk);
        });
        cp.stderr.on('error', (err) => {
            observe.error(chunk);
        });
        cp.stdout.on('data', (chunk) => {
            console.log(chunk);
        });
        cp.stdout.on('error', (err) => {
            observe.error(chunk);
        });
        cp.on('close', () => {
            observe.next(null);
            observe.complete();
        });
        cp.on('exit', () => {
            observe.next(null);
            observe.complete();
        });
    });
}


/**
 * 
 * @param {Options} options 
 */
function prepareYamlForRelease(options) {
    const CWD = process.cwd();
    try {
        process.chdir(options.depo.folder);
        const newLines = [];
        const content = fs.readFileSync(`${options.module}.yaml`, 'utf-8');
        const lines = content.split('\n');
        lines.forEach(line => {
            if (line.indexOf('imagePullSecrets') == -1 && line.indexOf('name: regsecret') == -1) {
                line.replace(/__release_tag__/g, options.release);
                line.replace(/__release_tag__/g, options.tag);
                newLines.push(line);
            }
        });
        fs.writeFileSync(path.join(options.saveLocation, 'yamls', `${options.module}.${options.tag}.yaml`), newLines.join('\n'), 'utf-8');
        return true;
    } catch (e) {
        throw e;
    } finally {
        process.chdir(CWD);
    }
}

/**
 * 
 * @param {Options} options 
 */
function prepareYamlForDeploy(options) {
    const CWD = process.cwd();
    try {
        process.chdir(options.depo.folder);
        const newLines = [];
        const content = fs.readFileSync(`${options.module}.yaml`, 'utf-8');
        const lines = content.split('\n');
        lines.forEach(line => {
            if (line.indexOf('imagePullSecrets') == -1 && line.indexOf('name: regsecret') == -1) {
                line.replace(/__release_tag__/, options.release);
                line.replace(/__release_tag__/, options.tag);
                line.replace(/__namespace__/, options.namespace);
                line.replace(/__docker_registry_server__\//, '');
                newLines.push(line);
            }
        });
        fs.writeFileSync(path.join(options.saveLocation, 'yamls', `${options.module}.${options.tag}.yaml`), newLines.join('\n'), 'utf-8');
        return true;
    } catch (e) {
        throw e;
    } finally {
        process.chdir(CWD);
    }
}


/**
 * 
 * @param {Options} options 
 */
function deployImage(options) {
    return new Observable(observe => {
        let k8sCmd = `kubectl set image deployment/${options.module} ${options.module}=odp:${options.module}.${options.tag} -n ${options.namespace} --record`;
        if (options.clean) {
            k8sCmd = `kubectl delete svc,deploy -n ${options.namespace} ${options.module} && k create -f ${options.module}.${options.tag}.yaml`;
        }
        const cp = exec(k8sCmd, {
            cwd: path.join(options.saveLocation, 'yamls')
        });
        cp.stderr.on('data', (chunk) => {
            console.log(chunk);
        });
        cp.stderr.on('error', (err) => {
            observe.error(chunk);
        });
        cp.stdout.on('data', (chunk) => {
            console.log(chunk);
        });
        cp.stdout.on('error', (err) => {
            observe.error(chunk);
        });
        cp.on('close', () => {
            observe.next(null);
            observe.complete();
        });
        cp.on('exit', () => {
            observe.next(null);
            observe.complete();
        });
    });
}

/**
 * 
 * @param {Options} options 
 */
function uploadImage(options) {
    return new Observable(observe => {
        const imageName = `odp_${options.module}.${options.tag}.tar.bz2`;
        let k8sCmd = `scp -i ~/edelivery-key.pem ${imageName} ubuntu@edelivery.capiot.com:~/e-delivery/Releases/ODP/${options.release}/Images/`;
        const cp = exec(k8sCmd, {
            cwd: options.saveLocation
        });
        cp.stderr.on('data', (chunk) => {
            console.log(chunk);
        });
        cp.stderr.on('error', (err) => {
            observe.error(chunk);
        });
        cp.stdout.on('data', (chunk) => {
            console.log(chunk);
        });
        cp.stdout.on('error', (err) => {
            observe.error(chunk);
        });
        cp.on('close', () => {
            observe.next(null);
            observe.complete();
        });
        cp.on('exit', () => {
            observe.next(null);
            observe.complete();
        });
    });
}


/**
 * 
 * @param {Options} options 
 */
function reTagAndSave(options) {
    const CWD = process.cwd();
    try {
        const LATEST_TAG = 'LATEST_' + options.module.toUpperCase();
        process.chdir(options.saveLocation);
        console.log(execSync(`docker tag odp:${options.module}.${LATEST_TAG} odp:${options.module}.${options.tag}`));
        console.log(execSync(`docker save -o odp_${options.module}.${options.tag}.tar odp:${options.module}.${options.tag}`));
        console.log(execSync(`bzip2 odp_${options.module}.${options.tag}.tar`));
        return prepareYamlForRelease(options);
    } catch (e) {
        throw e;
    } finally {
        process.chdir(CWD);
    }
}


module.exports.pullRepo = pullRepo;
module.exports.buildImage = buildImage;
module.exports.saveImage = saveImage;
module.exports.prepareYamlForRelease = prepareYamlForRelease;
module.exports.prepareYamlForDeploy = prepareYamlForDeploy;
module.exports.deployImage = deployImage;
module.exports.uploadImage = uploadImage;
module.exports.reTagAndSave = reTagAndSave;