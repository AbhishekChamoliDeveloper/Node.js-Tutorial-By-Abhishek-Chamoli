const { v4: uuidv4 } = require("uuid");
const fs = require("fs");
const path = require("path");

const utils = require("../utility/utils");

exports.createUser = async (req, res) => {
  const user = req.body;
  user.id = uuidv4();
  user.profile = null;

  const users = utils.loadUsers();
  users.push(user);

  utils.writeUsers(users);
  res.status(201).json(user);
};

exports.getAllUsers = async (req, res) => {
  const users = utils.loadUsers();
  res.status(200).json(users);
};

exports.getUserById = async (req, res) => {
  const users = utils.loadUsers();

  const user = users.find((user) => user.id === req.params.id);

  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }

  res.status(200).json(user);
};

exports.updateUserById = async (req, res) => {
  const users = utils.loadUsers();

  const userIndex = users.findIndex((user) => user.id === req.params.id);

  if (userIndex === -1) {
    return res.status(404).json({ message: "User not found" });
  }

  const updatedUser = { ...users[userIndex], ...req.body };
  users[userIndex] = updatedUser;

  utils.writeUsers(users);
  res.status(200).json(updatedUser);
};

exports.deleteUserById = async (req, res) => {
  const users = utils.loadUsers();

  const userIndex = users.findIndex((user) => user.id === req.params.id);

  if (userIndex === -1) {
    return res.status(404).json({ message: "User not found" });
  }

  users.splice(userIndex, 1);

  utils.writeUsers(users);
  res.status(204).send();
};

exports.uploadUserProfile = async (req, res) => {
  const users = utils.loadUsers();

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

    utils.writeUsers(users);
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
};

exports.getAllProfile = async (req, res) => {
  const users = utils.loadUsers();

  const profiles = users.map((user) => {
    return {
      id: user.id,
      profile: user.profile,
    };
  });

  res.status(200).json(profiles);
};

exports.updateUserPhoto = async (req, res) => {
  const users = utils.loadUsers();

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

    utils.writeUsers(users);
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
};

exports.getUserProfileById = async (req, res) => {
  const users = utils.loadUsers();

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
};

exports.deleteUserProfileById = async (req, res) => {
  const users = utils.loadUsers();

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

  utils.writeUsers(users);
  res.status(200).send();
};
