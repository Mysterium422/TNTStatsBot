// @ts-check
"use strict";

const db = require("../db");
const strings = require("../strings.js");
const {errorEmbed, successEmbed, GAMES, GAMES_READABLE} = require("../util.js");

module.exports = {
	run: async ({message, args: [game, ...rawPrefix]}) => {
		const prefix = rawPrefix.join(" ");

		if (!message.member.hasPermission("ADMINISTRATOR")) {
			return message.channel.send(errorEmbed("Invalid permissions", strings.admin_only));
		}

		if (!(game in GAMES)) {
			return message.channel.send(errorEmbed("Invalid game type", strings.invalid_game_type));
		}

		if (prefix.length === 0) {
			return message.channel.send(errorEmbed("Invalid prefix", strings.invalid_prefix));
		}

		game = GAMES[game]; // Convert to the internal representation

		await db.configureChannel(message.channel, prefix, game);
		const embed = successEmbed(message.author, "", "Success! Channel Configured");
		embed.addField("__Default Game:__", GAMES_READABLE[game], true);
		embed.addField("__Bot Prefix:__", prefix, true);
		return message.channel.send(embed);
	},
	aliases: ["configure", "config", "setup"],
	requiresConfiguredChannel: false
};
