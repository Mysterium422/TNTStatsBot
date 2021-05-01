const db = require("../db");
const {errorEmbed, randomChoice, embedFooter, getMentioned, mojangUUIDFetch, getStats, hypixelToStandard, getAvatar, formatMinutes, GAMES_READABLE, formatSeconds} = require("../util.js");
const Discord = require("discord.js");

module.exports = {
	run: async ({message, args}) => {
		let uuid = null;
		const handler = async discord => {
			const rows = await db.select(db.TABLES.VerifiedUsers, {discord});
			if (rows.length === 0) return null;
			// TODO: Inform of multiple linked accounts?
			return rows[0].uuid;
		};

		/**
		 * Get the stats embed
		 * @param {import("../util").HypixelStats} stats The statistics
		 * @param {string} game Game type
		 * @returns Embed to send to user
		 */
		const getStatsEmbed = (stats, game) => {
			const embed = new Discord.MessageEmbed();
			embed.setAuthor(message.author.tag, getAvatar(message.author));
			embed.setFooter(randomChoice(embedFooter.text), embedFooter.image.green);
			embed.setColor("#0099ff");
			embed.setURL(`https://plancke.io/hypixel/player/stats/${stats.info.displayname}`);
			embed.setThumbnail(`https://visage.surgeplay.com/head/128/${stats.info.uuid}`);
			embed.setTimestamp();
			embed.setTitle(`${stats.info.displayname} | ${GAMES_READABLE[game]} Statistics`);

			switch (game) {
				case "all":
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
				case "run":
					embed.addField("**Record**", formatSeconds(stats.run.record), true);
					embed.addField("**Wins**", stats.run.wins.toLocaleString(), true);
					embed.addField("**Deaths**", stats.run.deaths.toLocaleString(), true);
					embed.addField("**Potions Thrown**", stats.run.potions.toLocaleString(), true);
					embed.addField("**W/L Ratio**", stats.run.WL.toLocaleString(), true);
					embed.addField("**Blocks Broken**", stats.run.blocks.toLocaleString(), true);
					return embed;
				case "pvp":
					embed.addField("**Record**", formatSeconds(stats.run.record), true);
					embed.addField("**Wins**", stats.pvp.wins.toLocaleString(), true);
					embed.addField("**Deaths**", stats.pvp.deaths.toLocaleString(), true);
					embed.addField("**Kills**", stats.pvp.kills.toLocaleString(), true);
					embed.addField("**W/L Ratio**", stats.pvp.WL.toLocaleString(), true);
					embed.addField("**K/D Ratio**", stats.pvp.KD.toLocaleString(), true);
					return embed;
			}
			

		};

		if (args.length === 0) {
			const uuid = await handler(message.author.id);
			if (uuid === null) {
				return message.channel.send(errorEmbed("Invalid account", "You do not have a linked Hypixel account!"));
			}

			const data = await getStats(uuid);
			if (!data.success) return message.channel.send(errorEmbed(...data.error));
			const channelConfig = await db.getChannelInfo(message);			
			return message.channel.send(getStatsEmbed(hypixelToStandard(data.user.player), channelConfig.game));
		}
	},
	aliases: [],
	requiresConfiguredChannel: true
};
