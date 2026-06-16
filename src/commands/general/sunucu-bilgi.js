const { EmbedBuilder } = require("discord.js");

module.exports = {
  data: {
    name: "sunucu-bilgi",
    description: "Sunucu hakkında detaylı bilgi verir.",
  },
  async execute(interaction) {
    const guild = interaction.guild;
    const owner = await guild.fetchOwner();
    const channelCount = guild.channels.cache.size;
    const roleCount = guild.roles.cache.size;

    const embed = new EmbedBuilder()
      .setColor("#2F3136")
      .setTitle(`${guild.name} sunucu bilgileri`)
      .setThumbnail(guild.iconURL({ dynamic: true, size: 512 }))
      .addFields(
        { name: "Sunucu Adı", value: `${guild.name}`, inline: true },
        { name: "Sunucu ID", value: `${guild.id}`, inline: true },
        { name: "Kuruluş Tarihi", value: `${guild.createdAt.toLocaleString()}`, inline: false },
        { name: "Toplam Üye", value: `${guild.memberCount}`, inline: true },
        { name: "Kanal Sayısı", value: `${channelCount}`, inline: true },
        { name: "Rol Sayısı", value: `${roleCount}`, inline: true },
        { name: "Sunucu Sahibi", value: `${owner.user.tag}`, inline: false },
      )
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  },
};
