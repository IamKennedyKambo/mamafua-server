const fs = require("fs");
const path = require("path");

const { validationResult } = require("express-validator");

const io = require("../../socket");
const Referrals = require("../../models/new/referrals");

exports.getReferrals = async (req, res, next) => {
  const currentPage = req.query.page || 1;
  const perPage = 12;
  try {
    const totalItems = await Referrals.find().countDocuments();
    const referrals = await Referrals.find()
      .sort({ createdAt: -1 })
      .skip((currentPage - 1) * perPage)
      .limit(perPage);
    res.status(200).json({
      message: "Fetched referrals successfully.",
      referrals: referrals,
      totalItems: totalItems,
    });
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};

exports.createReferral = (req, res, next) => {
  const errors = validationResult(req);
  console.log(req.body);
  if (!errors.isEmpty()) {
    const error = new Error("Validation Failed");
    error.statusCode = 422;
    throw error;
  }

  const referrals = new Referrals({
    referrer: req.body.referrer,
    discount: req.body.discount,
    validFor: req.body.validFor,
    code: req.body.code,
  });
  referrals
    .save()
    .then((result) => {
      io.getIO().emit("referrals", { action: "create", referrals: referrals });
      res.status(201).json({
        message: "Referral created successfully!",
        referrals: referrals,
      });
    })
    .catch((err) => {
      if (!err.statusCode) {
        err.statusCode = 500;
      }
      next(err);
    });
};

exports.getReferral = (req, res, next) => {
  const referralId = req.params.referralId;
  Referrals.findById(referralId)
    .then((referrals) => {
      if (!referrals) {
        const error = new Error("Cannot find referrals");
        error.statusCode = 404;
        throw error;
      }
      res
        .status(200)
        .json({ message: "Referrals fetched.", referrals: referrals });
    })
    .catch((err) => {
      if (!err.statusCode) {
        err.statusCode = 500;
      }
      next(err);
    });
};

exports.updateReferral = (req, res, next) => {
  const referralId = req.params.referralId;
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const error = new Error("Validation failed, entered data is incorrect.");
    error.statusCode = 422;
    throw error;
  }
  const title = req.body.title;
  const content = req.body.content;

  Referrals.findById(referralId)
    .then((referrals) => {
      if (!referrals) {
        const error = new Error("Could not find referrals.");
        error.statusCode = 404;
        throw error;
      }
      if (imageUrl !== referrals.imageUrl) {
        clearImage(referrals.imageUrl);
      }
      referrals.title = title;
      referrals.imageUrl = imageUrl;
      referrals.content = content;
      return referrals.save();
    })
    .then((result) => {
      io.getIO().emit("referrals", { action: "update", referrals: result });
      res
        .status(200)
        .json({ message: "Referrals updated!", referrals: result });
    })
    .catch((err) => {
      if (!err.statusCode) {
        err.statusCode = 500;
      }
      next(err);
    });
};

exports.deleteReferral = (req, res, next) => {
  const referralId = req.params.referralId;
  Referrals.findById(referralId)
    .then((referrals) => {
      if (!referrals) {
        const error = new Error("Could not find referrals.");
        error.statusCode = 404;
        throw error;
      }
      clearImage(referrals.imageUrl);
      return Referrals.findByIdAndRemove(newsId);
    })
    .then((result) => {
      io.getIO().emit("referrals", { action: "delete", referrals: referralId });
      res.status(200).json({ message: "Referrals Deleted." });
    })
    .catch((err) => {
      if (!err.statusCode) {
        err.statusCode = 500;
      }
      next(err);
    });
};

const clearImage = (filePath) => {
  filePath = path.join(__dirname, "..", filePath);
  fs.unlink(filePath, (err) => console.log(err));
};
