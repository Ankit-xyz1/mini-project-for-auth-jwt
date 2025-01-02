const mongoose = require('mongoose');
mongoose.connect("mongodb://localhost:27017/miniProjectDb");
const userSchema = mongoose.Schema({
    name:String,
    username:String,
    age:Number,
    email:String,
    password:String,
    img : String,
    posts:[{
        type:mongoose.Schema.Types.ObjectId, ref:"post"
    }
    ]
});
module.exports = mongoose.model('user',userSchema)