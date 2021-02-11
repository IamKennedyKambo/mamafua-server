const express = require("express");

const { body } = require("express-validator");

const centersContoller = require("../../controllers/new/centers");
const isAuth = require("../../middleware/is-auth");

const router = express.Router();

router.get("/", centersContoller.getCenters);

router.post("/create", isAuth, centersContoller.createCenter);

router.get("/centerId", isAuth, centersContoller.getCenter);

router.put("/centerId", isAuth, centersContoller.updateCenter);

router.delete("/centerId", isAuth, centersContoller.deleteCenter);

module.exports = router;
