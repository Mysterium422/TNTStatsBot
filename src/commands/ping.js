// @ts-check
"use strict";

const {performance} = require("perf_hooks");
const {hypixelFetch, successEmbed, errorEmbed} = require("../util.js");
const db = require("../db");
const strings = require("../strings.js");


module.exports = {
	run: async ({message}) => {
		const discordToBot = message.createdTimestamp - Date.now();

		let START = performance.now();
		await db.where(db.TABLES.ConfiguredChannels, {channel: message.channel.id});
		const botToDB = performance.now() - START;

		START = performance.now();
		const hypixelResponse = await hypixelFetch("ping?"); // Fake endpoint
		if (hypixelResponse === null) return errorEmbed("Failed to reach Hypixel API", strings.hypixel_down);
		const botToHypixel = performance.now() - START;
		const hypixelString = hypixelResponse === "API ERROR" ? "No Response" : Math.round(botToHypixel) + "ms";

		const embed = successEmbed(message.author, "", "Ping");

		embed.addField("Discord to Bot", Math.round(Math.abs(discordToBot)) + "ms");
		embed.addField("Bot to Hypixel", hypixelString);
		embed.addField("Bot to Database", Math.round(botToDB) + "ms");

		return message.channel.send(embed);
	},
	aliases: ["latency"],
	requiresConfiguredChannel: true
};
