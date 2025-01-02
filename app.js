const express = require('express');
const app = express();
port = 3000;

const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken')
const cookie = require('cookie-parser')

const user = require('./models/user');
const post = require('./models/post');


const upload = require('./config/multer')

app.set('view engine', 'ejs')
app.use(cookie())
app.use(express.json())
app.use(express.static('public'));
app.use(express.urlencoded({ extended: true }))

// signup a user
app.get('/', (req, res) => {
    res.render("signup")
})
 

app.post('/create', async (req, res) => {
    // fetching values via destructuring
    let { email, name, username, age, password } = req.body
    console.log(email, name, username, age, password)

    // validations
    if (!email || !password || !name) return res.send("Please fill all necessary feilds")
    let emailAlreadyExist = await user.findOne({ email: email });
    if (emailAlreadyExist) return res.send("email Already exist");

    // encrypting password and storing it into mongo db database
    bcrypt.hash(password, 10, async (err, hash) => {
        let createdUser = await user.create({
            name,
            email,
            username,
            age,
            password: hash
        })
        let token = jwt.sign({ email, name }, "hack")
        res.cookie('token', token)
        res.redirect('profile')
    })
})


// login a user
app.get('/login', (req, res) => {
    res.render('login')
})

app.post('/loginUser', async (req, res) => {
    let { email, password } = req.body
    let Cuser = await user.findOne({ email })
    if (!Cuser) {
        return res.redirect("/login")
    }else{
        bcrypt.compare(password, Cuser.password, (err, value) => {
            if (value) {
                let token = jwt.sign({email}, "hack")
                res.cookie('token', token)
                res.redirect('profile')
            }
            else{
                return res.status('404').redirect("login")
            }
        })
    }
})

// protected routes

const IsLoggedin = async (req,res,next) => {
    let token = req.cookies.token
    if(!token) return res.status(404).redirect("/login")
    let data = jwt.verify(token,"hack")
    req.userEmail = data.email;
    next();
} 

app.get('/profile',IsLoggedin,async(req,res)=>{
    let Cuser = await user.findOne({email:req.userEmail}).populate("posts")
    res.render('profile',{Cuser})
})
app.post('/createpost',IsLoggedin,async(req,res)=>{
    let Cuser = await user.findOne({email:req.userEmail})
    let {content} = req.body
    let cp = await post.create({
        userid:Cuser._id,
        content
    })
    Cuser.posts.push(cp._id)
    await Cuser.save()
    res.redirect('/profile')
})

app.get('/like/:slug',IsLoggedin,async(req,res)=>{
    let LikedPost = await post.findOne({_id: req.params.slug})
    console.log(LikedPost)
    let userWhoLiked =await user.findOne({email:req.userEmail})
    console.log(userWhoLiked._id)
    if(LikedPost.like.includes(userWhoLiked._id)){
        let index = LikedPost.like.indexOf(userWhoLiked._id);
        await LikedPost.like.splice(index,1)
        await LikedPost.save()
    }else{
       await LikedPost.like.push(userWhoLiked._id)
       await LikedPost.save()
    }
    res.redirect('/profile')
})
app.get('/delete/:slug',IsLoggedin,async(req,res)=>{
    let deletedPost = await post.findOneAndDelete({_id: req.params.slug})
    res.redirect('/profile')
})

app.get('/upload',IsLoggedin,async(req,res)=>{
    res.render('upload')
})
app.post('/upload/pic',IsLoggedin,upload.single('profilepic'),async(req,res)=>{

    let fuser =await user.findOneAndUpdate({email:req.userEmail},{$set:{img:req.file.filename}})
    res.redirect('/upload')
})




// logout a user
app.get('/logout',(req,res)=>{
    res.clearCookie("token")
    res.redirect("/login")
})
app.listen(port, () => {
    console.log(`listeneing to port http://localhost:${port}`)
})
