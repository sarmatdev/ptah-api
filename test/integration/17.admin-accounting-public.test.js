'use strict';

const path = require('path');
const chai = require('chai');
const expect = chai.expect;
const should = chai.should();
const chaiHttp = require('chai-http');
const chaiValidateResponse = require('chai-validate-response');

chai.use(chaiHttp);
chai.use(chaiValidateResponse.default);

const server = require('../server');
const config = require('../../config/config');
const fakes = require('../fakes/fakes');

const routesPrefix = config.routesPrefix + config.adminRoutesNamespace + '/accounting/public';

const openapiSchemaPath = path.resolve("./spec/openapi.yaml");

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
                res.body.items.length.should.be.gt(0);
                const ids = [...new Set(res.body.items.map( i => i.userId.toString()))];
                ids.length.should.be.eq(2);
                expect(res.body.balance).to.not.be.equals;
                res.should.to.be.a.validResponse(openapiSchemaPath, `${routesPrefix}`, "get")
                    .andNotifyWhen(done);
            });
    });

    it("should return valid response for admin user", (done) => {
        chai.request(server)
            .get(`${routesPrefix}?limit=1&offset=1`)
            .set('authorization', `Bearer ${fakes.fakeUserAuthToken}`)
            .end((err, res) => {
                should.not.exist(err);
                res.status.should.eql(200);
                res.body.limit.should.be.eq(1);
                res.body.offset.should.be.eq(1);
                res.body.items.length.should.be.eq(1);
                expect(res.body.balance).to.not.be.equals;
                res.should.to.be.a.validResponse(openapiSchemaPath, `${routesPrefix}`, "get")
                    .andNotifyWhen(done);
            });
    });

    it("should return valid response for admin user with query by user", (done) => {
        chai.request(server)
            .get(`${routesPrefix}/${fakes.fakeUserId}`)
            .set('authorization', `Bearer ${fakes.fakeUserAuthToken}`)
            .end((err, res) => {
                should.not.exist(err);
                res.status.should.eql(200);
                res.body.items.length.should.be.gt(0);
                const ids = [...new Set(res.body.items.map( i => i.userId.toString()))];
                ids.length.should.be.eq(1);
                expect(res.body.balance).to.be.exist;
                res.body.balance.should.be.gt(0);
                res.should.to.be.a.validResponse(openapiSchemaPath, `${routesPrefix}/{userId}`, "get")
                    .andNotifyWhen(done);
            });
    });
});
