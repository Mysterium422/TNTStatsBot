const db = require("../db");
const {errorEmbed, getMentioned, mojangUUIDFetch} = require("../util.js");

module.exports = {
	run: async (client, message, args) => {
		// TODO: Cleanup
		let uuid = null;
		if (args.length === 0) {
			const rows = await db.select(db.TABLES.VerifiedUsers, {discord: message.author.id});
			if (rows.length === 0) {
				return message.channel.send(errorEmbed("User has no account linked"));
			} else if (rows.length === 1) {
				uuid = rows[0].uuid;
			} else {
				return message.channel.send(errorEmbed("Multiple accounts are not supported"));
			}
		} else if (args.length === 1) {
			const mentioned = getMentioned(message);
			if (mentioned === null) {
                if (args[1].length > 16) {
                    uuid = args[1];
                } else {
                    uuid = mojangUUIDFetch(args[1]).id;
                }
			} else {
				const rows = await db.select(db.TABLES.VerifiedUsers, {discord: mentioned.id});
				if (rows.length === 0) {
					return message.channel.send(errorEmbed("User has no account linked"));
				} else if (rows.length === 1) {
					uuid = rows[0].uuid;
				} else {
					return message.channel.send(errorEmbed("Multiple accounts are not supported"));
				}
			}
		}
	},
	aliases: []
};
