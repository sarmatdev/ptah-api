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

const routesPrefixSignup = config.routesPrefix + config.authRoutesNamespace + '/signup';
const routesPrefixUserinfo = config.routesPrefix + config.userRoutesNamespace;

const openapiSchemaPath = path.resolve("./spec/openapi.yaml");

let newTariffId;
let initialBalance;

describe('user sign-up', () => {

    it("should set user tariff on sign-up", (done) => {
        chai.request(server)
            .post(`${routesPrefixSignup}`)
            .send({
                "name": "unit test",
                "email": "test@test.com",
                "password": "Test123$"
            })
            .end((err, res) => {
                should.not.exist(err);
                res.status.should.eql(201);

                const authToken = res.body.accessToken;

                chai.request(server)
                    .get(`${routesPrefixUserinfo}`)
                    .set('authorization', `Bearer ${authToken}`)
                    .end((err, res) => {
                        should.not.exist(err);
                        res.status.should.eql(200);
                        expect(res.body.tariff).to.not.be.null;
                        res.should.to.be.a.validResponse(openapiSchemaPath, `${routesPrefixUserinfo}`, "get")
                            .andNotifyWhen(done);
                    });


            });
    });

});
