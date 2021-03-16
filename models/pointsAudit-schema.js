var mongoose = require("mongoose");
const validator = require("validator");
var pointsAuditSchema = new mongoose.Schema(
    {
        residentId: {
            type: String,
            required: true,
        },
        orderId: {
            type: String,
            required: true,
        },
        redeemedPoints: {
            type: Number,
            default: 0
        },
        earnedPoints: {
            type: Number,
            default: 0
        },
        earnedPointsExpiryDate: {
            type: Date,
        },
        availablePoints: {
            type: Number,
            default: 0
        },
        pointSource: {
            type: String,
        },
        isActive: {
            type: Boolean,
            default: false
        },
        isLapsed: {
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
module.exports = mongoose.model("pointsAudit", pointsAuditSchema);
