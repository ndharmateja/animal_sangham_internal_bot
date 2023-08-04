import { Telegraf } from "telegraf";
import { require } from "./utils/utils.js";
import { TELEGRAM_BOT_TOKEN } from "./utils/config.js";
import { documentHandler } from "./handlers/command_handlers.js";
const { message } = require("telegraf/filters");

// Create bot
const bot = new Telegraf(TELEGRAM_BOT_TOKEN);

// Handle document messages
bot.on(message("document"), documentHandler);

// Polling
await bot.launch();
