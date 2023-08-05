const express = require("express");
const { User } = require("../models");
const { checkAuth } = require("../middleware/auth");
const db = require("../models");

const user = express.Router();

user.post("/create-account", async (req, res) => {
  try {
    const { username, email } = req.body;
    let user = await User.findOne({ where: { email } });
    if (user) {
      return user;
    } else {
      const newUser = await User.create({ email, username });
      return newUser;
    }
  } catch (e) {
    res.status(500).json({
      success: false,
      message: e,
    });
  }
});

user.post("/create-room", checkAuth, async (req, res) => {
  const { room } = req.body;
  try {
    const newRoom = await db.Room.create({ title: room, user_id: req.user.id });

    return res.status(200).json({
      success: true,
      message: "Room Created",
      data: newRoom,
    });
  } catch (e) {
    return res.status(500).json({
      success: false,
      message: "server error",
      error: e,
    });
  }
});

user.get("/get-rooms", checkAuth, async (req, res) => {
  const { id } = req.user;
  try {
    const rooms = await db.Room.findAll({
      where: {
        user_id: id,
      },
      order: [["id", "desc"]],
    });

    return res.status(200).json({
      success: true,
      message: "Rooms",
      data: rooms,
    });
  } catch (e) {
    return res.status(500).json({
      success: false,
      message: "server error",
      error: e,
    });
  }
});

user.get("/chat", checkAuth, async (req, res) => {
  const { room_id } = req.query;
  try {
    const chats = await db.Chat.findAll({
      where: {
        room_id,
      },
      order: [["id", "asc"]],
    });

    return res.status(200).json({
      success: true,
      message: "chat",
      data: chats,
    });
  } catch (e) {
    console.log(e)
    return res.status(500).json({
      success: false,
      message: "server error",
      error: e,
    });
  }
});


module.exports = user;
