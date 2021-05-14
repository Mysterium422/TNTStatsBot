const { getTimedStats, cacheTimedStats } = require("../cache.js");
const {
    parseStatsArgs,
    fetchStats,
    hypixelToStandard,
    errorEmbed,
    createStatsEmbed,
	formatTimestamp
} = require("../util");

module.exports = {
	run: async ({command, message, args}) => {
		const parsed = await parseStatsArgs(message, args);
		if (!parsed.success) return message.channel.send(errorEmbed(...parsed.error));
		const {uuid, game} = parsed;

		const data = await fetchStats(uuid);
		if (!data.success) return message.channel.send(errorEmbed(...data.error));
		
        const stats = hypixelToStandard(data.user.player);
		const isWeekly = command !== "monthly";
        
		// TODO: Check both weekly & monthly, set if not exist
		// TODO: Do in !kills & !stats
		let previous = await getTimedStats(uuid, isWeekly);
		if (previous === null) await cacheTimedStats(uuid, isWeekly, stats);

		const embed = createStatsEmbed({message, stats, previous, game, timeframe: isWeekly ? "*[**Weekly**]*" : "*[**Monthly**]*"});
		embed.setDescription("**Showing changes since:** " + formatTimestamp(previous === null ? Date.now() : previous.info.timestamp));

        return message.channel.send(embed);
	},
	aliases: ["monthly"],
	requiresConfiguredChannel: true
};
