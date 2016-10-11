"use strict";

let crypto = require('crypto');
let express = require('express');
let path = require('path');
let Jwts = require(path.join(process.env.PROJECT_ROOT, 'lib', 'mongoose-schema', 'jwts'));
let nodeCryptoJS = require('node-cryptojs-aes');
let cryptoJS = nodeCryptoJS.CryptoJS;
let jwt = require('jsonwebtoken');

module.exports = (options, callback) => {
    let password = crypto.randomBytes(8).toString('base64');
    let userKey = options.userKey;
    let accountId = options.accountId;
    let issueEvent = options.issueEvent;
    let userKeyServerEncrypted = cryptoJS.AES.encrypt(userKey, new Buffer(password + process.env.SERVER_SECRET).toString('base64')).toString(); //SERVER_SECRET is already base64 encoded

    let issueDate = new Date();
    Jwts.create({
        accountId: accountId,
        password: password,
        issueEvent: issueEvent,
        issueDate: issueDate
    }, (err, row) => {
        if (err) {
            return next(err);
        }
        return jwt.sign({
            userKeyServerEncrypted: userKeyServerEncrypted, //to be used in future requests
        }, password + process.env.SERVER_SECRET, {
            algorithm: "HS256",
            expiresIn: "1h",
            issuer: process.env.HOST,
            audience: process.env.HOST,
            jwtid: row._id.toString(),
            subject: accountId.toString()
        }, (err, token) => {
            if (err) {
                return callback(err);
            }
            return callback(null, token);
        });
    });
};