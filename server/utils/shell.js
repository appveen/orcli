const { exec, execFile, spawn } = require('child_process');
const { Observable } = require('rxjs');

/**
 * 
 * @param {string} command 
 */
function executeSpawn(command) {
    return new Observable((observe) => {
        const child = spawn(command);
        child.on('error', function (err) {
            observe.error(err);
        });
        child.on('close', function () {
            observe.next(null);
            observe.complete();
        });
        child.stdout.on('data', function (chunk) {
            observe.next(chunk);
        });
        child.stderr.on('data', function (chunk) {
            observe.next(chunk);
        });
    });
}

/**
 * 
 * @param {string} command 
 */
function execute(command) {
    return new Observable((observe) => {
        const child = exec(command);
        child.on('error', function (err) {
            observe.error(err);
        });
        child.on('close', function () {
            observe.next(null);
            observe.complete();
        });
        child.stdout.on('data', function (chunk) {
            observe.next(chunk);
        });
        child.stderr.on('data', function (chunk) {
            observe.next(chunk);
        });
    });
}

/**
 * 
 * @param {string} filename 
 */
function executeFile(filename) {
    return new Observable((observe) => {
        const child = execFile(filename);
        child.on('error', function (err) {
            observe.error(err);
        });
        child.on('close', function () {
            observe.next(null);
            observe.complete();
        });
        child.stdout.on('data', function (chunk) {
            observe.next(chunk);
        });
        child.stderr.on('data', function (chunk) {
            observe.next(chunk);
        });
    });
}

module.exports.executeSpawn = executeSpawn;
module.exports.execute = execute;
module.exports.executeFile = executeFile;