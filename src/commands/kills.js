// @ts-check
"use strict";

const Discord = require("discord.js"),
	strings = require("../strings.js"),
	{getUserStats} = require("../cache.js"),
	{errorEmbed, getUUIDFromDiscord, parseUser, getMentioned, avatarOf, randomChoice, embedFooter} = require("../util"),
	{fetchStats, display, hypixelToStandard} = require("../stats-utils");

module.exports = {
	run: async ({message, args}) => {
		// TODO: Merge with stats command
		let uuid = null;
		if (args.length === 0) {
			uuid = await getUUIDFromDiscord(message.author.id);
			if (uuid === null) return message.channel.send(errorEmbed("Discord account not linked", strings.unlinked));
		} else if (args.length === 1) {
			const user = await parseUser(args[0], getMentioned(message));
			if (!user.success) return message.channel.send(...user.error);
			uuid = user.uuid;
		}

		const data = await fetchStats(uuid);
		if (!data.success) return message.channel.send(errorEmbed(...data.error));
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
		embed.addField("**Fire**", display("wizkills.fire", stats, previous), true);
		embed.addField("**Ice**", display("wizkills.ice", stats, previous), true);
		embed.addField("**Wither**", display("wizkills.wither", stats, previous), true);
		embed.addField("**Kinetic**", display("wizkills.kinetic", stats, previous), true);
		embed.addField("**Blood**", display("wizkills.blood", stats, previous), true);
		embed.addField("**Toxic**", display("wizkills.toxic", stats, previous), true);
		embed.addField("**Hydro**", display("wizkills.hydro", stats, previous), true);
		embed.addField("**Ancient**", display("wizkills.ancient", stats, previous), true);
		embed.addField("**Storm**", display("wizkills.storm", stats, previous), true);
		embed.setDescription("**Total Kills**: " + display("wizards.totalkills", stats, previous));

		return message.channel.send(embed);
	},
	aliases: [],
	requiresConfiguredChannel: true
};
