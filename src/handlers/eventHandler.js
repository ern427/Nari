const fs = require("fs");
const path = require("path");
const logger = require("../utils/logger");

const eventsPath = path.join(__dirname, "..", "events");

const loadEvents = (client) => {
  const eventFiles = fs.readdirSync(eventsPath).filter((file) => file.endsWith(".js"));

  for (const file of eventFiles) {
    const filePath = path.join(eventsPath, file);
    const event = require(filePath);

    if (!event.name || !event.execute) {
      logger.warn(`Event yüklenemedi: ${file} (name veya execute eksik)`);
      continue;
    }

    if (event.once) {
      client.once(event.name, (...args) => event.execute(...args));
    } else {
      client.on(event.name, (...args) => event.execute(...args));
    }

    logger.info(`Event yüklendi: ${event.name}`);
  }
};

module.exports = {
  loadEvents,
};
