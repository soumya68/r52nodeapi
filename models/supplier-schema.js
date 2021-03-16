var mongoose = require("mongoose");
const validator = require("validator");
const autoIncrement = require('mongoose-auto-increment');
var supplierSchema = new mongoose.Schema(
    {
        supplierId: {
            type: Number,
            required: true
        },
        catalogTags: {
            type: Array,
            default: []
        },
        contact: {
            address: {
                type: Array,
                default: []
            },
            email: {
                type: String,
                validate: {
                    validator: validator.isEmail,
                    message: "{VALUE} is not a valid email",
                },
                default: null
            },
            phone: {
                type: String,
                default: null
            },
        },
        deliveryFee: {
            type: mongoose.Decimal128,
            default: '0.00'
        },
        isoCountry: {
            type: String,
            default: null
        },
        lastProductSeq: {
            type: Number,
            default: 0
        },
        supplierCode: {
            type: String,
            default: 0
        },
        supplierName: {
            type: Object,
            default: {}
        },
        type: {
            type: String,
            default: null
        },
        usdPrice: {
            type: mongoose.Decimal128,
            default: '0.00'
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
autoIncrement.initialize(mongoose.connection);
supplierSchema.plugin(autoIncrement.plugin, {
    model: 'supplier',
    field: 'supplierId',
    startAt: 10000000,
    incrementBy: 1
});
module.exports = mongoose.model("supplier", supplierSchema);
