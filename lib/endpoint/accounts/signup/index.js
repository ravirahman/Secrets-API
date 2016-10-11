"use strict";

let express = require('express');
let router = express.Router();
let path = require('path');
let Accounts = require(path.join(process.env.PROJECT_ROOT, 'lib', 'mongoose-schema', 'accounts'));
let crypto = require('crypto');
let nodeCryptoJS = require('node-cryptojs-aes');
let cryptoJS = nodeCryptoJS.CryptoJS;

router.post('/', function(req, res, next) {
    let username = req.body.username.toLowerCase();
    let password = req.body.password;

    let userKey = crypto.randomBytes(32).toString('base64');
    let userKeyUserEncrypted = cryptoJS.AES.encrypt(userKey, new Buffer(password + process.env.SERVER_SECRET).toString('base64')).toString();

    Accounts.create({
        username: username,
        key: userKeyUserEncrypted
    }, (err, row) => {
        if (err) {
            if (err.code == 11000) { //account already exists (duplicate username key)
                let error = new Error("Please try a different username -- it is already taken.");
                error.status = 400;
                return next(error);
            }
            return next(err);
        }
        //successfully signed up. Now return a JWT.
        return req.app.locals.issueJwt({
            accountId: row._id,
            event: "SIGNUP",
            userKey: userKey
        }, (err, token) => {
            if (err) {
                return next(err);
            }
            res.location(`/accounts/${row._id}`);
            return res.send(201, {
                jwt: token
            });
        });
    });
});

module.exports = router;
