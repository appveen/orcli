const { exec } = require('child_process');
const { execSync } = require('child_process');
const { Observable } = require('rxjs');

/**
 * 
 * @param {string} command 
 */
function execute(command) {
    return new Observable((observe) => {
        const child = exec(command);
        child.on('error', function (err) {
            console.log('*********** BUILD FAILED ***********');
            observe.error(err);
        });
        child.on('close', function () {
            observe.next(null);
            observe.complete();
        });
        child.stdout.on('data', function (chunk) {
            observe.next(chunk);
        });
        child.stdout.on('error', function (err) {
            console.log('*********** BUILD FAILED ***********');
            observe.error(err);
        });
        child.stderr.on('data', function (chunk) {
            observe.next(chunk);
        });
        child.stderr.on('error', function (err) {
            console.log('*********** BUILD FAILED ***********');
            observe.error(err);
        });
    });
}

/**
 * 
 * @param {string} command 
 */
function executeSync(command) {
    return execSync(command);
}

/**
 * 
 * @param {string} path 
 */
function mkdir(path) {
    return execSync(`mkdir -p ${path}`);
}

/**
 * 
 * @param {string} path 
 */
function cd(path) {
    return process.chdir(path);
}

/**
 * 
 * @param {string} command 
 */
function rm(command) {
    return execSync(`rm -rf ${command}`, { cwd: process.cwd() });
}

module.exports.execute = execute;
module.exports.executeSync = executeSync;
module.exports.mkdir = mkdir;
module.exports.cd = cd;
module.exports.rm = rm;