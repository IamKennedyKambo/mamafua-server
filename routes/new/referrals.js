const express = require("express");

const { body } = require("express-validator");

const referralController = require("../../controllers/new/referrals");
const isAuth = require("../../middleware/is-auth");

const router = express.Router();

router.get("/", referralController.getReferrals);

router.post("/create", isAuth, referralController.createReferral);

router.get("/:code", isAuth, referralController.getReferral);

router.put("/:referralId", isAuth, referralController.updateReferral);

router.delete("/:referralId", isAuth, referralController.deleteReferral);

module.exports = router;
