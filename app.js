const fs = require('fs');
const path = require('path');
const express = require('express');
const expressSession = require('express-session');
const http = require('http');
const cookieParser = require('cookie-parser');
const log4js = require('log4js');
const socket = require('socket.io');
const CRON = require('node-schedule');

const shell = require('./utils/shell');

const PORT = process.env.PORT || 3001;
const LOG_LEVEL = process.env.LOG_LEVEL || 'info';
const SCRIPT_PATH = process.env.SCRIPT_PATH || path.join(__dirname, 'cicd.sh');
const BASE_PATH = process.env.BASE_PATH || '/friday-ci/'

const logger = log4js.getLogger('server');
const app = express();
const router = express.Router();
const server = http.createServer(app);
const io = socket(server, { path: '/socket' });

global.socket = io;
global.dbPath = path.join(__dirname, 'db');
global.secret = 'itworks@123123123';
global.cookieName = 'orcli-session';

if (!fs.existsSync(global.dbPath)) {
    fs.mkdirSync(global.dbPath);
}

log4js.configure({
    appenders: { 'out': { type: 'stdout' }, server: { type: 'multiFile', base: 'logs/', property: 'categoryName', extension: '.log', maxLogSize: 10485760, backups: 3, compress: true } },
    categories: { default: { appenders: ['out', 'server'], level: LOG_LEVEL } }
});
app.use('/friday-ci', express.static(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());
app.use(express.urlencoded());
app.use(cookieParser());
app.use(expressSession({
    secret: global.secret,
    name: 'friday-ci',
    cookie: { maxAge: 3600000, secure: false, httpOnly: true }
}))
app.set('view engine', 'ejs');

app.use((req, res, next) => {
    logger.info(req.method, req.headers['x-forwarded-for'] || req.connection.remoteAddress, req.path);
    res.locals.basePath = BASE_PATH;
    next();
});

app.use(BASE_PATH, router);

app.get('/', (req, res) => {
    res.redirect(BASE_PATH);
});

router.get('/', (req, res) => {
    res.redirect(BASE_PATH + 'login');
});

router.get('/login', (req, res) => {
    res.locals.message = null;
    if (!req.session.loggedIn) {
        res.render('login');
    } else {
        res.redirect(BASE_PATH + 'home');
    }
});

router.post('/login', (req, res) => {
    res.locals.message = null;
    if (req.session.loggedIn) {
        return res.redirect(BASE_PATH + 'home');
    }
    const username = req.body.username;
    const password = req.body.password;
    if (username && username.trim() && password && password.trim()) {
        if (username === 'admin' && password === '123123123') {
            return res.redirect(BASE_PATH + 'home');
        } else {
            res.locals.message = 'Invalid Username/Password';
            return res.render('login');
        }
    } else {
        res.locals.message = 'Invalid Username/Password';
        return res.render('login');
    }
});

router.post('/logout', (req, res) => {
    res.locals.message = null;
    if (req.session.loggedIn) {
        req.session.destroy();
    }
    return res.redirect(BASE_PATH);
});

router.get('/home', (req, res) => {
    let content = '';
    if (fs.existsSync(SCRIPT_PATH)) {
        content = fs.readFileSync(SCRIPT_PATH, 'utf-8');
    }
    res.render('index', { script: content });
});

router.post('/script', (req, res) => {
    const payload = req.body;
    fs.writeFileSync(SCRIPT_PATH, payload.script, 'utf-8');
    shell.mkdir(path.join(__dirname, 'repos'));
    shell.mkdir(path.join(__dirname, 'repos/logs'));
    shell.cd(path.join(__dirname, 'repos'));

    if (global.job) {
        global.job.cancel();
    }
    // global.job = CRON.scheduleJob('0 */2 * * *', function (fireDate) {
    //     const timeStamp = new Date().toISOString();
    //     shell.execute(`sh ../cicd.sh > ./logs/cicd_${timeStamp}.log`); 
    // });
    const timeStamp = new Date().toISOString();
    shell.execute(`sh ../cicd.sh > ./logs/cicd_${timeStamp}.log`).subscribe(data => {
        logger.info(data);
    });
    res.redirect(BASE_PATH + 'home');
});


server.listen(PORT, (err) => {
    if (!err) {
        logger.info('Server is listening on port', PORT);
    } else {
        logger.error(err);
    }
});