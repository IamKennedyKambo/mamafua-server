const fs = require("fs");
const path = require("path");

const { validationResult } = require("express-validator");

const io = require("../../socket");
const Service = require("../../models/new/service");
const User = require("../../models/user");

exports.getServices = async (req, res, next) => {
  const currentPage = req.query.page || 1;
  const perPage = 12;
  try {
    const totalItems = await Service.find().countDocuments();
    const services = await Service.find().sort({ name: 1 });
    // .skip((currentPage - 1) * perPage)
    // .limit(perPage);
    res.status(200).json({
      message: "Fetched services successfully.",
      services: services,
      totalItems: totalItems,
    });
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};

exports.createService = (req, res, next) => {
  const errors = validationResult(req);
  console.log(req.body);
  if (!errors.isEmpty()) {
    const error = new Error("Validation Failed");
    error.statusCode = 422;
    throw error;
  }
  if (!req.file) {
    const error = new Error("No image provided.");
    error.statusCode = 422;
    throw error;
  }

  let fileUrl = req.file.path.replace(/\\/g, "/");
  const service = new Service({
    name: req.body.name,
    onSitePrice: req.body.onSitePrice,
    offSitePrice: req.body.offSitePrice,
    machinePrice: req.body.machinePrice,
    description: req.body.description,
    imageUrl: fileUrl,
  });
  service
    .save()
    .then((result) => {
      io.getIO().emit("services", { action: "create", service: service });
      res.status(201).json({
        message: "Service created successfully!",
        service: service,
      });
    })
    .catch((err) => {
      if (!err.statusCode) {
        err.statusCode = 500;
      }
      next(err);
    });
};

exports.getService = (req, res, next) => {
  const serviceId = req.params.serviceId;
  Service.findById(serviceId)
    .then((service) => {
      if (!service) {
        const error = new Error("Cannot find service");
        error.statusCode = 404;
        throw error;
      }
      res.status(200).json({ message: "Service fetched.", service: service });
    })
    .catch((err) => {
      if (!err.statusCode) {
        err.statusCode = 500;
      }
      next(err);
    });
};

exports.updateService = (req, res, next) => {
  const serviceId = req.params.serviceId;
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
  Service.findById(serviceId)
    .then((service) => {
      if (!service) {
        const error = new Error("Could not find service.");
        error.statusCode = 404;
        throw error;
      }
      if (imageUrl !== service.imageUrl) {
        clearImage(service.imageUrl);
      }
      service.title = title;
      service.imageUrl = imageUrl;
      service.content = content;
      return service.save();
    })
    .then((result) => {
      io.getIO().emit("services", { action: "update", service: result });
      res.status(200).json({ message: "Service updated!", service: result });
    })
    .catch((err) => {
      if (!err.statusCode) {
        err.statusCode = 500;
      }
      next(err);
    });
};

exports.deleteService = (req, res, next) => {
  const serviceId = req.params.serviceId;
  Service.findById(serviceId)
    .then((service) => {
      if (!service) {
        const error = new Error("Could not find service.");
        error.statusCode = 404;
        throw error;
      }
      clearImage(service.imageUrl);
      return Service.findByIdAndRemove(serviceId);
    })
    .then((result) => {
      io.getIO().emit("services", { action: "delete", service: serviceId });
      res.status(200).json({ message: "Service Deleted." });
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
