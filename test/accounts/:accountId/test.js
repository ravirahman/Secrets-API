"use strict";

let chai = require('chai');
let chaiHttp = require('chai-http');
chai.use(chaiHttp);
let should = chai.should();
let expect = chai.expect;
let path = require('path');
let app = require(path.join(process.env.PROJECT_ROOT, 'index')).app;
let Accounts = require(path.join(process.env.PROJECT_ROOT, 'lib', 'mongoose-schema', 'accounts'));
let Jwts = require(path.join(process.env.PROJECT_ROOT, 'lib', 'mongoose-schema', 'jwts'));
let jwt = require('jsonwebtoken');

describe('GET /accounts/{accountId}', () => {
    var accountId1 = "";
    var jwt1 = "";
    var jwtId1 = "";
    var jwtPassword1 = "";

    var accountId2 = "";
    var jwt2 = "";
    var jwtId2 = "";

    before("Clearing the accounts collection", (cb) => {
        Accounts.remove({}, (err) => {
            if (err) {
                return cb(err);
            }
            return cb();
        });
    });

    before("Creating sample user 1", (cb) => {
        chai.request(app)
            .post('/accounts/signup')
            .send({
                username: "username_1",
                password: "password_1"
            }).end((err, res) => {
                if (err) {
                    return cb(err);
                }
                jwt1 = res.body.jwt;
                let payload = jwt.decode(jwt1);
                accountId1 = payload.sub;
                jwtId1 = payload.jti;

                return Jwts.findOne({
                    _id: jwtId1
                }, {password: String}, (err, row) => {
                    if (err) {
                        return cb(err);
                    }
                    jwtPassword1 = row.password;
                    return cb();
                });
            });
    });

    before("Creating sample user 2", (cb) => {
        chai.request(app)
            .post('/accounts/signup')
            .send({
                username: "username_2",
                password: "password_2"
            }).end((err, res) => {
            if (err) {
                return cb(err);
            }
            jwt2 = res.body.jwt;
            let payload = jwt.decode(jwt2);
            accountId2 = payload.sub;
            jwtId2 = payload.jti;
            return cb();
        });
    });

    it('should return account information when using the accountId', (cb) => {
        chai.request(app)
            .get(`/accounts/${accountId1}`)
            .set('Authorization', `Bearer ${jwt1}`)
            .end((err, res) => {
                expect(err).to.be.null;
                expect(res.body.username).to.be.equal('username_1');
                expect(res.body.accountId).to.be.equal(accountId1);
                cb();
            });
    });

    it('should return account information when using `me`', (cb) => {
        chai.request(app)
            .get(`/accounts/me`)
            .set('Authorization', `Bearer ${jwt1}`)
            .end((err, res) => {
                expect(err).to.be.null;
                expect(res.body.username).to.be.equal('username_1');
                expect(res.body.accountId).to.be.equal(accountId1);
                cb();
            });
    });

    it('after setting revocation date in the future, should still return account information', (cb) => {
        Jwts.findOneAndUpdate({
            _id: jwtId1
        }, {rev_date: new Date().setTime(new Date().getTime() + 60*60*1000), rev_event: "TDD Future Revoke"}, (err) => {
            if (err) {
                return cb(err);
            }
            chai.request(app)
                .get(`/accounts/me`)
                .set('Authorization', `Bearer ${jwt1}`)
                .end((err, res) => {
                    expect(err).to.be.null;
                    expect(res.body.username).to.be.equal('username_1');
                    expect(res.body.accountId).to.be.equal(accountId1);
                    cb();
                });
        });
    });

    it(`should return 403 error when attempting to access other or invalid account id`, (cb) => {
        chai.request(app)
            .get(`/accounts/${accountId2}`)
            .set('Authorization', `Bearer ${jwt1}`)
            .end((err, res) => {
                expect(err).to.have.status(403);
                expect(res.body.message).to.be.equal('You do not have permission to access this account.');
                cb();
            });
    });

    it(`should return 401 error when using different JWT signing algorithm`, (cb) => {
        let newJwt = jwt.sign({
            userKeyServerEncrypted: jwt.decode(jwt1).userKeyServerEncrypted
        }, jwtPassword1 + process.env.SERVER_SECRET, {
            algorithm: "HS384",
            expiresIn: "1h",
            issuer: process.env.HOST,
            audience: process.env.HOST,
            jwtid: jwtId1,
            subject: accountId1
        });
        chai.request(app)
            .get(`/accounts/${accountId1}`)
            .set('Authorization', `Bearer ${newJwt}`)
            .end((err, res) => {
                expect(err).to.have.status(401);
                expect(res.body.code).to.be.equal('revoked_token');
                cb();
            });
    });


    it(`should return 401 error if expired`, (cb) => {
        let newJwt = jwt.sign({
            userKeyServerEncrypted: jwt.decode(jwt1).userKeyServerEncrypted
        }, jwtPassword1 + process.env.SERVER_SECRET, {
            algorithm: "HS256",
            expiresIn: -60*60*1000,
            issuer: process.env.HOST,
            audience: process.env.HOST,
            jwtid: jwtId1,
            subject: accountId1
        });
        chai.request(app)
            .get(`/accounts/${accountId1}`)
            .set('Authorization', `Bearer ${newJwt}`)
            .end((err, res) => {
                expect(err).to.have.status(401);
                expect(res.body.message).to.be.equal('jwt expired');  //comparing message to confirm reason token is invalid
                cb();
            });
    });

    it(`should return 401 error if bad password`, (cb) => {
        let newJwt = jwt.sign({
            userKeyServerEncrypted: jwt.decode(jwt1).userKeyServerEncrypted
        }, "bad password", {
            algorithm: "HS256",
            expiresIn: 60*60*1000,
            issuer: process.env.HOST,
            audience: process.env.HOST,
            jwtid: jwtId1,
            subject: accountId1
        });
        chai.request(app)
            .get(`/accounts/${accountId1}`)
            .set('Authorization', `Bearer ${newJwt}`)
            .end((err, res) => {
                expect(err).to.have.status(401);
                expect(res.body.message).to.be.equal('invalid signature'); //comparing message to confirm reason token is invalid
                cb();
            });
    });

    it('after revoking the jwt, should return 401 error', (cb) => {
        Jwts.findOneAndUpdate({
            _id: jwtId1
        }, {rev_date: new Date().setTime(new Date().getTime() - 60*60*1000), rev_event: "TDD Past Revoke"}, (err) => {
            if (err) {
                return cb(err);
            }
            chai.request(app)
                .get(`/accounts/me`)
                .set('Authorization', `Bearer ${jwt1}`)
                .end((err, res) => {
                    expect(err).to.have.status(401);
                    expect(res.body.code).to.be.equal('revoked_token');
                    cb();
                });
        });
    });
});