const express = require("express");
const multer = require("multer");
const { v4: uuidv4 } = require("uuid");
const fs = require("fs");
const path = require("path");
const xlsx = require("xlsx");

require("dotenv").config();

const userFilePath = "users.xlsx";

function loadUsers() {
  const workbook = xlsx.readFile(userFilePath);
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  const users = xlsx.utils.sheet_to_json(sheet);
  return users;
}

function writeUsers(users) {
  const sheet = xlsx.utils.json_to_sheet(users);
  const workbook = xlsx.utils.book_new();
  xlsx.utils.book_append_sheet(workbook, sheet, "Users");
  xlsx.writeFile(workbook, userFilePath);
}

const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Creating a new User - http://localhost:3000/users - POST
app.post("/users", (req, res) => {
  const user = req.body;
  user.id = uuidv4();
  user.profile = null;

  const users = loadUsers();
  users.push(user);

  writeUsers(users);
  res.status(201).json(user);
});

// Get all users
app.get("/users", (req, res) => {
  const users = loadUsers();
  res.status(200).json(users);
});

// Get User by ID
app.get("/users/:id", (req, res) => {
  const users = loadUsers();

  const user = users.find((user) => user.id === req.params.id);

  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }

  res.status(200).json(user);
});

// Update User by ID
app.patch("/users/:id", (req, res) => {
  const users = loadUsers();

  const userIndex = users.findIndex((user) => user.id === req.params.id);

  if (userIndex === -1) {
    return res.status(404).json({ message: "User not found" });
  }

  const updatedUser = { ...users[userIndex], ...req.body };
  users[userIndex] = updatedUser;

  writeUsers(users);
  res.status(200).json(updatedUser);
});

// Delete a user by Id
app.delete("/users/:id", (req, res) => {
  const users = loadUsers();

  const userIndex = users.findIndex((user) => user.id === req.params.id);

  if (userIndex === -1) {
    return res.status(404).json({ message: "User not found" });
  }

  users.splice(userIndex, 1);

  writeUsers(users);
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
  const users = loadUsers();

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

  writeStream.on("finish", () => {
    user.profile = profileName;
    users[userIndex] = user;

    writeUsers(users);
    res.status(200).json(user);
  });

  writeStream.on("error", (err) => {
    console.log(err);
    res
      .status(500)
      .json({ message: "An error occurred while uploading photo" });
  });

  writeStream.write(profile.buffer);
  writeStream.end();
});

// Get all profiles
app.get("/profiles", (req, res) => {
  const users = loadUsers();

  const profiles = users.map((user) => {
    return {
      id: user.id,
      profile: user.profile,
    };
  });

  res.status(200).json(profiles);
});

// Update User photo
app.patch("/users/:id/profile", upload.single("profile"), (req, res) => {
  const users = loadUsers();

  const userIndex = users.findIndex((user) => user.id === req.params.id);

  if (userIndex === -1) {
    return res.status(404).json({ message: "User not found" });
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

  writeStream.on("finish", () => {
    // Delete old photo if it exists
    if (user.profile) {
      fs.unlink(path.join(__dirname, "uploads", user.profile), (err) => {
        if (err) {
          console.log(err);
        }
      });
    }
    user.profile = profileName;
    users[userIndex] = user;

    writeUsers(users);
    res.status(200).json(user);
  });

  writeStream.on("error", (err) => {
    console.log(err);
    return res
      .status(500)
      .json({ message: "An error occurred while uploading photo" });
  });

  writeStream.write(profile.buffer);
  writeStream.end();
});

// Get User Profile Photo by ID
app.get("/users/:id/profile", (req, res) => {
  const users = loadUsers();

  const user = users.find((user) => user.id === req.params.id);

  console.log(user);

  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }

  if (user.profile === null) {
    return res.status(404).json({ message: "User profile not found" });
  }

  const readStream = fs.createReadStream(
    path.join(__dirname, "uploads", user.profile)
  );

  readStream.pipe(res);
});

// Delete User profile Photo by ID
app.delete("/users/:id/profile", (req, res) => {
  const users = loadUsers();

  const userIndex = users.findIndex((user) => user.id === req.params.id);

  if (userIndex === -1) {
    return res.status(404).json({ message: "User not found" });
  }

  const user = users[userIndex];

  if (!user.profile) {
    return res.status(404).json({ message: "User profile not found" });
  }

  fs.unlink(path.join(__dirname, "uploads", user.profile), (err) => {
    console.log(err);
  });

  user.profile = null;

  writeUsers(users);
  res.status(200).send();
});

// url - http://localhost:3000
app.listen(process.env.PORT, () => {
  console.log(`Server has been started on Port ${process.env.PORT}`);
});

// Excel file

// ID  Name  Email               Password
//  1  abhi  abhihsek@gmail.com  124

// [
//   {
//     id: 1,
//     name: "abhi",
//     email: "abhishek@gmail.com",
//     password: 124,
//   },
//   {
//     id: 2,
//     name: "abhi",
//     email: "abhishek@gmail.com",
//     password: 124,
//   },
// ];
