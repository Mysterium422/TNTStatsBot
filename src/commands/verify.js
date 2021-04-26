const config = require("../../config.json");
const {errorEmbed, mojangUUIDFetch} = require("../util.js");
const db = require("../db");

module.exports = {
	run: async (client, message, args) => {
		if (message.author.id !== config.owner_id) return message.channel.send("This is a discord-bot-owner-only command");

		const mentioned = message.mentions.users.first();
		if (args.length !== 2) {
            return message.channel.send(errorEmbed("Incorrect number of arguments for *verify*!", "Expected [mention] [uuid/username]"));
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

        await db.setData(uuid, message.author.id);
        return message.channel.send("Successfully set your IGN to `" + args[0] + "`");
	},
	aliases: []
};
