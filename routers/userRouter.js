const express = require("express");
const multer = require("multer");

const userController = require("../controllers/userController");

const router = express.Router();

// Creating Multer Storage
const storage = multer.memoryStorage();

// Creating Multer Upload Middleware
const upload = multer({
  storage,
  limits: {
    fileSize: 1024 * 1024 * 5, // 5MB
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Invalid File Type"));
    }
  },
});

router
  .route("/users")
  .post(userController.createUser)
  .get(userController.getAllUsers);

router
  .route("/users/:id")
  .get(userController.getUserById)
  .patch(userController.updateUserById)
  .delete(userController.deleteUserById);

router
  .route("/users/:id/profile")
  .post(upload.single("profile"), userController.uploadUserProfile)
  .patch(upload.single("profile"), userController.updateUserPhoto)
  .get(userController.getUserProfileById)
  .delete(userController.deleteUserProfileById);

router.route("/profiles").get(userController.getAllProfile);

module.exports = router;
