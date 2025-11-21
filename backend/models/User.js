const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },

    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
    },

    password: {
        type: String,
        required: true,
        minlength: 6,
        //false mtlb data base response m nhi ayega'
        select: false,
    },

    avatar: {
        type: String,    // corrected tyep → type
        default: "",
    },

    isPro: {
        type: Boolean,   // corrected tyep → type
        default: false,
    },

}, {
    timestamps: true
});


// Password hashing middleware
userSchema.pre("save", async function (next) {
    if (!this.isModified("password")) return next();

    const salt = await bcrypt.genSalt(10);   // corrected grnSalt → genSalt
    this.password = await bcrypt.hash(this.password, salt);
    next();
});

// Compare password
userSchema.methods.matchPassword = async function (enterPassword) {
    return await bcrypt.compare(enterPassword, this.password);  // corrected pasword → password
};

module.exports = mongoose.model("User", userSchema);
