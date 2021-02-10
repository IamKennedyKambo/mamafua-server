const express = require("express");
const { body } = require("express-validator");

const User = require("../../models/new/user");
const authController = require("../../controllers/new/auth");
const isAuth = require("../../middleware/is-auth");

const router = express.Router();

router.put(
  "/signup",
  [
    body("email")
      .isEmail()
      .withMessage("Please enter a valid email.")
      .custom((value, { req }) => {
        return User.findOne({ email: value }).then((userDoc) => {
          if (userDoc) {
            return Promise.reject("E-Mail address already exists!");
          }
        });
      })
      .normalizeEmail(),
    body("password").trim().isLength({ min: 5 }),
    body("username").trim().not().isEmpty(),
  ],
  authController.signup
);

router.post("/login", authController.login);

router.get("/status", isAuth, authController.getUserStatus);

router.get("/user", isAuth, authController.getUser);

router.put(
  "/update/:_id",
  // [body("status").trim().not().isEmpty()],
  authController.updateUser
);

module.exports = router;
