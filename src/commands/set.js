// @ts-check
"use strict";

const db = require("../db"),
	strings = require("../strings.js"),
	config = require("../../config.json"),
	{errorEmbed, parseUser} = require("../util.js"),
	{fetchStats} = require("../stats-utils.js");

module.exports = {
	run: async ({message, args}) => {
		// TODO: confusing error message
		if (args.length !== 1) return message.channel.send(errorEmbed("Invalid usage", strings.see_help));

		const parsed = await parseUser(args[0]);
		if (!parsed.success) return message.channel.send(errorEmbed(...parsed.error));
		const {uuid} = parsed;

		const data = await fetchStats(uuid);
		let playername = data.user.player.displayname;

		if (message.author.id !== config.owner_id) {
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

		await db.linkUUID(uuid, message.author.id);
		return message.channel.send("Successfully set your IGN to `" + playername + "`");
	},
	aliases: [],
	requiresConfiguredChannel: true
};
