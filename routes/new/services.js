const express = require("express");

const { body } = require("express-validator");

const serviceController = require("../../controllers/new/services");
const isAuth = require("../../middleware/is-auth");

const router = express.Router();

const validate = [
  body("title").trim().isLength({ min: 5 }),
  body("content").trim().isLength({ min: 5 }),
];

router.get("/", serviceController.getServices);

router.post("/create", isAuth, serviceController.createService);

router.get("/serviceId", isAuth, serviceController.getService);

router.put("/serviceId", isAuth, serviceController.updateService);

router.delete("/serviceId", isAuth, serviceController.deleteService);

module.exports = router;
