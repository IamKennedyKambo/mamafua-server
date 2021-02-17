const fs = require("fs");
const path = require("path");

const { validationResult } = require("express-validator");

const io = require("../../socket");
const Order = require("../../models/new/order");
const User = require("../../models/new/user");
const Profile = require("../../models/new/profile");
const Receipt = require("../../models/new/receipt");

require("dotenv").config();

exports.getOrders = async (req, res, next) => {
  const currentPage = req.query.page || 1;
  const perPage = 12;
  try {
    const totalItems = await Order.find().countDocuments();
    const orders = await Order.find()
      .sort({ createdAt: -1 })
      .skip((currentPage - 1) * perPage)
      .limit(perPage);
    res.status(200).json({
      message: "Fetched orders successfully.",
      orders: orders,
      totalItems: totalItems,
    });
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};

exports.getOrderByUserId = async (req, res, next) => {
  const userId = req.query.userId;
  console.log(req);
  try {
    const orders = await Order.find({})
      .where("placedBy")
      .equals(userId)
      .sort({ createdAt: -1 });
    res.status(200).json({
      message: "Fetched orders successfully.",
      orders: orders,
    });

    console.log(orders);
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};

exports.createOrder = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const error = new Error("Validation Failed");
    error.statusCode = 422;
    throw error;
  }

  const order = new Order({
    placedBy: req.body.placedBy,
    phone: req.body.phone,
    latitude: req.body.latitude,
    longitude: req.body.longitude,
    amount: req.body.amount,
    paidVia: req.body.paidVia,
    status: req.body.status,
    transactionId: req.body.transactionId,
    merchantRequestId: req.body.merchantRequestId,
    checkoutRequestId: req.body.checkoutRequestId,
    profileId: req.body.fullfillerId,
    profileName: req.body.fullfillerName,
    center: req.body.center,
    executionDate: req.body.executionDate,
    paid: "",
    services: req.body.services,
  });

  order
    .save()
    .then(() => {
      return Profile.findById(req.body.profileId);
    })
    .then((profile) => {
      profile.jobs.push(order);
      return profile.save();
    })
    .then(() => {
      return User.findById(req.body.placedBy);
    })
    .then((user) => {
      user.orders.push(order);
      return user.save();
    })
    .then(() => {
      io.getIO().emit("orders", { action: "create", order: order });
      res.status(201).json({
        message: "Order created successfully!",
        order: order,
      });
    })
    .catch((err) => {
      if (!err.statusCode) {
        err.statusCode = 500;
      }
      next(err);
    });
};

exports.getOrder = (req, res, next) => {
  const orderId = req.params.orderId;
  Order.findById(orderId)
    .then((order) => {
      if (!order) {
        const error = new Error("Cannot find order");
        error.statusCode = 404;
        throw error;
      }
      res.status(200).json({ message: "Order fetched.", order: order });
    })
    .catch((err) => {
      if (!err.statusCode) {
        err.statusCode = 500;
      }
      next(err);
    });
};

exports.updateOrder = (req, res, next) => {
  const orderId = req.params.orderId;
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
  Order.findById(orderId)
    .then((order) => {
      if (!order) {
        const error = new Error("Could not find order.");
        error.statusCode = 404;
        throw error;
      }
      if (imageUrl !== order.imageUrl) {
        clearImage(order.imageUrl);
      }
      order.title = title;
      order.imageUrl = imageUrl;
      order.content = content;
      return order.save();
    })
    .then((result) => {
      io.getIO().emit("orders", { action: "update", order: result });
      res.status(200).json({ message: "Order updated!", order: result });
    })
    .catch((err) => {
      if (!err.statusCode) {
        err.statusCode = 500;
      }
      next(err);
    });
};

exports.deleteOrder = (req, res, next) => {
  const orderId = req.params.orderId;
  Order.findById(orderId)
    .then((order) => {
      if (!order) {
        const error = new Error("Could not find order.");
        error.statusCode = 404;
        throw error;
      }
      clearImage(order.imageUrl);
      return Order.findByIdAndRemove(orderId);
    })
    .then((result) => {
      io.getIO().emit("orders", { action: "delete", order: orderId });
      res.status(200).json({ message: "Order Deleted." });
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
