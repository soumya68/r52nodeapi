const supplier = require('../models/supplier-schema');
const medications = require('../models/catalouge-schema');
const residents = require('../models/resident-schema');
module.exports = function () {
    var supplierModule = {
        //Start of add supplier details
        addSupplier: function (supplierData, callBack) {
            try {
                supplier.find({ supplierCode: supplierData.supplierCode }).then(res => {
                    if (res.length > 0) {
                        callBack(true, null, res, "Supplier code already exists!!");
                    }
                    else {
                        const supplierDetails = new supplier(supplierData);
                        supplierDetails.save().then(response => {
                            callBack(false, null, response, "Supplier added successfully");
                        })
                            .catch(err => {
                                console.log(err)
                                callBack(true, err, null, "Error");
                            });
                    }
                })
                    .catch(err => {
                        console.log(err)
                        callBack(true, err, null, "Error");
                    });

            } catch (err) {
                console.log(err)
                callBack(true, err, null, "Error");
            }
        },
        // End of add supplier details
        //Start of view supplier details
        viewSuppliers: function (callBack) {
            try {
                supplier.find({}).sort({ _id: -1 }).then(response => {
                    console.log('response',response)
                    if (response.length > 0) {




                        index = 0
                        finalData = []
                        var subOrdersData = function (doc) {

                            medications.countDocuments({ supplierCode: doc.supplierCode }).then(totalDatas => {

                                var data = {
                                    supplierName: doc.supplierName.eng,
                                    supplierCode: doc.supplierCode,
                                    isoCountry: doc.isoCountry,
                                    catalogTags: doc.catalogTags,
                                    contact: doc.contact,
                                    address: doc.contact.address,
                                    email: doc.contact.email,
                                    phone: doc.contact.phone,
                                    supplierUniqueId: doc.supplierId,
                                    deliveryFee: doc.deliveryFee.toString(),
                                    // lastProductSeq: doc.lastProductSeq,
                                    totalDatas: totalDatas,
                                    type: doc.type,
                                    usdPrice: doc.usdPrice.toString()
                                }
                                finalData.push(data)
                                index++
                                // CHECK IF ANY MORE SUB ORDER IS AVAILABLE OR NOT
                                if (index < response.length) {
                                    // IF ANY MORE SUBORDER AVAILABLE ,THEN CALL THE SUBORDERDATA FUNCTION AGAIN
                                    subOrdersData(response[index]);
                                }
                                else {
                                    callBack(false, 'Suppliers data found', finalData);
                                }


                            }).catch(err => {
                                callBack(true, 'Error', null,);
                            });
                        }
                        // CHECK IF ANY SUBORDER IS FOUND OR NOT
                        if (response.length !== 0) {
                            // IF ANY SUBORDER IS FOUND THEN CALL SUBORDERDATA FUNCTION
                            subOrdersData(response[index]);
                        }
                    }
                    else {
                        callBack(false, 'No supplier found', response);
                    }
                })
                    .catch(err => {
                        callBack(true, 'Error', null,);
                    });
            } catch (err) {
                callBack(true, err, null,);
            }
        }
        // End of view supplier details
    }
    return supplierModule;
}