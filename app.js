const path = require("path");

const express = require("express");
const bodyParser = require("body-parser");
const prettyjson = require("prettyjson");
require("dotenv").config();
const mongoose = require("mongoose");
const multer = require("multer");
const cors = require("cors");

const feedRoutes = require("./routes/feed");
const serviceRoutes = require("./routes/new/services");
const profileRoutes = require("./routes/new/profiles");
const orderRoutes = require("./routes/new/order");
const newsRoutes = require("./routes/new/messages");
const requestRoutes = require("./routes/new/requests");
const centerRoutes = require("./routes/new/centers");
const authRoutes = require("./routes/new/auth");
const paymentRoutes = require("./routes/new/payment");
const referralRoutes = require("./routes/new/referrals");

const app = express();

const fileStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "images/");
  },
  filename: (req, file, cb) => {
    cb(null, file.originalname);
  },
});

const fileFilter = (req, file, cb) => {
  if (
    file.mimetype === "image/png" ||
    file.mimetype === "image/jpg" ||
    file.mimetype === "image/jpeg"
  ) {
    cb(null, true);
  } else {
    cb(null, false);
  }
};

// app.use(bodyParser.urlencoded()); // x-www-form-urlencoded <form>
app.use(bodyParser.json());
app.use(
  multer({
    storage: fileStorage,
    fileFilter: fileFilter,
  }).single("imageUrl")
);
app.use("/images", express.static(path.join(__dirname, "images")));

app.use(cors());
// app.use((req, res, next) => {
//     res.setHeader('Access-Control-Allow-Origin', '*');
//     res.setHeader(
//       'Access-Control-Allow-Methods',
//       'OPTIONS, GET, POST, PUT, PATCH, DELETE'
//     );
//     res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
//     next();
//   });

app.use("/feed", feedRoutes);
// app.use('/auth', authRoutes);
app.use("/auth", authRoutes);
app.use("/services", serviceRoutes);
app.use("/profiles", profileRoutes);
app.use("/orders", orderRoutes);
app.use("/news", newsRoutes);
app.use("/requests", requestRoutes);
app.use("/centers", centerRoutes);
app.use("/pay", paymentRoutes);
app.use("/referrals", referralRoutes);

app.use((error, req, res, next) => {
  console.log(error);
  const status = error.statusCode || 500;
  const message = error.message;
  const data = error.data;
  res.status(status).json({ message: message, data: data });
});

mongoose
  .connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then((result) => {
    console.log("Connected!");
    const server = app.listen(8080);
    const io = require("./socket").init(server);
    io.on("connection", (socket) => {
      console.log("Client connected");
    });
  })
  .catch((err) => console.log(err));

mongoose.set("useFindAndModify", false);
