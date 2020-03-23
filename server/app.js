const fs = require('fs');
const path = require('path');
const express = require('express');
const bodyParser = require('body-parser');
const log4js = require('log4js');

const PORT = process.env.PORT || 3000;
const LOG_LEVEL = process.env.LOG_LEVEL || 'info';

const logger = log4js.getLogger('server');
const app = express();

global.dbPath = path.join(__dirname, 'db');

if (!fs.existsSync(global.dbPath)) {
    fs.mkdirSync(global.dbPath);
}

log4js.configure({
    appenders: { 'out': { type: 'stdout' }, server: { type: 'multiFile', base: 'logs/', property: 'categoryName', extension: '.log', maxLogSize: 10485760, backups: 3, compress: true } },
    categories: { default: { appenders: ['out', 'server'], level: LOG_LEVEL } }
});

app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.json());

app.use((req, res, next) => {
    logger.info(req.method, req.headers['x-forwarded-for'] || req.connection.remoteAddress, req.path);
    next();
});

// app.use((req, res, next) => {
//     const token = req.headers.authorization;
//     if (req.path.indexOf('/auth') > -1) {
//         next();
//     } else if (req.path.indexOf('/orcli') > -1 && token && token === 'ORCLI') {
//         next();
//     } else {
//         res.status(401).json({
//             message: 'Unauthorised'
//         });
//     }
// });

app.use('/api', require('./controllers'));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});


app.listen(PORT, (err) => {
    if (!err) {
        logger.info('Server is listening on port', PORT);
    } else {
        logger.error(err);
    }
});