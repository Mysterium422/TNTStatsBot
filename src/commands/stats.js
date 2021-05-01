const db = require("../db");
const {errorEmbed, randomChoice, embedFooter, getMentioned, mojangUUIDFetch, getStats, hypixelToStandard, getAvatar, formatMinutes, GAMES_READABLE} = require("../util.js");
const Discord = require("discord.js");

module.exports = {
	run: async (client, message, args) => {
		let uuid = null;
		const handler = async discord => {
			const rows = await db.select(db.TABLES.VerifiedUsers, {discord});
			if (rows.length === 0) return null;
			// TODO: Inform of multiple linked accounts?
			return rows[0].uuid;
		};

		const getStatsEmbed = (stats, game) => {
			const embed = new Discord.MessageEmbed();
			embed.setAuthor(message.author.tag, getAvatar(message.author));
			embed.setFooter(randomChoice(embedFooter.text), embedFooter.image.green);
			embed.setColor("#0099ff");
			embed.setURL(`https://plancke.io/hypixel/player/stats/${stats.info.displayname}`);
			embed.setThumbnail(`https://visage.surgeplay.com/head/128/${stats.info.uuid}`);
			embed.setTimestamp();

			embed.setTitle(`${stats.info.displayname} | ${GAMES_READABLE[game]} Statistics`);
			embed.addField("**Coins**", stats.overall.coins.toLocaleString(), true);
			embed.addField("**Wins**", stats.overall.wins.toLocaleString(), true);
			embed.addField("**Playtime**", formatMinutes(stats.overall.playtime), true);

			embed.addField("**TNT Tag Wins**", stats.tag.wins.toLocaleString(), true);
			embed.addField("**TNT Run Record**", stats.run.record.toLocaleString(), true);
			embed.addField("**TNT Run Wins**", stats.run.wins.toLocaleString(), true);
			embed.addField("**Bowspleef Wins**", stats.bowspleef.wins.toLocaleString(), true);
			embed.addField("**PvP Run Kills**", stats.pvp.kills.toLocaleString(), true);
			embed.addField("**PvP Run Wins**", stats.pvp.wins.toLocaleString(), true);
			embed.addField("**Wizards Wins**", stats.wizards.wins.toLocaleString(), true);
			embed.addField("**Wizards Kills**", stats.wizards.kills.total.toLocaleString(), true);
			embed.addField("**Wizards Points**", stats.wizards.points.toLocaleString(), true);

			return embed;
		};

		if (args.length === 0) {
			const uuid = await handler(message.author.id);
			if (uuid === null) {
				return message.channel.send(errorEmbed("Invalid account", "You do not have a linked Hypixel account!"));
			}

			const data = await getStats(uuid);
			if (!data.success) return message.channel.send(errorEmbed(...data.error));

			const channelConfig = await db.select(db.TABLES.ConfiguredChannels, {
				guild: message.guild.id,
				channel: message.channel.id
			});

			const embed = getStatsEmbed(hypixelToStandard(data.user.player), channelConfig[0].game);
			return message.channel.send(embed);
		}
	},
	aliases: []
};
