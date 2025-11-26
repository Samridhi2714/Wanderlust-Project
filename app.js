if(process.env.NODE_ENV != "production") {
  require("dotenv").config();
};
require('dotenv').config();

const express = require("express");
const app = express();
const mongoose = require("mongoose");
//const Listing = require("./models/listing.js");
const path = require("path");
const methodOverride = require("method-override");
const ejsMate = require("ejs-mate");
//const wrapAsync = require("./utils/wrapAsync.js");
const ExpressError = require("./utils/ExpressError");
//const { listingSchema, reviewSchema } = require("./schema.js");
//const Review = require("./models/review.js");
const session = require("express-session");
const MongoStore = require('connect-mongo');
const flash = require("connect-flash");
const passport = require("passport");
const LocalStrategy = require("passport-local");
const User = require("./models/user.js");
const multer = require("multer");
const { storage } = require("./cloudConfig");
const upload = multer({ storage });

const listingRouter = require("./routes/listing.js");
const reviewRouter = require("./routes/review.js");
const userRouter = require("./routes/user.js");

//const MONGO_URL = "mongodb://127.0.0.1:27017/wanderlust";
const dbUrl = process.env.ATLASDB_URL;
mongoose.connect(dbUrl, 
  { dbName: "wanderlust" });
main()
  .then(() => {
    console.log("connected to DB.");
  })
  .catch((err) => {
    console.log(err);
  });

async function main() {
  await mongoose.connect(dbUrl);
}

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride("_method"));
app.engine("ejs", ejsMate);
app.use(express.static(path.join(__dirname, "/public")));

const store = MongoStore.create({
  mongoUrl: process.env.ATLASDB_URL,
  collectionName: "sessions",
  touchAfter: 24 * 3600,
});

const sessionOptions = {
  store,
  name: "wanderlustSession",
  secret: process.env.SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    maxAge: 1000 * 60 * 60 * 24 * 7,
  },
};

app.use(session(sessionOptions));
app.use(flash());

app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

//console.log("views directory is set to:", path.join(__dirname, "views"));
//-----Flash Middleware
app.use((req, res, next) => {
  res.locals.success = req.flash("success");
  res.locals.error = req.flash("error");
  res.locals.currUser = req.user;
  next(); 
});

app.use("/listings",listingRouter);
app.use("/listings/:id/reviews",reviewRouter);
app.use("/",userRouter);

/* app.get("/demouser", async (req,res) => {
  let fakeUser = new User({
    email: "student@gmail.com",
    username: "delta-student",
    });
    
    let registeredUser = await User.register(fakeUser, "helloWorld");
    res.send(registeredUser);
}) */

/*   app.get("/testListing",async (req,res) => {
        let sampleListing = new Listing({
                title:"My New Villa",
                description: "By the  Beach",
                price: 1200,
                location: "Calangute,Goa",
                country: "India", 
        });
        await sampleListing.save();
        console.log("Sample was saved");
        res.send("Successful testing.");
});      */ 

app.use((req, res, next) => {
  next(new ExpressError(404,"Page not found"));
});

app.use((err, req, res, next) => {
  const { statusCode = 500 } = err;
  if (!err.message) err.message = "Something went wrong!";
  console.error("ERROR STACK:", err.stack);
  res.status(statusCode).render("error.ejs", { err });
  console.log(err);
  // OR, if you’re not rendering a view:
  // res.status(statusCode).send(message);
});

app.listen(8080, () => {
  console.log("Server is listening to port 8080.");
});
