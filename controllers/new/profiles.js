const fs = require("fs");
const path = require("path");

const { validationResult } = require("express-validator");

const io = require("../../socket");
const Profile = require("../../models/new/profile");
const User = require("../../models/user");

exports.getProfiles = async (req, res, next) => {
  const currentPage = req.query.page || 1;
  const perPage = 12;
  try {
    const totalItems = await Profile.find().countDocuments();
    const profiles = await Profile.find()
      .sort({ createdAt: -1 })
      .skip((currentPage - 1) * perPage)
      .limit(perPage);
    res.status(200).json({
      message: "Fetched profiles successfully.",
      profiles: profiles,
      totalItems: totalItems,
    });
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};

exports.getProfilesByCenter = async (req, res, next) => {
  const centerId = req.query.centerId;
  console.log(req);
  try {
    const profiles = await Profile.find({})
      .where("centerId")
      .equals(centerId)
      .sort({ createdAt: -1 });
    res.status(200).json({
      message: "Fetched profiles successfully.",
      profiles: profiles,
    });
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};

exports.createProfile = (req, res, next) => {
  const errors = validationResult(req);
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
  const profile = new Profile({
    email: req.body.email,
    password: req.body.password,
    firstName: req.body.firstName,
    lastName: req.body.lastName,
    status: req.body.status,
    available: req.body.available,
    centerId: req.body.centerId,
    phone: req.body.phone,
    location: req.body.location,
    imageUrl: fileUrl,
  });
  profile
    .save()
    .then((result) => {
      io.getIO().emit("profiles", { action: "create", profile: profile });
      res.status(201).json({
        message: "Profile created successfully!",
        profile: profile,
      });
    })
    .catch((err) => {
      if (!err.statusCode) {
        err.statusCode = 500;
      }
      next(err);
    });
};

exports.getProfileById = (req, res, next) => {
  const profileId = req.body.profileId;
  Profile.findById(profileId)
    .then((profile) => {
      if (!profile) {
        const error = new Error("Cannot find profile");
        error.statusCode = 404;
        throw error;
      }
      res.status(200).json({ message: "Profile fetched.", profile: profile });
    })
    .catch((err) => {
      if (!err.statusCode) {
        err.statusCode = 500;
      }
      next(err);
    });
};

exports.updateProfile = (req, res, next) => {
  const profileId = req.params.profileId;
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

  Profile.findById(profileId)
    .then((profile) => {
      if (!profile) {
        const error = new Error("Could not find profile.");
        error.statusCode = 404;
        throw error;
      }
      if (imageUrl !== profile.imageUrl) {
        clearImage(profile.imageUrl);
      }
      profile.title = title;
      profile.imageUrl = imageUrl;
      profile.content = content;
      return profile.save();
    })
    .then((result) => {
      io.getIO().emit("profiles", { action: "update", profile: result });
      res.status(200).json({ message: "Profile updated!", profile: result });
    })
    .catch((err) => {
      if (!err.statusCode) {
        err.statusCode = 500;
      }
      next(err);
    });
};

exports.deleteProfile = (req, res, next) => {
  const profileId = req.params.profileId;
  Profile.findById(profileId)
    .then((profile) => {
      if (!profile) {
        const error = new Error("Could not find profile.");
        error.statusCode = 404;
        throw error;
      }
      clearImage(profile.imageUrl);
      return Profile.findByIdAndRemove(profileId);
    })
    .then((result) => {
      io.getIO().emit("profiles", { action: "delete", profile: profileId });
      res.status(200).json({ message: "Profile Deleted." });
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
