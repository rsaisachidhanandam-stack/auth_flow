let express = require("express")
const UserModel = require("../model/userModel");
const bcrypt = require("bcrypt")
const jwt = require("jsonwebtoken")
const { sendMail } = require("../utils/mail")

let userRoute = express.Router()



userRoute.post("/signup", async (req, res, next) => {
  try {

    const { name, email, password } = req.body;

    if (!email || !password || !name) {
      return res.status(400).json({
        status: false,
        message: "name, email and password required"
      });
    }

  
    const nameRegex = /^[A-Za-z\s]+$/;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;


    if (!nameRegex.test(name)) {
      return res.status(400).json({
        status: false, 
        message: "Name should contain only letters"
      });
    }

   
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        status: false,
        message: "Invalid email format"
      });
    }

    if (!passwordRegex.test(password)) {
      return res.status(400).json({
        status: false,
        message: "Password must be at least 8 characters with uppercase, lowercase, and number"
      });
    }

    let user = await UserModel.findOne({ email: email })
    if (user) {
      return res.status(400).json({ status: false, message: "user already exists" })
    }

    const hash = await bcrypt.hash(password, 5)
    let newUser = new UserModel({ name, email, password: hash })

    let token = jwt.sign({ id: newUser._id }, process.env.SECRET, { expiresIn: '1h' })
    let PORT = process.env.PORT || 8080
    let activation_url = `http://localhost:${PORT}/user/activation/${token}`
    await sendMail(
      {
        email: newUser.email,
        subject: "Activate your account",
        message: `Hello ${newUser.name}, please click the link to activate your account: ${activation_url}`,
      }
    )
    await newUser.save()
    res.status(200).json({ status: true, message: "registration successful" })
  } catch (error) {
    next(error);
  }
});




userRoute.get("/activation/:token", async (req, res, next) => {
  try {
    let token = req.params.token
    if (!token) {
      return res.status(404).json({ status: false, message: "token not found" })
    }
    const decoded = jwt.verify(token, process.env.SECRET)
    let id = decoded.id
    await UserModel.findByIdAndUpdate(id, { isActivated: true })

    res.redirect("http://localhost:5173/login")
  } catch (error) {
    next(error);
  }
})





userRoute.post("/login", async (req, res, next) => {
  try {
    const { email, password } = req.body;
   
    if (!email || !password) {
      return res.status(400).json({ status: false, message: "email and password required" })
    }

    let user = await UserModel.findOne({ email });

    if (!user) {
      return res.status(400).json({ status: false, message: "invalid credentials" })
    }

    if (!user.isActivated) {
      return res.status(400).json({ status: false, message: "Please activate your account" })
    }

    const result = await bcrypt.compare(password, user.password)
    if (!result) {
      return res.status(400).json({ status: false, message: "invalid credentials" })
    }

    let token = jwt.sign({ id: user._id }, process.env.SECRET, {expiresIn: '24h',});

    res.cookie("accesstoken", token, {
      httpOnly: true,
      secure: false,
      sameSite: "lax"
    });

    res.status(200).json({ 
      status: true, 
      message: "login successful", 
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email
      }
    })
  } catch (error) {
    next(error);
  }
});

module.exports = userRoute;
