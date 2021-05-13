const {
	errorEmbed,
	randomChoice,
	embedFooter,
	getMentioned,
	getUUIDFromDiscord,
	parseUser,
	getStats,
	hypixelToStandard,
	getAvatar,
	formatMinutes,
	GAMES_READABLE,
	formatSeconds,
	GAMES,
	display,
} = require("../util.js");

const Discord = require("discord.js"),
	strings = require("../strings.js"),
	db = require("../db"),
	{saveStats, getCache} = require("../cache.js");

module.exports = {
	run: async ({message, args}) => {
		/**
		 * Get the stats embed
		 * @param {import("../util").HypixelStats} stats The statistics
		 * @param {string} game Game type
		 * @returns Embed to send to user
		 */
		const getStatsEmbed = (stats, previous, game) => {
			const embed = new Discord.MessageEmbed();
			embed.setAuthor(message.author.tag, getAvatar(message.author));
			embed.setFooter(randomChoice(embedFooter.text), embedFooter.image.green);
			embed.setColor("#0099ff"); // TODO: Based on user's rank
			embed.setURL(`https://plancke.io/hypixel/player/stats/${stats.info.displayname}`);
			embed.setThumbnail(`https://visage.surgeplay.com/head/128/${stats.info.uuid}`);
			embed.setTimestamp();
			embed.setTitle(`${stats.info.displayname} | ${GAMES_READABLE[game]} Statistics`);

			switch (game) {
				case "all":
					embed.addField("**Coins**",          display("overall.coins",       stats, previous), true);
					embed.addField("**Wins**",           display("overall.wins",        stats, previous), true);
					embed.addField("**Playtime**",       display("overall.playtime",    stats, previous, formatMinutes), true);
					embed.addField("**TNT Tag Wins**",   display("tag.wins",            stats, previous), true);
					embed.addField("**TNT Run Record**", display("run.record",          stats, previous), true);
					embed.addField("**TNT Run Wins**",   display("run.wins",            stats, previous), true);
					embed.addField("**Bowspleef Wins**", display("bowspleef.wins",      stats, previous), true);
					embed.addField("**PvP Run Kills**",  display("pvp.kills",           stats, previous), true);
					embed.addField("**PvP Run Wins**",   display("pvp.wins",            stats, previous), true);
					embed.addField("**Wizards Wins**",   display("wizards.wins",        stats, previous), true);
					embed.addField("**Wizards Kills**",  display("wizards.kills.total", stats, previous), true);
					embed.addField("**Wizards Points**", display("wizards.points",      stats, previous), true);
					return embed;
				case "run":
					embed.addField("**Record**",         display("run.record",          stats, previous, formatSeconds), true);
					embed.addField("**Wins**",           display("run.wins",            stats, previous), true);
					embed.addField("**Deaths**",         display("run.deaths",          stats, previous), true);
					embed.addField("**Potions Thrown**", display("run.potions",         stats, previous), true);
					embed.addField("**W/L Ratio**",      display("run.WL",              stats, previous), true);
					embed.addField("**Blocks Broken**",  display("run.blocks",          stats, previous), true);
					return embed;
				case "pvp":
					embed.addField("**Record**",         display("pvp.record",          stats, previous, formatSeconds), true);
					embed.addField("**Wins**",           display("pvp.wins",            stats, previous), true);
					embed.addField("**Deaths**",         display("pvp.deaths",          stats, previous), true);
					embed.addField("**Kills**",          display("pvp.kills",           stats, previous), true);
					embed.addField("**W/L Ratio**",      display("pvp.WL",              stats, previous), true);
					embed.addField("**K/D Ratio**",      display("pvp.KD",              stats, previous), true);
					return embed;
				case "bowspleef":
					embed.addField("**Wins**",           display("bowspleef.wins",      stats, previous), true);
					embed.addField("**Deaths**",         display("bowspleef.deaths",    stats, previous), true);
					embed.addField("**Kills**",          display("bowspleef.kills",     stats, previous), true);
					embed.addField("**Shots**",          display("bowspleef.shots",     stats, previous), true);
					embed.addField("**W/L Ratio**",      display("bowspleef.WL",        stats, previous), true);
					return embed;
				case "tag":
					embed.addField("**Wins**",           display("tag.wins",            stats, previous), true);
					embed.addField("**Kills**",          display("tag.kills",           stats, previous), true);
					embed.addField("**Tags**",           display("tag.tags",            stats, previous), true);
					embed.addField("**T/K Ratio**",      display("tag.TK",              stats, previous), true);
					embed.addField("**K/W Ratio**",      display("tag.KW",              stats, previous), true);
					return embed;
				case "wizards":
					// TODO: Airtime, KA/D Ratio, K/W Ratio, Kills with each class (verbose only)
					embed.addField("**Wins**",           display("wizards.wins",        stats, previous), true);
					embed.addField("**Deaths**",         display("wizards.deaths",      stats, previous), true);
					embed.addField("**Kills**", stats.   display("wizards.kills.total", stats, previous), true);
					embed.addField("**Assists**",        display("wizards.assists",     stats, previous), true);
					embed.addField("**Points**",         display("wizards.points",      stats, previous), true);
					embed.addField("**K/D Ratio**",      display("wizards.KD",          stats, previous), true);
					return embed;
				case "duels":
					embed.addField("**Wins**",           display("duels.wins",          stats, previous), true);
					embed.addField("**Losses**",         display("duels.losses",        stats, previous), true);
					embed.addField("**Shots**",          display("duels.shots",         stats, previous), true);
					embed.addField("**W/L Ratio**",      display("duels.WL",            stats, previous), true);
					embed.addField("**Current WS**",     display("duels.currentWS",     stats, previous), true);
					embed.addField("**Best WS**",        display("duels.bestWS",        stats, previous), true);
					return embed;
				case null:
					embed.setDescription("No game was provided.");
					return embed;
			}
		};

		let uuid = null,
			game = null;

		if (args.length === 1 && args[0] in GAMES) {
			game = GAMES[args[0]];
		} else if (args.length === 2) {
			if (args[1] in GAMES) {
				game = GAMES[args[1]];
			} else {
				return message.channel.send(errorEmbed("Invalid game type", strings.invalid_game_type));
			}
		} else {
			const channelConfig = await db.getChannelInfo(message);
			game = channelConfig.game;
		}

		if (args.length > 2) {
			return message.channel.send(errorEmbed("Too many arguments!"));
		} else if (args.length === 0 || (args.length === 1 && args[0] in GAMES)) {
			uuid = await getUUIDFromDiscord(message.author.id);
			if (uuid === null) return message.channel.send(errorEmbed("Discord account not linked", strings.unlinked));
		} else if (args.length === 2 || (args.length === 1 && !(args[0] in GAMES))) {
			const user = await parseUser(args[0], getMentioned(message));
			if (!user.success) return message.channel.send(errorEmbed(...user.error));
			uuid = user.uuid;
		}

		const data = await getStats(uuid);
		if (!data.success) return message.channel.send(errorEmbed(...data.error));

		const stats = hypixelToStandard(data.user.player);
		const previous = await getCache(message.author.id, uuid);
		await saveStats(message.author.id, uuid, stats);

		return message.channel.send(getStatsEmbed(stats, previous, game));
	},
	aliases: [],
	requiresConfiguredChannel: true
};
