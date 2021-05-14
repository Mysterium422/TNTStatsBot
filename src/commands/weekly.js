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
	run: async ({message, args}) => {
		const parsed = await parseStatsArgs(message, args);
		if (!parsed.success) return message.channel.send(errorEmbed(...parsed.error));
		const {uuid, game} = parsed;

		const data = await fetchStats(uuid);
		if (!data.success) return message.channel.send(errorEmbed(...data.error));
		
        const stats = hypixelToStandard(data.user.player);
        
		let previous = await getTimedStats(uuid, true); // TODO: true represents weekly=true. make this dynamic
		if (previous === null) await cacheTimedStats(uuid, true, stats);

		const embed = createStatsEmbed(message.author, stats, previous, game);
		embed.setDescription("**Showing changes since:** " + formatTimestamp(previous.info.timestamp));

        return message.channel.send(embed);
	},
	aliases: [],
	requiresConfiguredChannel: true
};
