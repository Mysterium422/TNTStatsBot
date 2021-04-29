const db = require("../db");
const strings = require("../strings.js");
const config = require("../../config.json");
const {errorEmbed, mojangUUIDFetch, getMentioned, getStats} = require("../util.js");

module.exports = {
	run: async (client, message, args, prefix) => {
		const mentioned = getMentioned(message);
		let uuid = null,
			discord_id = null;

		if (args.length === 1) {
			uuid = args[0];
			discord_id = message.author.id;
		} else if (args.length === 2) {
			if (mentioned !== null) {
				if (mentioned.id === message.author.id || message.author.id === config.owner_id) {
					uuid = args[1];
					discord_id = mentioned.id;
				} else {
					return message.channel.send(errorEmbed("Invalid permissions", "Only the bot's owner can verify other users"));
				}
			} else {
				return message.channel.send(errorEmbed("Invalid usage", "Expected `[playername/uuid]` or `[mention] [playername/uuid]`"));
			}
		} else {
			return message.channel.send(errorEmbed("Invalid usage", "Expected `[playername/uuid]` or `[mention] [playername/uuid]`"));
		}

		let playername = null;
		const mojangResponse = await mojangUUIDFetch(uuid);
        if (uuid.length <= 16) {
			// It's actually a username
			playername = uuid;
            if (mojangResponse === null) {
                return message.channel.send(errorEmbed("Invalid playername", `Failed to fetch the UUID of '${uuid}' from the Mojang API`));
            } else {
                uuid = mojangResponse.id;
            }
        } else {
            if (mojangResponse === null) {
                return message.channel.send(errorEmbed("Invalid UUID", `Failed to fetch the playername of '${uuid}' from the Mojang API`));
            } else {
                playername = mojangResponse.name;
            }
		}

		if (message.author.id !== config.owner_id) {
			const data = await getStats(uuid);
			
			if (!data.success) {
				return message.channel.send(errorEmbed(...data.error));
			} else if (
				typeof data.user.player.socialMedia === "undefined" ||
				typeof data.user.player.socialMedia.links === "undefined" ||
				typeof data.user.player.socialMedia.links.DISCORD === "undefined"
			) {
				return message.channel.send(errorEmbed("Discord account not linked", strings.unlinked));
			} else if (data.user.player.socialMedia.links.DISCORD !== message.author.tag) {
				return message.channel.send(errorEmbed("Discord account incorrect", `${playername} has their Hypixel profile linked to a different discord user. Did you link the correct discord account?`));
			}
		}

		debugger;
		await db.linkUUID(uuid, discord_id);
		return message.channel.send("Successfully set your IGN to `" + playername + "`");
	},
	aliases: ["verify", "verifyalt", "setalt"]
};
