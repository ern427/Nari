const fs = require("fs");
const path = require("path");
const logger = require("../utils/logger");

const commandsPath = path.join(__dirname, "..", "commands");

const getCommandFiles = (directory) => {
  const entries = fs.readdirSync(directory, { withFileTypes: true });
  let files = [];

  for (const entry of entries) {
    const fullPath = path.join(directory, entry.name);

    if (entry.isDirectory()) {
      files = files.concat(getCommandFiles(fullPath));
    } else if (entry.isFile() && entry.name.endsWith(".js")) {
      files.push(fullPath);
    }
  }

  return files;
};

const loadCommands = (client) => {
  client.commands = client.commands || new Map();
  client.commandArray = [];

  const commandFiles = getCommandFiles(commandsPath);

  for (const filePath of commandFiles) {
    const command = require(filePath);

    if (!command.data || !command.execute) {
      logger.warn(`Komut yüklenemedi: ${filePath} (data veya execute eksik)`);
      continue;
    }

    client.commands.set(command.data.name, command);
    // Support both SlashCommandBuilder instances and plain data objects
    let commandJSON;
    try {
      if (typeof command.data.toJSON === "function") {
        commandJSON = command.data.toJSON();
      } else {
        commandJSON = {
          name: command.data.name,
          description: command.data.description || "No description",
          options: command.data.options || [],
        };
      }
    } catch (err) {
      logger.warn(`Komut JSON'a dönüştürülemedi: ${filePath} (${err.message})`);
      continue;
    }

    client.commandArray.push(commandJSON);
    logger.info(`Komut yüklendi: ${command.data.name}`);
  }
  // Rebuild commandArray from the commands map to avoid duplicate names
  client.commandArray = [];
  for (const [, cmd] of client.commands) {
    try {
      if (typeof cmd.data.toJSON === "function") {
        client.commandArray.push(cmd.data.toJSON());
      } else {
        client.commandArray.push({ name: cmd.data.name, description: cmd.data.description || "No description", options: cmd.data.options || [] });
      }
    } catch (err) {
      logger.warn(`Komut JSON'a dönüştürülemedi (rebuild): ${cmd.data.name} (${err.message})`);
    }
  }
};

module.exports = {
  loadCommands,
};
