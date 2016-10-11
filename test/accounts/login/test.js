"use strict";

let chai = require('chai');
let chaiHttp = require('chai-http');
chai.use(chaiHttp);
let should = chai.should();
let expect = chai.expect;
let path = require('path');
let app = require(path.join(process.env.PROJECT_ROOT, 'index')).app;
let Accounts = require(path.join(process.env.PROJECT_ROOT, 'lib', 'mongoose-schema', 'accounts'));

describe('POST /accounts/login', () => {
    before("Clearing the accounts collection", (cb) => {
        Accounts.remove({}, (err) => {
            if (err) {
                return cb(err);
            }
            return cb();
        });
    });

    before("Creating the sample user", (cb) => {
        chai.request(app)
            .post('/accounts/signup')
            .send({
                username: "username_1",
                password: "password_1"
            }).end((err) => {
                if (err) {
                    return cb(err);
                }
                return cb();
            });
    });

    it('should return 400 error without username', (cb) => {
        chai.request(app)
            .post('/accounts/login')
            .send({
                password: "password_1"
            })
            .end((err) => {
                expect(err).to.have.status(400);
                cb();
            });
    });

    it('should return 400 error without password', (cb) => {
        chai.request(app)
            .post('/accounts/login')
            .send({
                username: "username_1"
            })
            .end((err) => {
                expect(err).to.have.status(400);
                cb();
            });
    });

    it('should return 400 error without either username or password', (cb) => {
        chai.request(app)
            .post('/accounts/login')
            .send({})
            .end((err) => {
                expect(err).to.have.status(400);
                cb();
            });
    });

    it('should return 400 error with object as username ', (cb) => {
        chai.request(app)
            .post('/accounts/login')
            .send({
                username: {
                    $gt: 0
                },
                password: "password_1"
            })
            .end((err) => {
                expect(err).to.have.status(400);
                cb();
            });
    });

    it('should return 400 error with object as password', (cb) => {
        chai.request(app)
            .post('/accounts/login')
            .send({
                username: "username_1",
                password: {
                    $gt: 0
                }
            })
            .end((err) => {
                expect(err).to.have.status(400);
                cb();
            });
    });

    it('should return a JWT with a valid username and password', (cb) => {
        chai.request(app)
            .post('/accounts/login')
            .send({
                username: "username_1",
                password: "password_1"
            })
            .end((err, res) => {
                expect(err).to.be.null;
                expect(res).to.have.status(200);
                expect(res.body.jwt).to.be.a('string');
                cb();
            });
    });

    it('should return a 401 error with a invalid username', (cb) => {
        chai.request(app)
            .post('/accounts/login')
            .send({
                username: "username_2",
                password: "password_1"
            })
            .end((err) => {
                expect(err).to.have.status(401);
                cb();
            });
    });

    it('should return a 401 error with a invalid password', (cb) => {
        chai.request(app)
            .post('/accounts/login')
            .send({
                username: "username_1",
                password: "password_2"
            })
            .end((err) => {
                expect(err).to.have.status(401);
                cb();
            });
    });
});