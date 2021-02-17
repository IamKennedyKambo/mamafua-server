const fs = require("fs");
const path = require("path");

const { validationResult } = require("express-validator");

const io = require("../../socket");
const Center = require("../../models/new/center");

exports.getCenters = async (req, res, next) => {
  const currentPage = req.query.page || 1;
  const perPage = 12;
  try {
    const totalItems = await Center.find().countDocuments();
    const centers = await Center.find()
      .sort({ createdAt: -1 })
      .skip((currentPage - 1) * perPage)
      .limit(perPage);
    res.status(200).json({
      message: "Fetched centers successfully.",
      centers: centers,
      totalItems: totalItems,
    });
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};

exports.createCenter = (req, res, next) => {
  const errors = validationResult(req);
  console.log(req.body);
  if (!errors.isEmpty()) {
    const error = new Error("Validation Failed");
    error.statusCode = 422;
    throw error;
  }

  const centers = new Center({
    name: req.body.name,
    phone: req.body.phone,
    status: req.body.status,
    providers: [],
    location: { longitude: req.body.longitude, latitude: req.body.latitude },
  });
  centers
    .save()
    .then((result) => {
      io.getIO().emit("centers", { action: "create", centers: centers });
      res.status(201).json({
        message: "Center created successfully!",
        center: centers,
      });
    })
    .catch((err) => {
      if (!err.statusCode) {
        err.statusCode = 500;
      }
      next(err);
    });
};

exports.getCenter = (req, res, next) => {
  const centersId = req.params.centersId;
  Center.findById(centersId)
    .then((centers) => {
      if (!centers) {
        const error = new Error("Cannot find centers");
        error.statusCode = 404;
        throw error;
      }
      res.status(200).json({ message: "Center fetched.", centers: centers });
    })
    .catch((err) => {
      if (!err.statusCode) {
        err.statusCode = 500;
      }
      next(err);
    });
};

exports.updateCenter = (req, res, next) => {
  const centersId = req.params.centersId;
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const error = new Error("Validation failed, entered data is incorrect.");
    error.statusCode = 422;
    throw error;
  }
  const title = req.body.title;
  const content = req.body.content;

  Center.findById(centersId)
    .then((centers) => {
      if (!centers) {
        const error = new Error("Could not find centers.");
        error.statusCode = 404;
        throw error;
      }
      if (imageUrl !== centers.imageUrl) {
        clearImage(centers.imageUrl);
      }
      centers.title = title;
      centers.imageUrl = imageUrl;
      centers.content = content;
      return centers.save();
    })
    .then((result) => {
      io.getIO().emit("centers", { action: "update", centers: result });
      res.status(200).json({ message: "Center updated!", centers: result });
    })
    .catch((err) => {
      if (!err.statusCode) {
        err.statusCode = 500;
      }
      next(err);
    });
};

exports.deleteCenter = (req, res, next) => {
  const centersId = req.params.centersId;
  Center.findById(centersId)
    .then((centers) => {
      if (!centers) {
        const error = new Error("Could not find centers.");
        error.statusCode = 404;
        throw error;
      }
      clearImage(centers.imageUrl);
      return Center.findByIdAndRemove(centersId);
    })
    .then((result) => {
      io.getIO().emit("centers", { action: "delete", centers: centersId });
      res.status(200).json({ message: "Center Deleted." });
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
