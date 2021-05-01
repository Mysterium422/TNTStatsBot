const { getMentioned, errorEmbed, mojangNameFetch } = require("../util.js");
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
		
		const response = await mojangNameFetch(row[0].uuid),
			  currentName = response[response.length - 1].name;
		return message.channel.send(encodeURI("https://namemc.com/profile/" + currentName));
	},
	aliases: []
};
