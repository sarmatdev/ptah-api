'use strict';

const path = require('path');
const chai = require('chai');
const should = chai.should();
const chaiHttp = require('chai-http');
const chaiValidateResponse = require('chai-validate-response');

chai.use(chaiHttp);
chai.use(chaiValidateResponse.default);

const mockserver = require('../fakes/external-servers-mockup');

const server = require('../server');
const config = require('../../config/config');

const routesPrefix = config.routesPrefix;

const openapiSchemaPath = path.resolve("./spec/openapi.yaml");


it("should start mock server", (done) => {
    mockserver.start(done);
});

describe(`GET ${routesPrefix}/_healthz`, () => {

    it("should return 200 code with empty object in body", (done) => {
        chai.request(server)
            .get(`${routesPrefix}/_healthz`)
            .end((err, res) => {
                should.not.exist(err);
                res.status.should.eql(200);
                res.should.to.be.a.validResponse(openapiSchemaPath, `${routesPrefix}/_healthz`, "get")
                    .andNotifyWhen(done);
            });
    });

});


