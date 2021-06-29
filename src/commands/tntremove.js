// @ts-check
"use strict";

const db = require("../db");
const strings = require("../strings.js");
const {errorEmbed, successEmbed} = require("../util.js");

module.exports = {
	run: async ({message}) => {
		if (!message.member.hasPermission("ADMINISTRATOR")) {
			return message.channel.send(errorEmbed("Invalid permissions", strings.admin_only));
		}
        
        await db.del(db.TABLES.ConfiguredChannels, {channel: message.channel.id});
		const embed = successEmbed(message.author, "", "Success! Channel Removed");
		return message.channel.send(embed);
	},
	aliases: ["remove", "unconfigure"],
	requiresConfiguredChannel: true
};
