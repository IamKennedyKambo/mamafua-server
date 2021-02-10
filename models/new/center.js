const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const centerSchema = new Schema({
    name: {
        type: String,
        required: true
    },
    phone: {
        type: String,
        required: true
    },
    location: {
        latitude: { type: Number },
        longitude: { type: Number }
    },
    status: {
        type: String,
        default: 'Operational'
    },
    providers: [
        {
            type: Schema.Types.ObjectId,
            ref: 'Provider'
        }
    ]
});

module.exports = mongoose.model('Center', centerSchema);