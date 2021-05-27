const Discord = require("discord.js"),
	db = require("./db"),
	strings = require("./strings");

const embedFooter = {
	text: [
		"TNT Stats Bot by Mysterium_",
		"Created by Mysterium_",
		"Rewritten by Lebster",
		"Version 5.0.0 By Lebster",
		"Invite me to your server!",
		"Found a bug? Report it!",
		"Join the discord!",
		"All bow to sensei Kidzyy",
		"I'm open source!"
	],
	image: {
		green: "https://cdn.discordapp.com/emojis/722990201307398204.png?v=1",
		red: "https://cdn.discordapp.com/emojis/722990201302941756.png?v=1"
	}
};

const randomChoice = arr => arr[Math.floor(Math.random() * arr.length)];
const noop = () => {};
const errorEmbed = (error = "Something went wrong...", description = ":robot: beep boop") => {
	const embed = new Discord.MessageEmbed();
	embed.setColor("#F64B4B");
	embed.setTitle("ERROR: " + error);
	embed.setDescription(description);
	embed.setTimestamp();
	embed.setFooter(randomChoice(embedFooter.text), embedFooter.image.red);
	return embed;
};

const config = require("../config.json");
const fetch = require("node-fetch");

const hypixelFetch = query => fetch(`https://api.hypixel.net/${query}&key=${config.hypixel_key}`).then(response => response.json());
const defaultTo = (v, def = null) => (typeof v === "undefined" ? def : v);
const isValidPlayername = name => /^[A-Za-z0-9_]{3,16}$/.test(name);

const nameToUUID = async name => {
	if (!isValidPlayername(name)) return null;
	const response = await fetch(`https://api.mojang.com/users/profiles/minecraft/${name}`);
	if (response.status === 204) return null;
	return response.json().then(j => j.id);
};

const UUIDtoName = async uuid => {
	const response = await fetch(`https://api.mojang.com/user/profiles/${uuid}/names`).then(response => response.json());
	if (response.error) return null;
	else return response[response.length - 1].name;
};

const formatTimestamp = timestamp =>
	new Date(timestamp).toLocaleString("default", {
		dateStyle: "medium",
		timeStyle: "short"
	});

const ratio = (a = 0, b = 0) => (b === 0 ? a : a === 0 ? 0 : a / b);

const ChatColors = {
	black:        "#000000",   "0": "#000000",
	dark_blue:    "#0000AA",   "1": "#0000AA",
	dark_green:   "#00AA00",   "2": "#00AA00",
	dark_aqua:    "#00AAAA",   "3": "#00AAAA",
	dark_red:     "#AA0000",   "4": "#AA0000",
	dark_purple:  "#AA00AA",   "5": "#AA00AA",
	gold:         "#FFAA00",   "6": "#FFAA00",
	gray:         "#AAAAAA",   "7": "#AAAAAA",
	dark_gray:    "#555555",   "8": "#555555",
	blue:         "#5555FF",   "9": "#5555FF",
	green:        "#55FF55",   "a": "#55FF55",
	aqua:         "#55FFFF",   "b": "#55FFFF",
	red:          "#FF5555",   "c": "#FF5555",
	light_purple: "#FF55FF",   "d": "#FF55FF",
	yellow:       "#FFFF55",   "e": "#FFFF55",
	white:        "#FFFFFF",   "f": "#FFFFFF"
};

/**
 * Get the first mentioned user in a message
 * @param {Discord.Message} message 
 * @returns {Discord.User} user
 */
const getMentioned = message => {
	const result = message.mentions.users.first();
	return typeof result === "undefined" ? null : result;
};

const avatarOf = user => `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}?size=128`;
const successEmbed = (author, description = "", title = "Success", thumbnail = null) => {
	const result = new Discord.MessageEmbed();
	result.setColor("#3bcc71");
	result.setAuthor(author.tag, avatarOf(author));
	result.setFooter(randomChoice(embedFooter.text), embedFooter.image.green);
	result.setTimestamp();
	result.setDescription(description);
	result.setTitle(title);

	if (thumbnail !== null) result.setThumbnail(thumbnail);
	return result;
};

// TODO: Make a file for stats related functions
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

const getRank = D => {
	const ranks = {
		ADMIN:     {string: "[ADMIN]",   color: ChatColors.red},
		MODERATOR: {string: "[MOD]",     color: ChatColors.dark_green},
		HELPER:    {string: "[HELPER]",  color: ChatColors.blue},
		YOUTUBER:  {string: "[YOUTUBE]", color: ChatColors.red},
		SUPERSTAR: {string: "[MVP++]",   color: ChatColors.gold},
		MVP_PLUS:  {string: "[MVP+]",    color: ChatColors.aqua},
		MVP:       {string: "[MVP]",     color: ChatColors.aqua},
		VIP_PLUS:  {string: "[VIP+]",    color: ChatColors.green},
		VIP:       {string: "[VIP]",     color: ChatColors.green},
		DEFAULT:   {string: "",          color: ChatColors.gray}
	};

	const rank = D.rank === "NORMAL" ? null : D.rank;
	const monthlyPackageRank = D.monthlyPackageRank === "NONE" ? null : D.monthlyPackageRank;
	const packageRank = D.packageRank === "NONE" ? null : D.packageRank;
	const newPackageRank = D.newPackageRank === "NONE" ? null : D.newPackageRank;
	if (typeof D.prefix === "string") {
		return {
			string: D.prefix.replace(/§[A-F0-9]/gi, ""),
			color: D.prefix.indexOf("§") !== -1 ? ChatColors[D.prefix[D.prefix.indexOf("§") + 1]] : ChatColors.gray
		};
	} else if (rank || monthlyPackageRank || newPackageRank || packageRank) {
		return ranks[rank || monthlyPackageRank || newPackageRank || packageRank];
	} else {
		return ranks.DEFAULT;
	}
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

const formatMinutes = mins => {
	const hours = Math.trunc(mins / 60);
	return `${hours > 0 ? hours.toLocaleString() + "h" : ""} ${Math.floor(mins % 60).toLocaleString()}m`;
};

const formatSeconds = secs => {
	const mins = Math.trunc(secs / 60);
	return `${mins > 0 ? mins.toLocaleString() + "m" : ""} ${Math.floor(secs % 60).toLocaleString()}s`;
};

const GAMES_READABLE = {
	all: "Overall",
	wizards: "Wizards",
	run: "TNT Run",
	pvp: "PVP Run",
	tag: "TNT Tag",
	bowspleef: "Bow Spleef",
	duels: "Bow Spleef Duels"
};

const GAMES = {
	all:           "all",
	bow:           "bowspleef",
	bowduel:       "duels",
	bowspleef:     "bowspleef",
	bowspleefduel: "duels",
	bspleef:       "bowspleef",
	duel:          "duels",
	duels:         "duels",
	overall:       "all",
	pvp:           "pvp",
	pvprun:        "pvp",
	run:           "run",
	spleef:        "bowspleef",
	spleefduel:    "duels",
	tag:           "tag",
	tagtnt:        "tag",
	tnt:           "all",
	tntduel:       "duels",
	tntduels:      "duels",
	tntrun:        "run",
	tntspleef:     "bowspleef",
	tnttag:        "tag",
	tntwiz:        "wizards",
	tntwizard:     "wizards",
	tntwizards:    "wizards",
	wiz:           "wizards",
	wizard:        "wizards",
	wizards:       "wizards"
};

const getUUIDFromDiscord = async discord => {
	const row = await db.select(db.TABLES.VerifiedUsers, {discord});
	if (row.length === 0) return null;
	return row[0].uuid;
};

// TODO: JSDoc everything
const parseUser = async ({arg, mentioned = null, getName = false}) => {
	if (mentioned === null) {
		if (arg.length > 16) {
			// UUID specified
			let playername = await UUIDtoName(arg);
			if (playername === null) return {success: false, error: ["Invalid UUID", strings.uuid_invalid]};
			else return {success: true, uuid: arg, playername};
		} else {
			// Playername specified
			const uuid = await nameToUUID(arg);
			if (uuid === null) return {success: false, error: ["Invalid playername", strings.playername_invalid]};
			return {success: true, uuid, playername: arg};
		}
	} else {
		// Mention specified
		const uuid = await getUUIDFromDiscord(mentioned.id);
		if (uuid === null) return {success: false, error: ["Invalid user", strings.unlinked]};

		let playername = null;
		if (getName) {
			playername = await UUIDtoName(uuid);
			if (playername === null) return {success: false, error: ["Invalid user", strings.bad_link]};
		}

		return {success: true, uuid, playername};
	}
};

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
			embed.addField("**Wizards Kills**",  display("wizards.totalkills",  stats, previous), true);
			embed.addField("**Wizards Points**", display("wizards.points",      stats, previous), true);
			return embed;
		case "run":
			embed.addField("**Record**",         display("run.record",          stats, previous, formatSeconds), true);
			embed.addField("**Wins**",           display("run.wins",            stats, previous), true);
			embed.addField("**Deaths**",         display("run.deaths",          stats, previous), true);
			embed.addField("**Potions Thrown**", display("run.potions",         stats, previous), true);
			embed.addField("**W/L Ratio**",      display("ratio.run.WL",        stats, previous), true);
			embed.addField("**Blocks Broken**",  display("run.blocks",          stats, previous), true);
			return embed;
		case "pvp":
			embed.addField("**Record**",         display("pvp.record",          stats, previous, formatSeconds), true);
			embed.addField("**Wins**",           display("pvp.wins",            stats, previous), true);
			embed.addField("**Deaths**",         display("pvp.deaths",          stats, previous), true);
			embed.addField("**Kills**",          display("pvp.kills",           stats, previous), true);
			embed.addField("**W/L Ratio**",      display("ratio.pvp.WL",        stats, previous), true);
			embed.addField("**K/D Ratio**",      display("ratio.pvp.KD",        stats, previous), true);
			return embed;
		case "bowspleef":
			embed.addField("**Wins**",           display("bowspleef.wins",      stats, previous), true);
			embed.addField("**Deaths**",         display("bowspleef.deaths",    stats, previous), true);
			embed.addField("**Kills**",          display("bowspleef.kills",     stats, previous), true);
			embed.addField("**Shots**",          display("bowspleef.shots",     stats, previous), true);
			embed.addField("**W/L Ratio**",      display("ratio.bowspleef.WL",  stats, previous), true);
			embed.addField("**K/D Ratio**",      display("ratio.bowspleef.KD",  stats, previous), true);
			return embed;
		case "tag":
			embed.addField("**Wins**",           display("tag.wins",            stats, previous), true);
			embed.addField("**Kills**",          display("tag.kills",           stats, previous), true);
			embed.addField("**Tags**",           display("tag.tags",            stats, previous), true);
			embed.addField("**T/K Ratio**",      display("ratio.tag.TK",        stats, previous), true);
			embed.addField("**K/W Ratio**",      display("ratio.tag.KW",        stats, previous), true);
			return embed;
		case "wizards":
			// TODO: Airtime, KA/D Ratio, K/W Ratio, Kills with each class (verbose only)
			embed.addField("**Wins**",           display("wizards.wins",        stats, previous), true);
			embed.addField("**Deaths**",         display("wizards.deaths",      stats, previous), true);
			embed.addField("**Kills**", 		 display("wizards.totalkills",  stats, previous), true);
			embed.addField("**Assists**",        display("wizards.assists",     stats, previous), true);
			embed.addField("**Points**",         display("wizards.points",      stats, previous), true);
			embed.addField("**K/D Ratio**",      display("ratio.wizards.KD",	stats, previous), true);
			return embed;
		case "duels":
			embed.addField("**Wins**",           display("duels.wins",          stats, previous), true);
			embed.addField("**Losses**",         display("duels.losses",        stats, previous), true);
			embed.addField("**Shots**",          display("duels.shots",         stats, previous), true);
			embed.addField("**W/L Ratio**",      display("ratio.duels.WL",		stats, previous), true);
			embed.addField("**Current WS**",     display("duels.currentWS",     stats, previous), true);
			embed.addField("**Best WS**",        display("duels.bestWS",        stats, previous), true);
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
			embed.addField("**Coins**",          (stats.overall.coins - previous.overall.coins)          .toLocaleString(), true);
			embed.addField("**Wins**",           (stats.overall.wins - previous.overall.wins)            .toLocaleString(), true);
			embed.addField("**Playtime**",       (stats.overall.playtime - previous.overall.playtime)    .toLocaleString(), true);
			embed.addField("**TNT Tag Wins**",   (stats.tag.wins - previous.tag.wins)                    .toLocaleString(), true);
			embed.addField("**TNT Run Record**", (stats.run.record - previous.run.record)                .toLocaleString(), true);
			embed.addField("**TNT Run Wins**",   (stats.run.wins - previous.run.wins)                    .toLocaleString(), true);
			embed.addField("**Bowspleef Wins**", (stats.bowspleef.wins - previous.bowspleef.wins)        .toLocaleString(), true);
			embed.addField("**PvP Run Kills**",  (stats.pvp.kills - previous.pvp.kills)                  .toLocaleString(), true);
			embed.addField("**PvP Run Wins**",   (stats.pvp.wins - previous.pvp.wins)                    .toLocaleString(), true);
			embed.addField("**Wizards Wins**",   (stats.wizards.wins - previous.wizards.wins)            .toLocaleString(), true);
			embed.addField("**Wizards Kills**",  (stats.wizards.totalkills - previous.wizards.totalkills).toLocaleString(), true);
			embed.addField("**Wizards Points**", (stats.wizards.points - previous.wizards.points)        .toLocaleString(), true);
			return embed;
		case "run":
			embed.addField("**Record**",         (stats.run.record - previous.run.record)                .toLocaleString(), true);
			embed.addField("**Wins**",           (stats.run.wins - previous.run.wins)                    .toLocaleString(), true);
			embed.addField("**Deaths**",         (stats.run.deaths - previous.run.deaths)                .toLocaleString(), true);
			embed.addField("**Potions Thrown**", (stats.run.potions - previous.run.potions)              .toLocaleString(), true);
			embed.addField("**W/L Ratio**",      (stats.ratio.run.WL - previous.ratio.run.WL)            .toLocaleString(), true);
			embed.addField("**Blocks Broken**",  (stats.run.blocks - previous.run.blocks)                .toLocaleString(), true);
			return embed;
		case "pvp":
			embed.addField("**Record**",         (stats.pvp.record - previous.pvp.record)                .toLocaleString(), true);
			embed.addField("**Wins**",           (stats.pvp.wins - previous.pvp.wins)                    .toLocaleString(), true);
			embed.addField("**Deaths**",         (stats.pvp.deaths - previous.pvp.deaths)                .toLocaleString(), true);
			embed.addField("**Kills**",          (stats.pvp.kills - previous.pvp.kills)                  .toLocaleString(), true);
			embed.addField("**W/L Ratio**",      (stats.ratio.pvp.WL - previous.ratio.pvp.WL)            .toLocaleString(), true);
			embed.addField("**K/D Ratio**",      (stats.ratio.pvp.KD - previous.ratio.pvp.KD)            .toLocaleString(), true);
			return embed;
		case "bowspleef":
			embed.addField("**Wins**",           (stats.bowspleef.wins - previous.bowspleef.wins)        .toLocaleString(), true);
			embed.addField("**Deaths**",         (stats.bowspleef.deaths - previous.bowspleef.deaths)    .toLocaleString(), true);
			embed.addField("**Kills**",          (stats.bowspleef.kills - previous.bowspleef.kills)      .toLocaleString(), true);
			embed.addField("**Shots**",          (stats.bowspleef.shots - previous.bowspleef.shots)      .toLocaleString(), true);
			embed.addField("**W/L Ratio**",      (stats.ratio.bowspleef.WL - previous.ratio.bowspleef.WL).toLocaleString(), true);
			embed.addField("**K/D Ratio**",      (stats.ratio.bowspleef.KD - previous.ratio.bowspleef.KD).toLocaleString(), true);
			return embed;
		case "tag":
			embed.addField("**Wins**",           (stats.tag.wins - previous.tag.wins)                    .toLocaleString(), true);
			embed.addField("**Kills**",          (stats.tag.kills - previous.tag.kills)                  .toLocaleString(), true);
			embed.addField("**Tags**",           (stats.tag.tags - previous.tag.tags)                    .toLocaleString(), true);
			embed.addField("**T/K Ratio**",      (stats.ratio.tag.TK - previous.ratio.tag.TK)            .toLocaleString(), true);
			embed.addField("**K/W Ratio**",      (stats.ratio.tag.KW - previous.ratio.tag.KW)            .toLocaleString(), true);
			return embed;
		case "wizards":
			// TODO: Airtime, KA/D Ratio, K/W Ratio, Kills with each class (verbose only)
			embed.addField("**Wins**",           (stats.wizards.wins - previous.wizards.wins)            .toLocaleString(), true);
			embed.addField("**Deaths**",         (stats.wizards.deaths - previous.wizards.deaths)        .toLocaleString(), true);
			embed.addField("**Kills**",          (stats.wizards.totalkills - previous.wizards.totalkills).toLocaleString(), true);
			embed.addField("**Assists**",        (stats.wizards.assists - previous.wizards.assists)      .toLocaleString(), true);
			embed.addField("**Points**",         (stats.wizards.points - previous.wizards.points)        .toLocaleString(), true);
			embed.addField("**K/D Ratio**",      (stats.ratio.wizards.KD - previous.ratio.wizards.KD)    .toLocaleString(), true);
			return embed;
		case "duels":
			embed.addField("**Wins**",           (stats.duels.wins - previous.duels.wins)                .toLocaleString(), true);
			embed.addField("**Losses**",         (stats.duels.losses - previous.duels.losses)            .toLocaleString(), true);
			embed.addField("**Shots**",          (stats.duels.shots - previous.duels.shots)              .toLocaleString(), true);
			embed.addField("**W/L Ratio**",      (stats.ratio.duels.WL - previous.ratio.duels.WL)        .toLocaleString(), true);
			embed.addField("**Current WS**",     (stats.duels.currentWS - previous.duels.currentWS)      .toLocaleString(), true);
			embed.addField("**Best WS**",        (stats.duels.bestWS - previous.duels.bestWS)            .toLocaleString(), true);
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


module.exports = {
	embedFooter, ChatColors,
	GAMES, GAMES_READABLE, parseUser,

	nameToUUID, UUIDtoName,

	randomChoice, noop, errorEmbed, hypixelFetch,
	ratio, formatTimestamp, getMentioned, successEmbed, fetchStats,
	avatarOf, hypixelToStandard, formatMinutes,
	formatSeconds, getUUIDFromDiscord,
	parseStatsArgs, createStatsEmbed, createTimedEmbed
};
