"use strict";

let chai = require('chai');
let chaiHttp = require('chai-http');
chai.use(chaiHttp);
let should = chai.should();
let expect = chai.expect;
let path = require('path');
let app = require(path.join(process.env.PROJECT_ROOT, 'index')).app;
let Accounts = require(path.join(process.env.PROJECT_ROOT, 'lib', 'mongoose-schema', 'accounts'));
let jwt = require('jsonwebtoken');

describe('POST /accounts/{accountId}/logout', () => {
    var accountId1 = "";
    var jwt1a = "";
    var jwtId1a = "";

    var jwt1b = "";
    var jwtId1b = "";

    var jwt1c = "";
    var jwtId1c = "";

    var jwt1d = "";
    var jwtId1d = "";

    var jwt1e = "";
    var jwtId1e = "";

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
            jwt1a = res.body.jwt;
            let payload = jwt.decode(jwt1a);
            accountId1 = payload.sub;
            jwtId1a = payload.jti;
            return cb();
        });
    });

    before('Creating 2nd jwt for user 1', (cb) => {
        chai.request(app)
            .post('/accounts/login')
            .send({
                username: "username_1",
                password: "password_1"
            })
            .end((err, res) => {
                if (err) {
                    return cb(err);
                }
                jwt1b = res.body.jwt;
                let payload = jwt.decode(jwt1b);
                jwtId1b = payload.jti;
                return cb();
            });
    });
    before('Creating 3rd jwt for user 1', (cb) => {
        chai.request(app)
            .post('/accounts/login')
            .send({
                username: "username_1",
                password: "password_1"
            })
            .end((err, res) => {
                if (err) {
                    return cb(err);
                }
                jwt1c = res.body.jwt;
                let payload = jwt.decode(jwt1c);
                jwtId1c = payload.jti;
                return cb();
            });
    });
    before('Creating 4th jwt for user 1', (cb) => {
        chai.request(app)
            .post('/accounts/login')
            .send({
                username: "username_1",
                password: "password_1"
            })
            .end((err, res) => {
                if (err) {
                    return cb(err);
                }
                jwt1d = res.body.jwt;
                let payload = jwt.decode(jwt1d);
                jwtId1d = payload.jti;
                return cb();
            });
    });

    before('Creating 5th jwt for user 1', (cb) => {
        chai.request(app)
            .post('/accounts/login')
            .send({
                username: "username_1",
                password: "password_1"
            })
            .end((err, res) => {
                if (err) {
                    return cb(err);
                }
                jwt1e = res.body.jwt;
                let payload = jwt.decode(jwt1e);
                jwtId1e = payload.jti;
                return cb();
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

    it('should logout and not allow original JWT to be used, but should allow 2nd jwt', (cb) => {
        chai.request(app)
            .post(`/accounts/${accountId1}/logout`)
            .set('Authorization', `Bearer ${jwt1a}`)
            .end((err, res) => {
                expect(err).to.be.null;
                expect(res.status).to.be.equal(200);
                expect(Object.keys(res.body).length).to.be.equal(0);
                chai.request(app)
                    .get(`/accounts/${accountId1}`)
                    .set('Authorization', `Bearer ${jwt1a}`)
                    .end((err, res) => {
                        expect(err).to.have.status(401);
                        expect(res.body.message).to.be.equal('invalid signature'); //invalid signature because we delete the password when the token expires (so we cannot later recover the user's encryption key)
                        //not a revoked token error, because that check is performed 2nd.
                        chai.request(app)
                            .get(`/accounts/${accountId1}`)
                            .set('Authorization', `Bearer ${jwt1b}`)
                            .end((err, res) => {
                                expect(err).to.be.null;
                                expect(res.body.username).to.be.equal('username_1');
                                expect(res.body.accountId).to.be.equal(accountId1);
                                cb();
                            });
                    });

            });
    });

    it('should logout when using me `me`', (cb) => {
        chai.request(app)
            .post(`/accounts/me/logout`)
            .set('Authorization', `Bearer ${jwt1b}`)
            .end((err, res) => {
                expect(err).to.be.null;
                expect(res.status).to.be.equal(200);
                expect(Object.keys(res.body).length).to.be.equal(0);
                cb();
            });
    });

    it('should logout alternative jwt when directly specifying it', (cb) => {
        chai.request(app)
            .post(`/accounts/me/logout`)
            .set('Authorization', `Bearer ${jwt1c}`)
            .send({
                jwtIds: [jwtId1d]
            })
            .end((err, res) => {
                expect(err).to.be.null;
                expect(res).to.have.status(200);
                expect(Object.keys(res.body).length).to.be.equal(0);
                chai.request(app)
                    .get(`/accounts/${accountId1}`)
                    .set('Authorization', `Bearer ${jwt1d}`)
                    .end((err, res) => {
                        expect(err).to.have.status(401);
                        expect(res.body.code).to.be.equal('invalid_token'); //invalid signature because we delete the password when the token expires (so we cannot later recover the user's encryption key)
                        //not a revoked token error, because that check is performed 2nd.
                        chai.request(app)
                            .get(`/accounts/${accountId1}`)
                            .set('Authorization', `Bearer ${jwt1c}`)
                            .end((err, res) => {
                                expect(err).to.be.null;
                                expect(res.body.username).to.be.equal('username_1');
                                expect(res.body.accountId).to.be.equal(accountId1);
                                cb();
                            });
                    });
            });
    });



    it('Should throw 400 error if sending multiple jwtIds to revoke', (cb) => {
        chai.request(app)
            .post(`/accounts/me/logout`)
            .send({
                jwtIds: [jwtId1a, jwtId1b]
            })
            .set('Authorization', `Bearer ${jwt1c}`)
            .end((err) => {
                expect(err).to.have.status(400);
                cb();
            });
    });

    it('Should throw 403 error if acting on another account in the path', (cb) => {
        chai.request(app)
            .post(`/accounts/${accountId2}/logout`)
            .set('Authorization', `Bearer ${jwt1c}`)
            .end((err) => {
                expect(err).to.have.status(403);
                cb();
            });
    });

    it(`Should throw 400 error if jwt does not exist in system`, (cb) => {
        chai.request(app)
            .post(`/accounts/me/logout`)
            .set('Authorization', `Bearer ${jwt1c}`)
            .send({
                jwtIds: ["fake_id"]
            })
            .end((err) => {
                expect(err).to.have.status(400);
                cb();
            });
    });

    it(`Should throw 400 error if jwt does not exist in account`, (cb) => {
        chai.request(app)
            .post(`/accounts/me/logout`)
            .set('Authorization', `Bearer ${jwt1c}`)
            .send({
                jwtIds: [jwtId2]
            })
            .end((err) => {
                expect(err).to.have.status(400);
                cb();
            });
    });

    it(`After revoking using *, revoke remaining JWT in account but still allow JWT in alternative account`, (cb) => {
        chai.request(app)
            .post(`/accounts/me/logout`)
            .set('Authorization', `Bearer ${jwt1c}`)
            .send({
                jwtIds: ["*"]
            })
            .end((err, res) => {
                expect(res).to.have.status(200);
                chai.request(app)
                    .get(`/accounts/${accountId1}`)
                    .set('Authorization', `Bearer ${jwt1e}`)
                    .end((err, res) => {
                        expect(err).to.have.status(401);
                        expect(res.body.code).to.be.equal('revoked_token');
                        cb();
                    });
                chai.request(app)
                    .get(`/accounts/${accountId2}`)
                    .set('Authorization', `Bearer ${jwt2}`)
                    .end((err, res) => {
                        expect(err).to.be.null;
                        expect(res.body.username).to.be.equal('username_2');
                        expect(res.body.accountId).to.be.equal(accountId2);
                        cb();
                    });
                cb();
            });
    });
});