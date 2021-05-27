const {embedFooter, randomChoice, hypixelFetch, defaultTo, ratio, getMentioned, avatarOf, getRank, formatMinutes, formatSeconds, GAMES_READABLE, GAMES, getUUIDFromDiscord, parseUser} = require("./util");

const display = (pathStr, stats, previous, formatter = n => n.toLocaleString()) => {
	const path = pathStr.split(".");
	const statsValue = path.reduce((a, cv) => a[cv], stats);
	let result = formatter(statsValue);

	if (previous !== null) {
		const previousValue = path.reduce((a, cv) => a[cv], previous);
		if (statsValue < previousValue) {
			result += " (" + formatter(statsValue - previousValue) + ")";
		} else if (statsValue > previousValue) {
			result += " (+" + formatter(statsValue - previousValue) + ")";
		}
	}

	return result;
};

const createStatsEmbed = ({message, stats, previous, game}) => {
	const embed = new Discord.MessageEmbed();
	embed.setAuthor(message.author.tag, avatarOf(message.author));
	embed.setFooter(randomChoice(embedFooter.text), embedFooter.image.green);
	embed.setColor("#0099ff"); // TODO: Based on user's rank
	embed.setURL(`https://plancke.io/hypixel/player/stats/${stats.info.displayname}`);
	embed.setThumbnail(`https://visage.surgeplay.com/head/128/${stats.info.uuid}`);
	embed.setTimestamp();
	embed.setTitle(`${stats.info.displayname} | ${GAMES_READABLE[game]} Statistics`);

	switch (game) {
		case "all":
			embed.addField("**Coins**", display("overall.coins", stats, previous), true);
			embed.addField("**Wins**", display("overall.wins", stats, previous), true);
			embed.addField("**Playtime**", display("overall.playtime", stats, previous, formatMinutes), true);
			embed.addField("**TNT Tag Wins**", display("tag.wins", stats, previous), true);
			embed.addField("**TNT Run Record**", display("run.record", stats, previous), true);
			embed.addField("**TNT Run Wins**", display("run.wins", stats, previous), true);
			embed.addField("**Bowspleef Wins**", display("bowspleef.wins", stats, previous), true);
			embed.addField("**PvP Run Kills**", display("pvp.kills", stats, previous), true);
			embed.addField("**PvP Run Wins**", display("pvp.wins", stats, previous), true);
			embed.addField("**Wizards Wins**", display("wizards.wins", stats, previous), true);
			embed.addField("**Wizards Kills**", display("wizards.totalkills", stats, previous), true);
			embed.addField("**Wizards Points**", display("wizards.points", stats, previous), true);
			return embed;
		case "run":
			embed.addField("**Record**", display("run.record", stats, previous, formatSeconds), true);
			embed.addField("**Wins**", display("run.wins", stats, previous), true);
			embed.addField("**Deaths**", display("run.deaths", stats, previous), true);
			embed.addField("**Potions Thrown**", display("run.potions", stats, previous), true);
			embed.addField("**W/L Ratio**", display("ratio.run.WL", stats, previous), true);
			embed.addField("**Blocks Broken**", display("run.blocks", stats, previous), true);
			return embed;
		case "pvp":
			embed.addField("**Record**", display("pvp.record", stats, previous, formatSeconds), true);
			embed.addField("**Wins**", display("pvp.wins", stats, previous), true);
			embed.addField("**Deaths**", display("pvp.deaths", stats, previous), true);
			embed.addField("**Kills**", display("pvp.kills", stats, previous), true);
			embed.addField("**W/L Ratio**", display("ratio.pvp.WL", stats, previous), true);
			embed.addField("**K/D Ratio**", display("ratio.pvp.KD", stats, previous), true);
			return embed;
		case "bowspleef":
			embed.addField("**Wins**", display("bowspleef.wins", stats, previous), true);
			embed.addField("**Deaths**", display("bowspleef.deaths", stats, previous), true);
			embed.addField("**Kills**", display("bowspleef.kills", stats, previous), true);
			embed.addField("**Shots**", display("bowspleef.shots", stats, previous), true);
			embed.addField("**W/L Ratio**", display("ratio.bowspleef.WL", stats, previous), true);
			embed.addField("**K/D Ratio**", display("ratio.bowspleef.KD", stats, previous), true);
			return embed;
		case "tag":
			embed.addField("**Wins**", display("tag.wins", stats, previous), true);
			embed.addField("**Kills**", display("tag.kills", stats, previous), true);
			embed.addField("**Tags**", display("tag.tags", stats, previous), true);
			embed.addField("**T/K Ratio**", display("ratio.tag.TK", stats, previous), true);
			embed.addField("**K/W Ratio**", display("ratio.tag.KW", stats, previous), true);
			return embed;
		case "wizards":
			// TODO: Airtime, KA/D Ratio, K/W Ratio, Kills with each class (verbose only)
			embed.addField("**Wins**", display("wizards.wins", stats, previous), true);
			embed.addField("**Deaths**", display("wizards.deaths", stats, previous), true);
			embed.addField("**Kills**", display("wizards.totalkills", stats, previous), true);
			embed.addField("**Assists**", display("wizards.assists", stats, previous), true);
			embed.addField("**Points**", display("wizards.points", stats, previous), true);
			embed.addField("**K/D Ratio**", display("ratio.wizards.KD", stats, previous), true);
			return embed;
		case "duels":
			embed.addField("**Wins**", display("duels.wins", stats, previous), true);
			embed.addField("**Losses**", display("duels.losses", stats, previous), true);
			embed.addField("**Shots**", display("duels.shots", stats, previous), true);
			embed.addField("**W/L Ratio**", display("ratio.duels.WL", stats, previous), true);
			embed.addField("**Current WS**", display("duels.currentWS", stats, previous), true);
			embed.addField("**Best WS**", display("duels.bestWS", stats, previous), true);
			return embed;
		case null:
			embed.setDescription("No game was provided.");
			return embed;
	}
};

const createTimedEmbed = ({message, stats, previous, game, timeframe}) => {
	const embed = new Discord.MessageEmbed();
	embed.setAuthor(message.author.tag, avatarOf(message.author));
	embed.setFooter(randomChoice(embedFooter.text), embedFooter.image.green);
	embed.setColor("#0099ff"); // TODO: Based on user's rank
	embed.setURL(`https://plancke.io/hypixel/player/stats/${stats.info.displayname}`);
	embed.setThumbnail(`https://visage.surgeplay.com/head/128/${stats.info.uuid}`);
	embed.setTimestamp();
	embed.setTitle(`${stats.info.displayname} | ${GAMES_READABLE[game]} Statistics *[**${timeframe}**]*`);

	switch (game) {
		case "all":
			embed.addField("**Coins**", (stats.overall.coins - previous.overall.coins).toLocaleString(), true);
			embed.addField("**Wins**", (stats.overall.wins - previous.overall.wins).toLocaleString(), true);
			embed.addField("**Playtime**", (stats.overall.playtime - previous.overall.playtime).toLocaleString(), true);
			embed.addField("**TNT Tag Wins**", (stats.tag.wins - previous.tag.wins).toLocaleString(), true);
			embed.addField("**TNT Run Record**", (stats.run.record - previous.run.record).toLocaleString(), true);
			embed.addField("**TNT Run Wins**", (stats.run.wins - previous.run.wins).toLocaleString(), true);
			embed.addField("**Bowspleef Wins**", (stats.bowspleef.wins - previous.bowspleef.wins).toLocaleString(), true);
			embed.addField("**PvP Run Kills**", (stats.pvp.kills - previous.pvp.kills).toLocaleString(), true);
			embed.addField("**PvP Run Wins**", (stats.pvp.wins - previous.pvp.wins).toLocaleString(), true);
			embed.addField("**Wizards Wins**", (stats.wizards.wins - previous.wizards.wins).toLocaleString(), true);
			embed.addField("**Wizards Kills**", (stats.wizards.totalkills - previous.wizards.totalkills).toLocaleString(), true);
			embed.addField("**Wizards Points**", (stats.wizards.points - previous.wizards.points).toLocaleString(), true);
			return embed;
		case "run":
			embed.addField("**Record**", (stats.run.record - previous.run.record).toLocaleString(), true);
			embed.addField("**Wins**", (stats.run.wins - previous.run.wins).toLocaleString(), true);
			embed.addField("**Deaths**", (stats.run.deaths - previous.run.deaths).toLocaleString(), true);
			embed.addField("**Potions Thrown**", (stats.run.potions - previous.run.potions).toLocaleString(), true);
			embed.addField("**W/L Ratio**", (stats.ratio.run.WL - previous.ratio.run.WL).toLocaleString(), true);
			embed.addField("**Blocks Broken**", (stats.run.blocks - previous.run.blocks).toLocaleString(), true);
			return embed;
		case "pvp":
			embed.addField("**Record**", (stats.pvp.record - previous.pvp.record).toLocaleString(), true);
			embed.addField("**Wins**", (stats.pvp.wins - previous.pvp.wins).toLocaleString(), true);
			embed.addField("**Deaths**", (stats.pvp.deaths - previous.pvp.deaths).toLocaleString(), true);
			embed.addField("**Kills**", (stats.pvp.kills - previous.pvp.kills).toLocaleString(), true);
			embed.addField("**W/L Ratio**", (stats.ratio.pvp.WL - previous.ratio.pvp.WL).toLocaleString(), true);
			embed.addField("**K/D Ratio**", (stats.ratio.pvp.KD - previous.ratio.pvp.KD).toLocaleString(), true);
			return embed;
		case "bowspleef":
			embed.addField("**Wins**", (stats.bowspleef.wins - previous.bowspleef.wins).toLocaleString(), true);
			embed.addField("**Deaths**", (stats.bowspleef.deaths - previous.bowspleef.deaths).toLocaleString(), true);
			embed.addField("**Kills**", (stats.bowspleef.kills - previous.bowspleef.kills).toLocaleString(), true);
			embed.addField("**Shots**", (stats.bowspleef.shots - previous.bowspleef.shots).toLocaleString(), true);
			embed.addField("**W/L Ratio**", (stats.ratio.bowspleef.WL - previous.ratio.bowspleef.WL).toLocaleString(), true);
			embed.addField("**K/D Ratio**", (stats.ratio.bowspleef.KD - previous.ratio.bowspleef.KD).toLocaleString(), true);
			return embed;
		case "tag":
			embed.addField("**Wins**", (stats.tag.wins - previous.tag.wins).toLocaleString(), true);
			embed.addField("**Kills**", (stats.tag.kills - previous.tag.kills).toLocaleString(), true);
			embed.addField("**Tags**", (stats.tag.tags - previous.tag.tags).toLocaleString(), true);
			embed.addField("**T/K Ratio**", (stats.ratio.tag.TK - previous.ratio.tag.TK).toLocaleString(), true);
			embed.addField("**K/W Ratio**", (stats.ratio.tag.KW - previous.ratio.tag.KW).toLocaleString(), true);
			return embed;
		case "wizards":
			// TODO: Airtime, KA/D Ratio, K/W Ratio, Kills with each class (verbose only)
			embed.addField("**Wins**", (stats.wizards.wins - previous.wizards.wins).toLocaleString(), true);
			embed.addField("**Deaths**", (stats.wizards.deaths - previous.wizards.deaths).toLocaleString(), true);
			embed.addField("**Kills**", (stats.wizards.totalkills - previous.wizards.totalkills).toLocaleString(), true);
			embed.addField("**Assists**", (stats.wizards.assists - previous.wizards.assists).toLocaleString(), true);
			embed.addField("**Points**", (stats.wizards.points - previous.wizards.points).toLocaleString(), true);
			embed.addField("**K/D Ratio**", (stats.ratio.wizards.KD - previous.ratio.wizards.KD).toLocaleString(), true);
			return embed;
		case "duels":
			embed.addField("**Wins**", (stats.duels.wins - previous.duels.wins).toLocaleString(), true);
			embed.addField("**Losses**", (stats.duels.losses - previous.duels.losses).toLocaleString(), true);
			embed.addField("**Shots**", (stats.duels.shots - previous.duels.shots).toLocaleString(), true);
			embed.addField("**W/L Ratio**", (stats.ratio.duels.WL - previous.ratio.duels.WL).toLocaleString(), true);
			embed.addField("**Current WS**", (stats.duels.currentWS - previous.duels.currentWS).toLocaleString(), true);
			embed.addField("**Best WS**", (stats.duels.bestWS - previous.duels.bestWS).toLocaleString(), true);
			return embed;
		case null:
			embed.setDescription("No game was provided.");
			return embed;
	}
};

const parseStatsArgs = async (message, args, prefix) => {
	let uuid = null,
		game = null;

	if (args.length === 1 && args[0] in GAMES) {
		game = GAMES[args[0]];
	} else if (args.length === 2) {
		if (args[1] in GAMES) {
			game = GAMES[args[1]];
		} else {
			return {success: false, error: ["Invalid game type", strings.invalid_game_type]};
		}
	} else {
		const channelConfig = await db.getChannelInfo(message);
		game = channelConfig.game;
	}

	if (args.length > 2) {
		return {success: false, error: ["Too many arguments!"]};
	} else if (args.length === 0 || (args.length === 1 && args[0] in GAMES)) {
		uuid = await getUUIDFromDiscord(message.author.id);
		if (uuid === null) return {success: false, error: ["Discord account not verified", strings.unverified(prefix)]};
	} else if (args.length === 2 || (args.length === 1 && !(args[0] in GAMES))) {
		const user = await parseUser(args[0], getMentioned(message));
		if (!user.success) return user;
		uuid = user.uuid;
	}

	return {success: true, uuid, game};
};

const hypixelToStandard = D => {
	const TNT = D.stats.TNTGames,
		DUEL = D.stats.Duels;

	const result = {
		info: {
			uuid: D.uuid,
			displayname: D.displayname,
			rank: getRank(D),
			timestamp: Date.now()
		},
		run: {
			record: defaultTo(TNT.record_tntrun, 0),
			wins: defaultTo(TNT.wins_tntrun, 0),
			deaths: defaultTo(TNT.deaths_tntrun, 0),
			potions: defaultTo(TNT.run_potions_splashed_on_players, 0),
			blocks: defaultTo(D.achievements.tntgames_block_runner, 0)
		},
		pvp: {
			record: defaultTo(TNT.record_pvprun, 0),
			wins: defaultTo(TNT.wins_pvprun, 0),
			deaths: defaultTo(TNT.deaths_pvprun, 0),
			kills: defaultTo(TNT.kills_pvprun, 0)
		},
		bowspleef: {
			wins: defaultTo(TNT.wins_bowspleef, 0),
			deaths: defaultTo(TNT.deaths_bowspleef, 0),
			shots: defaultTo(TNT.tags_bowspleef, 0),
			kills: defaultTo(TNT.kills_bowspleef, 0)
		},
		tag: {
			wins: defaultTo(TNT.wins_tntag, 0),
			kills: defaultTo(TNT.kills_tntag, 0),
			tags: defaultTo(D.achievements.tntgames_clinic, 0)
		},
		wizards: {
			wins: defaultTo(TNT.wins_capture, 0),
			assists: defaultTo(TNT.assists_capture, 0),
			deaths: defaultTo(TNT.deaths_capture, 0),
			points: defaultTo(TNT.points_capture, 0),
			totalkills: defaultTo(TNT.kills_capture, 0),
			airtime: defaultTo(TNT.air_time_capture, 0)
		},
		wizkills: {
			fire: defaultTo(TNT.new_firewizard_kills, 0),
			ice: defaultTo(TNT.new_icewizard_kills, 0),
			wither: defaultTo(TNT.new_witherwizard_kills, 0),
			kinetic: defaultTo(TNT.new_kineticwizard_kills, 0),
			blood: defaultTo(TNT.new_bloodwizard_kills, 0),
			toxic: defaultTo(TNT.new_toxicwizard_kills, 0),
			hydro: defaultTo(TNT.new_hydrowizard_kills, 0),
			ancient: defaultTo(TNT.new_ancientwizard_kills, 0),
			storm: defaultTo(TNT.new_stormwizard_kills, 0)
		},
		overall: {
			coins: defaultTo(TNT.coins, 0),
			wins: defaultTo(TNT.wins, 0),
			streak: defaultTo(TNT.winstreak, 0),
			playtime: defaultTo(D.achievements.tntgames_tnt_triathlon, 0)
		},
		duels: {
			wins: 0,
			deaths: 0,
			losses: 0,
			shots: 0,
			bestWS: 0,
			currentWS: 0
		},
		ratio: {
			duels: {
				WL: 0
			},
			wizards: {
				KD: defaultTo(ratio(TNT.kills_capture, TNT.deaths_capture), 0),
				KAD: defaultTo(ratio(TNT.kills_capture + TNT.assists_capture, TNT.deaths_capture), 0),
				KW: defaultTo(ratio(TNT.kills_capture, TNT.wins_capture), 0)
			},
			tag: {
				TK: defaultTo(ratio(D.achievements.tntgames_clinic, TNT.kills_tntag), 0),
				KW: defaultTo(ratio(TNT.kills_tntag, TNT.wins_tntag), 0)
			},
			bowspleef: {
				WL: defaultTo(ratio(TNT.wins_bowspleef, TNT.deaths_bowspleef), 0),
				KD: defaultTo(ratio(TNT.kills_bowspleef, TNT.deaths_bowspleef), 0)
			},
			pvp: {
				WL: defaultTo(ratio(TNT.wins_pvprun, TNT.deaths_pvprun), 0),
				KD: defaultTo(ratio(TNT.kills_pvprun, TNT.deaths_pvprun), 0)
			},
			run: {
				WL: defaultTo(ratio(TNT.wins_tntrun, TNT.deaths_tntrun), 0)
			}
		}
	};

	if (typeof DUEL !== "undefined") {
		result.duels = {
			wins: defaultTo(DUEL.bowspleef_duel_wins, 0),
			deaths: defaultTo(DUEL.bowspleef_duel_deaths, 0),
			losses: defaultTo(DUEL.bowspleef_duel_losses, 0),
			shots: defaultTo(DUEL.bowspleef_duel_bow_shots, 0),
			bestWS: defaultTo(DUEL.best_tnt_games_winstreak, 0),
			currentWS: defaultTo(DUEL.current_tnt_games_winstreak, 0)
		};

		result.ratio.duels.WL = defaultTo(ratio(DUEL.bowspleef_duel_wins, DUEL.bowspleef_duel_losses), 0);
	}

	return result;
};

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

	return {
		success: true,
		user: data
	};
};

module.exports = {
	createStatsEmbed,
	createTimedEmbed,
	parseStatsArgs,
	fetchStats,
	hypixelToStandard,
	display
};
