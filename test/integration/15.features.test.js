'use strict';

const path = require('path');
const chai = require('chai');
const should = chai.should();
const chaiHttp = require('chai-http');
const chaiValidateResponse = require('chai-validate-response');

chai.use(chaiHttp);
chai.use(chaiValidateResponse.default);

const server = require('../server');
const config = require('../../config/config');
const fakes = require('../fakes/fakes');

const routesPrefix = config.routesPrefix + config.adminRoutesNamespace + '/feature';

const openapiSchemaPath = path.resolve("./spec/openapi.yaml");

let newFeatureId = '';

describe(`${routesPrefix}`, () => {

    it("should return auth error for request without bearer token", (done) => {
        chai.request(server)
            .get(`${routesPrefix}`)
            .end((err, res) => {
                should.not.exist(err);
                res.status.should.eql(401);
                res.type.should.eql('application/json');
                res.should.to.be.a.validResponse(openapiSchemaPath, `${routesPrefix}`, "get")
                    .andNotifyWhen(done);
            });
    });

    it("should return error for user without admin rights", (done) => {
        chai.request(server)
            .get(`${routesPrefix}`)
            .set('authorization', `Bearer ${fakes.fakeAnotherUserAuthToken}`)
            .end((err, res) => {
                should.not.exist(err);
                res.status.should.eql(403);
                done();
            });
    });

    it("should return valid response for admin user", (done) => {
        chai.request(server)
            .get(`${routesPrefix}`)
            .set('authorization', `Bearer ${fakes.fakeUserAuthToken}`)
            .end((err, res) => {
                should.not.exist(err);
                res.status.should.eql(200);
                res.body.features.length.should.be.gt(0);
                res.should.to.be.a.validResponse(openapiSchemaPath, `${routesPrefix}`, "get")
                    .andNotifyWhen(done);
            });
    });

    it("should return feature by id for admin user", (done) => {
        chai.request(server)
            .get(`${routesPrefix}/5f51769630e5fb53e0b94cbd`)
            .set('authorization', `Bearer ${fakes.fakeUserAuthToken}`)
            .end((err, res) => {
                should.not.exist(err);
                res.status.should.eql(200);
                res.should.to.be.a.validResponse(openapiSchemaPath, `${routesPrefix}/{featureId}`, "get")
                    .andNotifyWhen(done);
            });
    });

    it("should create feature by admin user", (done) => {
        chai.request(server)
            .post(`${routesPrefix}`)
            .set('authorization', `Bearer ${fakes.fakeUserAuthToken}`)
            .send({
                "code": "gtag_allowed_" + Math.random(),
                "isMeasureable": false,
                "measureName": "",
                "name": "Google Tag allowed",
                "description": "",
            })
            .end((err, res) => {
                should.not.exist(err);
                res.status.should.eql(201);
                newFeatureId = res.body._id;
                res.body.isArchived.should.be.false;
                res.should.to.be.a.validResponse(openapiSchemaPath, `${routesPrefix}`, "post")
                    .andNotifyWhen(done);
            });
    });

    it("should update feature by admin user", (done) => {
        chai.request(server)
            .patch(`${routesPrefix}/${newFeatureId}`)
            .set('authorization', `Bearer ${fakes.fakeUserAuthToken}`)
            .send({
                "isArchived": true,
            })
            .end((err, res) => {
                should.not.exist(err);
                res.status.should.eql(200);
                res.body.isArchived.should.be.true;
                res.should.to.be.a.validResponse(openapiSchemaPath, `${routesPrefix}/{featureId}`, "patch")
                    .andNotifyWhen(done);
            });
    });


});
