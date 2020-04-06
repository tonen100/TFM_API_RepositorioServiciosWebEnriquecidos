const app = require("../index");
const chai = require("chai");
const chaiHttp = require("chai-http");
var mongoose = require('mongoose'),
RestApis = mongoose.model('RestApis');

const { expect } = chai;
chai.use(chaiHttp);

describe('RestApis Integration tests', () => {
    var restApiId;
    var providerId;
    var provider2Id;
    var resPost;

    var getAllFunc = (done, callback, providerId, businessModels) => chai
        .request(app)
        .get('/v1/restApis' +
            ((providerId || businessModels) ? "?" : "") +
            (providerId ? "providerId=" + providerId : "") +
            (providerId && businessModels ? "&" : "") +
            (businessModels ? "businessModels=" + businessModels.map(bm => bm).join(",") : ""))
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