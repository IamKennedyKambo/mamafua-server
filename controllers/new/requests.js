const fs = require("fs");
const path = require("path");

const { validationResult } = require("express-validator");

const io = require("../../socket");
const Request = require("../../models/new/request");
const Profile = require("../../models/new/profile");

exports.getRequests = async (req, res, next) => {
  const currentPage = req.query.page || 1;
  const perPage = 12;
  try {
    const totalItems = await Request.find().countDocuments();
    const requests = await Request.find()
      .sort({ createdAt: -1 })
      .skip((currentPage - 1) * perPage)
      .limit(perPage);
    res.status(200).json({
      message: "Fetched requests successfully.",
      requests: requests,
      totalItems: totalItems,
    });
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};

exports.createRequest = (req, res, next) => {
  const errors = validationResult(req);
  console.log(req.body);
  if (!errors.isEmpty()) {
    const error = new Error("Validation Failed");
    error.statusCode = 422;
    throw error;
  }

  const request = new Request({
    firstName: req.body.firstName,
    lastName: req.body.lastName,
    phone: req.body.phone,
    location: req.body.location,
  });
  request
    .save()
    .then((result) => {
      io.getIO().emit("requests", { action: "create", request: request });
      res.status(201).json({
        message: "Request created successfully!",
        request: request,
      });
    })
    .catch((err) => {
      if (!err.statusCode) {
        err.statusCode = 500;
      }
      next(err);
    });
};

exports.getRequest = (req, res, next) => {
  const requestId = req.params.requestId;
  Request.findById(requestId)
    .then((request) => {
      if (!request) {
        const error = new Error("Cannot find request");
        error.statusCode = 404;
        throw error;
      }
      res.status(200).json({ message: "Request fetched.", request: request });
    })
    .catch((err) => {
      if (!err.statusCode) {
        err.statusCode = 500;
      }
      next(err);
    });
};

exports.updateRequest = (req, res, next) => {
  const requestId = req.params.requestId;
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const error = new Error("Validation failed, entered data is incorrect.");
    error.statusCode = 422;
    throw error;
  }
  const title = req.body.title;
  const content = req.body.content;
  let imageUrl = req.body.image;
  if (req.file) {
    imageUrl = req.file.path;
  }
  if (!imageUrl) {
    const error = new Error("No file picked.");
    error.statusCode = 422;
    throw error;
  }
  Request.findById(requestId)
    .then((request) => {
      if (!request) {
        const error = new Error("Could not find request.");
        error.statusCode = 404;
        throw error;
      }
      if (imageUrl !== request.imageUrl) {
        clearImage(request.imageUrl);
      }
      request.title = title;
      request.imageUrl = imageUrl;
      request.content = content;
      return request.save();
    })
    .then((result) => {
      io.getIO().emit("requests", { action: "update", request: result });
      res.status(200).json({ message: "Request updated!", request: result });
    })
    .catch((err) => {
      if (!err.statusCode) {
        err.statusCode = 500;
      }
      next(err);
    });
};

exports.deleteRequest = (req, res, next) => {
  const requestId = req.params.requestId;
  Request.findById(requestId)
    .then((request) => {
      if (!request) {
        const error = new Error("Could not find request.");
        error.statusCode = 404;
        throw error;
      }
      clearImage(request.imageUrl);
      return Request.findByIdAndRemove(requestId);
    })
    .then((result) => {
      io.getIO().emit("requests", { action: "delete", request: requestId });
      res.status(200).json({ message: "Request Deleted." });
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
