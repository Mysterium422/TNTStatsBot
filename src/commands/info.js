const {successEmbed} = require("../util.js");

module.exports = {
	run: async (client, message, args) => {
		const botUsers = new Set();
		client.guilds.cache.forEach(guild => {
			guild.members.cache.forEach(member => {
				if (!member.user.bot) botUsers.add(member.user.id);
			});
		});

		const embed = successEmbed(message.author, [
			"**Version:** " + require("../../package.json").version,
			"**Creator:** Mysterium#5229",
			"**Rewritten By:** Lebster#0617",
			"",
			"**Total Guilds:** " + client.guilds.cache.size,
			"**Total Unique Users:** " + botUsers.size
		].join("\n"), "Bot Information");

		return message.channel.send(embed);
	},
	aliases: ["information"]
};
