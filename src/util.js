const Discord = require("discord.js");

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
		"I'm open source!",
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

// SETUP CONFIG
const config = require("../config.json");
const key = config.hypixel_key;
const fetch = require("node-fetch");

// TODO: Caching with keyv (npm install keyv)
const hypixelFetch = query => fetch(`https://api.hypixel.net/${query}&key=${key}`).then(response => response.json());
const mojangUUIDFetch = query => fetch(`https://api.mojang.com/users/profiles/minecraft/${query}`).then(response => (response.status === 204 ? null : response.json()));
const mojangNameFetch = query => fetch(`https://api.mojang.com/user/profiles/${query}/names`).then(response => (response.status === 204 ? null : response.json()));
const defaultTo = (v, def=null) => typeof v === "undefined" ? def : v;

const formatTimestamp = timestamp =>
	new Date(timestamp).toLocaleString("default", {
		dateStyle: "medium",
		timeStyle: "short"
	});

const ratio = (a = 0, b = 0) => (b === 0 ? a : a === 0 ? b : a / b);

const booleanPhrases = {
	false: false,
	true: true,
	f: false,
	t: true,
	y: true,
	no: false,
	n: false,
	yes: true,
	"1": true,
	"0": false
};

const ChatColor = {
	black: "#000000",
	dark_blue: "#0000AA",
	dark_green: "#00AA00",
	dark_aqua: "#00AAAA",
	dark_red: "#AA0000",
	dark_purple: "#AA00AA",
	gold: "#FFAA00",
	gray: "#AAAAAA",
	dark_gray: "#555555",
	blue: "#5555FF",
	green: "#55FF55",
	aqua: "#55FFFF",
	red: "#FF5555",
	light_purple: "#FF55FF",
	yellow: "#FFFF55",
	white: "#FFFFFF"
};

const ChatCodes = {
	"0": "black",
	"1": "dark_blue",
	"2": "dark_green",
	"3": "dark_aqua",
	"4": "dark_red",
	"5": "dark_purple",
	"6": "gold",
	"7": "gray",
	"8": "dark_gray",
	"9": "blue",
	a: "green",
	b: "aqua",
	c: "red",
	d: "light_purple",
	e: "yellow",
	f: "white"
};

const getMentioned = message => {
	const result = message.mentions.users.first();
	return typeof result === "undefined" ? null : result;
};

const successEmbed = (author, description="", title="Success", thumbnail=null) => {
	const result = new Discord.MessageEmbed()
		.setColor("#3bcc71")
		.setAuthor(author.tag, `https://cdn.discordapp.com/avatars/${author.id}/${author.avatar}?size=128`)
		.setFooter(randomChoice(embedFooter.text), embedFooter.image.green)
		.setTimestamp()
		.setDescription(description)
		.setTitle(title);
	
	if (thumbnail !== null) result.setThumbnail(thumbnail);
	return result;
};

const getAvatar = user => `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}?size=128`;
const getStats = async uuid => {
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
			error: ["Invalid playername/uuid", `${playername} has never logged on to Hypixel!`]
		};
	} else if (!("TNTGames" in data.player.stats)) {
		return {
			success: false,
			error: ["Invalid playername/uuid", `${playername} has never played TNT Games!`]
		};
	}

	return {
		success: true,
		user: data
	};
};

const hypixelToStandard = D => {
	const TNT = D.stats.TNTGames,
		  DUEL = D.stats.Duels;

	const result = {
		info: {
			uuid:        D.uuid,
			displayname: D.displayname,
			rank:        D.packageRank
		},
		run: {
			record:   defaultTo(TNT.record_tntrun, 0),
			wins:     defaultTo(TNT.wins_tntrun, 0),
			deaths:   defaultTo(TNT.deaths_tntrun, 0),
			potions:  defaultTo(TNT.run_potions_splashed_on_players, 0),
			WL:       defaultTo(ratio(TNT.wins_tntrun, TNT.deaths_tntrun), 0)
		},
		pvp: {
			record:   defaultTo(TNT.record_pvprun, 0),
			wins:     defaultTo(TNT.wins_pvprun, 0),
			deaths:   defaultTo(TNT.deaths_pvprun, 0),
			kills:    defaultTo(TNT.kills_pvprun, 0),
			WL:       defaultTo(ratio(TNT.wins_pvprun, TNT.deaths_pvprun), 0),
			KD:       defaultTo(ratio(TNT.kills_pvprun, TNT.deaths_pvprun), 0)
		},
		bow: {
			wins:     defaultTo(TNT.wins_bowspleef, 0),
			deaths:   defaultTo(TNT.deaths_bowspleef, 0),
			shots:    defaultTo(TNT.tags_bowspleef, 0),
			kills:    defaultTo(TNT.kills_bowspleef, 0),
			WL:       defaultTo(ratio(TNT.wins_bowspleef, TNT.deaths_bowspleef), 0)
		},
		tag: {
			wins:     defaultTo(TNT.wins_tntag, 0),
			kills:    defaultTo(TNT.kills_tntag, 0),
			tags:     defaultTo(D.achievements.tntgames_clinic, 0),
			TK:       defaultTo(ratio(D.achievements.tntgames_clinic, TNT.kills_tntag), 0),
			KW:       defaultTo(ratio(TNT.kills_tntag, TNT.wins_tntag), 0)
		},
		wizards: {
			wins:     defaultTo(TNT.wins_capture, 0),
			assists:  defaultTo(TNT.assists_capture, 0),
			deaths:   defaultTo(TNT.deaths_capture, 0),
			points:   defaultTo(TNT.points_capture, 0),
			KD:       defaultTo(ratio(TNT.kills_capture, TNT.deaths_capture), 0),
			KAD:      defaultTo(ratio(TNT.kills_capture + TNT.assists_capture, TNT.deaths_capture), 0),
			airtime:  defaultTo(TNT.air_time_capture, 0),
			KW:       defaultTo(ratio(TNT.kills_capture, TNT.wins_capture), 0),
			kills: {
				total:   defaultTo(TNT.kills_capture, 0),
				fire:    defaultTo(TNT.new_firewizard_kills, 0),
				ice:     defaultTo(TNT.new_icewizard_kills, 0),
				wither:  defaultTo(TNT.new_witherwizard_kills, 0),
				kinetic: defaultTo(TNT.new_kineticwizard_kills, 0),
				blood:   defaultTo(TNT.new_bloodwizard_kills, 0),
				toxic:   defaultTo(TNT.new_toxicwizard_kills, 0),
				hydro:   defaultTo(TNT.new_hydrowizard_kills, 0),
				ancient: defaultTo(TNT.new_ancientwizard_kills, 0),
				storm:   defaultTo(TNT.new_stormwizard_kills, 0)
			}
		},
		overall: {
			coins:    defaultTo(TNT.coins, 0),
			wins:     defaultTo(TNT.wins, 0),
			streak:   defaultTo(TNT.winstreak, 0),
			playtime: defaultTo(D.achievements.tntgames_tnt_triathlon, 0)
		},
		duels: {
			wins: 0, deaths: 0, losses: 0,
			shots: 0, bestWS: 0, currentWS: 0, WL: 0
		}
	};

	if (typeof DUEL !== 'undefined') {
		result.duels = {
			wins: DUEL.bowspleef_duel_wins,
			deaths: DUEL.bowspleef_duel_deaths,
			losses: DUEL.bowspleef_duel_losses,
			shots: DUEL.bowspleef_duel_bow_shots,
			bestWS: DUEL.best_tnt_games_winstreak,
			currentWS: DUEL.current_tnt_games_winstreak,
			WL: ratio(DUEL.bowspleef_duel_wins, DUEL.bowspleef_duel_losses)
		};
	}
	
	return result;
};

const formatMinutes = mins => {
	let hours = 0;
	while (mins >= 60) {
		hours++;
		mins -= 60;
	}

	return `${hours}h ${mins}m`;
};

module.exports = {
	embedFooter, randomChoice, noop, errorEmbed,
	hypixelFetch, mojangUUIDFetch, ChatCodes,
	ChatColor, booleanPhrases, ratio, formatTimestamp,
	getMentioned, successEmbed, mojangNameFetch, getAvatar,
	getStats, hypixelToStandard, formatMinutes
};
