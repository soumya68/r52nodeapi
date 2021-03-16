const order = require('../models/order-schema');
const pointsAudit = require('../models/pointsAudit-schema');
var pointDetails = require('../utils/pointsDetails.json');
const residents = require('../models/resident-schema');
const productsModel = require('../models/catalouge-schema');
var ObjectId = require('mongoose').Types.ObjectId;
module.exports = function () {
    var orderModule = {
        // Start of  create order details
        createPointsDetails: function (orderId,
            redeemedPoints,
            pointSource, countryCode, callBack) {
            try {
                // FIND ORDER DETAILS BY ORDER ID
                order.find({ _id: new ObjectId(orderId) }).then(orderData => {

                    // CHECK ANY ORDER FOUND OR NOT
                    if (orderData.length > 0) {
                        // IF ANY ORDER FOUND
                        var finalPrice = orderData[0].orderTotalPayable
                        var residentId = orderData[0].residentId
                        totalAvailablePoint = 0
                        var productDetails = [];
                        // SUBORDER DETAILS
                        var subOrdersDetails = orderData[0].subOrders
                        // CHECK IF SUBORDER DETAILS HAS ANY SUBORDER OR EMPTY
                        if (subOrdersDetails.length > 0) {
                            // IF SUB ORDER FOUND
                            var index = 0;
                            // SUBORDERDATA FUNCTION START
                            var subOrdersData = function (doc) {
                                // GET ITEM DETAILS OF ITEM ARRAY
                                var item = doc.items
                                // ADD THOESE ITEMS WITH PREVIOUS PRODUCT DEATILS ARRAY
                                productDetails = productDetails.concat(item)
                                index++
                                // CHECK IF ANY MORE SUB ORDER IS AVAILABLE OR NOT
                                if (index < subOrdersDetails.length) {
                                    // IF ANY MORE SUBORDER AVAILABLE ,THEN CALL THE SUBORDERDATA FUNCTION AGAIN
                                    subOrdersData(subOrdersDetails[index]);
                                }
                                else {
                                    // IF NO MORE SUBORDER FOUND , THEN PASS REQUIRED DATAS TO POINTS ACCUMULATION FUNCTION
                                    orderModule.pointsAccumulation(
                                        productDetails, finalPrice,
                                        redeemedPoints,
                                        countryCode,
                                        function (error, totalEarnedPoints, earnedPointsExpiryDate, totalPrice, totalRedeemedPoints, discountAmount) {
                                            if (!error) {
                                                //IF NO ERROR FOUND ,THEN GET FINAL PRICE & UPDATE PERTICULAR ORDER DATAS
                                                finalPrice = parseFloat(finalPrice - discountAmount).toFixed(2)
                                                order.findOneAndUpdate({ _id: new ObjectId(orderId) },
                                                    {
                                                        $set: {
                                                            orderTotalPayable: finalPrice,
                                                            pointBasedDiscountedAmount: parseFloat(discountAmount).toFixed(2),
                                                            isEarnedPointCalculated: true
                                                        }
                                                    },
                                                )
                                                    .then(result => {
                                                        // CHECK IF IS THERE ANY totalEarnedPoints OR totalRedeemedPoints 
                                                        if (totalEarnedPoints > 0 || totalRedeemedPoints > 0) {
                                                            // IF  totalEarnedPoints IS AVAILABLE
                                                            if (totalEarnedPoints > 0) {
                                                                var pointData = {
                                                                    redeemedPoints: totalRedeemedPoints,
                                                                    earnedPoints: totalEarnedPoints,
                                                                    availablePoints: totalAvailablePoint,
                                                                    pointSource: pointSource,
                                                                    earnedPointsExpiryDate: earnedPointsExpiryDate,
                                                                    residentId: residentId,
                                                                    orderId: orderId,
                                                                    pointsEarnedCalculation: true
                                                                }
                                                            }
                                                            else {
                                                                var pointData = {
                                                                    redeemedPoints: totalRedeemedPoints,
                                                                    earnedPoints: totalEarnedPoints,
                                                                    availablePoints: totalAvailablePoint,
                                                                    pointSource: pointSource,
                                                                    earnedPointsExpiryDate: earnedPointsExpiryDate,
                                                                    residentId: residentId,
                                                                    orderId: orderId,
                                                                    pointsEarnedCalculation: true
                                                                }
                                                            }
                                                            const ponitDetails = new pointsAudit(pointData);
                                                            // SAVE POINTS DETAILS IN POINTSAUDIT COLLECTION 
                                                            ponitDetails.save().then(response => {
                                                                // UPDATE AVAILABLE POINT OF THAT RESIDENT BY SUBSTRACTING REEDEM POINTS FROM AVAILABLE POINTS
                                                                residents.findOneAndUpdate({ residentId: residentId },
                                                                    { $inc: { availablePoints: -parseInt(totalRedeemedPoints) } },
                                                                    { new: true }).then(result => {
                                                                        callBack(false, "Order point created successfully", discountAmount, finalPrice, totalEarnedPoints);
                                                                    }).catch(err => {
                                                                        callBack(true, "Error", 0, 0, 0);
                                                                    });
                                                            })
                                                        }
                                                        else {
                                                            // IF NO EARNED POINT OR REDEEM POINT AVAILABLE FOR THIS ORDER
                                                            callBack(false, "Order point created successfully", discountAmount, finalPrice, totalEarnedPoints);
                                                        }
                                                        // callBack(false, "Order point created successfully");
                                                    }).catch(err => {
                                                        callBack(true, "Error", 0, 0, 0);
                                                    })
                                                // })
                                            }
                                            else {
                                                callBack(true, "Error", 0, 0, 0);
                                            }
                                        })
                                }
                            }
                            // CHECK IF ANY SUBORDER IS FOUND OR NOT
                            if (subOrdersDetails.length !== 0) {
                                // IF ANY SUBORDER IS FOUND THEN CALL SUBORDERDATA FUNCTION
                                subOrdersData(subOrdersDetails[index]);
                            }
                        }
                        else {
                            // if no suborder found
                            callBack(true, "No suborder data found");
                        }
                    }
                    else {
                        // if no order found 
                        callBack(true, "No order found");
                    }
                })
                    .catch(err => {
                        callBack(true, "Error",);
                    });
            } catch (e) {
                callBack(true, "Error",);
            }
        },
        // Start of  point accumulation for create order
        pointsAccumulation: function (productDetails, finalPrice,
            redeemedPoints,
            countryCode, callBack) {
            try {
                totalEarnedPoints = 0
                totalRedeemedPoints = 0
                totalPrice = finalPrice;
                totalAvailablePoints = 0;
                discountAmount = 0.00;
                earnedPointsExpiryDate = new Date();
                //  if (pointDetails[countryCode].earned.minimumOrderPrice <= finalPrice) {
                var products = productDetails
                var index = 0;
                var productData = function (doc) {
                    var singleProductId = doc.medicationId
                    if (doc.pointsAccumulation) {
                        var productPrice = doc.price
                        totalEarnedPoints = parseFloat(totalEarnedPoints) + Math.round(((parseFloat(pointDetails[countryCode].earned.numberOfPoints) / parseFloat(pointDetails[countryCode].earned.amountSpent)) * parseFloat(productPrice)))
                    }
                    index++;
                    if (index < products.length) {
                        productData(products[index]);
                    }
                    else {
                        //  if (pointDetails[countryCode].redemption.minimumOrderPrice <= finalPrice) {
                        if (redeemedPoints > 0) {
                            totalRedeemedPoints = redeemedPoints
                            discountAmount = ((parseFloat(pointDetails[countryCode].redemption.currencyValue).toFixed(2) / parseInt(pointDetails[countryCode].redemption.numberOfPoints)) * parseInt(redeemedPoints))
                            totalPrice = parseFloat(totalPrice) - parseFloat(discountAmount)
                            totalAvailablePoints = parseFloat(totalAvailablePoints) - parseFloat(redeemedPoints)
                        }
                        //   }
                        var days = pointDetails[countryCode].earnedPointsExpiryDays
                        earnedPointsExpiryDate.setDate(earnedPointsExpiryDate.getDate() + days);
                        callBack(false, totalEarnedPoints, earnedPointsExpiryDate, totalPrice, totalRedeemedPoints, discountAmount)
                    }
                }
                if (products.length !== 0) {
                    productData(products[index]);
                }
                // }
                // else {
                //     callBack(false, totalEarnedPoints, null, finalPrice, totalRedeemedPoints)
                // }
            } catch (e) {
                callBack(true, totalEarnedPoints, earnedPointsExpiryDate, totalPrice, totalRedeemedPoints, discountAmount)
            }
        },
        // End of create order details
        //Start To get the points earned after successfully deliver
        pointsupdate: function (orderId, callBack) {
            try {
                pointsAudit.find({ orderId: orderId }).then((result) => {
                    let updates = {
                        availablePoints: result[0].availablePoints + result[0].earnedPoints
                    }
                    if (result[0].isActive == true) {
                        // To update points in the collections
                        residents.findOneAndUpdate({ _id: orderId },
                            { $set: updates },
                            { new: true }).then(data => {
                                order.findOneAndUpdate({ _id: orderId },
                                    { $set: { isDelivered: true, isPointsAddedToResident: true } },
                                    { new: true }).then(data => {
                                        pointsAudit.findOneAndUpdate({ orderId: orderId },
                                            { $set: { isActive: false, earnedPointsExpiryDate: new Date() } },
                                            { new: true }).then(data => {
                                                callBack(false, "Order status updated successfully");
                                            })
                                    })
                            }).catch(err => {
                            });
                    }
                    else {
                        callBack(true, "No delivery products");
                    }
                }).catch(err => {
                    callBack(true, "Error");
                });
            } catch (e) {
                callBack(true, "Error");
            }
        },
        //Start To get the points earned after successfully deliver
    }
    return orderModule;
}
