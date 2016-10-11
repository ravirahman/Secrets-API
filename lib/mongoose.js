"use strict";

let mongoose = require('mongoose');
mongoose.connect(process.env.MONGO_DB_URI);
module.exports = mongoose;
