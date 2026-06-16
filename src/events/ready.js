const logger = require("../utils/logger");
const { registerSlashCommands } = require("../handlers/slashCommandHandler");

module.exports = {
  name: "ready",
  once: true,
  execute: async (client) => {
    if (!client.user) {
      logger.error("Bot kullanıcısı alınamadı.");
      return;
    }

    logger.info(`${client.user.tag} olarak giriş yapıldı.`);
    await registerSlashCommands(client);
    logger.info("Bot hazır ve komutlar yüklenmiş durumda.");
  },
};
