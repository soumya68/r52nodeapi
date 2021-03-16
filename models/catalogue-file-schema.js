var mongoose = require("mongoose");
const validator = require("validator");
var catalogueFileStatusSchema = new mongoose.Schema(
    {
        fileName: {
            type: String,
            required: true,
            min: 6,
            trim: true,
        },
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
        },
        successedRecordsCount: {
            type: Number,
            default: 0
        },
        failedRecordsCount: {
            type: Number,
            default: 0
        },
        totalRecordsCount: {
            type: Number,
            default: 0
        },
        duplicateRecordsCount: {
            type: Number,
            default: 0
        },
        status: {
            type: Boolean,
            default: false
        },
    },
    {
        timestamps: {
            createdAt: "createdAt",
            updatedAt: "updatedAt",
        },
    }
);
module.exports = mongoose.model("catalogueFiles", catalogueFileStatusSchema);
