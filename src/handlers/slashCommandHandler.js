const logger = require("../utils/logger");

const registerSlashCommands = async (client) => {
  if (!client || !client.application) {
    logger.warn("Slash komutlar kaydedilemedi: Client uygulama bilgisi kullanılabilir değil.");
    return;
  }

  try {
    await client.application.commands.set(client.commandArray);
    logger.info(`${client.commandArray.length} slash komut başarıyla kaydedildi.`);
  } catch (error) {
    logger.error(`Slash komut kaydı sırasında hata oluştu: ${error.message || error}`);
  }
};

module.exports = {
  registerSlashCommands,
};
