const { EmbedBuilder } = require("discord.js");

module.exports = {
  data: {
    name: "kullanici-bilgi",
    description: "Bir kullanıcı hakkında detaylı bilgi gösterir.",
    options: [
      {
        name: "kullanici",
        type: 6,
        description: "Bilgilerini görmek istediğin kullanıcı.",
        required: false,
      },
    ],
  },
  async execute(interaction) {
    const member = interaction.options.getMember("kullanici") || interaction.member;
    const user = member.user;
    const roles = member.roles.cache
      .filter((role) => role.id !== interaction.guild.id)
      .sort((a, b) => b.position - a.position)
      .map((role) => role.toString())
      .slice(0, 10);

    const embed = new EmbedBuilder()
      .setColor("#5865F2")
      .setTitle(`${user.tag} kullanıcısı hakkında bilgi`)
      .setThumbnail(user.displayAvatarURL({ dynamic: true, size: 512 }))
      .addFields(
        { name: "Kullanıcı Adı", value: `${user.tag}`, inline: true },
        { name: "ID", value: `${user.id}`, inline: true },
        { name: "Sunucuya Katılma", value: `${member.joinedAt.toLocaleString()}`, inline: true },
        { name: "Hesap Oluşturma", value: `${user.createdAt.toLocaleString()}`, inline: true },
        { name: "Bot mu?", value: `${user.bot ? "Evet" : "Hayır"}`, inline: true },
        { name: "Roller", value: roles.length ? roles.join(" ") : "Rol yok", inline: false },
      )
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  },
};
