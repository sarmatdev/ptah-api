'use strict';

const fs = require('fs');
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

const setTariffRoutesPrefix = config.routesPrefix + config.userRoutesNamespace + '/set-tariff';
const routesPrefix = config.routesPrefix + config.landingsRoutesNamespace;

const openapiSchemaPath = path.resolve("./spec/openapi.yaml");

let domain = 'test';
let landingId = '';
let currentVersion = '';
let nginxConfigFile = '';
let landingDestinationDir = '';
let newTariffId = '5f53ee77ea0c9a00a8c88082';
let landingNewName = 'My new landing with edit';
const fakeProjectFile = fs.readFileSync(fakes.fakeProjectZipPath);

describe(`Re-publish landing (PTH-14187)`, () => {

    it("should re-publish landing after changes", (done) => {
        chai.request(server)
            .post(`${setTariffRoutesPrefix}`)
            .set('authorization', `Bearer ${fakes.fakeUserAuthToken}`)
            .send({
                "id": newTariffId,
            })
            .end((err, setTarifRes) => {
                should.not.exist(err);
                setTarifRes.status.should.eql(200);
                setTarifRes.body.tariff.should.eql(newTariffId);
                setTarifRes.body.subscriptionState.should.eql(0);

                chai.request(server)
                    .post(`${routesPrefix}`)
                    .set('authorization', `Bearer ${fakes.fakeUserAuthToken}`)
                    .send({
                        name: "My new landing",
                        previewUrl: "http://domain.com/image/preview.png",
                        landing: {
                            slug: 'some new slug'
                        },
                    })
                    .end((err, res) => {
                        should.not.exist(err);
                        res.status.should.eql(201);

                        landingId = res.body._id;
                        currentVersion = res.body.currentVersion;
                        landingDestinationDir = path.resolve(config.landingsHtmlDir, landingId);
                        nginxConfigFile = path.resolve(config.nginxConfigsDir, `${landingId}.conf`);

                        chai.request(server)
                            .post(`${routesPrefix}/${landingId}/domain`)
                            .set('authorization', `Bearer ${fakes.fakeUserAuthToken}`)
                            .send({
                                domain: domain,
                                personal: false
                            })
                            .end((err, res) => {
                                should.not.exist(err);
                                res.status.should.eql(200);
                                res.body.domain.should.eql(domain + '.' + process.env.LANDINGS_PUBLISHING_HOST);

                                chai.request(server)
                                    .post(`${routesPrefix}/${landingId}/publishing`)
                                    .set('authorization', `Bearer ${fakes.fakeUserAuthToken}`)
                                    .attach('file', fakeProjectFile, 'project.zip')
                                    .end((err, res) => {
                                        should.not.exist(err);
                                        res.status.should.eql(200);
                                        res.body.isPublished.should.be.true;
                                        res.body.hasUnpublishedChanges.should.be.false;

                                        fs.existsSync(landingDestinationDir).should.be.true;
                                        // fs.existsSync(nginxConfigFile).should.be.false;

                                        chai.request(server)
                                            .patch(`${routesPrefix}/${landingId}`)
                                            .set('authorization', `Bearer ${fakes.fakeUserAuthToken}`)
                                            .send({
                                                name: landingNewName,
                                                previewUrl: "http://domain.com/image/new-preview.png",
                                                landing: fakes.fakeLanding.landing,
                                                baseVersion: currentVersion
                                            })
                                            .end((err, res) => {
                                                should.not.exist(err);
                                                res.status.should.eql(200);
                                                res.body.name.should.eq(landingNewName);
                                                res.body.currentVersion.should.be.eql(currentVersion + 1);
                                                res.body.hasUnpublishedChanges.should.be.true;

                                                chai.request(server)
                                                    .post(`${routesPrefix}/${landingId}/publishing`)
                                                    .set('authorization', `Bearer ${fakes.fakeUserAuthToken}`)
                                                    .attach('file', fakeProjectFile, 'project.zip')
                                                    .end((err, res) => {
                                                        should.not.exist(err);
                                                        res.status.should.eql(200);
                                                        res.body.isPublished.should.be.true;
                                                        res.body.hasUnpublishedChanges.should.be.false;
                                                        res.should.to.be.a.validResponse(openapiSchemaPath, `${routesPrefix}/{landingId}/publishing`, "post")
                                                            .andNotifyWhen(done);
                                                    });
                                            });
                                    });
                            });
                    });
            });
    });
});
