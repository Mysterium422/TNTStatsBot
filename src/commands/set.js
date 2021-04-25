const Discord = require("discord.js");
const db = require("../db");
const strings = require("../strings.js");
const {errorEmbed, hypixelFetch, mojangUUIDFetch} = require("../util.js");

module.exports = {
	run: async (client, message, args, prefix) => {
		if (args.length !== 1) {
			return message.channel.send(errorEmbed("Incorrect number of arguments for set!", "Expected [uuid/playername]"));
		}

		let uuid = args[0];
        if (args[0].length <= 16) {
            const mojangResponse = await mojangUUIDFetch(args[0]);
            if (mojangResponse === null) {
                return message.channel.send(errorEmbed("Invalid playername", `Failed to fetch the UUID of '${args[0]}' from the Mojang API`));
            } else {
                uuid = mojangResponse.id;
            }
        }

		const user = hypixelFetch("user?uuid=" + uuid);

		if (user === null) {
			return message.channel.send(errorEmbed("Failed to reach Hypixel API", "Hypixel could be offline?"));
		} else if (!user.success) {
			return message.channel.send(errorEmbed("Something went wrong", user.cause));
		} else if (user.player === null) {
			return message.channel.send(errorEmbed("Invalid playername/uuid", "That player has never logged on to Hypixel!"));
		} else if (!("TNTGames" in user.player.stats)) {
			return message.channel.send(errorEmbed("Invalid playername/uuid", "That player has never played TNT Games!"));
		} else if (
			typeof user.player.socialMedia === "undefined" ||
			typeof user.player.socialMedia.links === "undefined" ||
			typeof user.player.socialMedia.links.DISCORD === "undefined" ||
			user.player.socialMedia.links.DISCORD !== message.author.tag
		) {
			return message.channel.send(errorEmbed("Discord account not linked", strings.unlinked(prefix, args[0])));
		}

		await db.setData(uuid, message.author.id);
		return message.channel.send("Successfully set your IGN to `" + args[0] + "`");
	}
};
