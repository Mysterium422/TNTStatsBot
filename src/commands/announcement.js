// @ts-check
"use strict";

const {errorEmbed, successEmbed, avatarOf} = require("../util.js");
const config = require("../../config.json");
const db = require("../db");

module.exports = {
	run: async ({client, message, multiArgs}) => {
		if (message.author.id !== config.owner_id) {
			return message.channel.send(errorEmbed("Invalid permissions", "This command can only be executed by the bot owner"));
		}

		const embed = successEmbed(message.author, multiArgs, "__Announcement__", avatarOf(client.user));
		const rows = await db.all(db.TABLES.ConfiguredChannels);
		return Promise.all(rows.map(({channel}) => 
			client.channels.fetch(channel).then(c => c.send(embed))
		));
	},
	aliases: ["announce"],
	requiresConfiguredChannel: false
};
