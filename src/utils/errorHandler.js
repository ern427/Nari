const logger = require("./logger");

const handleError = (error, origin = "Unknown") => {
  const message = error instanceof Error ? error.stack || error.message : JSON.stringify(error);
  logger.error(`[${origin}] ${message}`);
};

const handleInteractionError = async (interaction, error) => {
  logger.error(error);

  if (interaction.replied || interaction.deferred) {
    return interaction.followUp({ content: "Bir hata oluştu. Lütfen daha sonra tekrar deneyin.", ephemeral: true });
  }

  return interaction.reply({ content: "Bir hata oluştu. Lütfen daha sonra tekrar deneyin.", ephemeral: true });
};

module.exports = {
  handleError,
  handleInteractionError,
};
