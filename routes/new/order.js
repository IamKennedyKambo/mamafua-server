const express = require("express");

const { body } = require("express-validator");

const orderController = require("../../controllers/new/orders");
const isAuth = require("../../middleware/is-auth");

const router = express.Router();

router.get("/", orderController.getOrders);

router.post("/create", orderController.createOrder);

router.get("/find/:userId", orderController.getOrderByUserId);

router.get("/get/:profileId", orderController.getOrderByProfileId);

router.get("/:orderId", orderController.getOrderById);

router.put("/:orderId/:status", orderController.updateOrder);

router.delete("/:orderId", isAuth, orderController.deleteOrder);

module.exports = router;
