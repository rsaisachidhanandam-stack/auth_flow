
const mongoose = require("mongoose")


const userSchema = mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Name is required']
    }, 
    email: {
        type: String,
        required: [true, 'Email is required'],
        unique: true
    },
    password: {
        type: String,
        required: [true, 'Password is required']
    },
    isActivated: {
        type: Boolean,
        default: false
    }
})

const UserModel = mongoose.model("user", userSchema)

module.exports = UserModel