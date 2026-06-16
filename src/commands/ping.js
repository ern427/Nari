const { SlashCommandBuilder } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("ping")
    .setDescription("Botun gecikmesini gösterir."),
  async execute(interaction) {
    const sent = await interaction.reply({ content: "Pong! Hesaplanıyor...", fetchReply: true });
    const latency = sent.createdTimestamp - interaction.createdTimestamp;
    await interaction.editReply(`Pong! Bot gecikmesi: ${latency}ms`);
  },
};
