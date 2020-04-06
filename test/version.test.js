const app = require("../index");
const chai = require("chai");
const chaiHttp = require("chai-http");
const fs = require('fs');
var mongoose = require('mongoose'),
RestApis = mongoose.model('RestApis');

const { expect } = chai;
chai.use(chaiHttp);

describe('RestApis Versions Integration tests', () => {
    var versionId;
    var restApiId;
    var providerId;
    var resPost;

    var getAllFunc = (done, callback) => chai
        .request(app)
        .get('/v1/restApis/' + restApiId + '/versions')
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
        .get('/v1/restApis/' + restApiId + '/versions/' + versionId)
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

    var putByIdFunc = (done, newRestApi, callback) =>
        chai
        .request(app)
        .put('/v1/restApis/' + restApiId + '/versions/' + versionId)
        .send(newRestApi)
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
        .patch('/v1/restApis/' + restApiId + '/versions/' + versionId + '/blacklist')
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
        .delete('/v1/restApis/' + restApiId + '/versions/' + versionId)
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
        RestApis.collection.deleteMany({}, () => {
            Providers.collection.deleteMany({}, () => {
                chai
                    .request(app)
                    .post('/v1/providers')
                    .send({
                        name: "Twitter Inc"
                    }).end((err, res) => {
                        if(err) {
                            done(err);
                        } else {
                            providerId = res._id;
                            chai
                                .request(app)
                                .post('/v1/restApis')
                                .send({
                                    "name": "Twitter",
                                    "logoUrl": "https://upload.wikimedia.org/wikipedia/fr/thumb/c/c8/Twitter_Bird.svg/1200px-Twitter_Bird.svg.png",
                                    "provider_id": providerId,
                                    "businessModels": ["Free"]
                                })
                                .end((err, res) => {
                                    if (err) {
                                        done(err);
                                    } 
                                    else {
                                        restApiId = res.body._id;
                                        done();
                                    }
                                });
                        }
                    });
            });
        });
    });

    beforeEach(done => {
        chai
            .request(app)
            .post('/v1/restApis/' + restApiId + '/versions/')
            .send({
                "number": "v1.0.0",
                "originalDocumentation": fs.readFileSync('test/ressources/twitter-swagger.json').toString(),
                "description": "1rst version of twitter API"
            })
            .end((err, res) => {
                if (err) {
                    done(err);
                } 
                else {
                    versionId = res.body._id;
                    resPost = res;
                    done();
                }
            });
    });

    describe('POST RestApis id Versions', () => {
        it('should return status code 201', done => {
            expect(resPost).to.have.status(201);
            done();
        });
        it('should return the right version of restApi', done => {
            expect(resPost.body.number).to.eql("v1.0.0");
            expect(resPost.body.description).to.eql("1rst version of twitter API");
            done();
        });
        it('should return generate the metadata of this version of restApi', done => {
            expect(resPost.body.oasDocumentation).to.not.be.null;
            expect(resPost.body.metadata).to.not.be.null;
            done();
        });
    });

    describe('GET RestApis id Versions', () => {
        it('should return status code 200', done => {
            getAllFunc(done, res => expect(res).to.have.status(200));
        });
        it('should return the right version of restApi', done => {
            getAllFunc(done, res => expect(res.body[res.body.length - 1].number).to.eql("v1.0.0"));
        });
    });

    describe('GET RestApis id Versions id', () => {
        it('should return status code 200', done => {
            getByIdFunc(done, res => expect(res).to.have.status(200));
        });
        it('should return the right version of restApi', done => {
            getByIdFunc(done, res => expect(res.body.number).to.eql("v1.0.0"));
        });
    });

    describe('PUT RestApis id Versions id', () => {
        var newBM = ['FreeTrialVersion', 'Billing'];
        var correctRestApi = {
            "_id": restApiId,
            "number": "v2.0.0",
            "description": "2nd version of twitter API"
        };
        var wrongRestApi = {
            "_id": restApiId,
            "number": "v1.0.1",
            "description": {}
        };
        it('should return status code 200', done => {
            putByIdFunc(done, correctRestApi, res => expect(res).to.have.status(200));
        });
        it('should return the right version of restApi', done => {
            putByIdFunc(done, correctRestApi,
                res => expect(res.body.number).to.eql("v2.0.0")
                && expect(res.body.description).to.eql("2nd version of twitter API")
            );
        });
        it('should return status code 422', done => {
            putByIdFunc(done, wrongRestApi, res => expect(res).to.have.status(422));
        });
    });

    describe('PATCH RestAPI id Versions id blacklist', () => {
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
        it('should return the right blacklisted version of restApi', done => {
            blacklistById(done, correctPatch,  res => expect(res.body.blacklisted).to.be.true);
        });
        it('should return status code 422', done => {
            blacklistById(done, wrongPatch, res => expect(res).to.have.status(422));
        });
        it('should return the right unblacklisted version of restApi', done => {
            blacklistById(done, correctRepatch,  res => expect(res.body.blacklisted).to.be.false);
        });
    });

    describe('DELETE RestApis id Versions id', () => {
        it('should return status code 204', done => {
            deleteByIdFunc(() => {}, res => {
                expect(res).to.have.status(204)
                // Verify that delete is idempotent and that ressource is deleted
                deleteByIdFunc(() => getByIdFunc(done, res => expect(res).to.have.status(404)), res => expect(res).to.have.status(204));
            });
        });
    });

    afterEach(done => {
        chai
            .request(app)
            .delete('/v1/restApis/' + restApiId + '/versions/' + versionId)
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
        Providers.collection.deleteMany({}, () => {
            done();
        });
    });
});