const Discord = require("discord.js");

const embedFooter = {
	text: [
		"TNT Stats Bot by Mysterium_",
		"TNT Stats Bot by Mysterium_",
		"TNT Stats Bot by Mysterium_",
		"Created by Mysterium_",
		"Created by Mysterium_",
		"Created by Mysterium_",
		"Invite this bot to your own server! (/invite)",
		"Invite this bot to your own server! (/invite)",
		"Invite this bot to your own server! (/invite)",
		"Invite this bot to your own server! (/invite)",
		"Invite this bot to your own server! (/invite)",
		"Wizard Leaderboard Bot! (/discord)",
		"Suggest fixes! (/discord)",
		"Join the discord! (/discord)",
		"All bow to sensei Kidzyy",
		"Check out my code! (/source)",
		"Report any bugs! (/discord)"
	],
	image: {
		green: "https://cdn.discordapp.com/emojis/722990201307398204.png?v=1",
		red: "https://cdn.discordapp.com/emojis/722990201302941756.png?v=1"
	}
};

const randomChoice = arr => arr[Math.floor(Math.random() * arr.length)];
const noop = () => {};

module.exports = {embedFooter, randomChoice, noop};
