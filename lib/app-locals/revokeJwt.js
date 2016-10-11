"use strict";

let crypto = require('crypto');
let express = require('express');
let path = require('path');
let Jwts = require(path.join(process.env.PROJECT_ROOT, 'lib', 'mongoose-schema', 'jwts'));

module.exports = (options, cb) => { //can provide either jwt_ids and callback, or an accountId and a callback
    let accountId = options.accountId;
    let event = options.event;
    let jwtIds = options.jwtIds || ["*"];
    //for now, we only care about the first item in the secrets array. Down the line, multiple sessions can be revoked at once
    let jwtId = jwtIds[0];
    if (jwtId == "*") { //revoke all secrets for this account id
        return Jwts.update({
            accountId: accountId
        }, {
            $unset: {
                password: "" //now this token can never be used to recover the user's encryption key
            },
            revEvent: event,
            revDate: new Date().getTime()
        }, {
            upsert: false,
            multi: true
        }, (err) => {
            if (err) {
                return cb(err);
            }
            return cb();
        });
    }
    //revoke the specific secret for this account id
    return Jwts.findOneAndUpdate({
        accountId: accountId,
        _id: jwtId,
        revDate: {
            $exists: false
        }
    },{
        $unset: {
            password: "" //now this token can never be used to recover the user's encryption key
        },
        revEvent: event,
        revDate: new Date().getTime()
    },{
        upsert: false,
        new: true
    }, (err, row) => {
        if (err) {
            return cb(err);
        }
        if (!row) {
            let error = new Error(`Could not find a JWT with id ${jwtId} belonging to this account.`);
            error.status = 400;
            return cb(error);
        }
        return cb(null, row)
    });
};