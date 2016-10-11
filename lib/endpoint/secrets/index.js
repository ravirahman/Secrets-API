"use strict";

let express = require('express');
let router = express.Router();
let path = require('path');
let Secrets = require(path.join(process.env.PROJECT_ROOT, 'lib', 'mongoose-schema', 'secrets'));
let nodeCryptoJS = require('node-cryptojs-aes');
let cryptoJS = nodeCryptoJS.CryptoJS;

router.get('/', (req, res, next) => {
    let accountId = req.user.sub;
    let userKey = req.userKey; //already decrypted
    let search = req.query ? req.query.search : null;
    let sortField = req.query ? req.query.sortField : null;
    let sortOrder = req.query ? req.query.sortOrder : null;
    let query = {
        owner: accountId,
    };
    let options = {};
    if (search) {
        query["title"] = {
            $regex: `.*${search}.*`,
            $options: "i"
        };
    }
    if (sortField) {
        options.sort = {
            [sortField]: sortOrder || 1
        }
    }
    let fields = {
        owner: 1,
        createdAt: 1,
        updatedAt: 1,
        title: 1,
        content: 1
    };
    Secrets.find(query, fields, options, (err, rows) => {
        if (err) {
            return next(err);
        }

        let secrets = [];
        for (var row of rows) {
            try {
                let contentDecrypted = cryptoJS.AES.decrypt(row.content, userKey);
                let contentDecryptedString = cryptoJS.enc.Utf8.stringify(contentDecrypted);
                if (!contentDecryptedString) {
                    throw new Error();
                }
                secrets.push({
                    secretId: row._id.toString(),
                    owner: row.owner,
                    title: row.title,
                    content: contentDecryptedString,
                    createdAt: row.createdAt,
                    updatedAt: row.updatedAt
                });
            }
            catch(e) {
                let error = new Error("Could not decrypt secret content from database");
                error.status = 500;
                return next(error);
            }

        }
        return res.send({
            secrets: secrets
        });
    });
});

router.post('/', (req, res, next) => {
    let accountId = req.user.sub;
    let userKey = req.userKey; //already decrypted

    let title = req.body.title;
    let content = req.body.content;

    Secrets.create({
        title: title,
        content: cryptoJS.AES.encrypt(content, userKey).toString(), //encrypt secret using user key
        owner: accountId
    }, (err, row) => {
        if (err) {
            return next(err);
        }
        res.location(`/secrets/${row._id}`);
        return res.status(201).send({
            secret: {
                secretId: row._id.toString(),
                owner: row.owner,
                title: row.title,
                content: content,
                createdAt: row.createdAt,
                updatedAt: row.updatedAt
            }
        });
    });
});

module.exports = router;