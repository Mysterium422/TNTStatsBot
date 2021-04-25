const config = require("../../config.json");
const {mojangUUIDFetch, hypixelFetch} = require("../mystFetch.js");
const {errorEmbed} = require("../util.js");

module.exports = {
	run: async (client, message, args) => {
		if (message.author.id !== config.masterID) return message.channel.send("This is a discord-bot-owner-only command");

		const mentioned = message.mentions.users.first();
		if (args.length !== 2) {
            return message.channel.send(errorEmbed("Incorrect number of arguments for *verify*!", "Expected <mention> <uuid/name>"));
		} else if (typeof mentioned === "undefined") {
            return message.channel.send(errorEmbed("Incorrect argument for *verify*!", "The first argument should be the member you wish to verify!"));
		}

        let uuid = args[1];
        if (args[1].length <= 16) {
            const mojangResponse = await mojangUUIDFetch(args[1]);
            if (mojangResponse === null) {
                return message.channel.send(errorEmbed("Invalid username", `Failed to fetch the UUID of '${args[1]}' from the Mojang API`));
            } else {
                uuid = mojangResponse.id;
            }
        }

        message.channel.send(errorEmbed("Verifying is not currently supported", "There is no database"));
	},
	aliases: []
};
