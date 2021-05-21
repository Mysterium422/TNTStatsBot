const { getUserSettings } = require("../db.js");

module.exports = {
	run: async ({message, args}) => {
		const existingSettings = await getUserSettings(message.author);
        
	},
	aliases: [],
	requiresConfiguredChannel: true
};
