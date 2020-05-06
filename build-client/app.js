const { execFile } = require('child_process');
const os = require('os');
const fs = require('fs');
const path = require('path');
const https = require('https');
const express = require('express');
const log4js = require('log4js');
const { Observable } = require('rxjs');

const PORT = process.env.PORT || 8000;
const LOG_LEVEL = process.env.LOG_LEVEL || 'info';

const logger = log4js.getLogger('server');
const app = express();
let logFile = path.join('./logs/');
if (process.env.NODE_ENV === 'production') {
    logFile = path.join('/var/log/orcli/');
}
let client;

log4js.configure({
    appenders: { 'out': { type: 'stdout' }, server: { type: 'multiFile', base: logFile, property: 'categoryName', extension: '.log', maxLogSize: 10485760, backups: 3, compress: true } },
    categories: { default: { appenders: ['out', 'server'], level: LOG_LEVEL } }
});

app.use(express.json({
    inflate: true
}));

app.use((req, res, next) => {
    logger.info(req.method, req.headers['x-forwarded-for'] || req.connection.remoteAddress, req.path);
    next();
});

app.get('/', (req, res) => {
    res.json({ messsage: 'ORCLI Build Service is running on: ' + PORT });
});

app.post('/trigger', (req, res) => {
    if (!req.body.script) {
        return res.status(400).json({
            messsage: 'Script is Needed'
        });
    }
    const filePath = path.join(os.tmpdir(), Date.now());
    fs.writeFileSync(filePath, req.body.script, 'utf-8');
    runScript(filePath).subscribe(data => {
        if (socket) {
            socket.write({
                status: 200,
                data
            });
        }
    }, err => {
        if (socket) {
            socket.write({
                status: 500,
                data
            });
        }
    });
    res.status(200).json({
        messsage: 'Created'
    });
});

const server = https.createServer({
    ca: fs.readFileSync('./keys/ca.crt'),
    cert: fs.readFileSync('./keys/server.crt'),
    key: fs.readFileSync('./keys/server.key'),
    requestCert: true,
}, app).listen(PORT, (err) => {
    if (!err) {
        logger.info('Server is listening on port', PORT);
    } else {
        logger.error(err);
    }
});

server.on('secureConnection', function (socket) {
    logger.info('Client connected through TLS', socket.remoteAddress, socket.authorized);
    if (socket.authorized) {
        client = socket;
    }
});

server.on('tlsClientError', function (err, socket) {
    logger.info('Client Error', err, socket.authorized);
});

server.on('close', function () {
    logger.info('Client disconnected through TCP');
});


function runScript(path) {
    return new Observable(observe => {
        const cp = execFile(path);
        cp.on('error', function (err) {
            observe.error(err);
        });
        cp.on('close', function () {
            observe.next(null);
            observe.complete();
        });
        cp.on('exit', function () {
            observe.next(null);
            observe.complete();
        });
        cp.stdout.on('data', function (chunk) {
            observe.next(chunk);
        });
        cp.stderr.on('data', function (chunk) {
            observe.next(chunk);
        });
    });
}