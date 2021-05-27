const {
	errorEmbed,
	getUUIDFromDiscord,
	parseUser,
	getMentioned,
	fetchStats,
	hypixelToStandard,
	avatarOf,
	randomChoice,
	embedFooter,
	display
} = require("../util.js");

const Discord = require("discord.js"),
	  strings = require("../strings.js");
const { getUserStats } = require("../cache.js");

module.exports = {
	run: async ({message, args}) => {
		// TODO: Merge with stats command
		let uuid = null;
		if (args.length === 0) {
			uuid = await getUUIDFromDiscord(message.author.id);
			if (uuid === null) return message.channel.send(errorEmbed("Discord account not linked", strings.unlinked));
		} else if (args.length === 1) {
			const user = await parseUser({arg: args[0], mentioned: getMentioned(message)});
			if (!user.success) return message.channel.send(...user.error);
			uuid = user.uuid;
		}

		const data = await fetchStats(uuid);
		if (!data.success) return message.channel.send(errorEmbed(...data.error));

		/**
		 * @type {import("../util").HypixelStats}
		*/
		const stats = hypixelToStandard(data.user.player);
		const previous = await getUserStats(message.author.id, uuid);

		const embed = new Discord.MessageEmbed();
		embed.setAuthor(message.author.tag, avatarOf(message.author));
		embed.setFooter(randomChoice(embedFooter.text), embedFooter.image.green);
		// TODO: Based on user's rank
		embed.setColor("#0099ff");
		embed.setTitle(`${stats.info.displayname} | Wizards Kills`);
		embed.setURL(`https://www.plotzes.ml/stats/${stats.info.displayname}`);
		embed.setThumbnail(`https://visage.surgeplay.com/head/128/${stats.info.uuid}`);
		embed.setTimestamp();
		
		// TODO: Recording system
		embed.addField("**Fire**",    display("wizards.kills.fire",    stats, previous), true);
		embed.addField("**Ice**",     display("wizards.kills.ice",     stats, previous), true);
		embed.addField("**Wither**",  display("wizards.kills.wither",  stats, previous), true);
		embed.addField("**Kinetic**", display("wizards.kills.kinetic", stats, previous), true);
		embed.addField("**Blood**",   display("wizards.kills.blood",   stats, previous), true);
		embed.addField("**Toxic**",   display("wizards.kills.toxic",   stats, previous), true);
		embed.addField("**Hydro**",   display("wizards.kills.hydro",   stats, previous), true);
		embed.addField("**Ancient**", display("wizards.kills.ancient", stats, previous), true);
		embed.addField("**Storm**",   display("wizards.kills.storm",   stats, previous), true);
		embed.setDescription("**Total Kills**: " + display("wizards.kills.total",   stats, previous));

		return message.channel.send(embed);

	},
	aliases: [],
	requiresConfiguredChannel: true
};
