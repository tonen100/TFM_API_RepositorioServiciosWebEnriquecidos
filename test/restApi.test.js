const app = require("../index");
const chai = require("chai");
const chaiHttp = require("chai-http");
const fs = require('fs');
var mongoose = require('mongoose'),
RestApis = mongoose.model('RestApis');

const { expect } = chai;
chai.use(chaiHttp);

describe('RestApis Integration tests', () => {
    var restApiId;
    var providerId;
    var provider2Id;
    var resPost;
    var firebaseFakeToken = "token";

    var getAllFunc = (done, callback, providerId, businessModels, keywords) => chai
        .request(app)
        .get('/v1/restApis' +
            ((providerId || businessModels || keywords) ? "?" : "") +
            (providerId ? "providerId=" + providerId : "") +
            (providerId && businessModels ? "&" : "") +
            (businessModels ? "businessModels=" + businessModels.map(bm => bm).join(",") : "") +
            (keywords ? "keywords=" + keywords : ""))
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

    var getMostRecentFunc = (count, done, callback) => chai
    .request(app)
    .get('/v1/restApis/recent' +
        (count ? "?count=" + count : "")
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
        .get('/v1/restApis/' + restApiId)
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

    var putByIdFunc = (done, newRestApi, callback) =>
        chai
        .request(app)
        .put('/v1/restApis/' + restApiId)
        .set('authorization', firebaseFakeToken)
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
        .patch('/v1/restApis/' + restApiId + '/blacklist')
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
    
    var linkById = (done, provider_id, callback) =>
        chai
        .request(app)
        .patch('/v1/restApis/' + restApiId + '/link/' + provider_id)
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

    var deleteByIdFunc = (done, restApi_id, callback) =>
        chai
        .request(app)
        .delete('/v1/restApis/' + restApi_id)
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
        RestApis.collection.deleteMany({}, (err) => {
            Providers.collection.deleteMany({}, () => {
                chai
                    .request(app)
                    .post('/v1/providers')
                    .set('authorization', firebaseFakeToken)
                    .send({
                        name: "Twitter Inc"
                    }).end((err, res) => {
                        if(err) {
                            done(err);
                        } else {
                            providerId = res.body._id;
                            chai
                                .request(app)
                                .post('/v1/providers')
                                .send({
                                    name: "Facebook, Inc."
                                }).end((err2, res2) => {
                                    if(err2) {
                                        done(err2);
                                    } else {
                                        provider2Id = res2.body._id;
                                        done();
                                    }
                                })
                        }
                    })
            });
        });
    });

    function postFunc(obj, callback) {
        chai
            .request(app)
            .post('/v1/restApis')
            .set('authorization', firebaseFakeToken)
            .send(obj)
            .end((err, res) => {
                if (err) {
                    done(err);
                } 
                else {
                    callback(res)
                }
            })
    }

    beforeEach(done => {
        postFunc({
            "name": "Twitter",
            "logoUrl": "https://upload.wikimedia.org/wikipedia/fr/thumb/c/c8/Twitter_Bird.svg/1200px-Twitter_Bird.svg.png",
            "provider_id": providerId,
            "businessModels": ["Free"]
        }, (res) => {
            restApiId = res.body._id;
            resPost = res;
            done();
        })
    });

    describe('POST RestApis', () => {
        it('should return status code 201', done => {
            expect(resPost).to.have.status(201);
            done();
        });
        it('should return the right restApi', done => {
            expect(resPost.body.name).to.eql("Twitter");
            expect(resPost.body.businessModels[0]).to.eql("Free");
            done();
        });
    });

    describe('GET RestApis', () => {
        it('should return status code 200', done => {
            getAllFunc(done, res => expect(res).to.have.status(200));
        });
        it('should return the right restApi', done => {
            getAllFunc(done, res => expect(res.body[res.body.length - 1].name).to.eql("Twitter"));
        });
        it('should return the right restApis filtered by provider', done => {
            postFunc({
                "name": "Facebook",
                "logoUrl": "https://upload.wikimedia.org/wikipedia/commons/thumb/f/ff/Facebook_logo_36x36.svg/1200px-Facebook_logo_36x36.svg.png",
                "provider_id": provider2Id,
                "businessModels": ["Free"]
            }, (res2) => getAllFunc(() => {}, res => {
                expect(res.body.length).to.eql(1);
                expect(res.body[res.body.length - 1].name).to.eql("Twitter");
                deleteByIdFunc(done, res2.body._id, (res) => {});
            }, providerId));
        });
        it('should return the right restApis filtered by business model', done => {
            postFunc({
                "name": "AWS Security Hub",
                "logoUrl": "https://d0.awsstatic.com/security-center/AWSSecurity.jpg",
                "provider_id": provider2Id,
                "businessModels": ["Billing"]
            }, (res2) => getAllFunc(() => {}, res => {
                expect(res.body.length).to.eql(1);
                expect(res.body[res.body.length - 1].name).to.eql("AWS Security Hub");
                deleteByIdFunc(done, res2.body._id, (res) => {});
            }, null, ["Billing"]));
        });
        it('should return the right restApis filtered by various business models', done => {
            postFunc({
                "name": "AWS Security Hub",
                "logoUrl": "https://d0.awsstatic.com/security-center/AWSSecurity.jpg",
                "provider_id": provider2Id,
                "businessModels": ["Free", "FreeTrialVersion", "Billing"]
            }, (res2) => getAllFunc(() => {}, res => {
                expect(res.body.length).to.eql(2);
                expect(res.body.find(restApi => restApi.name == ("Twitter"))).to.not.be.null;
                expect(res.body.find(restApi => restApi.name == ("AWS Security Hub"))).to.not.be.null;
                deleteByIdFunc(done, res2.body._id, (res) => {});
            }, null, ["Free", "Billing"]));
        });
        it('should return the right restApis filtered by keywords', done => {
            postFunc({
                "name": "AWS Security Hub",
                "provider_id": provider2Id,
                "businessModels": ["Billing"]
            }, (res3) => postFunc({
                "name": "AWS Migration Hub",
                "provider_id": provider2Id,
                "businessModels": ["Billing"]
            }, (res2) => chai
                .request(app)
                .post('/v1/restApis/' + res3.body._id + '/versions/')
                .set('authorization', firebaseFakeToken)
                .send({
                    "number": "v1.0.0",
                    "originalDocumentation": fs.readFileSync('test/ressources/AWSSecurityHub-oas.json').toString(),
                    "description": "1rst version of AWS Security"
                })
                .end((err5, res5) => {
                    if (err5) {
                        done(err5);
                    } 
                    else {
                        chai
                        .request(app)
                        .post('/v1/restApis/' + res2.body._id + '/versions/')
                        .set('authorization', firebaseFakeToken)
                        .send({
                            "number": "v1.0.0",
                            "originalDocumentation": fs.readFileSync('test/ressources/AWSMigrationHub-oas.json').toString(),
                            "description": "1rst version of AWS Migration"
                        })
                        .end((err4, res4) => {
                            if (err4) {
                                done(err4);
                            } 
                            else {
                                getAllFunc(() => {}, res => {
                                    expect(res.body.length).to.eql(2);
                                    expect(res.body[0].name).to.eql("AWS Migration Hub");
                                    expect(res.body[1].name).to.eql("AWS Security Hub");
                                    deleteByIdFunc(done, res2.body._id, (res) => deleteByIdFunc(() => {}, res3.body._id, () => {}));
                                }, null, null, "AWS Migration");
                            }
                        });
                    }
                })
            ));
        });
        it('should return the most recent api', done => {
            postFunc({
                "name": "Facebook",
                "logoUrl": "https://upload.wikimedia.org/wikipedia/commons/thumb/f/ff/Facebook_logo_36x36.svg/1200px-Facebook_logo_36x36.svg.png",
                "provider_id": provider2Id,
                "businessModels": ["Free"]
            }, (res2) => getMostRecentFunc(1, () => {}, res => {
                expect(res.body.length).to.eql(1);
                expect(res.body[res.body.length - 1].name).to.eql("Facebook");
                deleteByIdFunc(done, res2.body._id, (res) => {});
            }, providerId));
        });
    });

    describe('GET RestApis id', () => {
        it('should return status code 200', done => {
            getByIdFunc(done, res => expect(res).to.have.status(200));
        });
        it('should return the right restApi', done => {
            getByIdFunc(done, res => expect(res.body.name).to.eql("Twitter"));
        });
    });

    describe('PUT RestApis id', () => {
        var newBM = ['FreeTrialVersion', 'Billing'];
        var correctRestApi = {
            "_id": restApiId,
            "name": "TwitterHub",
            "businessModels": newBM
        };
        var wrongRestApi = {
            "_id": restApiId,
            "name": "Twitter",
            "businessModels": ["NotABusinessModel"]
        };
        it('should return status code 200', done => {
            putByIdFunc(done, correctRestApi, res => expect(res).to.have.status(200));
        });
        it('should return the right restApi', done => {
            putByIdFunc(done, correctRestApi,
                res => expect(res.body.name).to.eql("TwitterHub")
                && expect(JSON.stringify(res.body.businessModels)).to.eql(JSON.stringify(newBM))
            );
        });
        it('should return status code 422', done => {
            putByIdFunc(done, wrongRestApi, res => expect(res).to.have.status(422));
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
        it('should return the right blacklisted restApi', done => {
            blacklistById(done, correctPatch,  res => expect(res.body.blacklisted).to.be.true);
        });
        it('should return status code 422', done => {
            blacklistById(done, wrongPatch, res => expect(res).to.have.status(422));
        });
        it('should return the right unblacklisted restApi', done => {
            blacklistById(done, correctRepatch,  res => expect(res.body.blacklisted).to.be.false);
        });
    });

    describe('PATCH RestAPI restApiId link providerId', () => {
        it('should return status code 200', done => {
            linkById(done, providerId, res => expect(res).to.have.status(200));
        });
        it('should return the right blacklisted restApi', done => {
            linkById(done, providerId,  res => expect(res.body.provider_id).to.eql(providerId));
        });
        it('should return status code 404', done => {
            linkById(done, restApiId, res => expect(res).to.have.status(404));
        });
    });

    describe('DELETE RestApis id', () => {
        it('should return status code 204', done => {
            deleteByIdFunc(() => {}, restApiId, res => {
                expect(res).to.have.status(204)
                // Verify that delete is idempotent and that ressource is deleted
                deleteByIdFunc(() => getByIdFunc(done, res => expect(res).to.have.status(404)), restApiId, res => expect(res).to.have.status(204));
            });
        });
    });

    afterEach(done => {
        deleteByIdFunc(done, restApiId, (res) => {});
    })

    after((done) => {
        Providers.collection.deleteMany({}, () => {
            done();
        });
    });
});