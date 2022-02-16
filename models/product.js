const mongoose = require('mongoose');


const productSchema = new mongoose.Schema({
    to: {
        type: String,
        required: true
    },
    from: {
        type: String,
        required: true,
        min: 0
    },
    DueDate: {
        type: Date,

    },
    Due: {
        type: Boolean
    },

    item: {
        type: String
    },
    price: {
        type: Number
    }


})

const Invoice = mongoose.model('Invoice', productSchema);

module.exports = Invoice;