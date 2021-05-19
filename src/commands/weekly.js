const {getTimedStats, cacheTimedStats, setAndOrGet} = require("../cache.js");
const {parseStatsArgs, fetchStats, hypixelToStandard, createTimedEmbed, errorEmbed, formatTimestamp} = require("../util");

module.exports = {
	run: async ({command, message, args}) => {
		const parsed = await parseStatsArgs(message, args);
		if (!parsed.success) return message.channel.send(errorEmbed(...parsed.error));
		const {uuid, game} = parsed;

		const data = await fetchStats(uuid);
		if (!data.success) return message.channel.send(errorEmbed(...data.error));

		const stats = hypixelToStandard(data.user.player);
		const isWeekly = command !== "monthly";
		const previous = await setAndOrGet(uuid, isWeekly, stats);

		const embed = createTimedEmbed({
			message, stats, previous, game,
			timeframe: isWeekly ? "Weekly" : "Monthly"
		});
		
		embed.setDescription("**Showing changes since:** " + formatTimestamp((previous === null ? stats : previous).info.timestamp));
		return message.channel.send(embed);
	},
	aliases: ["monthly"],
	requiresConfiguredChannel: true
};
