const express = require("express");

const { body } = require("express-validator");

const orderController = require("../../controllers/new/orders");
const isAuth = require("../../middleware/is-auth");

const router = express.Router();

router.get("/", orderController.getOrders);

router.post("/create", orderController.createOrder);

router.get("/find/:userId", orderController.getOrderByUserId);

router.get("/:orderId", orderController.getOrder);

router.put("/:orderId", isAuth, orderController.updateOrder);

router.delete("/:orderId", isAuth, orderController.deleteOrder);

module.exports = router;
