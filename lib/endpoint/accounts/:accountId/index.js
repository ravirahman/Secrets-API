"use strict";

let express = require('express');
let router = express.Router();
let path = require('path');
let Accounts = require(path.join(process.env.PROJECT_ROOT, 'lib', 'mongoose-schema', 'accounts'));

router.get('/', function(req, res, next) {
    let accountId = req.pathParams.accountId;
    if (accountId == "me") {
        accountId = req.user.sub;
    }
    if (accountId != req.user.sub) { //currently you can only access your own account
        let error = new Error("You do not have permission to access this account.");
        error.status = 403;
        return next(error);
    }
    Accounts.findOne({
        _id: accountId
    }, (err, row) => {
        if (err) {
            return next(err);
        }
        return res.send({ //manually defining fields to prevent leaking fields to the end user
            accountId: row._id,
            username: row.username,
            //do not provide encrypted encryption key -- it is useless, since it is also encrypted with the server's key
        });
    });
});
/*
router.patch('/', function(req, res, next) {
    let accountId = req.pathParams.accountId;
    let username = req.body.username;
    let password = req.body.password;
    let existingPassword = req.header.verification_password; //passed in the header, because it is not a parameter in the object, and thus should not be in the body

    if (accountId == "me") {
        accountId = req.user.sub;
    }
    if (accountId != req.user.sub) { //currently you can only access your own account
        let error = new Error("You do not have permission to access this account.");
        error.status = 403;
        return next(error);
    }
    Accounts.findOne({
        _id: accountId
    }, {
        key: String //key is encrypted using the password. if they can decrypt the key, then they are logged in.
    }, (err, row) => {
        if (err) {
            return next(err);
        }
        if (!row) {
            let error = new Error("An account does not exist with this username.");
            error.status = 500; //should never reach this error, because the id was validated with the JWT. Hence, throwing a 500.
            return cb(error);
        }

        let updateQuery = {};
        if (username) {
            updateQuery.username = username
        }
        if (password) {
            let userKeyRaw = cryptoJS.AES.decrypt(row.key, new Buffer(existingPassword + process.env.SERVER_SECRET).toString('base64'));
            let userKey = cryptoJS.enc.Utf8.stringify(userKeyRaw);

            if (!userKey) {
                let error = new Error("Your password is incorrect.");
                error.status = 401;
                return cb(error);
            }
            //re-encrypt the key with the new password
            updateQuery.key = cryptoJS.AES.encrypt(userKey, new Buffer(password + process.env.SERVER_SECRET).toString('base64')).toString();
            req.app.locals.revokeJwt({ //revoke the existing jwts
                accountId: accountId,
                jwtIds: ["*"],
                event: "UPDATE_PASSWORD"
            }); //not catching errors on this, since we would not be sending errors back to the client
            //client should call login method with password to get new jwt
        }
        return Accounts.findOneAndUpdate({
            _id: accountId
        }, updateQuery, {
            new: true,
            upsert: false
        }, (err, row) => {
            if (err) {
                return cb(err);
            }
            return res.send(null, { //return all fields that the users should see
                username: row.username,
                accountId: row._id
                //do not provide encrypted encryption key -- it is useless, since it is also encrypted with the server's key
            })
        });


    });
});*/

module.exports = router;
