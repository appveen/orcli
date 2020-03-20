const router = require('express').Router();
const log4js = require('log4js');
const usersModel = require('../models/users.model');

const logger = log4js.getLogger('users.controller');

router.post('/login', (req, res) => {
    async function execute() {
        try {
            const username = req.body.username;
            const password = req.body.password;
            if (!username || !password) {
                return res.status(400).json({
                    message: 'Invalid Username/Password'
                });
            }
            const user = await usersModel.findById(username);
            if (!user || user.password != password) {
                return res.status(400).json({
                    message: 'Invalid Username/Password'
                });
            }
            delete user.password;
            user.token = 'ORCLI';
            res.status(200).json(user);
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