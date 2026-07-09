import moongoose from 'mongoose';

const messageSchema = new moongoose.Schema({

    name: {
        type: String,
        required: true,},
    email: {
        type: String,
        required: true,},
    phone: {
      type: String,
      match: [/^\+63\d{10}$/, 'Phone number must be in the format +63XXXXXXXXXX'],
      default: null,
    },
    message:{
        type: String,
        required: true,
        trim: true
    },
    response: {
        type: Boolean,
        default: false,
    },
    isRead: {
        type: Boolean,
        default: false,
    },
}, { timestamps: true });

export default moongoose.model('Message', messageSchema);