"use strict";
let mongoose = require('../mongoose');
let Schema = mongoose.Schema;

let JwtsSchema = Schema({
    accountId: {
        type: String,
        required: true
    },
    password: {
        type: String,
        description: "Used in part to encrypt the encryption key as well as the JWT signature"
    },
    issueEvent: {
        type: String
    },
    issueDate: {
        type: Date,
        default: Date.now
    },
    /*exp_date: {
        type: Date
    },*/
    revEvent: {
        type: String
    },
    revDate: {
        type: Date
    }
    //a valid
});

let JwtsModel = mongoose.model('jwts', JwtsSchema);
module.exports = JwtsModel;