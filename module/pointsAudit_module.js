const pointsAudit = require('../models/pointsAudit-schema');
var pointDetails = require('../utils/pointsDetails.json');
const residents = require('../models/resident-schema');
var ObjectId = require('mongoose').Types.ObjectId;
module.exports = function () {
    var pointsAuditModule = {
        // Start of get user points details
        // Total Earned points = sum of toal earned points of perticular user id of points collection
        // Total Redeemed points = sum of total redeemed points of perticular user id of points collection
        // Total Available points = Total Earned points(whose is_active is true) -Total Redeemed points
        // Total Lapsed points = Sum of total earned points whose is_active is false
        userPoints: function (residentId, callBack) {
            try {
                totalLapsedPoints = 0
                totalEarnedPoints = 0
                totalRedeemedPoints = 0
                totalAvailablePoints = 0
                pointsAudit.find({ residentId: residentId }, function (err, docs) {
                    if (err) {
                        callBack(true, null, "Error");
                    }
                    else {
                        if (docs.length > 0) {
                            var index = 0;
                            var checkData = function (doc) {
                                totalEarnedPoints = parseInt(totalEarnedPoints) + parseInt(doc.earnedPoints)
                                totalRedeemedPoints = parseInt(totalRedeemedPoints) + parseInt(doc.redeemedPoints)
                                if (doc.isActive) {
                                    totalAvailablePoints = totalEarnedPoints - totalRedeemedPoints
                                }
                                if (!doc.isActive) {
                                    totalLapsedPoints = parseInt(totalLapsedPoints) + parseInt(doc.earnedPoints)
                                }
                                index++;
                                if (index < docs.length) {
                                    checkData(docs[index]);
                                } else {
                                    var data = {
                                        totalLapsedPoints: totalLapsedPoints,
                                        totalAvailablePoints: totalAvailablePoints,
                                        totalEarnedPoints: totalEarnedPoints,
                                        totalRedeemedPoints: totalRedeemedPoints
                                    }
                                    callBack(false, data, "User points details available");
                                }
                            }
                            if (docs.length !== 0) {
                                checkData(docs[index]);
                            }
                        }
                        else {
                            callBack(false, null, "User has no point");
                        }
                    }
                });
            } catch (e) {
                callBack(true, null);
            }
        },
        // End of get user points details
        //Start of get Redeem points
        userRedeemPoints: function (residentId, redeemedPoints, callBack) {
            try {
                pointsAudit.find({ residentId: residentId }).sort({ createdAt: -1 }).limit(1).then((result) => {
                    if (result.length > 0) {
                        if (result[0].availablePoints >= redeemedPoints) {
                            callBack(false, "User has available redeempoints");
                        }
                        else {
                            callBack(true, "Sorry, You don't have availablepoints to redeem");
                        }
                    }
                    else {
                        callBack(true, "Sorry, You don't have availablepoints to redeem");
                    }
                }).catch(err => {
                    callBack(true, "Error");
                });
            } catch (e) {
                callBack(true, "Error");
            }
        },
        //End of get Redeem points
        //Start API to get the user Transaction details
        transactionDetails: function (residentId, callBack) {
            try {
                pointsAudit.find({ residentId: residentId }).sort({ createdAt: -1 }).limit(10).then((result) => {
                    if (result.length > 0) {
                        callBack(false, result, "User transaction details");
                    }
                    else {
                        callBack(true, "don't have transaction details");
                    }
                }).catch(err => {
                    callBack(true, "Error");
                });
            } catch (e) {
                callBack(true, null);
            }
        },
        //End API to get the user Transaction details
        //Start points conversion 
        pointConversion: function (countryCode, redeemedPoints, callBack) {
            try {
                var currencyValue = ((parseFloat(pointDetails[countryCode].redemption.currencyValue) / parseInt(pointDetails[countryCode].redemption.numberOfPoints)) * parseInt(redeemedPoints))
                var currency = pointDetails[countryCode].countryCurrency
                callBack(false, currencyValue, currency);
            } catch (e) {
                callBack(true, null, null);
            }
        },
        //End points conversion 
        //Start of user eligibility to Redeem points
        userRedeemPointsEligibility: function (residentId, redeemedPoints, callBack) {
            try {
                residents.find({ residentId: residentId }).then((result) => {
                    if (result.length > 0) {
                        if (result[0].availablePoints >= redeemedPoints) {
                            callBack(false, true, "User has available redeempoints");
                        }
                        else {
                            callBack(true, false, "Sorry, You don't have availablepoints to redeem");
                        }
                    }
                    else {
                        callBack(true, false, "Sorry, no user found");
                    }
                }).catch(err => {
                    callBack(true, false, "Error");
                });
            } catch (e) {
                callBack(true, false, "Error");
            }
        },
        //End of user eligibility to Redeem points
        //Start deactivate points
        deactivatePoints: async function (callBack) {
            try {
                // FIND ALL RESIDENTS DATA 
                let residentData = await residents.find({})
                // IF ANY RESIDENT DATA FOUND THEN WE WILL CALLL RECURSIVE FUNCTION 'checkData'
                if (residentData.length > 0) {
                    var totalEarnedPoints = 0;
                    var totalRedeemedPoints = 0;
                    var updatedPoints = 0;
                    var availablePoints = 0;
                    var startOfToday = new Date();
                    var lastDataId
                    startOfToday.setHours(0, 0, 0, 0);  // SETTING START OF THE DAY TO MIDNIGHT
                    var index = 0;
                    var checkData = async function (doc) {
                        // FIND OUT TOTAL EARNED POINTS WHICH ARE GOING TO BE EXPIRED ON SAME DAY OF THIS RESIDENT BY RESIDENT ID
                        var pointsData = await pointsAudit.aggregate([{
                            $match: {
                                residentId: doc.residentId,
                                earnedPointsExpiryDate: { "$lte": startOfToday },
                                isActive: true,
                                isLapsed: false
                            }
                        }, {
                            $group:
                                { _id: null, totalEarnedPoints: { $sum: "$earnedPoints" } }
                        }])
                        // FIND OUT LASTEST POINT DATA OF THIS RESIDENT FROM POINTSAUDIT COLLECTION TO UPDATE LATEST AVAILABLE POINTS 
                        let pointsAllData = await pointsAudit.find({
                            residentId: doc.residentId,
                        }).sort({ _id: -1 }).limit(1)
                        // IF ANY POINTS DATA FOUND OF THIS PERTICULAR RESIDENT
                        if (pointsData.length > 0) {
                            // TOTAL EARNED POINT OF THIS RESIDENT
                            totalEarnedPoints = parseInt(pointsData[0].totalEarnedPoints)
                            // LATEST POINTSAUDIT ID OF THIS RESIDENT POINTSAUDIT DATA
                            lastDataId = pointsAllData[0]._id
                            // FIND OUT TODAY'S TOTAL REDEMED POINTS DETAILS OF THIS RESIDENT WHICH CREATED AT IS TODAY
                            var todayPointsData = await pointsAudit.aggregate([{
                                $match: {
                                    residentId: doc.residentId,
                                    createdAt: { "$gte": startOfToday },
                                    isActive: true,
                                    isLapsed: false
                                }
                            }, {
                                $group:
                                    { _id: null, totalRedeemedPoints: { $sum: "$redeemedPoints" } }
                            }])
                            // CHECK IF ANY TODAY REDEM POINT FOUND
                            if (todayPointsData.length > 0) {
                                // TOTAL REDEMMED POINT OF TODAY
                                totalRedeemedPoints = parseInt(todayPointsData[0].totalRedeemedPoints)
                            }
                            // GET UDATED POINTS AFTER SUBTRACTING TODAY TOTAL REDEMED POINTS WITH EXPIREDDATE TOTAL EARNED POINTS
                            updatedPoints = totalEarnedPoints - totalRedeemedPoints
                            // UPDATING AVAILABLE PONTS OF RESIDENTS COLLECTION BY SUBTRACTING UPDATED POINTS FROM LATEST AVAILABLE POINTS OF THIS RESINDENT IN RESIDENT COLLECTION
                            availablePoints = parseInt(doc.availablePoints) - updatedPoints
                            // UPDATE LATEST AVAILABLE POINTS AT LATEST RECORD OF RESIDENT AT POINTSAUDIT COLLECTION
                            var updatedLastPointsAudit = await pointsAudit.updateOne({
                                _id: lastDataId
                            }, {
                                $set: {
                                    availablePoints: availablePoints,
                                }
                            }, function (err, res) {
                                console.log(err)
                            })
                            // UPDATE LATEST AVAILABLE POINTS IN RESIDENT COLLECTION OF THAT RESIDENT ID
                            var updatedResidents = await residents.updateOne({ residentId: doc.residentId }, {
                                $set: { availablePoints: availablePoints }
                            })
                            // UPDATE ALL EXPIRED POINTS RECORD MAKE IT ACTIVE FALSE & LAPSE TRUE FOR MAKING IT EXPIRED
                            var updatedPointsAudit = await pointsAudit.updateMany({
                                residentId: doc.residentId,
                                earnedPointsExpiryDate: { "$lte": startOfToday },
                            }, {
                                $set: {
                                    isActive: false,
                                    isLapsed: true
                                }
                            })
                        }
                        // MAKE INDEX INCREMENT
                        index++
                        // CHECK IF MORE RESIDENTS ARE AVAILABLE OR NOT IN RESIDENTDATA
                        if (index < residentData.length) {
                            // IF MORE RESIDENT AVAILABLE THEN PASS NEXT INDEX TO CHECKDATA FUNCTION
                            checkData(residentData[index]);
                        } else {
                            // IF MORE RESIDENTS ARE NOT AVAILABLE THE GIVE CALL BACK TO API
                            callBack(false, 'Expiration done')
                        }
                    }
                    // THIS IS THE CHECK DATA RECURSIVE FUNCTION
                    checkData(residentData[index]);
                }
                else {
                    // IF NO RESIDENTS AVAILABLE IN RESIDENTS COLLECTION
                    callBack(false, 'No residents available');
                }
            } catch (e) {
                callBack(true, null);
            }
        }
        //End deactivate points
    }
    return pointsAuditModule;
}
