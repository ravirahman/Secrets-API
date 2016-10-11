"use strict";
let mongoose = require('../mongoose');
let Schema = mongoose.Schema;

let AccountsSchema = Schema({
    username: {
        type: String,
        unique: true,
        required: true,
        dropDups: true
    },
    key: {
        type: String
    }
});

let AccountsModel = mongoose.model('accounts', AccountsSchema);
module.exports = AccountsModel;