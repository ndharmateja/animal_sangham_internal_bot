import { Telegraf } from "telegraf";
import { require } from "./utils/utils.js";
import { TELEGRAM_BOT_TOKEN } from "./utils/config.js";
import { documentHandler, startHandler } from "./handlers/command_handlers.js";
const { message } = require("telegraf/filters");

// Create bot
const bot = new Telegraf(TELEGRAM_BOT_TOKEN);

// Commands
bot.start(startHandler);

// Text messages
bot.on(message("text"), startHandler);

// Handle document messages
bot.on(message("document"), documentHandler);

// Remaining kinds of messages
bot.on("message", startHandler);

// Polling
await bot.launch();
