const app = require("../index");
const chai = require("chai");
const chaiHttp = require("chai-http");
var mongoose = require('mongoose'),
Users = mongoose.model('Users');

const { expect } = chai;
chai.use(chaiHttp);

describe('Users Integration tests', () => {
    var userId;
    var resPost;

    var getAllFunc = (done, callback) => chai
        .request(app)
        .get('/v1/users')
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

    var putByIdFunc = (done, newUser, callback) =>
        chai
        .request(app)
        .put('/v1/users/' + userId)
        .send(newUser)
        .end((err, res) => {
            if (err) {
                done(err);
            } 
            else {
                callback(res);
                done();
            }
        });

    var banByIdFunc = (done, patch, callback) =>
        chai
        .request(app)
        .patch('/v1/users/' + userId + '/ban')
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

    var deleteByIdFunc = (done, callback) =>
        chai
        .request(app)
        .delete('/v1/users/' + userId)
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
    

    before((done) => {
        Users.collection.deleteMany({}, () => {
            done();
        });
    });

    beforeEach(done => {
        chai
            .request(app)
            .post('/v1/users')
            .send({
                "username": "Medor",
                "email": "f@f.com",
                "password": "s",
                "role": "Administrator"
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

    describe('DELETE Users id', () => {
        it('should return status code 204', done => {
            deleteByIdFunc(() => {}, res => {
                expect(res).to.have.status(204)
                // Verify that delete is idempotent
                deleteByIdFunc(done, res => expect(res).to.have.status(204));
            });
        });
    });

    afterEach(done => {
        chai
            .request(app)
            .delete('/v1/users/' + userId)
            .send()
            .end((err, res) => {
                if (err) {
                    done(err);
                } 
                else {
                    done();
                }
            });
    })

    after((done) => {
        Users.collection.deleteMany({}, () => {
            done();
        });
    });
});