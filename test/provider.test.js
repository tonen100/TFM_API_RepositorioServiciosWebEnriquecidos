const app = require("../index");
const chai = require("chai");
const chaiHttp = require("chai-http");
const sinon = require('sinon');
var mongoose = require('mongoose'),
Users = mongoose.model('Users'),
Providers = mongoose.model('Providers');

var admin = require('firebase-admin');
sinon.stub(admin.auth(), "verifyIdToken").callsFake(() => { 
    return {
        uid: 'admin@test.com'
    }
});

const { expect } = chai;
chai.use(chaiHttp);

describe('Providers Integration tests', () => {
    var providerId;
    var resPost;
    var firebaseFakeToken = "token";

    var getAllFunc = (done, callback) => chai
        .request(app)
        .get('/v1/providers')
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
        .get('/v1/providers/' + providerId)
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

    var putByIdFunc = (done, newProvider, callback) =>
        chai
        .request(app)
        .put('/v1/providers/' + providerId)
        .set('authorization', firebaseFakeToken)
        .send(newProvider)
        .end((err, res) => {
            if (err) {
                done(err);
            } 
            else {
                callback(res);
                done();
            }
        });

    var blacklistById = (done, patch, callback) =>
        chai
        .request(app)
        .patch('/v1/providers/' + providerId + '/blacklist')
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

    var deleteByIdFunc = (done, provider_id, callback) =>
        chai
        .request(app)
        .delete('/v1/providers/' + provider_id)
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
    

    before((done) => {
        Providers.collection.deleteMany({}, (err) => {
            if(err) {
                done(err);
            } else {
                done();
            }
        });
    });

    function postFunc(obj, callback) {
        chai
            .request(app)
            .post('/v1/providers')
            .set('authorization', firebaseFakeToken)
            .send(obj)
            .end((err, res) => {
                if (err) {
                    console.error(err)
                } 
                else {
                    callback(res)
                }
            })
    }

    beforeEach(done => {
        postFunc({
            "name": "Twitter",
            "description": "Twitter API Test",
            "logoUrl": "https://upload.wikimedia.org/wikipedia/fr/thumb/c/c8/Twitter_Bird.svg/1200px-Twitter_Bird.svg.png",
            "externalLinks": [
                "https://help.twitter.com/en/rules-and-policies/twitter-api",
                "https://twitter.com/explore"
            ]
        }, (res) => {
            providerId = res.body._id;
            resPost = res;
            done();
        })
    });

    describe('POST Providers', () => {
        it('should return status code 201', done => {
            expect(resPost).to.have.status(201);
            done();
        });
        it('should return the right provider', done => {
            expect(resPost.body.name).to.eql("Twitter");
            expect(JSON.stringify(resPost.body.externalLinks)).to.eql(JSON.stringify([
                "https://help.twitter.com/en/rules-and-policies/twitter-api",
                "https://twitter.com/explore"
            ]));
            done();
        });
    });

    describe('GET Providers', () => {
        it('should return status code 200', done => {
            getAllFunc(done, res => expect(res).to.have.status(200));
        });
        it('should return the right provider', done => {
            getAllFunc(done, res => expect(res.body[res.body.length - 1].name).to.eql("Twitter"));
        });
    });

    describe('GET Providers id', () => {
        it('should return status code 200', done => {
            getByIdFunc(done, res => expect(res).to.have.status(200));
        });
        it('should return the right provider', done => {
            getByIdFunc(done, res => expect(res.body.name).to.eql("Twitter"));
        });
    });

    describe('PUT Providers id', () => {
        var correctProvider = {
            "_id": providerId,
            "name": "Twitter Inc",
            "description": "Twitter API",
            "logoUrl": "https://upload.wikimedia.org/wikipedia/fr/thumb/c/c8/Twitter_Bird.svg/1200px-Twitter_Bird.svg.png",
            "externalLinks": [
                "https://help.twitter.com/en/rules-and-policies/twitter-api",
                "https://twitter.com/explore"
            ]
        };
        var wrongProvider = {
            "_id": providerId,
            "name": "Twitter",
            "description": "Twitter API",
            "logoUrl": [1, 2, 3],
            "externalLinks": [
                "https://help.twitter.com/en/rules-and-policies/twitter-api",
                "https://twitter.com/explore"
            ]
        };
        it('should return status code 200', done => {
            putByIdFunc(done, correctProvider, res => expect(res).to.have.status(200));
        });
        it('should return the right provider', done => {
            putByIdFunc(done, correctProvider,
                res => expect(res.body.name).to.eql("Twitter Inc")
                && expect(res.body.description).to.eql("Twitter API")
            );
        });
        it('should return status code 422', done => {
            putByIdFunc(done, wrongProvider, res => expect(res).to.have.status(422));
        });
    });

    describe('PATCH RestAPI id blacklist', () => {
        var correctPatch = {
            "blacklisted": true,
        };
        var wrongPatch = {
            "blacklisted": "Not a boolean"
        };
        var correctRepatch = {
            "blacklisted": false,
        };
        it('should return status code 200', done => {
            blacklistById(done, correctPatch, res => expect(res).to.have.status(200));
        });
        it('should return the right blacklisted provider', done => {
            blacklistById(done, correctPatch,  res => expect(res.body.blacklisted).to.be.true);
        });
        it('should return status code 422', done => {
            blacklistById(done, wrongPatch, res => expect(res).to.have.status(422));
        });
        it('should return the right unblacklisted provider', done => {
            blacklistById(done, correctRepatch,  res => expect(res.body.blacklisted).to.be.false);
        });
    });

    describe('DELETE Providers id', () => {
        it('should return status code 204', done => {
            deleteByIdFunc(() => {}, providerId, res => {
                expect(res).to.have.status(204)
                // Verify that delete is idempotent and that ressource is deleted
                deleteByIdFunc(() => getByIdFunc(done, res => expect(res).to.have.status(404)), providerId, res => expect(res).to.have.status(204));
            });
        });
    });

    afterEach(done => {
        deleteByIdFunc(done, providerId, (res) => {});
    })

    after((done) => {
        Providers.collection.deleteMany({}, () => {
            done();
        });
    });
});