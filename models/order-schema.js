var mongoose = require("mongoose");
const validator = require("validator");
var orderSchema = new mongoose.Schema(
    {
        delivery: {
            type: Number,
            default: 0
        },
        discount: {
            type: Object,
            default: {}
        },
        discountIdNumber: {
            type: Number,
            default: 0
        },
        isoCountry: {
            type: String,
            required: true,
        },
        isoCurrency: {
            type: String,
            required: true,
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
        orderSubTotal: {
            type: mongoose.Decimal128,
            default: '0.00'
        },
        orderTotalPayable: {
            type: mongoose.Decimal128,
            default: '0.00'
        },
        pointBasedDiscountedAmount: {
            type: mongoose.Decimal128,
            default: '0.00'
        },
        canRedeemPoints: {
            type: Boolean,
            default: false
        },
        isPointsAddedToResident: {
            type: Boolean,
            default: false
        },
        isEarnedPointCalculated: {
            type: Boolean,
            default: false
        },
        patientAddress: {
            type: Object,
            default: {}
        },
        patientAge: {
            type: Number,
            default: 0
        },
        patientGender: {
            type: String,
            default: 0
        },
        patientName: {
            type: String,
            default: 0
        },
        prescriptionNumber: {
            type: String,
            default: 0
        },
        recipient: {
            type: String,
            default: 0
        },
        residentId: {
            type: String,
            default: 0
        },
        currentStatus: {
            type: Object,
            default: {}
        },
        supplierOrderId: {
            type: String,
            default: 0
        },
        orderStatus: {
            type: String,
            default: 0
        },
        subOrders: {
            type: Array,
            default: []
        },
        taxPayable: {
            type: Number,
            default: 0
        },
        trackingCode: {
            type: String,
            default: 0
        },
        type: {
            type: String,
            default: 0
        },
        ///////////
        residentId: {
            type: String,
            required: true,
        },
        productDetails: {
            type: Array,
            default: []
        },
        deliveryAddress: {
            type: String,
            //required: true,
            min: 6,
            trim: true,
        },
        isDelivered: {
            type: Boolean,
            default: false
        },
        date: {
            type: Date,
        },
    },
    {
        timestamps: {
            createdAt: "createdAt",
            updatedAt: "updatedAt",
        },
    }
);
module.exports = mongoose.model("neworder", orderSchema);
