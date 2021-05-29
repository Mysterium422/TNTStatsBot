// @ts-check
"use strict";

const {setAndOrGet} = require("../cache.js"),
	{errorEmbed, formatTimestamp} = require("../util"),
	{getUserSettings} = require("../db.js"),
	{parseStatsArgs, fetchStats, HypixelStats} = require("../stats-utils.js");

module.exports = {
	run: async ({command, message, args, channelInfo}) => {
		const parsed = await parseStatsArgs(message, args, channelInfo);
		if (!parsed.success) return message.channel.send(errorEmbed(...parsed.error));
		const {uuid, game} = parsed;

		const data = await fetchStats(uuid);
		if (!data.success) return message.channel.send(errorEmbed(...data.error));
		const stats = new HypixelStats(data.user.player);

		const isWeekly = command !== "monthly";
		const previous = await setAndOrGet(uuid, isWeekly, stats);
		const settings = getUserSettings(message.author);
		const embed = stats.getDifference(previous).toEmbed(game, message.author, settings);

		// Prepend description
		// embed.setDescription(
		// 	"**Showing changes since:** " + formatTimestamp((previous === null ? stats : previous).info.timestamp) +
		// 	(embed.description === null ? "" : "\n" + embed.description)
		// );

		return message.channel.send(embed);
	},
	aliases: ["monthly"],
	requiresConfiguredChannel: true
};
