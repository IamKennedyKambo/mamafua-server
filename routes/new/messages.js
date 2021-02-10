const express = require("express");

const { body } = require("express-validator");

const newsController = require("../../controllers/new/messages");
const isAuth = require("../../middleware/is-auth");

const router = express.Router();

router.get("/", newsController.getNews);

router.post("/create", isAuth, newsController.createMessage);

router.get("/newsId", isAuth, newsController.getMessage);

router.put("/newsId", isAuth, newsController.updateMessage);

router.delete("/newsId", isAuth, newsController.deleteMessage);

module.exports = router;
