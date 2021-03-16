const medications = require('../models/catalouge-schema');
const catalogueFiles = require('../models/catalogue-file-schema');
const readXlsxFile = require('read-excel-file/node');
const fs = require('fs');
const csv = require('csv-parser');
const createCsvWriter = require('csv-writer').createObjectCsvWriter;
module.exports = function () {
    var medicationModule = {
        // Start Generating catalogue number -----
        catalogueNumber: function (callBack) {
            try {
                medications.find({}).sort({ _id: -1 }).limit(1).then((data) => {
                    if (data.length > 0) {
                        var dbNum = data[0].r52CatNo;
                        // Incrementing the catalogue number
                        var r52CatNumber = dbNum + 1;
                        callBack(r52CatNumber);
                    }
                    else {
                        var r52CatNumber = 1000000;
                        callBack(r52CatNumber);
                    }
                }).catch(err => {
                    callBack(null);
                });
            } catch (e) {
                callBack(null);
            }
        },
        // End Generating catalogue number -----
        //Start of File Row Validation
        excelValidation: function (data, callBack) {
            try {
                // CHECK IF THESE FIELDS ARE EMPTY OR NOT 
                if (
                    !data.SupplierUniqueCatalogueNumber
                    || !data.BrandName
                    || !data.Dosage
                    || !data.BrandName
                    || !data.PackSize
                    || !data.PackSizeUnits
                    || !data.ProductType
                    || !data.RequiresRx
                    || !data.TaxName
                    || !data.IsTaxExempt
                    || !data.IsTaxIncluded
                    || !data.TaxPercent
                    || !data.PricePerPackage
                    || !data.Status
                    || !data.PointsAccumulation.toString()
                    || !data.Manufacturer
                ) {
                    // IF EMPTY THEN SEND STATUS FALSE
                    callBack(false);
                }
                else {
                    // IF NOT EMPTY THEN SEND STATUS TRUE
                    callBack(true);
                }
            } catch (e) {
                callBack(null);
            }
        },
        //End of Validation
        // Start of Check duplicate data 
        checkDuplicate: function (SupplierUniqueCatalogueNumber, supplierCode, callBack) {
            try {
                // FIND DATA FROM MEDICATION COLLECTION BY SUPPLIER UNIQUE CATALOUGUE NUM & SUPPLIER CODE
                medications.findOne({ suppCatNo: SupplierUniqueCatalogueNumber, supplierCode: supplierCode }, function (err, doc) {
                    if (err) {
                        callBack(true, null);
                    }
                    if (doc) {
                        callBack(false, true);
                    }
                    else {
                        callBack(false, false);
                    }
                });
            } catch (e) {
                callBack(true, null);
            }
        },
        // End of Check duplicate data 
        // Start of csv file upload
        csvUpload: function (userId, version, supplierCode, filepath, totalEntryCount, correctEntryCount, invalidDatas, duplicateData, callBack) {
            try {
                var isIncluded
                var IsTaxExempt
                // var r52CatNo = crypto.randomBytes(6).toString('hex')
                var r52CatNo;
                rows = []
                rawDocuments = []
                // START READING OF CSV FILE
                fs.createReadStream(filepath)
                    .pipe(csv())
                    .on('data', (rowData) => {
                        // AFTER READ ALL ROWS OF FILE PUSH DATAS INSIDE ROWS ARRAY
                        rows.push(rowData)
                    })
                    .on('end', () => {
                        if (rows.length !== 0) {
                            // GENERATE CATALOUGUE NUMBER
                            medicationModule.catalogueNumber(function (result) {
                                r52CatNo = result
                                var index = 0;
                                // RECURSIVE FUNCTION INSERT DATA FOUND
                                var insertData = function (row) {
                                    // EXCEL FILE ROW VALIDATION FOR EMPTY DATA IN ANY MANDATORY COLUMN
                                    medicationModule.excelValidation(row, function (status) {
                                        if (status) {
                                            /// DUPLICATE SUPPLIER CATALOUGE NUMBER CHECK
                                            medicationModule.checkDuplicate(row.SupplierUniqueCatalogueNumber, supplierCode, function (error, isDuplicate) {
                                                // IF NO DUPLICATE DATA FOUND
                                                if (!isDuplicate) {
                                                    // INCREASE CORRECT ENTRY VALUE
                                                    correctEntryCount = correctEntryCount + 1
                                                    if (row.IsTaxIncluded == 'Yes' || row.IsTaxIncluded == 1) {
                                                        isIncluded = true
                                                    }
                                                    else {
                                                        isIncluded = false
                                                    }
                                                    if (row.IsTaxExempt == 'Yes' || row.IsTaxExempt == 1) {
                                                        IsTaxExempt = true
                                                    }
                                                    else {
                                                        IsTaxExempt = false
                                                    }
                                                    // MAKE A MEDICATION DATA OBJECT 
                                                    const medicationData = {
                                                        supplierCode: supplierCode,
                                                        r52CatNo: r52CatNo,
                                                        suppCatNo: row.SupplierUniqueCatalogueNumber,
                                                        brandName: {
                                                            eng: row.BrandName,
                                                        },
                                                        genericName: {
                                                            eng: row.Generic
                                                        },
                                                        manufacturerName: row.Manufacturer,
                                                        description: {
                                                            eng: row.Description,
                                                        },
                                                        dosage: row.Dosage,
                                                        form: {
                                                            eng: row.Form,
                                                        },
                                                        packSize: row.PackSize,
                                                        packSizeUnit: row.PackSizeUnits,
                                                        type: row.ProductType,
                                                        requireRx: row.RequiresRx,
                                                        tax: {
                                                            name: row.TaxName,
                                                            category: row.TaxName,
                                                            isIncluded: isIncluded,
                                                            percentage: row.TaxPercent,
                                                            type: row.TaxName,
                                                            IsTaxExempt: IsTaxExempt
                                                        },
                                                        pricePerPack: parseFloat(row.PricePerPackage).toFixed(2),
                                                        catalogTags: [row.CatalogTag],
                                                        status: row.Status,
                                                        pointsAccumulation: row.PointsAccumulation,
                                                        metadata: {
                                                            createdBy: {
                                                                userId: userId,
                                                                utcDatetime: new Date()
                                                            },
                                                            updatedBy: [],
                                                            version: version
                                                        },
                                                        timestamp: new Date(),
                                                    };
                                                    // PUSH MEDICATION DATA OBJECT IN RAWDOCUMENT ARRAY FOR SAVING IN COLLECTION
                                                    rawDocuments.push(medicationData)
                                                    // INCREASE R52 CATALOUGUE NUMBER
                                                    r52CatNo = r52CatNo + 1
                                                    // INCREASE INDEX BY 1
                                                    index++;
                                                    // CHECK IF MORE DATA IS AVAILABLE OR NOT IN FILE
                                                    if (index < rows.length) {
                                                        // IF MORE DATA AVAILABLE THEN CALL AGAIN INSERTDATA FUNCTION
                                                        insertData(rows[index]);
                                                    } else {
                                                        // IF NO MORE DATA IN FILE THE INSERT BULK DATA IN MEDICATION COLLECTION
                                                        medications.insertMany(rawDocuments)
                                                            .then(function (mongooseDocuments) {
                                                                callBack(false, rows.length, correctEntryCount, invalidDatas, duplicateData);
                                                            })
                                                            .catch(function (err) {
                                                                callBack(true, rows.length, correctEntryCount, invalidDatas, duplicateData);
                                                            });
                                                    }
                                                }
                                                else {
                                                    // IF DUPLICATE DATA FOUND
                                                    // MAKE MEDICATION DATA OBJECT FOR UPDATE DATA IN COLLECTION
                                                    const medicationUpdateData = {
                                                        brandName: {
                                                            eng: row.BrandName,
                                                        },
                                                        genericName: {
                                                            eng: row.Generic
                                                        },
                                                        manufacturerName: row.Manufacturer,
                                                        description: {
                                                            eng: row.Description,
                                                        },
                                                        dosage: row.Dosage,
                                                        form: {
                                                            eng: row.Form,
                                                        },
                                                        packSize: row.PackSize,
                                                        packSizeUnit: row.PackSizeUnits,
                                                        type: row.ProductType,
                                                        requireRx: row.RequiresRx,
                                                        tax: {
                                                            name: row.TaxName,
                                                            category: row.TaxName,
                                                            isIncluded: isIncluded,
                                                            percentage: row.TaxPercent,
                                                            type: row.TaxName,
                                                            IsTaxExempt: IsTaxExempt
                                                        },
                                                        pricePerPack: parseFloat(row.PricePerPackage).toFixed(2),
                                                        catalogTags: [row.CatalogTag],
                                                        status: row.Status,
                                                        pointsAccumulation: row.PointsAccumulation,
                                                        metadata: {
                                                            createdBy: {
                                                                userId: userId,
                                                                utcDatetime: new Date()
                                                            },
                                                            updatedBy: [],
                                                            version: version
                                                        },
                                                        timestamp: new Date(),
                                                    };
                                                    // UPDATE THAT DUPLICATE DATA IN MEDICATION COLLECTION BY SPECIFIC SUPPLIERUNIQUECATALOUGUENUM & SUPPLIER CODE
                                                    medications.findOneAndUpdate({ suppCatNo: row.SupplierUniqueCatalogueNumber, supplierCode: supplierCode },
                                                        { $set: medicationUpdateData },
                                                        { new: true }).then(result => {
                                                        }).catch(err => {
                                                            console.log('error', err)
                                                        });
                                                    // INCREASE DUPLICATE DATA COUNT
                                                    duplicateData = duplicateData + 1
                                                    // INCREASE INDEX BY 1
                                                    index++;
                                                    // CHECK IF MORE DATA IS AVAILABLE OR NOT IN FILE
                                                    if (index < rows.length) {
                                                        // IF MORE DATA AVAILABLE THEN CALL AGAIN INSERTDATA FUNCTION
                                                        insertData(rows[index]);
                                                    } else {
                                                        // IF NO MORE DATA IN FILE THE INSERT BULK DATA IN MEDICATION COLLECTION
                                                        medications.insertMany(rawDocuments)
                                                            .then(function (mongooseDocuments) {
                                                                callBack(false, rows.length, correctEntryCount, invalidDatas, duplicateData);
                                                            })
                                                            .catch(function (err) {
                                                                callBack(true, rows.length, correctEntryCount, invalidDatas, duplicateData);
                                                            });
                                                    }
                                                }
                                            })
                                        }
                                        else {
                                            /////// IF ANY ISSUE FOUND
                                            var invaliRow = row
                                            // PUSH THAT ROW INSIDE INVALIDDATAS ARRAY
                                            invalidDatas.push(row)
                                            // INCREASE INDEX BY 1
                                            index++;
                                            // CHECK IF MORE DATA IS AVAILABLE OR NOT IN FILE
                                            if (index < rows.length) {
                                                // IF MORE DATA AVAILABLE THEN CALL AGAIN INSERTDATA FUNCTION
                                                insertData(rows[index]);
                                            } else {
                                                // IF NO MORE DATA IN FILE THE INSERT BULK DATA IN MEDICATION COLLECTION
                                                medications.insertMany(rawDocuments)
                                                    .then(function (mongooseDocuments) {
                                                        callBack(false, rows.length, correctEntryCount, invalidDatas, duplicateData);
                                                    })
                                                    .catch(function (err) {
                                                        callBack(true, rows.length, correctEntryCount, invalidDatas, duplicateData);
                                                    });
                                            }
                                        }
                                    })
                                }
                                // CHECK IF ROW HAS DATA OR EMPTY
                                if (rows.length !== 0) {
                                    // IF ROW IS NOT EMPTY ,THEN CALL INSERT DATA FUNCTION
                                    insertData(rows[index]);
                                }
                            })
                        }
                        else {
                            // IF FILE IS EMPTY OR ROW IS EMPTY
                            callBack(false, rows.length, correctEntryCount, invalidDatas, duplicateData);
                        }
                    })
            } catch (e) {
                callBack(true, totalEntryCount, correctEntryCount, invalidDatas, duplicateData);
            }
        },
        // End of csv file upload
        // Start of xlsx file upload
        xlsxUpload: function (userId, version, supplierCode, filepath, correctEntryCount, invalidDatas, duplicateData, callBack) {
            try {
                var isIncluded
                var IsTaxExempt
                var r52CatNo = 0
                rawDocuments = []
                // START READING OF EXCEL/XLSX FILE
                readXlsxFile(fs.createReadStream(filepath), { sheet: 2 }).then((rows) => {
                    var theRemovedElement = rows.shift();
                    // CHECK IF FILE/ROW HAS DATA OR NOT
                    if (rows.length !== 0) {
                        var index = 0;
                        // CREATE CATALOUGUE NUMBER
                        medicationModule.catalogueNumber(function (result) {
                            r52CatNo = result
                            // INSERTDATA FUNCTION START
                            var insertData = function (doc) {
                                // CHECK IF DOC HAS NO VALUE
                                if (doc.length !== 0) {
                                    // IF DOC HAS DATA ,THEN MAKE A DATA OBJECT 
                                    const data = {
                                        SupplierUniqueCatalogueNumber: doc[1],
                                        BrandName: doc[2],
                                        Generic: doc[3],
                                        Manufacturer: doc[4],
                                        Description: doc[5],
                                        Dosage: doc[6],
                                        Form: doc[7],
                                        PackSize: doc[8],
                                        PackSizeUnits: doc[9],
                                        ProductType: doc[10],
                                        RequiresRx: doc[11],
                                        TaxName: doc[12],
                                        IsTaxExempt: doc[13],
                                        IsTaxIncluded: doc[14],
                                        TaxPercent: doc[15],
                                        PricePerPackage: doc[16],
                                        CatalogTag: doc[17],
                                        Status: doc[18],
                                        PointsAccumulation: doc[19],
                                        supplierCode: supplierCode,
                                    };
                                    // CHECK DATA OBJECT VALIDATION FOR NO EMPTY COLUMNS FOR MANDATORY FIELDS
                                    medicationModule.excelValidation(data, function (status) {
                                        // IF VALIDATION DONE & STATUS TRUE
                                        if (status) {
                                            /// DUPLICATE SUPPLIER CATALOUGE NUMBER CHECK
                                            medicationModule.checkDuplicate(data.SupplierUniqueCatalogueNumber, data.supplierCode, function (error, isDuplicate) {
                                                // IF NO DUPLICATE DATA
                                                if (!isDuplicate) {
                                                    correctEntryCount = correctEntryCount + 1
                                                    if (doc[14] == 'Yes' || doc[14] == 1) {
                                                        isIncluded = true
                                                    }
                                                    else {
                                                        isIncluded = false
                                                    }
                                                    if (doc[13] == 'Yes' || doc[14] == 1) {
                                                        IsTaxExempt = true
                                                    }
                                                    else {
                                                        IsTaxExempt = false
                                                    }
                                                    // MAKE MEDICATION OBJECT
                                                    const medicationData = {
                                                        supplierCode: supplierCode,
                                                        r52CatNo: r52CatNo,
                                                        suppCatNo: doc[1],
                                                        brandName: {
                                                            eng: doc[2]
                                                        },
                                                        genericName: {
                                                            eng: doc[3]
                                                        },
                                                        manufacturerName: doc[4],
                                                        description: {
                                                            eng: doc[5]
                                                        },
                                                        dosage: doc[6],
                                                        form: {
                                                            eng: doc[7]
                                                        },
                                                        packSize: doc[8],
                                                        packSizeUnit: doc[9],
                                                        type: doc[10],
                                                        requireRx: doc[11],
                                                        tax: {
                                                            name: doc[12],
                                                            category: doc[12],
                                                            isIncluded: isIncluded,
                                                            percentage: doc[15],
                                                            type: doc[12],
                                                            IsTaxExempt: IsTaxExempt
                                                        },
                                                        pricePerPack: parseFloat(doc[16]).toFixed(2),
                                                        catalogTags: [doc[17]],
                                                        status: doc[18],
                                                        pointsAccumulation: doc[19],
                                                        metadata: {
                                                            createdBy: {
                                                                userId: userId,
                                                                utcDatetime: new Date()
                                                            },
                                                            updatedBy: [],
                                                            version: version
                                                        },
                                                        timestamp: new Date(),
                                                    };
                                                    // PUSH MEDICATION OBJECT INSIDE RAW DOCUMENT ARRAY FOR FINAL INSERT
                                                    rawDocuments.push(medicationData)
                                                    // INCREASE CATALOGUE NUMBER
                                                    r52CatNo = r52CatNo + 1
                                                    // INCREASE INDEX BY 1
                                                    index++;
                                                    // CHECK IF MORE DATA IS AVAILABLE OR NOT IN FILE
                                                    if (index < rows.length) {
                                                        // IF MORE DATA AVAILABLE THEN CALL AGAIN INSERTDATA FUNCTION
                                                        insertData(rows[index]);
                                                    } else {
                                                        // IF NO MORE DATA IN FILE THE INSERT BULK DATA IN MEDICATION COLLECTION
                                                        medications.insertMany(rawDocuments)
                                                            .then(function (mongooseDocuments) {
                                                                callBack(false, rows.length, correctEntryCount, invalidDatas, duplicateData);
                                                            })
                                                            .catch(function (err) {
                                                                callBack(true, rows.length, correctEntryCount, invalidDatas, duplicateData);
                                                            });
                                                    }
                                                    //////////
                                                }
                                                else {
                                                    // IF DUPLICATE DATA FOUND MAKE A OBJECT
                                                    const medicationUpdateData = {
                                                        brandName: {
                                                            eng: doc[2]
                                                        },
                                                        genericName: {
                                                            eng: doc[3]
                                                        },
                                                        manufacturerName: doc[4],
                                                        description: {
                                                            eng: doc[5]
                                                        },
                                                        dosage: doc[6],
                                                        form: {
                                                            eng: doc[7]
                                                        },
                                                        packSize: doc[8],
                                                        packSizeUnit: doc[9],
                                                        type: doc[10],
                                                        requireRx: doc[11],
                                                        tax: {
                                                            name: doc[12],
                                                            category: doc[12],
                                                            isIncluded: isIncluded,
                                                            percentage: doc[15],
                                                            type: doc[12],
                                                            IsTaxExempt: IsTaxExempt
                                                        },
                                                        pricePerPack: parseFloat(doc[16]).toFixed(2),
                                                        catalogTags: [doc[17]],
                                                        status: doc[18],
                                                        pointsAccumulation: doc[19],
                                                        metadata: {
                                                            updatedBy: [],
                                                            version: version
                                                        },
                                                        timestamp: new Date(),
                                                    };
                                                    // UPDATE THAT DUPLICATE DATA IN MEDICATION COLLECTION BY SPECIFIC SUPPLIERUNIQUECATALOUGUENUM & SUPPLIER CODE
                                                    medications.findOneAndUpdate({ suppCatNo: data.SupplierUniqueCatalogueNumber, supplierCode: supplierCode },
                                                        { $set: medicationUpdateData },
                                                        { new: true }).then(result => {
                                                        }).catch(err => {
                                                            console.log('error', error)
                                                        });
                                                    // INCREASE DUPLICATE DATA COUNT
                                                    duplicateData = duplicateData + 1
                                                    // INCREASE INDEX BY 1
                                                    index++;
                                                    // CHECK IF MORE DATA IS AVAILABLE OR NOT IN FILE
                                                    if (index < rows.length) {
                                                        // IF MORE DATA AVAILABLE THEN CALL AGAIN INSERTDATA FUNCTION
                                                        insertData(rows[index]);
                                                    } else {
                                                        // IF NO MORE DATA IN FILE THE INSERT BULK DATA IN MEDICATION COLLECTION
                                                        medications.insertMany(rawDocuments)
                                                            .then(function (mongooseDocuments) {
                                                                callBack(false, rows.length, correctEntryCount, invalidDatas, duplicateData);
                                                            })
                                                            .catch(function (err) {
                                                                callBack(true, rows.length, correctEntryCount, invalidDatas, duplicateData);
                                                            });
                                                    }
                                                }
                                            })
                                        }
                                        else {
                                            /////// IF ANY ISSUE FOUND THEN MAKE A INVALIDATA OBJECT
                                            const invalidData = {
                                                CatalougeNumber: "",
                                                SupplierUniqueCatalogueNumber: doc[1],
                                                BrandName: doc[2],
                                                Generic: doc[3],
                                                Manufacturer: doc[4],
                                                Description: doc[5],
                                                Dosage: doc[6],
                                                Form: doc[7],
                                                PackSize: doc[8],
                                                PackSizeUnits: doc[9],
                                                ProductType: doc[10],
                                                RequiresRx: doc[11],
                                                TaxName: doc[12],
                                                IsTaxExempt: doc[13],
                                                IsTaxIncluded: doc[14],
                                                TaxPercent: doc[15],
                                                PricePerPackage: doc[16],
                                                CatalogTag: doc[17],
                                                Status: doc[18],
                                                pointsAccumulation: doc[19],
                                                SupplierName: doc[20]
                                            };
                                            // PUSH INVALID DATA OBJECR INSIDE INVALIDATA ARRAY
                                            invalidDatas.push(invalidData)
                                            // INCREASE INDEX BY 1
                                            index++;
                                            // CHECK IF MORE DATA IS AVAILABLE OR NOT IN FILE
                                            if (index < rows.length) {
                                                // IF MORE DATA AVAILABLE THEN CALL AGAIN INSERTDATA FUNCTION
                                                insertData(rows[index]);
                                            }
                                            else {
                                                // IF NO MORE DATA IN FILE THE INSERT BULK DATA IN MEDICATION COLLECTION
                                                medications.insertMany(rawDocuments)
                                                    .then(function (mongooseDocuments) {
                                                        callBack(false, rows.length, correctEntryCount, invalidDatas, duplicateData);
                                                    })
                                                    .catch(function (err) {
                                                        callBack(true, rows.length, correctEntryCount, invalidDatas, duplicateData);
                                                    });
                                            }
                                        }
                                    })
                                }
                                else {
                                    index++;
                                    if (index < rows.length) {
                                        insertData(rows[index]);
                                    }
                                    else {
                                        medications.insertMany(rawDocuments)
                                            .then(function (mongooseDocuments) {
                                                callBack(false, rows.length, correctEntryCount, invalidDatas, duplicateData);
                                            })
                                            .catch(function (err) {
                                                callBack(true, rows.length, correctEntryCount, invalidDatas, duplicateData);
                                            });
                                    }
                                }
                            }
                            // CHECK IF ROW HAS DATA OR EMPTY
                            if (rows.length !== 0) {
                                // IF ROW IS NOT EMPTY ,THEN CALL INSERT DATA FUNCTION
                                insertData(rows[index]);
                            }
                        })
                    }
                    else {
                        // IF FILE IS EMPTY OR ROW IS EMPTY
                        callBack(false, 0, correctEntryCount, invalidDatas, duplicateData);
                    }
                })
                    .catch(err => {
                        callBack(true, 0, correctEntryCount, invalidDatas, duplicateData);
                    })
            } catch (e) {
                callBack(true, 0, correctEntryCount, invalidDatas, duplicateData);
            }
        },
        // End of xlsx file upload
        // Start of Failuer data file create
        failuerFileUpload: function (filename, invalidDatas, callBack) {
            try {
                const csvWriter = createCsvWriter({
                    path: 'Failure_Catalogue/' + filename,
                    header: [
                        { id: 'CatalougeNumber', title: 'CatalougeNumber' },
                        { id: 'SupplierUniqueCatalogueNumber', title: 'SupplierUniqueCatalogueNumber' },
                        { id: 'BrandName', title: 'BrandName' },
                        { id: 'Generic', title: 'Generic' },
                        { id: 'Manufacturer', title: 'Manufacturer' },
                        { id: 'Description', title: 'Description' },
                        { id: 'Dosage', title: 'Dosage' },
                        { id: 'Form', title: 'Form' },
                        { id: 'PackSize', title: 'PackSize' },
                        { id: 'PackSizeUnits', title: 'PackSizeUnits' },
                        { id: 'ProductType', title: 'ProductType' },
                        { id: 'RequiresRx', title: 'RequiresRx' },
                        { id: 'TaxName', title: 'TaxName' },
                        { id: 'IsTaxExempt', title: 'IsTaxExempt' },
                        { id: 'IsTaxIncluded', title: 'IsTaxIncluded' },
                        { id: 'TaxPercent', title: 'TaxPercent' },
                        { id: 'PricePerPackage', title: 'PricePerPackage' },
                        { id: 'CatalogTag', title: 'CatalogTag' },
                        { id: 'Status', title: 'Status' },
                        { id: 'PointsAccumulation', title: 'pointsAccumulation' },
                        { id: 'SupplierName', title: 'SupplierName' },
                    ]
                });
                csvWriter.writeRecords(invalidDatas)
                    .then(() => {
                        callBack(false);
                    })
                    .catch(err => {
                        callBack(true);
                    });
            } catch (e) {
                callBack(true);
            }
        },
        // End of Failuer data file create
        //Start of view file details
        viewFiles: function (callBack) {
            try {
                catalogueFiles.find({}).sort({ _id: -1 }).then(response => {
                    if (response.length > 0) {
                        callBack(false, 'Files details found', response);
                    }
                    else {
                        callBack(false, 'No files details found', response);
                    }
                })
                    .catch(err => {
                        callBack(true, 'Error', null,);
                    });
            } catch (err) {
                callBack(true, err, null,);
            }
        }
        // End of view file details
    }
    return medicationModule;
}