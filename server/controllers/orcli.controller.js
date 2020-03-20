const os = require('os');
const path = require('path');
const makeDir = require('make-dir');
const dateformat = require('dateformat');
const router = require('express').Router();
const log4js = require('log4js');
const jsonfile = require('jsonfile');

const buildsModel = require('../models/builds.model');
const prepareScript = require('../utils/prepare-script');

/**
 * @type {[{name:string,url:string,node:boolean,short:string,dependency:string[]}]}
 */
const repoList = jsonfile.readFileSync(path.join(process.cwd(), 'repo-list.json'));

const logger = log4js.getLogger('orcli.controller');


router.get('/hotfix', (req, res) => {
    async function execute() {
        try {
            res.status(200).json(repoList);
        } catch (e) {
            if (typeof e === 'string') {
                throw new Error(e);
            }
            throw e;
        }
    }
    execute().catch(err => {
        logger.error(err);
        res.status(500).json({
            message: err.message
        });
    })
});

router.post('/hotfix', (req, res) => {
    async function execute() {
        try {
            const payload = req.body;
            if (!payload.workspace) {
                payload.workspace = path.join(os.homedir(), 'orcli_workspace');
            }
            payload.workspace = path.join(process.cwd(), path.relative(process.cwd(), payload.workspace));
            if (payload.releaseType == 'New Release') {
                payload.workspace = path.join(payload.workspace, payload.release);
            } else {
                payload.workspace = path.join(payload.workspace, payload.branch);
            }
            const date = new Date();
            payload.saveLocation = path.join(payload.workspace, 'images', dateformat(date, 'yyyy_mm_dd'));
            makeDir.sync(payload.workspace);
            makeDir.sync(payload.saveLocation);
            makeDir.sync(path.join(payload.saveLocation, 'yamls'));
            const script = prepareScript.hotfixScript(payload);
            res.status(200).json({
                script
            });
        } catch (e) {
            if (typeof e === 'string') {
                throw new Error(e);
            }
            throw e;
        }
    }
    execute().catch(err => {
        logger.error(err);
        res.status(500).json({
            message: err.message
        });
    })
});

module.exports = router;