"use strict";

let chai = require('chai');
let chaiHttp = require('chai-http');
chai.use(chaiHttp);
let should = chai.should();
let expect = chai.expect;
let path = require('path');
let app = require(path.join(process.env.PROJECT_ROOT, 'index')).app;
let Accounts = require(path.join(process.env.PROJECT_ROOT, 'lib', 'mongoose-schema', 'accounts'));
let Secrets = require(path.join(process.env.PROJECT_ROOT, 'lib', 'mongoose-schema', 'secrets'));
let jwt = require('jsonwebtoken');

describe('/accounts/secrets', () => {
    var accountId1 = "";
    var jwt1 = "";
    var accountId2 = "";
    var jwt2 = "";

    var secretId1 = "";
    var secretId2 = "";
    var secretId3 = "";

    before("Clearing the accounts collection", (cb) => {
        Accounts.remove({}, (err) => {
            if (err) {
                return cb(err);
            }
            return cb();
        });
    });
    before("Clearing the secrets collection", (cb) => {
        Secrets.remove({}, (err) => {
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
                accountId1 = jwt.decode(jwt1).sub;
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
                accountId2 = jwt.decode(jwt2).sub;
                return cb();
            });
    });

    before("Creating first secret in first account", (cb) => {
        chai.request(app)
            .post('/secrets')
            .set('Authorization', `Bearer ${jwt1}`)
            .send({
                title: "alpha",
                content: "alpha content"
            }).end((err, res) => {
                if (err) {
                    return cb(err);
                }
                secretId1 = res.body.secret.secretId;
                return cb();
            });
    });

    before("Creating second secret in first account", (cb) => {
        chai.request(app)
            .post('/secrets')
            .set('Authorization', `Bearer ${jwt1}`)
            .send({
                title: "beta",
                content: "beta content"
            }).end((err, res) => {
            if (err) {
                    return cb(err);
                }
                secretId2 = res.body.secret.secretId;
                return cb();
            });
    });

    before("Creating third secret in first account", (cb) => {
        chai.request(app)
            .post('/secrets')
            .set('Authorization', `Bearer ${jwt1}`)
            .send({
                title: "gamma",
                content: "gamma content"
            }).end((err, res) => {
                if (err) {
                    return cb(err);
                }
                secretId3 = res.body.secret.secretId;
                return cb();
            });
    });

    it("should get first secret using first account", (cb) => {
        chai.request(app)
            .get(`/secrets/${secretId1}`)
            .set('Authorization', `Bearer ${jwt1}`)
            .end((err, res) => {
                expect(err).to.be.null;
                expect(res).to.have.status(200);
                expect(res.body.secret.title).to.be.equal("alpha");
                expect(res.body.secret.content).to.be.equal("alpha content");
                expect(res.body.secret.owner).to.be.equal(accountId1);
                expect(res.body.secret.secretId).to.be.equal(secretId1);
                expect(res.body.secret).to.have.property('createdAt');
                expect(res.body.secret).to.have.property('updatedAt');
                return cb();
            });
    });

    it("should throw 404 error when getting first secret using second account", (cb) => {
        chai.request(app)
            .get(`/secrets/${secretId1}`)
            .set('Authorization', `Bearer ${jwt2}`)
            .end((err, res) => {
                expect(err).to.have.status(404);
                return cb();
            });
    });

    it("should patch alpha to delta title using first account", (cb) => {
       chai.request(app)
           .patch(`/secrets/${secretId1}`)
           .set('Authorization', `Bearer ${jwt1}`)
           .send({
               title: "delta"
           })
           .end((err, res) => {
               expect(err).to.be.null;
               expect(res).to.have.status(200);
               expect(res.body.secret.title).to.be.equal("delta");
               expect(res.body.secret.content).to.be.equal("alpha content");
               expect(res.body.secret.owner).to.be.equal(accountId1);
               expect(res.body.secret.secretId).to.be.equal(secretId1);
               expect(res.body.secret).to.have.property('createdAt');
               expect(res.body.secret).to.have.property('updatedAt');
               return cb();
           });
    });

    it("should patch alpha to delta content using first account", (cb) => {
        chai.request(app)
            .patch(`/secrets/${secretId1}`)
            .set('Authorization', `Bearer ${jwt1}`)
            .send({
                content: "delta content"
            })
            .end((err, res) => {
                expect(err).to.be.null;
                expect(res).to.have.status(200);
                expect(res.body.secret.title).to.be.equal("delta");
                expect(res.body.secret.content).to.be.equal("delta content");
                expect(res.body.secret.owner).to.be.equal(accountId1);
                expect(res.body.secret.secretId).to.be.equal(secretId1);
                expect(res.body.secret).to.have.property('createdAt');
                expect(res.body.secret).to.have.property('updatedAt');
                return cb();
            });
    });

    it("should throw 404 error when attempting to patch gamma to epsilon using second account", (cb) => {
        chai.request(app)
            .patch(`/secrets/${secretId3}`)
            .set('Authorization', `Bearer ${jwt2}`)
            .send({
                title: "gamma",
                content: "gamma content"
            })
            .end((err, res) => {
                expect(err).to.have.status(404);
                return cb();
            });
    });

    it("should return both secrets with ta in title", (cb) => {
        chai.request(app)
            .get(`/secrets?search=ta`)
            .set('Authorization', `Bearer ${jwt1}`)
            .end((err, res) => {
                expect(err).to.be.null;
                expect(res.body.secrets[0].secretId).to.be.oneOf([secretId1,secretId2]);
                expect(res.body.secrets[1].secretId).to.be.oneOf([secretId1, secretId2]);
                expect(res.body.secrets[1].secretId).to.not.be.equal(res.body.secrets[0].secretId);
                expect(res.body.secrets.length).to.be.equal(2);
                return cb();
            });
    });

    it.only("should return both secrets sorted by createdAt with sort order =-1", (cb) => {
        chai.request(app)
            .get(`/secrets?sortField=createdAt&sortOrder=-1`)
            .set('Authorization', `Bearer ${jwt1}`)
            .end((err, res) => {
                expect(err).to.be.null;
                expect(res.body.secrets[0].secretId).to.be.equal(secretId3);
                expect(res.body.secrets[1].secretId).to.be.equal(secretId2);
                expect(res.body.secrets[2].secretId).to.be.equal(secretId1);
                return cb();
            });
    });
    it("should return both secrets sorted by createdAt ASC with empty sort order", (cb) => {
        chai.request(app)
            .get(`/secrets?sortField=createdAt&sortOrder=`)
            .set('Authorization', `Bearer ${jwt1}`)
            .end((err, res) => {
                expect(err).to.be.null;
                expect(res.body.secrets[0].secretId).to.be.equal(secretId1);
                expect(res.body.secrets[1].secretId).to.be.equal(secretId2);
                expect(res.body.secrets[2].secretId).to.be.equal(secretId3);
                return cb();
            });
    });

    it("should return secrets sorted by Title without sortOrder", (cb) => {
        chai.request(app)
            .get(`/secrets?sortField=title`)
            .set('Authorization', `Bearer ${jwt1}`)
            .end((err, res) => {
                expect(err).to.be.null;
                expect(res.body.secrets[0].secretId).to.be.equal(secretId2);
                expect(res.body.secrets[1].secretId).to.be.equal(secretId1);
                expect(res.body.secrets[2].secretId).to.be.equal(secretId3);
                return cb();
            });
    });

    it("ignores incorrect sort field", (cb) => {
        chai.request(app)
            .get(`/secrets?sortField=createdAtTime`)
            .set('Authorization', `Bearer ${jwt1}`)
            .end((err, res) => {
                expect(err).to.be.null;
                expect(res.body.secrets.length).to.be.equal(3);
                return cb();
            });
    });

    it("should delete alpha secret", (cb) => {
        chai.request(app)
            .delete(`/secrets/${secretId1}`)
            .set('Authorization', `Bearer ${jwt1}`)
            .end((err, res) => {
                expect(err).to.be.null;
                expect(res).to.have.status(200);
                return cb();
            });
    });

    it("shouldn't delete alpha secret since it was already deleted and can't be found (throws 404)", (cb) => {
        chai.request(app)
            .delete(`/secrets/${secretId1}`)
            .set('Authorization', `Bearer ${jwt1}`)
            .end((err, res) => {
                expect(err).to.have.status(404);
                return cb();
            });
    });

    it("shouldn't delete alpha secret because it doesn't belong to account (throws 404)", (cb) => {
        chai.request(app)
            .delete(`/secrets/${secretId2}`)
            .set('Authorization', `Bearer ${jwt2}`)
            .end((err, res) => {
                expect(err).to.have.status(404);
                return cb();
            });
    });


});