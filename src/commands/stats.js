const db = require("../db");
const {errorEmbed, getMentioned, mojangUUIDFetch} = require("../util.js");

module.exports = {
	run: async (client, message, args) => {
		// TODO: Cleanup

		let uuid = null;
		const handler = async discord => {
			const rows = await db.select(db.TABLES.VerifiedUsers, {discord});
			if (rows.length === 0) return null;
			// TODO: Inform of multiple linked accounts?
			return rows[0].uuid;
		};

		if (args.length === 0) {
			// Use the author's linked account
			uuid = await handler(message.author.id);
		} else if (args.length === 1) {
			// Use the mentioned user's linked account
			const mentioned = getMentioned(message);
			if (mentioned !== null) {
				uuid = await handler(mentioned.id);
			} else if (args[1].length > 16) {
				uuid = args[1];
			} else {
				uuid = mojangUUIDFetch(args[1]).id;
			}
		}

		if (uuid === null) {
			return message.channel.send(errorEmbed("User has no account linked"));
		}

		debugger;
	},
	aliases: []
};
