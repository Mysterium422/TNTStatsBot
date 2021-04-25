const Discord = require("discord.js");
const {performance} = require("perf_hooks");
const {hypixelFetch} = require("../mystFetch.js");
const {embedFooter, randomChoice} = require("../util.js");

module.exports = {
	run: async (client, message, args) => {
		const discordToBot = Date.now() - message.createdTimestamp;

		let START = performance.now();
		// await db.get("chan_" + message.channel.id);
		const botToDB = performance.now() - START;

		START = performance.now();
		const hypixelResponse = await hypixelFetch("key?");
		const botToHypixel = performance.now() - START;

		const embed = new Discord.MessageEmbed();
		embed.setColor("#3bcc71");
		embed.setAuthor(`${message.author.tag}`, `https://cdn.discordapp.com/avatars/${message.author.id}/${message.author.avatar}?size=128`);
		embed.setTitle("Ping");
		embed.setTimestamp();
		embed.setFooter(randomChoice(embedFooter), embedFooter.image.green);

		embed.addField('Discord to Bot', discordToBot.toFixed(1) + 'ms');
		embed.addField('Bot to Hypixel (round trip)', hypixelResponse === "API ERROR" ? "No Response" : botToHypixel.toFixed(1) + "ms");
		embed.addField('Bot to Database (round trip)t', botToDB.toFixed(1) + 'ms');

		message.channel.send(embed);
	},
	aliases: [
		"latency"
	]
};
