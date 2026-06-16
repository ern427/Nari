require("dotenv").config();
const path = require("path");
const { Client, Collection, GatewayIntentBits, Partials } = require("discord.js");
const { loadCommands } = require("./src/handlers/commandHandler");
const { loadEvents } = require("./src/handlers/eventHandler");
const { db } = require("./src/database/sqlite");
const logger = require("./src/utils/logger");
const { handleError } = require("./src/utils/errorHandler");

const token = process.env.TOKEN;
const clientId = process.env.CLIENT_ID;
const databasePath = process.env.DATABASE_PATH || path.join(__dirname, "src", "database", "database.sqlite");

if (!token || !clientId) {
  logger.error("Lütfen .env dosyanızda TOKEN ve CLIENT_ID değerlerini doldurun.");
  process.exit(1);
}

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.DirectMessages,
  ],
  partials: [Partials.Channel, Partials.Message, Partials.GuildMember],
});

client.logger = logger;
client.db = db;
client.commands = new Collection();
client.commandArray = [];
client.databasePath = databasePath;

loadCommands(client);
loadEvents(client);

process.on("unhandledRejection", (reason) => handleError(reason, "unhandledRejection"));
process.on("uncaughtException", (error) => handleError(error, "uncaughtException"));
process.on("uncaughtExceptionMonitor", (error) => handleError(error, "uncaughtExceptionMonitor"));

client.login(token).catch((error) => {
  logger.error("Bot giriş yaparken bir hata oluştu:", error);
  process.exit(1);
});
