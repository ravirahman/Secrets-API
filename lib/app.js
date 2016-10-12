"use strict";

let express = require('express');
let path = require('path');
let morgan = require('morgan');
let bodyParser = require('body-parser');
let async = require('async');
let recursive = require('recursive-readdir');
var swaggerExpressMiddleware = require('swagger-express-middleware');
let errorHandler = require('express-error-handler');
let expressJwt = require('express-jwt');
let Jwts = require(path.join(process.env.PROJECT_ROOT, 'lib', 'mongoose-schema', 'jwts'));
let crypto = require('crypto');
let app = express();
let nodeCryptoJS = require('node-cryptojs-aes');
let cryptoJS = nodeCryptoJS.CryptoJS;
let cors = require('cors');
let http = require('http');
let jwt = require('jsonwebtoken');

let server = http.createServer(app);

async.parallel([
    (cb) => { //load app-locals and attach to the app
        recursive(path.join(__dirname, "app-locals"), [".js"], (err,files) => {
            if (err) {
                return cb(err);
            }
            for (var pathname of files) {
                var filename = path.basename(pathname,".js");
                app.locals[filename] = require(pathname);
            }
            cb();
        });
    },
    (cb) => { //configuration before loading routes
        app.use(morgan('dev'));
        app.use(bodyParser.json());
        app.use(cors({
            origin: process.env.PROTOCOL + process.env.HOST,
            credentials: true
        }));
        app.use(bodyParser.urlencoded({ extended: false }));

        app.use("/", express.static(path.join(__dirname, 'public')));

        app.use(expressJwt({
            secret: (req, payload, cb) => {
                return Jwts.findOne({
                    _id: payload.jti
                }, {password: String}, (err, row) => {
                    if (err) {
                        return cb(err);
                    }
                    payload.password = row.password;
                    return cb(null, row.password + process.env.SERVER_SECRET);
                });

            },
            isRevoked: (req, payload, cb) => {
                let jwtDecoded = jwt.decode(req.headers.authorization.split(" ")[1], {complete: true});
                if (jwtDecoded.header.alg != "HS256") {
                    return cb(null, true); //improper algorithm. security risk
                }
                try {
                    let userKeyRaw = cryptoJS.AES.decrypt(payload.userKeyServerEncrypted, new Buffer(payload.password + process.env.SERVER_SECRET).toString('base64'));
                    req.userKey = cryptoJS.enc.Utf8.stringify(userKeyRaw);
                    if (!req.userKey) {
                        throw new Error();
                    }
                }
                catch(e) {
                    let error = new Error("userKeyServerEncrypted could not be decrypted");
                    error.status = 500;
                    return cb(error);
                }
                return Jwts.findOne({
                    _id: payload.jti,
                    $or: [{
                        revDate: {
                            $exists: false
                        }
                    }, {
                        revDate: {
                            $gte: new Date()
                        }
                    }]
                }, (err, row) => {
                    if (err) {
                        return cb(err);
                    }
                    if (!row) {
                        return cb(null, true); //if row not found, then it has been revoked / is not valid. return true(=revoked)
                    }
                    return cb(null, false); //token found, and is valid. return false(=not revoked=valid)
                });
            }
        }).unless({
            path: ["/", /^\/api-docs.*/gi, /^\/accounts\/(login|signup).*/gi] //regex for not requiring JWT when logging in or creating an account
        }));
        swaggerExpressMiddleware('./lib/swagger.yaml', app, (err, middleware) => {
            if (err) {
                return cb(err);
            }
            app.use(middleware.metadata());
            app.use(middleware.parseRequest());
            app.use(middleware.validateRequest());
            app.use(middleware.files({}));
            return cb();
        });

    },
    (cb) => { //load the routes
        return recursive(path.join(__dirname, "endpoint"), (err,files) => {
            if (err) {
                return cb(err);
            }
            let filenames = [];
            for (var filename of files) {
                if (filename.slice(-3) == ".js") {
                    var pathname = "/" + path.relative(path.join(__dirname, "endpoint"), path.dirname(filename));
                    app.use(pathname, require(filename));
                    filenames.push(filename);
                }

            }
            return cb(null, filenames);
        });
    }
], (err) => {
    if (err) {
        throw err; //throwing to kill the process
    }
    // Log the error in the console
    app.use(function (err, req, res, next) {
        if (errorHandler.isClientError(err.status)) {
            console.warn(err);
        }
        else {
            console.error(err);
        }
        return next(err);
    });
    app.use(errorHandler.httpError(404)); //throw a 404 error if no routes were defined
    app.use(errorHandler({
        server: server,
        serializer: function(err) {
            var body = {
                status: err.status,
                message: err.message
            };
            if (errorHandler.isClientError(err.status)) {
                ['code', 'name', 'type', 'details'].forEach(function(prop) {
                    if (err[prop]) body[prop] = err[prop];
                });
            }
            return body;
        }
    }));
});

module.exports = {
    app: app,
    server: server
};
