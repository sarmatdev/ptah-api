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

const routesPrefix = config.routesPrefix + config.adminRoutesNamespace + '/tariff';

const openapiSchemaPath = path.resolve("./spec/openapi.yaml");

let newTariffId = '';

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
                res.body.tariffs.length.should.be.gt(0);
                res.should.to.be.a.validResponse(openapiSchemaPath, `${routesPrefix}`, "get")
                    .andNotifyWhen(done);
            });
    });

    it("should return tariff by id for admin user", (done) => {
        chai.request(server)
            .get(`${routesPrefix}/5f53ee77ea0c9a00a8c88082`)
            .set('authorization', `Bearer ${fakes.fakeUserAuthToken}`)
            .end((err, res) => {
                should.not.exist(err);
                res.status.should.eql(200);
                res.should.to.be.a.validResponse(openapiSchemaPath, `${routesPrefix}/{tariffId}`, "get")
                    .andNotifyWhen(done);
            });
    });

    it("should create tariff by admin user", (done) => {
        chai.request(server)
            .post(`${routesPrefix}`)
            .set('authorization', `Bearer ${fakes.fakeUserAuthToken}`)
            .send({
                "dayPrice": 1,
                "features": [
                    {"id": "5f51769630e5fb53e0b94cbd", "volume": 3},
                    {"id": "5f5176d730e5fb53e0b94cce", "volume": 50},
                    {"id": "5f53e591e36dd80b9caaf9f2", "volume": 0}
                ],
                "name": "Test",
                "description": "Test tariff",
                "periodDays": 30
            })
            .end((err, res) => {
                should.not.exist(err);
                res.status.should.eql(201);
                newTariffId = res.body._id;
                res.body.isArchived.should.be.false;
                res.should.to.be.a.validResponse(openapiSchemaPath, `${routesPrefix}`, "post")
                    .andNotifyWhen(done);
            });
    });

    it("should update tariff by admin user", (done) => {
        chai.request(server)
            .patch(`${routesPrefix}/${newTariffId}`)
            .set('authorization', `Bearer ${fakes.fakeUserAuthToken}`)
            .send({
                "isArchived": true,
            })
            .end((err, res) => {
                should.not.exist(err);
                res.status.should.eql(200);
                res.body.isArchived.should.be.true;
                res.should.to.be.a.validResponse(openapiSchemaPath, `${routesPrefix}/{tariffId}`, "patch")
                    .andNotifyWhen(done);
            });
    });


    it("should set tariff as default by admin user", (done) => {
        chai.request(server)
            .post(`${routesPrefix}/5f53ee77ea0c9a00a8c88082/default`)
            .set('authorization', `Bearer ${fakes.fakeUserAuthToken}`)
            .end((err, res) => {
                should.not.exist(err);
                res.status.should.eql(200);
                res.should.to.be.a.validResponse(openapiSchemaPath, `${routesPrefix}/{tariffId}/default`, "post")
                    .andNotifyWhen(done);
            });
    });


});
