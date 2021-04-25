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
		const hypixelString = hypixelResponse === "API ERROR" ? "No Response" : Math.round(botToHypixel) + "ms";

		const embed = new Discord.MessageEmbed();
		embed.setColor("#3bcc71");
		embed.setAuthor(`${message.author.tag}`, `https://cdn.discordapp.com/avatars/${message.author.id}/${message.author.avatar}?size=128`);
		embed.setTitle("Ping");
		embed.setTimestamp();
		embed.setFooter(randomChoice(embedFooter.text), embedFooter.image.green);

		embed.addField("Discord to Bot", Math.round(discordToBot) + "ms", true);
		embed.addField("Bot to Hypixel", hypixelString, true);
		embed.addField("Bot to Database", Math.round(botToDB) + "ms", true);

		message.channel.send(embed);
	},
	aliases: [
		"latency"
	]
};
