const db = require("../db");
const {errorEmbed, getMentioned, mojangUUIDFetch} = require("../util.js");

module.exports = {
	run: async (client, message, args) => {
		// TODO: Cleanup

		let uuid = null;
		const handler = id => {
			const accounts = db.getLinkedAccounts(id);
			if (accounts === null) return message.channel.send(errorEmbed("User has no account linked"));

			// TODO: Inform of multiple linked accounts?
			uuid = accounts[0].uuid;
		};

		if (args.length === 0) {
			// Use the author's linked account
			handler(message.author.id);
		} else if (args.length === 1) {
			// Use the mentioned user's linked account
			const mentioned = getMentioned(message);
			if (mentioned !== null) {
				handler(mentioned.id);
			} else if (args[1].length > 16) {
				uuid = args[1];
			} else {
				uuid = mojangUUIDFetch(args[1]).id;
			}
		}

		debugger;

	},
	aliases: []
};
