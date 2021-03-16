const catalogueFiles = require('../models/catalogue-file-schema');
const path = require('path');
const multer = require('multer');
module.exports = (app) => {
    var medicationModule = require('../module/medication_module')();
    // FILE UPLOAD FOLDER PATH
    const DIR = 'Catalouge_Import/';
    // STORAGE OF MULTER
    var storage = multer.diskStorage({
        destination: function (req, file, callback) {
            callback(null, DIR)
        },
        filename: function (req, file, callback) {
            // MAKING DATE PART FOR FILE NAME
            var date = new Date();
            // var dateStr =
            //     ("00" + date.getDate()).slice(-2) + "-" +
            //     ("00" + (date.getMonth() + 1)).slice(-2) + "-" +
            //     date.getFullYear() + "-" +
            //     ("00" + date.getHours()).slice(-2) + ":" +
            //     ("00" + date.getMinutes()).slice(-2) + ":" +
            //     ("00" + date.getSeconds()).slice(-2);
            var milliseconds = date.getTime();
            var ml = milliseconds.toString()
            var dateStr = ml
            // MAKING FILENAME WITH SUPPLIERCODE,COUNTRYCODE,& MILISECONDS OF FILEUPLOADTIME
            var customeFileName = req.body.supplierCode + req.body.isoCountryCode + dateStr
            // CHECKING FILE EXTENSION & MAKING FILE NAME 
            if (file.mimetype == "text/csv") {
                const fileName = customeFileName + '.csv';
                callback(null, fileName)
            }
            else {
                const fileName = customeFileName + '.xlsx';
                callback(null, fileName)
            }
        },
    });
    // File type validation  by multer
    var upload = multer({
        storage: storage,
        limits: { fileSize: 1000000 }, // File size must be below 1 MB
        fileFilter: (req, file, cb) => {
            // FILE TYPE ONLY CSV OR XLSX IS ALLOWED
            if (file.mimetype == "text/csv"
                || file.mimetype == "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet") {
                cb(null, true);
            } else {
                cb(null, false);
                return cb(new Error('Only .xlsx, .csv format!'));
            }
        }
    });
    //START OF API FOR MEDICATION DETAILS EXCELSHEET IMPORT
    //Params: file,userId,supplierCode
    //Functions: xlsxUpload,failuerFileUpload,csvUpload
    //Response: status, message,invalidRows,invalidRowsCount,validRowsCount,totalRowsCount,duplicateEntryCount
    app.post('/api/upload/medications',
        upload.single('file'),
        function (req, res) {
            try {
                // console.log('FILE',req.file)
                // console.log('BODY',req.body)
                invalidDatas = [];
                incorrectEntryCount = 0;
                correctEntryCount = 0;
                totalEntryCount = 0;
                duplicateEntryCount = 0;
                if (!req.file) {
                    res.json({ status: false, message: "No file passed" });
                    return;
                }
                if (!req.body.userId) {
                    res.json({ status: false, message: "userId parameter is missing" });
                    return;
                }
                if (!req.body.supplierCode) {
                    res.json({ status: false, message: "supplierCode parameter is missing" });
                    return;
                }
                if (!req.body.isoCountryCode) {
                    res.json({ status: false, message: "isoCountryCode parameter is missing" });
                    return;
                }
                // File path where file is saved
                var filePath = path.resolve(DIR + req.file.filename);
                const { supplierCode, version, userId } = req.body
                const fileData = {
                    fileName: req.file.filename,
                    userId: userId,
                    status: false,
                    successedRecordsCount: 0,
                    failedRecordsCount: 0,
                    totalRecordsCount: 0,
                    timestamp: new Date()
                };
                // SAVING FILE DETAILS IN CATALOUGEFILES COLLECTION
                const fileDetails = new catalogueFiles(fileData);
                fileDetails.save().then(response => {
                    //FILE DATA INSERT CODE WILL BE HERE
                    if (req.file.mimetype == "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet") {
                        ////// THIS IS FOR XLSX FILE 
                        medicationModule.xlsxUpload(userId, version, supplierCode, filePath, correctEntryCount, invalidDatas, duplicateEntryCount,
                            function (error, totalEntryCount, correctEntryCount, invalidDatas, duplicateEntryCount) {
                                // IF FILE HAS NO DATA
                                if (totalEntryCount == 0) {
                                    return res.status(200).json({
                                        status: false,
                                        message: "File is empty",
                                        //  invalidRows: invalidDatas,
                                        invalidRowsCount: invalidDatas.length,
                                        validRowsCount: correctEntryCount,
                                        totalRowsCount: totalEntryCount,
                                        duplicateEntryCount: duplicateEntryCount
                                    })
                                }
                                // IF ANY ERROR HAPPENS
                                if (error) {
                                    res.status(200).json({
                                        status: false,
                                        message: error,
                                        // invalidRows: invalidDatas,
                                        invalidRowsCount: invalidDatas.length,
                                        validRowsCount: correctEntryCount,
                                        totalRowsCount: totalEntryCount,
                                        duplicateEntryCount: duplicateEntryCount
                                    })
                                }
                                else {
                                    // UPDATE THE UPLOAD FILE STATUS IN CATALOGUE FILE COLLECTION BY FILE NAME
                                    let updates = {
                                        status: true,
                                        successedRecordsCount: correctEntryCount,
                                        failedRecordsCount: invalidDatas.length,
                                        totalRecordsCount: totalEntryCount,
                                        duplicateRecordsCount: duplicateEntryCount
                                    }
                                    catalogueFiles.findOneAndUpdate({ fileName: req.file.filename },
                                        { $set: updates },
                                        { new: true }).then(response => {
                                            // CHECK IF ANY ROW OF FILE HAS VALIDATION ISSUE
                                            if (invalidDatas.length > 0) {
                                                // IF ANY VALIDATION ISSUE FOUND THEN MAKE A FAILUER FILE & SAVE THAT FAILED ROW DATA
                                                medicationModule.failuerFileUpload(req.file.filename, invalidDatas,
                                                    function (error) {
                                                        // IF ANY ERROR HAPPENS AT FAILURE FILE SAVING
                                                        if (error) {
                                                            res.status(200).json({
                                                                status: false,
                                                                // invalidRows: invalidDatas,
                                                                invalidRowsCount: invalidDatas.length,
                                                                validRowsCount: correctEntryCount,
                                                                totalRowsCount: totalEntryCount,
                                                                duplicateEntryCount: duplicateEntryCount
                                                            })
                                                        }
                                                        else {
                                                            res.status(200).json({
                                                                status: true,
                                                                message: "Data Inserted Successfully",
                                                                // invalidRows: invalidDatas,
                                                                invalidRowsCount: invalidDatas.length,
                                                                validRowsCount: correctEntryCount,
                                                                totalRowsCount: totalEntryCount,
                                                                duplicateEntryCount: duplicateEntryCount
                                                            })
                                                        }
                                                    })
                                            }
                                            else {
                                                // IF NO FAILUER DATA FOUND THEN RESPONSE WILL BE HERE
                                                res.status(200).json({
                                                    status: true,
                                                    message: "Data Inserted Successfully",
                                                    // invalidRows: invalidDatas,
                                                    invalidRowsCount: invalidDatas.length,
                                                    validRowsCount: correctEntryCount,
                                                    totalRowsCount: totalEntryCount,
                                                    duplicateEntryCount: duplicateEntryCount
                                                })
                                            }
                                        })
                                        .catch(err => {
                                            return res.status(400).json({ status: false, message: err });
                                        });
                                }
                            })
                    }
                    else {
                        ////// THIS IS FOR CSV FILE 
                        medicationModule.csvUpload(userId, version, supplierCode, filePath, totalEntryCount, correctEntryCount, invalidDatas, duplicateEntryCount,
                            function (error, totalEntryCount, correctEntryCount, invalidDatas, duplicateEntryCount) {
                                // IF FILE HAS NO DATA
                                if (totalEntryCount == 0) {
                                    return res.status(200).json({
                                        status: false,
                                        message: "File is empty",
                                        // invalidRows: invalidDatas,
                                        invalidRowsCount: invalidDatas.length,
                                        validRowsCount: correctEntryCount,
                                        totalRowsCount: totalEntryCount,
                                        duplicateEntryCount: duplicateEntryCount
                                    })
                                }
                                // IF ANY ERROR HAPPENS
                                if (error) {
                                    res.status(200).json({
                                        status: false,
                                        message: error,
                                        //  invalidRows: invalidDatas,
                                        invalidRowsCount: invalidDatas.length,
                                        validRowsCount: correctEntryCount,
                                        totalRowsCount: totalEntryCount,
                                        duplicateEntryCount: duplicateEntryCount
                                    })
                                }
                                else {
                                    // UPDATE THE UPLOAD FILE STATUS IN CATALOGUE FILE COLLECTION BY FILE NAME
                                    let updates = {
                                        status: true,
                                        successedRecordsCount: correctEntryCount,
                                        failedRecordsCount: invalidDatas.length,
                                        totalRecordsCount: totalEntryCount,
                                        duplicateRecordsCount: duplicateEntryCount
                                    }
                                    catalogueFiles.findOneAndUpdate({ fileName: req.file.filename },
                                        { $set: updates },
                                        { new: true }).then(response => {
                                            // CHECK IF ANY ROW OF FILE HAS VALIDATION ISSUE
                                            if (invalidDatas.length > 0) {
                                                // IF ANY VALIDATION ISSUE FOUND THEN MAKE A FAILUER FILE & SAVE THAT FAILED ROW DATA
                                                medicationModule.failuerFileUpload(req.file.filename, invalidDatas,
                                                    function (error) {
                                                        // IF ANY ERROR HAPPENS AT FAILURE FILE SAVING
                                                        if (error) {
                                                            res.status(200).json({
                                                                status: false,
                                                                message: "Data Inserted Successfully",
                                                                // invalidRows: invalidDatas,
                                                                invalidRowsCount: invalidDatas.length,
                                                                validRowsCount: correctEntryCount,
                                                                totalRowsCount: totalEntryCount,
                                                                duplicateEntryCount: duplicateEntryCount
                                                            })
                                                        }
                                                        else {
                                                            res.status(200).json({
                                                                status: true,
                                                                message: "Data Inserted Successfully",
                                                                // invalidRows: invalidDatas,
                                                                invalidRowsCount: invalidDatas.length,
                                                                validRowsCount: correctEntryCount,
                                                                totalRowsCount: totalEntryCount,
                                                                duplicateEntryCount: duplicateEntryCount
                                                            })
                                                        }
                                                    })
                                            }
                                            else {
                                                // IF NO FAILUER DATA FOUND THEN RESPONSE WILL BE HERE
                                                res.status(200).json({
                                                    status: true,
                                                    message: "Data Inserted Successfully",
                                                    // invalidRows: invalidDatas,
                                                    invalidRowsCount: invalidDatas.length,
                                                    validRowsCount: correctEntryCount,
                                                    totalRowsCount: totalEntryCount,
                                                    duplicateEntryCount: duplicateEntryCount
                                                })
                                            }
                                        })
                                        .catch(err => {
                                            return res.status(400).json({ status: false, message: err });
                                        });
                                }
                            })
                        /////////
                    }
                    ////
                }).catch(err => {
                    return res.status(400).json({ message: 'Error while uploading file', error: err });
                });
            }
            catch (er) {
                console.log(er)
                res.json({ status: false, message: er });
            }
        });
    //END OF API FOR MEDICATION DETAILS EXCELSHEET IMPORT
    //START OF API FOR VIEW FILE DETAILS 
    //Params:
    //Response: status, message,data
    //Functions:viewSupplier
    app.post('/api/view/files', function (req, res) {
        try {
            medicationModule.viewFiles(
                function (error, message, result) {
                    if (error) {
                        res.status(200).json({
                            status: false,
                            message: message,
                            data: result
                        })
                    }
                    else {
                        res.status(200).json({
                            status: true,
                            message: message,
                            data: result
                        })
                    }
                })
        }
        catch (er) {
            res.json({ status: false, message: er });
        }
    });
    //END OF API FOR VIEW FILE DETAILS 
};