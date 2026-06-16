const { EmbedBuilder } = require("discord.js");

module.exports = {
  data: {
    name: "avatar",
    description: "Bir kullanıcının avatarını gösterir.",
    options: [
      {
        name: "kullanici",
        type: 6,
        description: "Avatarını görmek istediğin kullanıcı.",
        required: false,
      },
    ],
  },
  async execute(interaction) {
    const user = interaction.options.getUser("kullanici") || interaction.user;
    const avatarUrl = user.displayAvatarURL({ dynamic: true, size: 1024 });

    const embed = new EmbedBuilder()
      .setColor("#0099ff")
      .setTitle(`${user.username} kullanıcısının avatarı`)
      .setImage(avatarUrl)
      .setFooter({ text: `ID: ${user.id}` })
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  },
};
