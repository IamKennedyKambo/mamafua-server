const fs = require("fs");
const path = require("path");

const { validationResult } = require("express-validator");

const io = require("../../socket");
const News = require("../../models/new/messages");
const User = require("../../models/user");

exports.getNews = async (req, res, next) => {
  const currentPage = req.query.page || 1;
  const perPage = 12;
  try {
    const totalItems = await News.find().countDocuments();
    const news = await News.find()
      .sort({ createdAt: -1 })
      .skip((currentPage - 1) * perPage)
      .limit(perPage);
    res.status(200).json({
      message: "Fetched news successfully.",
      news: news,
      totalItems: totalItems,
    });
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};

exports.createMessage = (req, res, next) => {
  const errors = validationResult(req);
  console.log(req.body);
  if (!errors.isEmpty()) {
    const error = new Error("Validation Failed");
    error.statusCode = 422;
    throw error;
  }
  if (!req.file) {
    const error = new Error("No image provided.");
    error.statusCode = 422;
    throw error;
  }

  let fileUrl = req.file.path.replace(/\\/g, "/");
  const news = new News({
    title: req.body.title,
    content: req.body.content,
    imageUrl: fileUrl,
  });
  news
    .save()
    .then((result) => {
      io.getIO().emit("news", { action: "create", news: news });
      res.status(201).json({
        message: "News created successfully!",
        news: news,
      });
    })
    .catch((err) => {
      if (!err.statusCode) {
        err.statusCode = 500;
      }
      next(err);
    });
};

exports.getMessage = (req, res, next) => {
  const newsId = req.params.newsId;
  News.findById(newsId)
    .then((news) => {
      if (!news) {
        const error = new Error("Cannot find news");
        error.statusCode = 404;
        throw error;
      }
      res.status(200).json({ message: "News fetched.", news: news });
    })
    .catch((err) => {
      if (!err.statusCode) {
        err.statusCode = 500;
      }
      next(err);
    });
};

exports.updateMessage = (req, res, next) => {
  const newsId = req.params.newsId;
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
  News.findById(newsId)
    .then((news) => {
      if (!news) {
        const error = new Error("Could not find news.");
        error.statusCode = 404;
        throw error;
      }
      if (imageUrl !== news.imageUrl) {
        clearImage(news.imageUrl);
      }
      news.title = title;
      news.imageUrl = imageUrl;
      news.content = content;
      return news.save();
    })
    .then((result) => {
      io.getIO().emit("news", { action: "update", news: result });
      res.status(200).json({ message: "News updated!", news: result });
    })
    .catch((err) => {
      if (!err.statusCode) {
        err.statusCode = 500;
      }
      next(err);
    });
};

exports.deleteMessage = (req, res, next) => {
  const newsId = req.params.newsId;
  News.findById(newsId)
    .then((news) => {
      if (!news) {
        const error = new Error("Could not find news.");
        error.statusCode = 404;
        throw error;
      }
      clearImage(news.imageUrl);
      return News.findByIdAndRemove(newsId);
    })
    .then((result) => {
      io.getIO().emit("news", { action: "delete", news: newsId });
      res.status(200).json({ message: "News Deleted." });
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
