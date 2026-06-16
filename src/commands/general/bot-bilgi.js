const { EmbedBuilder } = require("discord.js");
const os = require("os");

module.exports = {
  data: {
    name: "bot-bilgi",
    description: "Bot hakkında teknik bilgiler gösterir.",
  },
  async execute(interaction) {
    const client = interaction.client;
    const uptime = Math.floor(client.uptime / 1000);
    const memory = process.memoryUsage().heapUsed / 1024 / 1024;

    const embed = new EmbedBuilder()
      .setColor("#FFD700")
      .setTitle("Bot Bilgisi")
      .addFields(
        { name: "Ping", value: `${client.ws.ping}ms`, inline: true },
        { name: "Uptime", value: `<t:${Math.floor(Date.now() / 1000 - uptime)}:R>`, inline: true },
        { name: "RAM Kullanımı", value: `${memory.toFixed(2)} MB`, inline: true },
        { name: "Discord.js Sürümü", value: `${require("discord.js").version}`, inline: true },
        { name: "Node.js Sürümü", value: `${process.version}`, inline: true },
        { name: "Sunucu Sayısı", value: `${client.guilds.cache.size}`, inline: true },
      )
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  },
};
