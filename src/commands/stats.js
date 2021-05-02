const db = require("../db");
const {errorEmbed, randomChoice, embedFooter, getMentioned, mojangUUIDFetch, getStats, hypixelToStandard, getAvatar, formatMinutes, GAMES_READABLE, formatSeconds} = require("../util.js");
const Discord = require("discord.js");

module.exports = {
	run: async ({message, args}) => {
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
				case "bowspleef":
					embed.addField("**Wins**", stats.bowspleef.wins.toLocaleString(), true);
					embed.addField("**Deaths**", stats.bowspleef.deaths.toLocaleString(), true);
					embed.addField("**Kills**", stats.bowspleef.kills.toLocaleString(), true);
					embed.addField("**Shots**", stats.bowspleef.shots.toLocaleString(), true);
					embed.addField("**W/L Ratio**", stats.bowspleef.WL.toLocaleString(), true);
					return embed;
				case "tag":
					embed.addField("**Wins**", stats.tag.wins.toLocaleString(), true);
					embed.addField("**Kills**", stats.tag.kills.toLocaleString(), true);
					embed.addField("**Tags**", stats.tag.tags.toLocaleString(), true);
					embed.addField("**T/K Ratio**", stats.tag.TK.toLocaleString(), true);
					embed.addField("**K/W Ratio**", stats.tag.KW.toLocaleString(), true);
					return embed;
				case "wizards":
					// TODO: Airtime, KA/D Ratio, K/W Ratio, Kills with each class (verbose only)
					embed.addField("**Wins**", stats.wizards.wins.toLocaleString(), true);
					embed.addField("**Deaths**", stats.wizards.deaths.toLocaleString(), true);
					embed.addField("**Kills**", stats.wizards.kills.total.toLocaleString(), true);
					embed.addField("**Assists**", stats.wizards.assists.toLocaleString(), true);
					embed.addField("**Points**", stats.wizards.points.toLocaleString(), true);
					embed.addField("**K/D Ratio**", stats.wizards.KD.toLocaleString(), true);
					return embed;
				case "duels":
					embed.addField("**Wins**", stats.duels.wins.toLocaleString(), true);
					embed.addField("**Losses**", stats.duels.losses.toLocaleString(), true);
					embed.addField("**Shots**", stats.duels.shots.toLocaleString(), true);
					embed.addField("**W/L Ratio**", stats.duels.WL.toLocaleString(), true);
					embed.addField("**Current WS**", stats.duels.currentWS.toLocaleString(), true);
					embed.addField("**Best WS**", stats.duels.bestWS.toLocaleString(), true);
					return embed;
			}
			

		};

		let uuid = null,
			game = null;
	
		if (args.length > 2) {
			return message.channel.send(errorEmbed("Too many arguments", "Expected `[user]` or `[user], [game]`"));
		}
		
		if (args.length === 0 || args.length === 1) {
			const channelConfig = await db.getChannelInfo(message);
			game = channelConfig.game;
		} else if (args.length === 2) {
			game = args[2];
		}

		if (args.length === 0) {
			uuid = await handler(message.author.id);
		} else if (args.length === 2 || args.length === 1) {
			// If nobody was mentioned...
			const mentioned = getMentioned(message);
			if (mentioned === null) {
				// If it's too short to be a UUID...
				if (uuid.length <= 16) {
					// Fetch the UUID from Mojang...
					const mojangResponse = await mojangUUIDFetch(uuid);
					if (mojangResponse === null) {
						// If the playername is invalid, show an error
						return message.channel.send(errorEmbed("Invalid playername", `Failed to fetch the UUID of '${uuid}' from the Mojang API`));
					} else {
						// Otherwise use the response from Mojang
						uuid = mojangResponse.id;
					}
				} else {
					// Otherwise, if it's long enough we can assume it's a UUID
					uuid = args[0];
				}
			}
			
			// The argument was a mention:
			else {
				// Get the UUID from the database...
				const row = await db.select(db.TABLES.VerifiedUsers, {discord: mentioned.id});
				if (row.length === 0) {
					return message.channel.send(errorEmbed("Invalid mention", "That user has not linked their account"));
				}

				uuid = row.uuid;
			}
		}

		// -------------- [ Get the Statistics ] --------------

		if (uuid === null) {
			return message.channel.send(errorEmbed("Invalid account", "You do not have a linked Hypixel account!"));
		}

		const data = await getStats(uuid);
		if (!data.success) return message.channel.send(errorEmbed(...data.error));
		return message.channel.send(getStatsEmbed(hypixelToStandard(data.user.player), game));
	},
	aliases: [],
	requiresConfiguredChannel: true
};
