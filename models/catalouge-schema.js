var mongoose = require("mongoose");
var catalougeSchema = new mongoose.Schema(
    {
        supplierCode: {
            type: String,
            required: true,
        },
        //manufacturerName IS ADDED AS PER UPLOAD SHEET
        manufacturerName: {
            type: String,
            required: true,
            min: 6,
            trim: true,
        },
        //packSizeUnit IS ADDED AS PER UPLOAD SHEET
        packSizeUnit: {
            type: String,
            default: 0
        },
        //requireRx IS ADDED AS PER UPLOAD SHEET
        requireRx: {
            type: String,
            default: 'No'
        },
        //pricePerPack IS ADDED AS PER UPLOAD SHEET
        pricePerPack: {
            type: mongoose.Decimal128,
            default: '0.00'
        },
        ////////////////////////////////////
        pointsAccumulation: {
            type: Boolean,
            require: true,
            min: 6,
            default: false,
        },
        barCode: {
            type: String,
            default: 0000
        },
        brandName: {
            type: Object,
            default: {}
        },
        catalogTags: {
            type: Array,
            default: []
        },
        description: {
            type: Object,
            default: {}
        },
        dosage: {
            type: String,
            default: 0
        },
        form: {
            type: Object,
            default: {}
        },
        genericName: {
            type: Object,
            default: {}
        },
        handlingInstr: {
            type: Object,
            default: {}
        },
        information: {
            type: Object,
            default: {}
        },
        ingredients: {
            type: Object,
            default: {}
        },
        medClass: {
            type: Array,
            default: []
        },
        medCode: {
            type: String,
            default: 0000
        },
        metadata: {
            createdBy: {
                userId: {
                    type: mongoose.Schema.Types.ObjectId,
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
        packSize: {
            type: String,
            default: 0
        },
        prescriptionRequired: {
            type: Boolean,
            require: true,
            min: 6,
            default: false,
        },
        price: {
            type: mongoose.Decimal128,
            default: '0.00'
        },
        prodCategory: {
            type: Array,
            default: []
        },
        promotion: {
            type: Object,
            default: {}
        },
        r52CatCode: {
            type: String,
            default: 0000,
        },
        r52CatNo: {
            type: Number,
            required: true,
            default: 0000,
        },
        r52Locale: {
            type: Array,
            default: []
        },
        r52SupplierCode: {
            type: String,
            default: 0000
        },
        status: {
            type: String,
            required: true,
            default: 'Unavailable'
        },
        stock: {
            type: Object,
            default: {}
        },
        suppCatNo: {
            type: String,
            required: true,
        },
        supplier: {
            type: Object,
            default: {}
        },
        tax: {
            //////// name IS ADDED AS PER UPLOAD SHEET
            name: {
                type: String,
                default: '',
            },
            category: {
                type: String,
                default: '',
            },
            isIncluded: {
                type: Boolean,
                require: true,
                min: 6,
                default: false,
            },
            //////// IsTaxExempt IS ADDED AS PER UPLOAD SHEET
            IsTaxExempt: {
                type: Boolean,
                require: true,
                min: 6,
                default: false,
            },
            percentage: {
                type: Number,
                default: 0,
            },
            type: {
                type: String,
                default: '',
            }
        },
        type: {
            type: String,
            default: '',
        },
        usdPrice: {
            type: mongoose.Decimal128,
            default: '0.00'
        }
    },
    {
        timestamps: {
            createdAt: "createdAt",
            updatedAt: "updatedAt",
        },
    }
);
module.exports = mongoose.model("medication", catalougeSchema);
