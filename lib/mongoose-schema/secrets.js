"use strict";

let mongoose = require('../mongoose');
let Schema = mongoose.Schema;

let SecretsSchema = new Schema({
    title: {
        type: String
    },
    content: {
        type: String
    },
    timestamp: {
        type: Date,
        default: Date.now
    }
});

let SecretsModel = mongoose.model('secrets', SecretsSchema);
module.exports = SecretsModel;