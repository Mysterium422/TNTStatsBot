const {performance} = require("perf_hooks");
const {hypixelFetch} = require("../mystFetch.js");
const Discord = require("discord.js");

module.exports = {
	run: async (client, message, args) => {
		const discordToBot = Date.now() - message.createdTimestamp;

		let START = performance.now();
		// await db.get("chan_" + message.channel.id);
		const botToDB = performance.now() - START;

		START = performance.now();
		const hypixelResponse = await hypixelFetch("key?");
		const botToHypixel = performance.now() - START;

		const embed = new Discord.MessageEmbed()
        .setColor("#3bcc71")
        .setAuthor(`${message.author.tag}`, `https://cdn.discordapp.com/avatars/${message.author.id}/${message.author.avatar}?size=128`)
        .setTitle("Help Menu - Home")
        .setThumbnail(`https://findicons.com/files/icons/1008/quiet/128/information.png`)
        .setTimestamp()
        .setFooter("Created by Mysterium", embedFooter.image.green);

		messageSent = await message.channel.send(
			[
				"**Ping**",
				"",
				`Discord to Bot: ${discordToBot.toFixed(1)}ms`,
				`Bot to Hypixel (round trip): ${hypixelResponse === "API ERROR" ? "No Response" : botToHypixel.toFixed(1) + "ms"}`,
				`Bot to Database (round trip): ${botToDB.toFixed(1)}ms`
			].join("\n")
		);
	},
	aliases: [
		"latency"
	]
};
