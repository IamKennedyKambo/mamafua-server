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

exports.getOrderByProfileId = async (req, res, next) => {
  const profileId = req.query.profileId;
  console.log(req);
  try {
    const orders = await Order.find({})
      .where("profileId")
      .equals(profileId)
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
  console.log(req.body);
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
    profileId: req.body.profileId,
    profileName: req.body.profileName,
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

exports.getOrderById = (req, res, next) => {
  const orderId = req.params.orderId;
  console.log(req.params);
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
  const status = req.params.status;
  Order.findByIdAndUpdate({ _id: orderId }, { status: status })
    .then((result) => {
      res.status(200).json({ message: "Order updated!", order: result });
    })
    .catch((err) => {
      if (err)
        res.status(200).json({ message: "Order update failed!", error: err });
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
