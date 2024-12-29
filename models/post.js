const { default: mongoose } = require("mongoose");

const postSchemachema = mongoose.Schema({
    userid:{
        type:mongoose.Schema.Types.ObjectId, ref:"user"
    },
    content:String,
    date:{
        date:Date,
        default:Date.now()
    }

});
module.exports = mongoose.model('post',postSchema)