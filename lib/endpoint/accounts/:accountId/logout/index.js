"use strict";

let express = require('express');
let router = express.Router();

router.post('/', function(req, res, next) {
    let accountId = req.pathParams.accountId;
    if (accountId == "me") {
        accountId = req.user.sub;
    }
    if (accountId != req.user.sub) { //currently you can only access your own account
        let error = new Error("You do not have permission to access this account.");
        error.status = 403;
        return next(error);
    }


    let jwtIds = req.body ? req.body.jwtIds : [req.user.jti];
    if (jwtIds.length != 1) {
        let error = new Error("Only one jwtId at a time is currently supported. Array length must be 1, or not set.");
        error.status = 400; //should be 501, but that causes the server to crash.
        return next(error);
    }
    return req.app.locals.revokeJwt({
        jwtIds: jwtIds,
        accountId: accountId
    }, (err) => {
        if (err) {
            return next(err);
        }
        return res.status(200).send({});
    });
});

module.exports = router;
