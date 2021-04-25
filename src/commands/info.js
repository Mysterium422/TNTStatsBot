const Discord = require("discord.js");
const {randomChoice, embedFooter} = require("../util.js");

module.exports = {
	run: async (client, message, args) => {
		const botUsers = new Set();
		client.guilds.cache.forEach(guild => {
			guild.members.cache.forEach(member => {
				if (!member.user.bot) botUsers.add(member.user.id);
			});
		});

		const embed = new Discord.MessageEmbed();
		embed.setColor("#3bcc71");
		embed.setAuthor(`${message.author.tag}`, `https://cdn.discordapp.com/avatars/${message.author.id}/${message.author.avatar}?size=128`);
		embed.setTitle("Bot Information");
		embed.setThumbnail(`https://cdn.discordapp.com/avatars/${client.user.id}/${client.user.avatar}.png?size=256`);
		embed.setTimestamp().setFooter(randomChoice(embedFooter.text), embedFooter.image.green);
		embed.setDescription(
			[
				"**Version:** " + require("../../package.json").version,
				"**Creator:** Mysterium#5229",
				"**Rewritten By:** Lebster#0617",
				"",
				"**Total Guilds:** " + client.guilds.cache.size,
				"**Total Unique Users:** " + botUsers.size
			].join("\n")
		);

		return message.channel.send(embed);
	},
	aliases: [
		"information"
	]
};
