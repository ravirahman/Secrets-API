"use strict";

let express = require('express');
let router = express.Router();
let path = require('path');
let Secrets = require(path.join(process.env.PROJECT_ROOT, 'lib', 'mongoose-schema', 'secrets'));
let nodeCryptoJS = require('node-cryptojs-aes');
let cryptoJS = nodeCryptoJS.CryptoJS;

router.get('/', (req, res, next) => {
    let accountId = req.user.sub;
    let secretId = req.pathParams.secretId;
    let userKey = req.userKey; //already decrypted

    Secrets.findOne({
        _id: secretId,
        owner: accountId
    }, (err, row) => {
        if (err) {
            return next(err);
        }
        if (!row) {
            let error = new Error("A secret with this id belonging to you was not found.");
            error.status = 404;
            return next(error);
        }
        try {
            let contentDecrypted = cryptoJS.AES.decrypt(row.content, userKey);
            let contentDecryptedString = cryptoJS.enc.Utf8.stringify(contentDecrypted);
            if (!contentDecryptedString) {
                throw new Error();
            }
            return res.send({
                secret: {
                    secretId: row._id.toString(),
                    owner: row.owner,
                    title: row.title,
                    content: contentDecryptedString,
                    createdAt: row.createdAt,
                    updatedAt: row.updatedAt
                }
            });
        }
        catch(e) {
            let error = new Error("Could not decrypt secret content from database");
            error.status = 500;
            return next(error);
        }
    });
});

router.patch('/', (req, res, next) => {
    let accountId = req.user.sub;
    let secretId = req.pathParams.secretId;
    let userKey = req.userKey; //already decrypted

    let title = req.body ? req.body.title : null;
    let content = req.body ? req.body.content : null;

    let updates = {};

    if (title) {
        updates.title = title;
    }
    if (content) {
        updates.content = cryptoJS.AES.encrypt(content, userKey).toString(); //encrypt secret using user key
    }


    Secrets.findOneAndUpdate({
        _id: secretId,
        owner: accountId
    }, updates, {
        upsert: false,
        new: true
    }, (err, row) => {
        if (err) {
            return next(err);
        }
        if (!row) {
            let error = new Error("A secret with this id belonging to you was not found.");
            error.status = 404;
            return next(error);
        }
        try {
            let contentDecrypted = cryptoJS.AES.decrypt(row.content, userKey);
            let contentDecryptedString = cryptoJS.enc.Utf8.stringify(contentDecrypted);
            if (!contentDecryptedString) {
                throw new Error();
            }
            return res.send({
                secret: {
                    secretId: row._id.toString(),
                    owner: row.owner,
                    title: row.title,
                    content: contentDecryptedString,
                    createdAt: row.createdAt,
                    updatedAt: row.updatedAt
                }
            });
        }
        catch(e) {
            let error = new Error("Could not decrypt secret content from database");
            error.status = 500;
            return next(error);
        }
    });
});

router.delete('/', (req, res, next) => {
    let accountId = req.user.sub;
    let secretId = req.pathParams.secretId;

    Secrets.findOneAndRemove({
        _id: secretId,
        owner: accountId
    }, (err, row) => {
        if (err) {
            return next(err);
        }
        if (!row) {
            let error = new Error("A secret with this id belonging to you was not found.");
            error.status = 404;
            return next(error);
        }
        return res.status(200).send({});
    });
});

module.exports = router;