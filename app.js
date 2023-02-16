const express = require("express");
const multer = require("multer");
const { v4: uuidv4 } = require("uuid");
const fs = require("fs");
const path = require("path");

require("dotenv").config();

let users = [];

const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Creating a new User - http://localhost:3000/users - POST
app.post("/users", (req, res) => {
  const user = req.body;
  user.id = uuidv4();
  user.profile = null;

  users.push(user);

  res.status(201).json(user);
});

// Get all users
app.get("/users", (req, res) => {
  res.status(200).json(users);
});

// Get User by ID
app.get("/users/:id", (req, res) => {
  const user = users.find((user) => user.id === req.params.id);

  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }

  res.status(200).json(user);
});

// Update User by ID
app.patch("/users/:id", (req, res) => {
  const userIndex = users.findIndex((user) => user.id === req.params.id);

  if (userIndex === -1) {
    return res.status(404).json({ message: "User not found" });
  }

  const updatedUser = { ...users[userIndex], ...req.body };
  users[userIndex] = updatedUser;

  res.status(200).json(updatedUser);
});

// Delete a user by Id
app.delete("/users/:id", (req, res) => {
  const userIndex = users.findIndex((user) => user.id === req.params.id);

  if (userIndex === -1) {
    return res.status(404).json({ message: "User not found" });
  }

  users.splice(userIndex, 1);
  res.status(204).send();
});

// Upload a user's profile photo
const storage = multer.memoryStorage();

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

app.post("/users/:id/profile", upload.single("profile"), (req, res) => {
  const userIndex = users.findIndex((user) => user.id === req.params.id);

  if (userIndex === -1) {
    return res.status(404).json({ message: "User not Found" });
  }

  const user = users[userIndex];
  const profile = req.file;

  if (!profile) {
    return res.status(400).json({ message: "Profile Photo Required" });
  }

  const profileName = `${user.id}-${profile.originalname}`;
  const writeStream = fs.createWriteStream(
    path.join(__dirname, "uploads", profileName)
  );

  writeStream.write(profile.buffer, (err) => {
    console.log(profile.buffer);
    console.log(err);
    return res
      .status(500)
      .json({ message: "An error occurred while uploading photo" });
  });

  user.profile = profileName;
  res.status(200).json(user);
});

// url - http://localhost:3000
app.listen(process.env.PORT, () => {
  console.log(`Server has been started on Port ${process.env.PORT}`);
});
