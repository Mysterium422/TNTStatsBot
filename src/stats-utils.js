// @ts-check
"use strict";
const strings = require("./strings.js"),
	Discord = require("discord.js");
const {
		getRank,
		defaultTo,
		hypixelFetch,
		GAMES,
		parseUser,
		getUUIDFromDiscord,
		getMentioned,
		embedFooter,
		GAMES_READABLE,
		randomChoice,
		avatarOf
} = require("./util.js");

/**
 * Parse stats arguments
 * @param {import("discord.js").Message} message Message containing the command
 * @param {string[]} args Args array
 * @param {object} channelConfig Configuration object for the channel
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

class HypixelStats {
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
				blocks: defaultTo(data.achievements.tntgames_block_runner, 0)
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
			overall: {
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

	getDifference(other) {
		if (other === null) return this;
		
		const result = new HypixelStats(null);
		// @ts-ignore
		result.stats = {};
		result.info = this.info;

		for (const categoryName in this.stats) {
			result.stats[categoryName] = {};
			for (const statName in this.stats[categoryName]) {
				result.stats[categoryName][statName] = this.stats[categoryName][statName] - other.stats[categoryName][statName];
			}
		}

		result.setRatios();
		return result;
	}

	setRatios() {}

	toEmbed(game, author, settings) {
		const embed = new Discord.MessageEmbed();
		embed.setAuthor(author.tag, avatarOf(author));
		embed.setFooter(randomChoice(embedFooter.text), embedFooter.image.green);
		embed.setColor(this.info.rank.color);
		embed.setURL(`https://plancke.io/hypixel/player/stats/${this.info.displayname}`);
		embed.setThumbnail(`https://visage.surgeplay.com/head/128/${this.info.uuid}`);
		embed.setTimestamp();
		embed.setTitle(`${this.info.displayname} | ${GAMES_READABLE[game]} Statistics`);
		embed.setDescription("Work in progress!");

		return embed;
	}
}

module.exports = {
	HypixelStats,
	fetchStats,
	parseStatsArgs
};
