'use strict';

const {TariffsList} = require('../../../../common/classes/tariffs-list.class');
const {FeatureCheck} = require('../../../../common/classes/features-check.class')

module.exports = async (ctx, user, featureCode, landing) => {
    const tariffsList = new TariffsList(ctx);
    const tariff = await tariffsList.GetById(user.tariff);

    if (!tariff) {
        return false;
    }

    const feature = tariff.features.find(f => f.feature.code === featureCode);
    if (!feature) {
        return false;
    }

    return await FeatureCheck.CheckByCode(featureCode, ctx, user._id.toString(), feature.volume, false, landing)
}
