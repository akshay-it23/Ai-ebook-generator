const mongoose = require('mongoose');

//chapter schema define here
const chapterSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
    },
    description: {
        type: String,
        default: "",
    },
});


const bookSchema = new mongoose.Schema({

    userID: {
        //_id objectid

        type: mongoose.Schema.Types.ObjectId,
        required: true,
        //ya define krat h ki ya book owner ko
        ref: "User",
    },

    title: {
        type: String,
        required: true,
    },

    subtitle: {
        type: String,
        default: "",
    },

    author: {
        type: String,
        required: true,   
    },

    coverImage: {
        type: String,
        default: "",    
    },

    chapters: [chapterSchema],

    status: {
        type: String,
        //fixed specific value print hote bs
        enum: ["draft", "published"],
        default: "draft",
    },

}, {
    timestamps: true
});

module.exports = mongoose.model("Book", bookSchema);   
