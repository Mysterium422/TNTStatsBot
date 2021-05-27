// @ts-check
"use strict";

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

module.exports = {
	embedFooter, randomChoice, errorEmbed, hypixelFetch,
	defaultTo, isValidPlayername, nameToUUID, UUIDtoName,
	formatTimestamp, ratio, ChatColors, getMentioned,
	avatarOf, successEmbed, getRank, formatMinutes,
	formatSeconds, GAMES_READABLE, GAMES, getUUIDFromDiscord,
	parseUser
};
