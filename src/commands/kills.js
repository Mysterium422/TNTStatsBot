// @ts-check
"use strict";

const strings = require("../strings.js"),
	{errorEmbed, getUUIDFromDiscord, parseUser, getMentioned, GAMES} = require("../util");
const {commandFunction} = require("./stats.js");

module.exports = {
	run: async ({message, args}) => {
		let uuid = null;
		if (args.length === 0) {
			uuid = await getUUIDFromDiscord(message.author.id);
			if (uuid === null) return message.channel.send(errorEmbed("Discord account not linked", strings.unlinked));
		} else if (args.length === 1) {
			const user = await parseUser(args[0], getMentioned(message));
			if (!user.success) return message.channel.send(...user.error);
			uuid = user.uuid;
		}

		return commandFunction(uuid, GAMES.kills, message);
	},
	aliases: [],
	requiresConfiguredChannel: true
};
