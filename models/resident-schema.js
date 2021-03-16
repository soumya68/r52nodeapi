var mongoose = require("mongoose");
const validator = require("validator");
const autoIncrement = require('mongoose-auto-increment');
var residentSchema = new mongoose.Schema(
    {
        residentId: {
            type: String,
            required: true
        },
        availablePoints: {
            type: Number,
            default: 0
        },
        metadata: {
            createdBy: {
                userId: {
                    type: String,
                    required: true
                },
                utcDatetime: {
                    type: Date
                },
            },
            updatedBy: {
                type: Array,
                default: []
            },
            version: {
                type: String,
                default: 0
            },
        },
    },
    {
        timestamps: {
            createdAt: "createdAt",
            updatedAt: "updatedAt",
        },
    }
);
module.exports = mongoose.model("resident", residentSchema);
