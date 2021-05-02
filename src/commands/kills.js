const {
	errorEmbed,
	getUUIDFromDiscord,
	parseUser,
	getMentioned,
	getStats,
	hypixelToStandard,
	getAvatar,
	randomChoice,
	embedFooter
} = require("../util.js");

const Discord = require("discord.js"),
	  strings = require("../strings.js");

module.exports = {
	run: async ({message, args}) => {
		let uuid = null;
		if (args.length === 0) {
			uuid = await getUUIDFromDiscord(message.author.id);
			if (uuid === null) return message.channel.send(errorEmbed("Discord account not linked", strings.unlinked));
		} else if (args.length === 1) {
			const user = await parseUser(arg[0], getMentioned(message));
			if (!user.success) return message.channel.send(...user.error);
			uuid = user.uuid;
		}

		const data = await getStats(uuid);
		if (!data.success) return message.channel.send(errorEmbed(...data.error));

		/**
		 * @type {import("../util").HypixelStats}
		*/
		const stats = hypixelToStandard(data.user.player);
		const embed = new Discord.MessageEmbed();
		embed.setAuthor(message.author.tag, getAvatar(message.author));
		embed.setFooter(randomChoice(embedFooter.text), embedFooter.image.green);
		// TODO: Based on user's rank
		embed.setColor("#0099ff");
		embed.setTitle(`${stats.info.displayname} | Wizards Kills`);
		embed.setURL(`https://www.plotzes.ml/stats/${stats.info.displayname}`);
		embed.setThumbnail(`https://visage.surgeplay.com/head/128/${stats.info.uuid}`);
		embed.setTimestamp();
		
		// TODO: Recording system
		embed.addField("**Fire**", stats.wizards.kills.fire.toLocaleString(), true);
		embed.addField("**Ice**", stats.wizards.kills.ice.toLocaleString(), true);
		embed.addField("**Wither**", stats.wizards.kills.wither.toLocaleString(), true);
		embed.addField("**Kinetic**", stats.wizards.kills.kinetic.toLocaleString(), true);
		embed.addField("**Blood**", stats.wizards.kills.blood.toLocaleString(), true);
		embed.addField("**Toxic**", stats.wizards.kills.toxic.toLocaleString(), true);
		embed.addField("**Hydro**", stats.wizards.kills.hydro.toLocaleString(), true);
		embed.addField("**Ancient**", stats.wizards.kills.ancient.toLocaleString(), true);
		embed.addField("**Storm**", stats.wizards.kills.storm.toLocaleString(), true);
		embed.setDescription("**Total Kills**: " + stats.wizards.kills.total.toLocaleString());

		return message.channel.send(embed);

	},
	aliases: [],
	requiresConfiguredChannel: true
};
