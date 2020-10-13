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

const adminRoutesPrefix = config.routesPrefix + config.adminRoutesNamespace + '/tariff';
const routesPrefix = config.routesPrefix + config.userRoutesNamespace + '/set-tariff';
const balanceRoutesPrefix = config.routesPrefix + config.userRoutesNamespace + '/balance';

const openapiSchemaPath = path.resolve("./spec/openapi.yaml");

let newTariffId;
let initialBalance;

describe(`${routesPrefix}`, () => {

    before(() => {
        return new Promise((resolve) => {
            chai.request(server)
                .get(`${balanceRoutesPrefix}`)
                .set('authorization', `Bearer ${fakes.fakeAnotherUserAuthToken}`)
                .end((err, res) => {
                    initialBalance = res.body.balance;
                    resolve();
                });
        });
    });

    it("should create tariff by admin user", (done) => {
        chai.request(server)
            .post(`${adminRoutesPrefix}`)
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

                chai.request(server)
                    .post(`${routesPrefix}`)
                    .set('authorization', `Bearer ${fakes.fakeAnotherUserAuthToken}`)
                    .send({
                        "id": newTariffId,
                    })
                    .end((err, setTarifRes) => {
                        should.not.exist(err);
                        setTarifRes.status.should.eql(200);
                        setTarifRes.body.tariff.should.eql(newTariffId);
                        setTarifRes.body.subscriptionState.should.eql(1);

                        chai.request(server)
                            .get(`${balanceRoutesPrefix}`)
                            .set('authorization', `Bearer ${fakes.fakeAnotherUserAuthToken}`)
                            .end((err, res) => {
                                should.not.exist(err);
                                res.status.should.eql(200);

                                console.log('initialBalance', initialBalance);

                                // we already have 20 USD on user's internal balance
                                res.body.balance.should.be.eq(initialBalance - (30 - 20));

                                setTarifRes.should.to.be.a.validResponse(openapiSchemaPath, `${routesPrefix}`, "post")
                                    .andNotifyWhen(done);
                            });

                    });
            });
    });

});
