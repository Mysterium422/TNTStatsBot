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

/**
 * Pick a random item from an array
 * @param {any[]} arr Array
 * @returns {any} Random item
 */
const randomChoice = arr => arr[Math.floor(Math.random() * arr.length)];

/**
 * Creates a Discord embed which represents a user error
 * @param {string=} error Error message
 * @param {string=} description Description of the error
 * @returns {Discord.MessageEmbed} Embed
 */
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

/**
 * Query the Hypixel API
 * @param {string} query Query string
 * @returns {Object} API Response
 */
// @ts-ignore
const hypixelFetch = query => fetch(`https://api.hypixel.net/${query}&key=${config.hypixel_key}`).then(response => response.json());

/**
 * Use a default value if `v` is not defined
 * @param {any} v Value
 * @param {any} def Default value
 * @returns `def` if `v` is `undefined`, otherwise `v`
 */
const defaultTo = (v, def = null) => (typeof v === "undefined" ? def : v);

/**
 * Check if a string is a valid Minecraft username
 * @param {string} name Name to check
 * @returns {boolean} Was the name valid?
 */
const isValidPlayername = name => /^[A-Za-z0-9_]{3,16}$/.test(name);

/**
 * Get the UUID associated with a Minecraft username
 * @param {string} name Minecraft username
 * @returns {Promise<string>|null} UUID, or `null` if an error occurred
 */
const nameToUUID = async name => {
	if (!isValidPlayername(name)) return null;
	// @ts-ignore
	const response = await fetch(`https://api.mojang.com/users/profiles/minecraft/${name}`);
	if (response.status === 204) return null;
	return response.json().then(j => j.id);
};

/**
 * Get the username associated with a Minecraft UUID
 * @param {string} uuid Minecraft UUID
 * @returns {Promise<string>|null} Username, or `null` if an error occurred
 */
const UUIDtoName = async uuid => {
	// @ts-ignore
	const response = await fetch(`https://api.mojang.com/user/profiles/${uuid}/names`).then(response => response.json());
	if (response.error) return null;
	else return response[response.length - 1].name;
};

/**
 * Format a unix epoch timestamp
 * @param {number} timestamp Timpestamp to format
 * @returns {string} Formatted string
 */
const formatTimestamp = timestamp =>
	new Date(timestamp).toLocaleString("default", {
		dateStyle: "medium",
		timeStyle: "short"
	});

/**
 * Get the ratio between two numbers
 * @param {number} a First number
 * @param {number} b Second number
 * @returns {number}
 */
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

/**
 * Get the avatar of a user
 * @param {Discord.User} user User
 * @returns {string} URL to to the avatar of the specified user
 */
const avatarOf = user => `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}?size=128`;

/**
 * 
 * @param {Discord.User} author Author of the message
 * @param {string=} description Description
 * @param {string=} title Title
 * @param {string | null} thumbnail Thumbnail URL
 * @returns 
 */
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

/**
 * @typedef {Object} Rank A Hypixel Rank
 * @property {string} prefix Prefix
 * @property {string} color Hex color
 */
/**
 * Get the rank of a user
 * @param {Object} D Hypixel API response
 * @returns {Rank} The user's rank
 */
const getRank = D => {
	const ranks = {
		ADMIN:     {prefix: "[ADMIN]",   color: ChatColors.red},
		MODERATOR: {prefix: "[MOD]",     color: ChatColors.dark_green},
		HELPER:    {prefix: "[HELPER]",  color: ChatColors.blue},
		YOUTUBER:  {prefix: "[YOUTUBE]", color: ChatColors.red},
		SUPERSTAR: {prefix: "[MVP++]",   color: ChatColors.gold},
		MVP_PLUS:  {prefix: "[MVP+]",    color: ChatColors.aqua},
		MVP:       {prefix: "[MVP]",     color: ChatColors.aqua},
		VIP_PLUS:  {prefix: "[VIP+]",    color: ChatColors.green},
		VIP:       {prefix: "[VIP]",     color: ChatColors.green},
		DEFAULT:   {prefix: "",          color: ChatColors.gray}
	};

	const rank = D.rank === "NORMAL" ? null : D.rank;
	const monthlyPackageRank = D.monthlyPackageRank === "NONE" ? null : D.monthlyPackageRank;
	const packageRank = D.packageRank === "NONE" ? null : D.packageRank;
	const newPackageRank = D.newPackageRank === "NONE" ? null : D.newPackageRank;
	if (typeof D.prefix === "string") {
		return {
			prefix: D.prefix.replace(/§[A-F0-9]/gi, ""),
			color: D.prefix.indexOf("§") !== -1 ? ChatColors[D.prefix[D.prefix.indexOf("§") + 1]] : ChatColors.gray
		};
	} else if (rank || monthlyPackageRank || newPackageRank || packageRank) {
		return ranks[rank || monthlyPackageRank || newPackageRank || packageRank];
	} else {
		return ranks.DEFAULT;
	}
};

/**
 * Format a number of minutes
 * @param {number} raw Number of minutes
 * @returns {string} Formatted string
 */
const formatMinutes = raw => {
	const hours = Math.trunc(raw / 60),
		  mins = Math.floor(raw % 60),
		  secs = Math.trunc(raw / 60 % 60);

	let out = [];
	if (hours > 0) out.push(hours.toLocaleString() + "h");
	if (mins > 0)  out.push(mins.toLocaleString() + "m");
	if (secs > 0)  out.push(secs.toLocaleString() + "s");
	if (out.length === 0) return "0s";

	return out.join(" ");
};

/**
 * Format a number of seconds
 * @param {number} raw Number of seconds
 * @returns {string} Formatted string
 */
const formatSeconds = raw => {
	const hours = Math.trunc(raw / 3600),
		  mins = Math.trunc(raw / 60 % 60),
		  secs = Math.floor(raw % 60);

	let out = [];
	if (hours > 0) out.push(hours.toLocaleString() + "h");
	if (mins > 0)  out.push(mins.toLocaleString() + "m");
	if (secs > 0)  out.push(secs.toLocaleString() + "s");
	if (out.length === 0) return "0s";

	return out.join(" ");
};

const GAMES_READABLE = {
	all: "Overall",
	wizards: "Wizards",
	run: "TNT Run",
	pvp: "PVP Run",
	tag: "TNT Tag",
	bowspleef: "Bow Spleef",
	duels: "Bow Spleef Duels",
	kills: "Wizards Kills"
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
	wizards:       "wizards",
	kills:         "kills",
	wizkills:      "kills",
	wkills:        "kills"
};

/**
 * Get the Minecraft UUID linked to a Discord ID
 * @param {string} discord User ID
 * @returns {Promise<string|null>} UUID, or `null` if have not linked
 */
const getUUIDFromDiscord = async discord => {
	const row = await db.where(db.TABLES.VerifiedUsers, {discord});
	if (row.length === 0) return null;
	return row[0].uuid;
};

/**
 * Parse a Minecraft UUID from a bot command
 * @param {string} arg First argument
 * @param {Discord.User} mentioned First mention
 * @returns {Promise<{success: false, error: [string, string], uuid?: undefined} | {success: true, uuid: string, error?: undefined}>} Parsed user
 */
const parseUser = async (arg, mentioned = null) => {
	if (mentioned === null) {
		if (arg.length > 16) {
			// UUID specified
			let playername = await UUIDtoName(arg);
			if (playername === null) return {success: false, error: ["Invalid UUID", strings.uuid_invalid]};
			else return {success: true, uuid: arg};
		} else {
			// Playername specified
			const uuid = await nameToUUID(arg);
			if (uuid === null) return {success: false, error: ["Invalid playername", strings.playername_invalid]};
			return {success: true, uuid};
		}
	} else {
		// Mention specified
		const uuid = await getUUIDFromDiscord(mentioned.id);
		if (uuid === null) return {success: false, error: ["Invalid user", strings.unlinked]};
		return {success: true, uuid};
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
