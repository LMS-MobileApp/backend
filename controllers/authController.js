// import jwt from "jsonwebtoken";
// import User from "../models/User.js";
// import { config } from "../config.js";

// const register = async (req, res) => {
//   const { name, email, password, course, batch, regNo, role } = req.body;

//   try {
//     let user = await User.findOne({ email });
//     if (user) {
//       return res.status(400).json({ message: "User already exists" });
//     }

//     user = new User({ name, email, password, course, batch, regNo, role });
//     await user.save();

//     const token = jwt.sign({ id: user._id }, config.JWT_SECRET, { expiresIn: "1h" });
//     res.status(201).json({ token });
//   } catch (err) {
//     console.error("Register Error:", err);
//     res.status(500).json({ message: "Server error" });
//   }
// };

// const login = async (req, res) => {
//   const { email, password } = req.body;

//   try {
//     const user = await User.findOne({ email });
//     if (!user || !(await user.matchPassword(password))) {
//       return res.status(401).json({ message: "Invalid credentials" });
//     }

//     const token = jwt.sign({ id: user._id }, config.JWT_SECRET, { expiresIn: "1h" });
//     res.json({ token });
//   } catch (err) {
//     console.error("Login Error:", err);
//     res.status(500).json({ message: "Server error" });
//   }
// };

// const getProfile = async (req, res) => {
//   res.json(req.user);
// };

// const updateProfile = async (req, res) => {
//   const { name, email, course, batch, regNo } = req.body;

//   try {
//     const user = await User.findById(req.user._id);
//     if (!user) {
//       return res.status(404).json({ message: "User not found" });
//     }

//     user.name = name || user.name;
//     user.email = email || user.email;
//     user.course = course || user.course;
//     user.batch = batch || user.batch;
//     user.regNo = regNo || user.regNo;

//     await user.save();
//     res.json(user);
//   } catch (err) {
//     console.error("Update Profile Error:", err);
//     res.status(500).json({ message: "Server error" });
//   }
// };

// export { register, login, getProfile, updateProfile };


import jwt from "jsonwebtoken";
import User from "../models/User.js";
import { config } from "../config.js";

const register = async (req, res) => {
  const { name, email, password, course, batch, regNo, role } = req.body;

  try {
    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ message: "User already exists" });
    }

    user = new User({ name, email, password, course, batch, regNo, role });
    await user.save();

    const token = jwt.sign({ id: user._id, role: user.role }, config.JWT_SECRET, { expiresIn: "1h" });
    res.status(201).json({ token, role: user.role });
  } catch (err) {
    console.error("Register Error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

const login = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user || !(await user.matchPassword(password))) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const token = jwt.sign({ id: user._id, role: user.role }, config.JWT_SECRET, { expiresIn: "1h" });
    res.json({ token, role: user.role });
  } catch (err) {
    console.error("Login Error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

const getProfile = async (req, res) => {
  res.json(req.user);
};

const updateProfile = async (req, res) => {
  const { name, email, course, batch, regNo } = req.body;

  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    user.name = name || user.name;
    user.email = email || user.email;
    user.course = course || user.course;
    user.batch = batch || user.batch;
    user.regNo = regNo || user.regNo;

    await user.save();
    res.json(user);
  } catch (err) {
    console.error("Update Profile Error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

export { register, login, getProfile, updateProfile };