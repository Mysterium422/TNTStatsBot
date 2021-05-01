const {errorEmbed, successEmbed, getAvatar} = require("../util.js");
const config = require("../../config.json");

module.exports = {
	run: ({client, message, multiArgs}) => {
		if (message.author.id !== config.owner_id) {
			return message.channel.send(errorEmbed("Invalid permissions", "This command can only be executed by the bot owner"));
		}
		
		// TODO: Every configured channel
		const embed = successEmbed(message.author, multiArgs, "__Announcement__", getAvatar(client.user));
		return message.channel.send(embed);
	},
	aliases: []
};
