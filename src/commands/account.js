const {getMentioned, errorEmbed, UUIDtoName} = require("../util.js");
const db = require("../db");

module.exports = {
	run: async ({message, args}) => {
		let userID = null;
		if (args.length === 0) {
			userID = message.author.id;
		} else if (args.length === 1) {
			const mentioned = getMentioned(message);
			if (mentioned === null) {
				return message.channel.send(errorEmbed("Invalid user", "You must mention the user whose account you wish to inspect"));
			} else {
				userID = mentioned.id;
			}
		}

		const row = await db.select(db.TABLES.VerifiedUsers, {discord: userID});
		if (row.length === 0) {
			return message.channel.send(errorEmbed("Invalid mention", "That user has not linked their account"));
		}

		const currentName = await UUIDtoName(row[0].uuid);
		return message.channel.send(encodeURI("https://namemc.com/profile/" + currentName));
	},
	aliases: [],
	requiresConfiguredChannel: true
};
