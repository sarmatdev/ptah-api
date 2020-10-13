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

const routesPrefix = config.routesPrefix + config.userRoutesNamespace + '/payments-history';

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


    it("should return valid response for authenticated user", (done) => {
        chai.request(server)
            .get(`${routesPrefix}`)
            .set('authorization', `Bearer ${fakes.fakeUserAuthToken}`)
            .end((err, res) => {
                should.not.exist(err);
                res.status.should.eql(200);
                const ids = [...new Set(res.body.items.map( i => i.userId.toString()))];
                ids.length.should.be.eq(1);
                res.should.to.be.a.validResponse(openapiSchemaPath, `${routesPrefix}`, "get")
                    .andNotifyWhen(done);
            });
    });

});
