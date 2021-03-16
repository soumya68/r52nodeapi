module.exports = (app) => {
    var pointsModule = require('../module/pointsAudit_module')();
    //START OF API FOR USER POINTS DETAILS 
    //Response: status, message,data
    //functions:userPoints
    //Params:residentId
    app.post('/api/user/points', function (req, res) {
        try {
            if (!req.body.residentId) {
                res.status(400).json({ status: false, message: "residentId parameter is missing" });
                return;
            }
            // TO CHECK USER POINT DETAILS BY USERPOINTS FUNCTION
            pointsModule.userPoints(req.body.residentId,
                function (error, result, message) {
                    if (error) {
                        res.status(500).json({
                            status: false,
                            message: message,
                            data: result,
                        })
                    }
                    else {
                        res.status(200).json({
                            status: true,
                            message: message,
                            data: result,
                        })
                    }
                })
        }
        catch (er) {
            res.json({ status: false, message: er });
        }
    });
    //END OF API FOR USER POINTS DETAILS 
    // Start of API for get the user latest transaction details
    //Response: status, message,data
    //functions:transactionDetails
    //Params:residentId
    app.get('/api/user/transactiondetails', function (req, res) {
        try {
            if (!req.body.residentId) {
                res.status(400).json({ status: false, message: "residentId parameter is missing" });
                return;
            }
            pointsModule.transactionDetails(req.body.residentId,
                function (error, result, message) {
                    if (error) {
                        res.status(500).json({
                            status: false,
                            message: message,
                            data: result,
                        })
                    }
                    else {
                        res.status(200).json({
                            status: true,
                            message: message,
                            data: result,
                        })
                    }
                })
        }
        catch (er) {
            res.json({ status: false, message: er });
        }
    });
    // Start of API for get the user latest transaction details
    // Start of API for Point Redeemption 
    //Response: status, message,data
    //functions:userRedeemPoints
    //Params:residentId,redeemedPoints
    app.get('/api/redeemdetails', function (req, res) {
        try {
            if (!req.body.residentId) {
                res.status(400).json({ status: false, message: "residentId parameter is missing" });
                return;
            }
            if (!req.body.redeemedPoints) {
                res.status(400).json({ status: false, message: "redeemedPoints parameter is missing" });
                return;
            }
            pointsModule.userRedeemPoints(req.body.residentId, req.body.redeemedPoints,
                function (error, result, message) {
                    if (error) {
                        res.status(500).json({
                            status: false,
                            message: message,
                            data: result,
                        })
                    }
                    else {
                    }
                })
        }
        catch (er) {
            res.json({ status: false, message: er });
        }
    });
    //End of API for Point Redeemption
    // Start of API for Point Coversion & check Available points for redem
    //Response: status, message,currencyValue,currency
    //functions:pointConversion,userRedeemPointsEligibility
    //Params:residentId,redeemPoints,countryCode
    app.post('/api/pointconversion', function (req, res) {
        try {
            if (!req.body.countryCode) {
                res.status(400).json({ status: false, message: "countryCode parameter is missing" });
                return;
            }
            if (!req.body.redeemPoints) {
                res.status(400).json({ status: false, message: "redeemPoints parameter is missing" });
                return;
            }
            if (!req.body.residentId) {
                res.status(400).json({ status: false, message: "residentId parameter is missing" });
                return;
            }
            const { countryCode, redeemPoints, residentId } = req.body
            // POINT CONVERSION FUNTION TO CHECK POINT CONVERTED AMOUNT
            pointsModule.pointConversion(countryCode, redeemPoints,
                function (error, currencyValue, currency) {
                    if (error) {
                        res.status(500).json({
                            status: false,
                            currencyValue: null,
                            currency: null
                        })
                    }
                    else {
                        // TO CHECK USER ELIGIBILITY FOR REDEEM THE POINTS
                        pointsModule.userRedeemPointsEligibility(residentId, redeemPoints,
                            function (err, status, message) {
                                if (err) {
                                    res.status(500).json({
                                        status: false,
                                        message: message,
                                        currencyValue: currencyValue,
                                        currency: currency
                                    })
                                }
                                else {
                                    res.status(200).json({
                                        status: status,
                                        message: message,
                                        currencyValue: currencyValue,
                                        currency: currency
                                    })
                                }
                            })
                    }
                })
        }
        catch (er) {
            res.status(500).json({ status: false, message: er });
        }
    });
    //End of API for Point Coversion & check Available points for redem
    // Start of API for Point Expiry
    //Response: status, message
    //functions:deactivatePoints
    //Params:
    app.post('/api/pointsexpire', function (req, res) {
        try {
            // TO DEACTIVATE ALL POINTS WHO'S EXPIRY DATE IS TODAY
            pointsModule.deactivatePoints(
                function (error, message) {
                    if (error) {
                        res.status(500).json({
                            status: false,
                            message: message,
                        })
                    }
                    else {
                        res.status(200).json({
                            status: true,
                            message: message,
                        })
                    }
                })
        }
        catch (er) {
            res.status(500).json({ status: false, message: er });
        }
    });
    //End of API for Point Expiry
};