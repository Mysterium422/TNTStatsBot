// @ts-check
"use strict";
const strings = require("./strings.js"),
	Discord = require("discord.js");
const {getRank, defaultTo, hypixelFetch, GAMES, parseUser, getUUIDFromDiscord, getMentioned, embedFooter, GAMES_READABLE, randomChoice, avatarOf, ratio, formatMinutes, formatSeconds} = require("./util.js");

/**
 * Parse stats arguments
 * @param {Discord.Message} message Message containing the command
 * @param {String[]} args Args array
 * @param {import("./db").ConfiguredChannelRow} channelConfig Configuration object for the channel
 * @returns {Promise<{success: false, error: [String, String]} | {success: true, uuid: String, game: String, error?: undefined}>} Parsed arguments
 */
const parseStatsArgs = async (message, args, channelConfig) => {
	let uuid = null,
		game = null;

	let gameFirst = args[0] in GAMES;

	if (args.length === 0 || (args.length === 1 && gameFirst)) {
		uuid = await getUUIDFromDiscord(message.author.id);
		if (uuid === null) return {success: false, error: ["Discord account not verified", strings.unverified(channelConfig.prefix)]};
	} else if ((args.length === 1 && !gameFirst) || args.length === 2) {
		let argPos = args.length === 1 ? 0 : gameFirst ? 1 : 0;
		const user = await parseUser(args[argPos], getMentioned(message));
		// @ts-ignore
		if (!user.success) return user;
		uuid = user.uuid;
	}

	if (args.length === 0) {
		game = channelConfig.game;
	} else if (args.length === 1) {
		game = gameFirst ? GAMES[args[0]] : channelConfig.game;
	} else if (args.length === 2) {
		game = gameFirst ? GAMES[args[0]] : GAMES[args[1]];
	}

	return {success: true, uuid, game};
};

/**
 * Fetch a the stats of a Minecraft player
 * @param {string} uuid Minecraft UUID
 * @returns {Promise<{success: false, error: [String, String], user?: undefined} | {success: true, user: Object, error?: undefined}>} Fetched statistics
 */
const fetchStats = async uuid => {
	const data = await hypixelFetch("player?uuid=" + uuid);
	if (data === null) {
		return {
			success: false,
			error: ["Failed to reach Hypixel API", "Hypixel could be offline?"]
		};
	} else if (!data.success) {
		return {
			success: false,
			error: ["Something went wrong", data.cause]
		};
	} else if (data.player === null) {
		return {
			success: false,
			error: ["Invalid playername/uuid", "That player has never logged on to Hypixel!"]
		};
	} else if (!("TNTGames" in data.player.stats)) {
		return {
			success: false,
			error: ["Invalid playername/uuid", "That player has never played TNT Games!"]
		};
	}

	return {success: true, user: data};
};

/**
 * Convert JSON to a HypixelStats object
 * @param {Object} json JSON to convert
 * @param {Object} json.info Required property
 * @param {Object} json.stats Required property
 * @param {Object} json.ratios Required property
 * @returns {HypixelStats | null} Converted statistics
 */
const fromJSON = json => {
	if (json === null) return null;

	const result = new HypixelStats(null);
	result.info = json.info;
	result.stats = json.stats;
	result.ratios = json.ratios;
	return result;
};

class HypixelStats {
	/**
	 * Represents a Hypixel Statistics for a specific player
	 * @param {Object | null} data Data to construct from
	 */
	constructor(data) {
		if (data === null) return;

		this.info = {
			uuid: data.uuid,
			displayname: data.displayname,
			rank: getRank(data),
			timestamp: Date.now()
		};

		this.stats = {
			run: {
				record: defaultTo(data.stats.TNTGames.record_tntrun, 0),
				wins: defaultTo(data.stats.TNTGames.wins_tntrun, 0),
				deaths: defaultTo(data.stats.TNTGames.deaths_tntrun, 0),
				potions: defaultTo(data.stats.TNTGames.run_potions_splashed_on_players, 0),
				blocks: defaultTo(data.achievements.tntgames_block_runner, 0) // FIXME: data.achievements can be undefined (try /set Notch)
			},
			pvp: {
				record: defaultTo(data.stats.TNTGames.record_pvprun, 0),
				wins: defaultTo(data.stats.TNTGames.wins_pvprun, 0),
				deaths: defaultTo(data.stats.TNTGames.deaths_pvprun, 0),
				kills: defaultTo(data.stats.TNTGames.kills_pvprun, 0)
			},
			bowspleef: {
				wins: defaultTo(data.stats.TNTGames.wins_bowspleef, 0),
				deaths: defaultTo(data.stats.TNTGames.deaths_bowspleef, 0),
				shots: defaultTo(data.stats.TNTGames.tags_bowspleef, 0),
				kills: defaultTo(data.stats.TNTGames.kills_bowspleef, 0)
			},
			tag: {
				wins: defaultTo(data.stats.TNTGames.wins_tntag, 0),
				kills: defaultTo(data.stats.TNTGames.kills_tntag, 0),
				tags: defaultTo(data.achievements.tntgames_clinic, 0)
			},
			wizards: {
				wins: defaultTo(data.stats.TNTGames.wins_capture, 0),
				assists: defaultTo(data.stats.TNTGames.assists_capture, 0),
				deaths: defaultTo(data.stats.TNTGames.deaths_capture, 0),
				points: defaultTo(data.stats.TNTGames.points_capture, 0),
				totalkills: defaultTo(data.stats.TNTGames.kills_capture, 0),
				airtime: defaultTo(data.stats.TNTGames.air_time_capture, 0)
			},
			kills: {
				fire: defaultTo(data.stats.TNTGames.new_firewizard_kills, 0),
				ice: defaultTo(data.stats.TNTGames.new_icewizard_kills, 0),
				wither: defaultTo(data.stats.TNTGames.new_witherwizard_kills, 0),
				kinetic: defaultTo(data.stats.TNTGames.new_kineticwizard_kills, 0),
				blood: defaultTo(data.stats.TNTGames.new_bloodwizard_kills, 0),
				toxic: defaultTo(data.stats.TNTGames.new_toxicwizard_kills, 0),
				hydro: defaultTo(data.stats.TNTGames.new_hydrowizard_kills, 0),
				ancient: defaultTo(data.stats.TNTGames.new_ancientwizard_kills, 0),
				storm: defaultTo(data.stats.TNTGames.new_stormwizard_kills, 0)
			},
			all: {
				coins: defaultTo(data.stats.TNTGames.coins, 0),
				wins: defaultTo(data.stats.TNTGames.wins, 0),
				streak: defaultTo(data.stats.TNTGames.winstreak, 0),
				playtime: defaultTo(data.achievements.tntgames_tnt_triathlon, 0)
			},
			duels: {
				wins: 0,
				deaths: 0,
				losses: 0,
				shots: 0,
				bestWS: 0,
				currentWS: 0
			}
		};

		this.ratios = null;

		// TODO: Same check for TNTGames stats
		if (typeof data.stats.Duels !== "undefined") {
			this.stats.duels = {
				wins: defaultTo(data.stats.Duels.bowspleef_duel_wins, 0),
				deaths: defaultTo(data.stats.Duels.bowspleef_duel_deaths, 0),
				losses: defaultTo(data.stats.Duels.bowspleef_duel_losses, 0),
				shots: defaultTo(data.stats.Duels.bowspleef_duel_bow_shots, 0),
				bestWS: defaultTo(data.stats.Duels.best_tnt_games_winstreak, 0),
				currentWS: defaultTo(data.stats.Duels.current_tnt_games_winstreak, 0)
			};
		}
	}

	/**
	 * Get the difference between a pair of stats
	 * @param {HypixelStats} other Other statistics
	 * @returns {HypixelStats}
	 */
	getDifference(other) {
		if (other === null) return this;

		const result = new HypixelStats(null);
		// @ts-ignore
		result.stats = {};
		result.info = this.info;

		if (this.ratios === null) this.setRatios();
		if (other.ratios === null) other.setRatios();

		for (const categoryName in this.stats) {
			result.stats[categoryName] = {};
			for (const statName in this.stats[categoryName]) {
				result.stats[categoryName][statName] = this.stats[categoryName][statName] - other.stats[categoryName][statName];
			}
		}

		result.ratios = null;
		return result;
	}

	setRatios() {
		this.ratios = {
			duels: {
				WL: ratio(this.stats.duels.wins, this.stats.duels.losses)
			},
			wizards: {
				KD: ratio(this.stats.wizards.totalkills, this.stats.wizards.deaths),
				KAD: ratio(this.stats.wizards.totalkills + this.stats.wizards.assists, this.stats.wizards.deaths),
				KW: ratio(this.stats.wizards.totalkills, this.stats.wizards.wins)
			},
			tag: {
				TK: ratio(this.stats.tag.tags, this.stats.tag.kills),
				KW: ratio(this.stats.tag.kills, this.stats.tag.wins)
			},
			bowspleef: {
				WL: ratio(this.stats.bowspleef.wins, this.stats.bowspleef.deaths),
				KD: ratio(this.stats.bowspleef.kills, this.stats.bowspleef.deaths)
			},
			pvp: {
				WL: ratio(this.stats.pvp.wins, this.stats.pvp.deaths),
				KD: ratio(this.stats.pvp.kills, this.stats.pvp.deaths)
			},
			run: {
				WL: ratio(this.stats.run.wins, this.stats.run.deaths)
			}
		};

		return this;
	}

	unsetRatios() {
		this.ratios = null;
		return this;
	}

	/**
	 * Converts this HypixelStats object to a Discord embed
	 * @param {Object} params
	 * @param {HypixelStats=} params.previous
	 * @param {String} params.game
	 * @param {Discord.User} params.author
	 * @param {import("./settings").UserSettings} params.settings
	 * @returns {Discord.MessageEmbed}
	 */
	toEmbed({game, author, settings, previous = this}) {
		if (previous === null) previous = this;
		if (this.ratios === null) this.setRatios();
		if (previous.ratios === null) previous.setRatios();

		const embed = new Discord.MessageEmbed();
		embed.setAuthor(author.tag, avatarOf(author));
		embed.setFooter(randomChoice(embedFooter.text), embedFooter.image.green);
		embed.setColor(this.info.rank.color);
		embed.setURL(`https://plancke.io/hypixel/player/stats/${this.info.displayname}`);
		embed.setThumbnail(`https://visage.surgeplay.com/head/128/${this.info.uuid}`);
		embed.setTimestamp();
		embed.setTitle(`${this.info.displayname} | ${GAMES_READABLE[game]} Statistics`);

		const display = (A, B, formatter = n => n.toLocaleString()) => formatter(A) + (A === B ? "" : ` (${A > B ? "+" : ""}${formatter(A - B)})`);

		switch (game) {
			case GAMES.all:
				embed.addField("**Coins**", display(this.stats.all.coins, previous.stats.all.coins), true);
				embed.addField("**Wins**", display(this.stats.all.wins, previous.stats.all.wins), true);
				embed.addField("**Playtime**", display(this.stats.all.playtime, previous.stats.all.playtime, formatMinutes), true);
				embed.addField("**TNT Tag Wins**", display(this.stats.tag.wins, previous.stats.tag.wins), true);
				embed.addField("**TNT Run Record**", display(this.stats.run.record, previous.stats.run.record), true);
				embed.addField("**TNT Run Wins**", display(this.stats.run.wins, previous.stats.run.wins), true);
				embed.addField("**Bowspleef Wins**", display(this.stats.bowspleef.wins, previous.stats.bowspleef.wins), true);
				embed.addField("**PvP Run Kills**", display(this.stats.pvp.kills, previous.stats.pvp.kills), true);
				embed.addField("**PvP Run Wins**", display(this.stats.pvp.wins, previous.stats.pvp.wins), true);
				embed.addField("**Wizards Wins**", display(this.stats.wizards.wins, previous.stats.wizards.wins), true);
				embed.addField("**Wizards Kills**", display(this.stats.wizards.totalkills, previous.stats.wizards.totalkills), true);
				embed.addField("**Wizards Points**", display(this.stats.wizards.points, previous.stats.wizards.points), true);
				return embed;
			case GAMES.run:
				embed.addField("**Record**", display(this.stats.run.record, previous.stats.run.record, formatSeconds), true);
				embed.addField("**Wins**", display(this.stats.run.wins, previous.stats.run.wins), true);
				embed.addField("**Deaths**", display(this.stats.run.deaths, previous.stats.run.deaths), true);
				embed.addField("**Potions Thrown**", display(this.stats.run.potions, previous.stats.run.potions), true);
				embed.addField("**W/L Ratio**", display(this.ratios.run.WL, previous.ratios.run.WL), true);
				embed.addField("**Blocks Broken**", display(this.stats.run.blocks, previous.stats.run.blocks), true);
				return embed;
			case GAMES.pvp:
				embed.addField("**Record**", display(this.stats.pvp.record, previous.stats.pvp.record, formatSeconds), true);
				embed.addField("**Wins**", display(this.stats.pvp.wins, previous.stats.pvp.wins), true);
				embed.addField("**Deaths**", display(this.stats.pvp.deaths, previous.stats.pvp.deaths), true);
				embed.addField("**Kills**", display(this.stats.pvp.kills, previous.stats.pvp.kills), true);
				embed.addField("**W/L Ratio**", display(this.ratios.pvp.WL, previous.ratios.pvp.WL), true);
				embed.addField("**K/D Ratio**", display(this.ratios.pvp.KD, previous.ratios.pvp.KD), true);
				return embed;
			case GAMES.bow:
				embed.addField("**Wins**", display(this.stats.bowspleef.wins, previous.stats.bowspleef.wins), true);
				embed.addField("**Deaths**", display(this.stats.bowspleef.deaths, previous.stats.bowspleef.deaths), true);
				embed.addField("**Kills**", display(this.stats.bowspleef.kills, previous.stats.bowspleef.kills), true);
				embed.addField("**Shots**", display(this.stats.bowspleef.shots, previous.stats.bowspleef.shots), true);
				embed.addField("**W/L Ratio**", display(this.ratios.bowspleef.WL, previous.ratios.bowspleef.WL), true);
				embed.addField("**K/D Ratio**", display(this.ratios.bowspleef.KD, previous.ratios.bowspleef.KD), true);
				return embed;
			case GAMES.tag:
				embed.addField("**Wins**", display(this.stats.tag.wins, previous.stats.tag.wins), true);
				embed.addField("**Kills**", display(this.stats.tag.kills, previous.stats.tag.kills), true);
				embed.addField("**Tags**", display(this.stats.tag.tags, previous.stats.tag.tags), true);
				embed.addField("**T/K Ratio**", display(this.ratios.tag.TK, previous.ratios.tag.TK), true);
				embed.addField("**K/W Ratio**", display(this.ratios.tag.KW, previous.ratios.tag.KW), true);
				return embed;
			case GAMES.wizards:
				embed.addField("**Wins**", display(this.stats.wizards.wins, previous.stats.wizards.wins), true);
				embed.addField("**Deaths**", display(this.stats.wizards.deaths, previous.stats.wizards.deaths), true);
				embed.addField("**Kills**", display(this.stats.wizards.totalkills, previous.stats.wizards.totalkills), true);
				embed.addField("**Assists**", display(this.stats.wizards.assists, previous.stats.wizards.assists), true);
				embed.addField("**Points**", display(this.stats.wizards.points, previous.stats.wizards.points), true);
				embed.addField("**K/D Ratio**", display(this.ratios.wizards.KD, previous.ratios.wizards.KD), true);
				if (!settings.verbose) return embed;

				embed.addField("**Airtime**", display(this.stats.wizards.airtime, previous.stats.wizards.airtime, t => formatSeconds(t / 20)), true);
				embed.addField("**KA/D Ratio**", display(this.ratios.wizards.KAD, previous.ratios.wizards.KAD), true);
				embed.addField("**K/W Ratio**", display(this.ratios.wizards.KW, previous.ratios.wizards.KW), true);
			// Intentional fallthrough
			case GAMES.kills:
				embed.addField("**Fire**", display(this.stats.kills.fire, previous.stats.kills.fire), true);
				embed.addField("**Ice**", display(this.stats.kills.ice, previous.stats.kills.ice), true);
				embed.addField("**Wither**", display(this.stats.kills.wither, previous.stats.kills.wither), true);
				embed.addField("**Kinetic**", display(this.stats.kills.kinetic, previous.stats.kills.kinetic), true);
				embed.addField("**Blood**", display(this.stats.kills.blood, previous.stats.kills.blood), true);
				embed.addField("**Toxic**", display(this.stats.kills.toxic, previous.stats.kills.toxic), true);
				embed.addField("**Hydro**", display(this.stats.kills.hydro, previous.stats.kills.hydro), true);
				embed.addField("**Ancient**", display(this.stats.kills.ancient, previous.stats.kills.ancient), true);
				embed.addField("**Storm**", display(this.stats.kills.storm, previous.stats.kills.storm), true);
				if (game !== GAMES.wizards) {
					embed.setDescription("**Total Kills**: " + display(this.stats.wizards.totalkills, previous.stats.wizards.totalkills));
				}
				
				return embed;
			case GAMES.duels:
				embed.addField("**Wins**", display(this.stats.duels.wins, previous.stats.duels.wins), true);
				embed.addField("**Losses**", display(this.stats.duels.losses, previous.stats.duels.losses), true);
				embed.addField("**Shots**", display(this.stats.duels.shots, previous.stats.duels.shots), true);
				embed.addField("**W/L Ratio**", display(this.ratios.duels.WL, previous.ratios.duels.WL), true);
				embed.addField("**Current WS**", display(this.stats.duels.currentWS, previous.stats.duels.currentWS), true);
				embed.addField("**Best WS**", display(this.stats.duels.bestWS, previous.stats.duels.bestWS), true);
				return embed;
			case null:
				embed.setDescription("No game was provided.");
				return embed;
		}

		return embed;
	}
}

module.exports = {
	HypixelStats,
	fetchStats,
	parseStatsArgs,
	fromJSON
};
