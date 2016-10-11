"use strict";

let express = require('express');
let router = express.Router();
let path = require('path');
let Accounts = require(path.join(process.env.PROJECT_ROOT, 'lib', 'mongoose-schema', 'accounts'));
let nodeCryptoJS = require('node-cryptojs-aes');
let cryptoJS = nodeCryptoJS.CryptoJS;

router.post('/', function(req, res, next) {
    let username = req.body.username.toLowerCase();
    let password = req.body.password;
    Accounts.findOne({
        username: username
    }, {
        _id: String,
        key: String //key is encrypted using the password. if they can decrypt the key, then they are logged in.
    }, (err, row) => {
        if (err) {
            return next(err);
        }
        if (!row) {
            let error = new Error("Please double-check your username and password."); //same error message, since password could also be incorrect
            error.status = 401;
            return next(error);
        }

        let userKeyRaw = cryptoJS.AES.decrypt(row.key, new Buffer(password + process.env.SERVER_SECRET).toString('base64'));
        try {
            let userKey = cryptoJS.enc.Utf8.stringify(userKeyRaw);
            if (!userKey) { //in case it is blank, still throw an error
                throw new Error();
            }
            //include an encrypted version of the key in the JWT; otherwise, it cannot be used again without asking for the user's password.
            return req.app.locals.issueJwt({
                accountId: row._id,
                event: "LOGIN",
                userKey: userKey
            }, (err, token) => {
                if (err) {
                    return next(err);
                }
                return res.send({
                    jwt: token
                });
            });
        }
        catch(e) {
            let error = new Error("Please double-check your username and password."); //same error message, since username could be incorrect instead.
            error.status = 401;
            return next(error);
        }
    });
});

module.exports = router;
