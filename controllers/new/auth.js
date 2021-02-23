const { validationResult } = require("express-validator");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
require("dotenv").config();

const User = require("../../models/new/user");
const user = require("../../models/new/user");

exports.signup = (req, res, next) => {
  const errors = validationResult(req);
  console.log(errors);
  if (!errors.isEmpty()) {
    const error = new Error("Validation Failed");
    error.statusCode = 422;
    error.data = errors.array();
    throw error;
  }
  const email = req.body.email;
  const username = req.body.username;
  const password = req.body.password;
  console.log(req.body);
  bcrypt
    .hash(password, 12)
    .then((hashedPw) => {
      const user = new User({
        email: email,
        password: hashedPw,
        username: username,
      });
      return user.save();
    })
    .then((result) => {
      const token = jwt.sign(
        {
          email: result.email,
          userId: result._id.toString(),
        },
        process.env.SECRET,
        { expiresIn: "1h" }
      );
      res
        .status(201)
        .json({ message: "User created!", token: token, user: result });
    })
    .catch((err) => {
      if (!err.statusCode) {
        err.statusCode = 500;
      }
      next(err);
    });
};

exports.refreshToken = (req, res) => {
  const { token } = req.body;

  if (!token) {
    return res.sendStatus(401);
  }

  if (!refreshTokens.includes(token)) {
    return res.sendStatus(403);
  }

  jwt.verify(token, refreshTokenSecret, (err, user) => {
    if (err) {
      return res.sendStatus(403);
    }

    const accessToken = jwt.sign(
      { username: user.username, role: user.role },
      accessTokenSecret,
      { expiresIn: "20m" }
    );

    res.json({
      accessToken,
    });
  });
};

exports.logOut = (req, res) => {
  const { token } = req.body;
  refreshTokens = refreshTokens.filter((token) => t !== token);

  res.send("Logout successful");
};

function omit(obj, key) {
  const { [key]: ignore, ...rest } = obj;
  return rest;
}

exports.login = (req, res, next) => {
  const email = req.body.email;
  const password = req.body.password;
  var loadedUser;
  User.findOne({ email: email })
    .then((user) => {
      if (!user) {
        const error = new Error("No user with that email exists");
        error.statusCode = 401;
        res.status(401).send({ message: "No such user exists", user: null });
      }
      loadedUser = user;
      console.log(loadedUser);
      return bcrypt.compare(password, user.password);
    })
    .then((isEqual) => {
      if (!isEqual) {
        const error = new Error("Wrong Password");
        error.statusCode = 401;
        throw error;
      }
      const token = jwt.sign(
        {
          email: loadedUser.email,
          userId: loadedUser._id.toString(),
        },
        process.env.SECRET,
        { expiresIn: "1h" }
      );
      const refreshToken = jwt.sign(
        {
          email: loadedUser.email,
          userId: loadedUser._id.toString(),
        },
        process.env.REFRESH_SECRET,
        { expiresIn: "1h" }
      );

      //Save token to db
      // refreshTokens.push(refreshToken);
      loadedUser.password = undefined;
      loadedUser = JSON.parse(JSON.stringify(loadedUser));
      res.status(200).json({
        message: "Welcome to mama-fua",
        token: token,
        user: loadedUser,
      });
    })
    .catch((err) => {
      if (!err.statusCode) {
        err.statusCode = 500;
      }
      next(err);
    });
};

exports.getUserStatus = (req, res, next) => {
  User.findById(req.userId)
    .then((user) => {
      if (!user) {
        const error = new Error("User not found");
        error.statusCode = 404;
        throw error;
      }
      res.status(200).json({ status: user.status });
    })
    .catch((err) => {
      if (!err.statusCode) {
        err.statusCode = 500;
      }
      next(err);
    });
};

exports.getUser = (req, res, next) => {
  User.findById(req.userId)
    .then((user) => {
      if (!user) {
        const error = new Error("User not found");
        error.statusCode = 404;
        throw error;
      }
      res.status(200).json({ user: user });
    })
    .catch((err) => {
      if (!err.statusCode) {
        err.statusCode = 500;
      }
      next(err);
    });
};

exports.updateUser = (req, res, next) => {
  console.log(req.body.nameValuePairs);
  console.log(req.body.nameValuePairs);
  User.updateOne({ _id: req.query._id }, { $set: req.body.nameValuePairs })
    .then((result) => {
      res
        .status(200)
        .json({ message: "User updated successfully.", user: result });
    })
    .catch((err) => {
      if (!err.statusCode) {
        err.statusCode = 500;
      }
      next(err);
    });
};
