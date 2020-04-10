const app = require("../index");
const chai = require("chai");
const chaiHttp = require("chai-http");
const sinon = require('sinon');
var mongoose = require('mongoose'),
Users = mongoose.model('Users');

var admin = require('firebase-admin');

const { expect } = chai;
chai.use(chaiHttp);

describe('Users Integration tests', () => {
    var userId;
    var resPost;
    var firebaseFakeToken = "token";

    var getAllFunc = (done, callback) => chai
        .request(app)
        .get('/v1/users')
        .set('authorization', firebaseFakeToken)
        .send()
        .end((err, res) => {
            if (err) {
                done(err);
            } 
            else {
                callback(res);
                done();
            }
        });

    var getByIdFunc = (done, callback) =>
        chai
        .request(app)
        .get('/v1/users/' + userId)
        .set('authorization', firebaseFakeToken)
        .send()
        .end((err, res) => {
            if (err) {
                done(err);
            } 
            else {
                callback(res);
                done();
            }
        });

    var putByIdFunc = (done, newUser, callback) => {
        admin.auth().verifyIdToken.restore();
        sinon.stub(admin.auth(), "verifyIdToken").callsFake(() => { 
            return {
                uid: 'f@f.com'
            }
        });
        chai
        .request(app)
        .put('/v1/users/' + userId)
        .set('authorization', firebaseFakeToken)
        .send(newUser)
        .end((err, res) => {
            if (err) {
                done(err);
            } 
            else {
                callback(res);
                admin.auth().verifyIdToken.restore();
                sinon.stub(admin.auth(), "verifyIdToken").callsFake(() => { 
                    return {
                        uid: 'admin@test.com'
                    }
                });
                done();
            }
        });
    } 

    var banByIdFunc = (done, patch, callback) =>
        chai
        .request(app)
        .patch('/v1/users/' + userId + '/ban')
        .set('authorization', firebaseFakeToken)
        .send(patch)
        .end((err, res) => {
            if (err) {
                done(err);
            } 
            else {
                callback(res);
                done();
            }
        });

    var deleteByIdFunc = (done, callback) => {
        admin.auth().verifyIdToken.restore();
        sinon.stub(admin.auth(), "verifyIdToken").callsFake(() => { 
            return {
                uid: 'f@f.com'
            }
        });
        chai
        .request(app)
        .delete('/v1/users/' + userId)
        .set('authorization', firebaseFakeToken)
        .send()
        .end((err, res) => {
            if (err) {
                done(err);
            } 
            else {
                callback(res);
                admin.auth().verifyIdToken.restore();
                sinon.stub(admin.auth(), "verifyIdToken").callsFake(() => { 
                    return {
                        uid: 'admin@test.com'
                    }
                });
                done();
            }
        });
    }    

    before((done) => {
        Users.collection.deleteMany({ $not: { email: 'admin@test.com' } }, () => {
            done();
        });
    });

    beforeEach(done => {
        chai
            .request(app)
            .post('/v1/users')
            .set('authorization', firebaseFakeToken)
            .send({
                "username": "Medor",
                "email": "f@f.com",
                "password": "s",
                "role": "Contributor"
            })
            .end((err, res) => {
                if (err) {
                    done(err);
                } 
                else {
                    userId = res.body._id;
                    resPost = res;
                    done();
                }
            });
    });

    describe('POST Users', () => {
        it('should return status code 201', done => {
            expect(resPost).to.have.status(201);
            done();
        });
        it('should return the right user', done => {
            expect(resPost.body.username).to.eql("Medor");
            expect(resPost.body.email).to.eql("f@f.com");
            done();
        });
    });

    describe('GET Users', () => {
        it('should return status code 200', done => {
            getAllFunc(done, res => expect(res).to.have.status(200));
        });
        it('should return the right user', done => {
            getAllFunc(done, res => expect(res.body[res.body.length - 1].username).to.eql("Medor"));
        });
    });

    describe('GET Users id', () => {
        it('should return status code 200', done => {
            getByIdFunc(done, res => expect(res).to.have.status(200));
        });
        it('should return the right user', done => {
            getByIdFunc(done, res => expect(res.body.username).to.eql("Medor"));
        });
    });

    describe('PUT Users id', () => {
        var correctUser = {
            "_id": userId,
            "username": "Elvae",
            "email": "f@f.com",
            "role": "Contributor"
        };
        var wrongUser = {
            "_id": userId,
            "username": "Medor",
            "email": "not an email",
            "password": "s",
            "role": "NonExistantRole"
        };
        it('should return status code 200', done => {
            putByIdFunc(done, correctUser, res => expect(res).to.have.status(200));
        });
        it('should return the right user', done => {
            putByIdFunc(done, correctUser,  res => expect(res.body.username).to.eql("Elvae"));
        });
        it('should return status code 422', done => {
            putByIdFunc(done, wrongUser, res => expect(res).to.have.status(422));
        });
    });

    describe('PATCH Users id ban', () => {
        var correctPatch = {
            "banned": true,
        };
        var wrongPatch = {
            "banned": "Not a boolean"
        };
        var correctRepatch = {
            "banned": false,
        };
        it('should return status code 200', done => {
            banByIdFunc(done, correctPatch, res => expect(res).to.have.status(200));
        });
        it('should return the right banned user', done => {
            banByIdFunc(done, correctPatch,  res => expect(res.body.banned).to.be.true);
        });
        it('should return status code 422', done => {
            banByIdFunc(done, wrongPatch, res => expect(res).to.have.status(422));
        });
        it('should return the right banned user', done => {
            banByIdFunc(done, correctRepatch,  res => expect(res.body.banned).to.be.false);
        });
    });

    afterEach(done => {
        deleteByIdFunc(done, res => {});
    })

    after((done) => {
        Users.collection.deleteMany({ $not: { email: 'admin@test.com' } }, () => {
            done();
        });
    });
});