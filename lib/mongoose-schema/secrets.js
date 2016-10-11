"use strict";

let mongoose = require('../mongoose');
let Schema = mongoose.Schema;

let SecretsSchema = new Schema({
    title: {
        type: String,
        index: true
    },
    content: {
        type: String
    },
    owner: {
        type: String
    }
}, {
    timestamps: {}
});

let SecretsModel = mongoose.model('secrets', SecretsSchema);
module.exports = SecretsModel;