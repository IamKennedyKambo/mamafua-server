const express = require("express");

const { body } = require("express-validator");

const profileController = require("../../controllers/new/profiles");
const isAuth = require("../../middleware/is-auth");

const router = express.Router();

router.get("/", profileController.getProfiles);

router.get("/findbycenter/:centerId", profileController.getProfilesByCenter);

router.post("/login", profileController.login);

router.post("/create", isAuth, profileController.createProfile);

router.post("/findOne", isAuth, profileController.getProfileById);

router.put("/:profileId/:status", profileController.updateProfile);

router.delete("/profile/:profileId", isAuth, profileController.deleteProfile);

module.exports = router;
