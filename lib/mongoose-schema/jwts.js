"use strict";
let mongoose = require('../mongoose');
let Schema = mongoose.Schema;

let JwtsSchema = Schema({
    account_id: {
        type: String,
        required: true
    },
    password: {
        type: String,
        description: "Used in part to encrypt the encryption key as well as the JWT signature"
    },
    issue_event: {
        type: String
    },
    issue_date: {
        type: Date,
        default: Date.now
    },
    /*exp_date: {
        type: Date
    },*/
    rev_event: {
        type: String
    },
    rev_date: {
        type: Date
    }
    //a valid
});

let JwtsModel = mongoose.model('jwts', JwtsSchema);
module.exports = JwtsModel;