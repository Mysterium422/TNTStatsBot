const db = require("../db");
const strings = require("../strings.js");
const config = require("../../config.json");
const {errorEmbed, mojangUUIDFetch, fetchStats, mojangNameFetch} = require("../util.js");
	
module.exports = {
	run: async ({message, args}) => {
		let uuid = null,
			discord_id = null;
	
		if (args.length === 1) {
			uuid = args[0];
			discord_id = message.author.id;
		} else {
			return message.channel.send(errorEmbed("Invalid usage", "Expected `[playername/uuid]`"));
		}
		
		const mojangResponse = await (uuid.length > 16 ? mojangNameFetch : mojangUUIDFetch)(uuid),
			  playername = uuid.length > 16 ? mojangResponse[0].name : uuid;
		if (uuid.length <= 16) uuid = mojangResponse.id;
	
		if (message.author.id !== config.owner_id) {
			const data = await fetchStats(uuid);
				
			if (!data.success) {
				return message.channel.send(errorEmbed(...data.error));
			} else if (
				typeof data.user.player.socialMedia === "undefined" ||
				typeof data.user.player.socialMedia.links === "undefined" ||
				typeof data.user.player.socialMedia.links.DISCORD === "undefined"
			) {
				return message.channel.send(errorEmbed("Discord account not linked", strings.unlinked));
			} else if (data.user.player.socialMedia.links.DISCORD !== message.author.tag) {
				return message.channel.send(errorEmbed("Discord account incorrect", `${playername} has their Hypixel profile linked to a different discord user. Did you link the correct discord account?`));
			}
		}
	
		await db.linkUUID(uuid, discord_id);
		return message.channel.send("Successfully set your IGN to `" + playername + "`");
	},
	aliases: [],
	requiresConfiguredChannel: true
};
