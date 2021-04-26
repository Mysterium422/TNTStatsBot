const Discord = require("discord.js");

const embedFooter = {
	text: [
		"TNT Stats Bot by Mysterium_",
		"Created by Mysterium_",
		"Rewritten by Lebster",
		"Version 5.0.0 By Lebster",
		"Invite this bot to your own server! (/invite)",
		"Found a bug? Report it! (/discord)",
		"Join the discord! (/discord)",
		"All bow to sensei Kidzyy",
		"I'm open source! (/source)",
	],
	image: {
		green: "https://cdn.discordapp.com/emojis/722990201307398204.png?v=1",
		red: "https://cdn.discordapp.com/emojis/722990201302941756.png?v=1"
	}
};

const randomChoice = arr => arr[Math.floor(Math.random() * arr.length)];
const noop = () => {};
const errorEmbed = (error = "Something went wrong...", description = "") => {
	const embed = new Discord.MessageEmbed();
	embed.setColor("#F64B4B");
	embed.setTitle(`Oops!`);
	embed.addField(error, description);
	embed.setTimestamp();
	embed.setFooter(randomChoice(embedFooter.text), embedFooter.image.red);
	return embed;
};

// SETUP CONFIG
const config = require("../config.json");
const key = config.hypixel_key;
const nodeFetch = require("node-fetch");

// TODO: Caching with keyv (npm install keyv)
const hypixelFetch = query => nodeFetch(`https://api.hypixel.net/${query}&key=${key}`).then(response => response.json());
const mojangUUIDFetch = query => nodeFetch(`https://api.mojang.com/users/profiles/minecraft/${query}`).then(response => (response.status === 204 ? null : response.json()));

const randInt = (max, min) => Math.floor(Math.random() * (max - min + 1) + min);
const shuffle = array => {
	for (let currentIndex = array.length; currentIndex !== 0; currentIndex--) {
		const randomIndex = Math.floor(Math.random() * currentIndex);
		currentIndex -= 1;

		const temporaryValue = array[currentIndex];
		array[currentIndex] = array[randomIndex];
		array[randomIndex] = temporaryValue;
	}

	return array;
};

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
		.setFooter(randomChoice(embedFooter), embedFooter.image.green)
		.setTimestamp()
		.setDescription(description)
		.setTitle(title);
	
	if (thumbnail !== null) result.setThumbnail(thumbnail);
	return result;
};
	

module.exports = {
	embedFooter, randomChoice, noop, errorEmbed,
	hypixelFetch, mojangUUIDFetch, ChatCodes,
	ChatColor, booleanPhrases, ratio, formatTimestamp,
	shuffle, randInt, getMentioned, successEmbed
};
