const express = require("express");

const { body } = require("express-validator");

const requestsController = require("../../controllers/new/requests");
const isAuth = require("../../middleware/is-auth");

const router = express.Router();

router.get("/", requestsController.getRequests);

router.post("/create", requestsController.createRequest);

router.get("/requestId", isAuth, requestsController.getRequest);

router.put("/requestId", isAuth, requestsController.updateRequest);

router.delete("/requestId", isAuth, requestsController.deleteRequest);

module.exports = router;
