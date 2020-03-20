const { exec } = require('child_process');
const { Observable } = require('rxjs');

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


module.exports.execute = execute;