const {performance} = require("perf_hooks");
const {hypixelFetch, errorEmbed, successEmbed} = require("../util.js");

module.exports = {
	run: async (client, message, args) => {
		// TODO: Fix this
		if (1 + 1 === 2) return message.channel.send(errorEmbed("Command Failed", "The ping command is under construction..."));

		const discordToBot = Date.now() - message.createdTimestamp;

		let START = performance.now();
		// await db.get("chan_" + message.channel.id);
		const botToDB = performance.now() - START;

		START = performance.now();
		const hypixelResponse = await hypixelFetch("?");
		const botToHypixel = performance.now() - START;
		const hypixelString = hypixelResponse === "API ERROR" ? "No Response" : Math.round(botToHypixel) + "ms";

		const embed = successEmbed(message.author, "", "Ping");

		embed.addField("Discord to Bot", Math.round(discordToBot) + "ms", true);
		embed.addField("Bot to Hypixel", hypixelString, true);
		embed.addField("Bot to Database", Math.round(botToDB) + "ms", true);

		return message.channel.send(embed);
	},
	aliases: [ "latency" ]
};
