const { EmbedBuilder } = require("discord.js");

module.exports = {
  data: {
    name: "ping",
    description: "Botun gecikmesini gösterir.",
  },
  async execute(interaction) {
    const sent = await interaction.reply({ content: "Pong! Hesaplanıyor...", fetchReply: true });
    const latency = sent.createdTimestamp - interaction.createdTimestamp;
    const embed = new EmbedBuilder()
      .setColor("#57F287")
      .setTitle("Pong!")
      .setDescription(`Bot gecikmesi: **${latency}ms**`)
      .setTimestamp();

    await interaction.editReply({ content: null, embeds: [embed] });
  },
};
