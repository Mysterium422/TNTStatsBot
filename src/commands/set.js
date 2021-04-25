const Discord = require("discord.js");
const db = require("../db");
const strings = require("../strings.js");
const {errorEmbed, hypixelFetch, mojangUUIDFetch} = require("../util.js");

module.exports = {
	run: async (client, message, args) => {
		if (args.length !== 2) {
			return message.channel.send(errorEmbed("Incorrect number of arguments for *set*!", "Expected [uuid/playername]"));
		}

		let uuid = args[1];
        if (args[1].length <= 16) {
            const mojangResponse = await mojangUUIDFetch(args[1]);
            if (mojangResponse === null) {
                return message.channel.send(errorEmbed("Invalid playername", `Failed to fetch the UUID of '${args[1]}' from the Mojang API`));
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
		
		let received = "";
		try {
			received = await fs.readFileSync("../global/IDS.json");
		} catch (e) {
			console.warn("File is invalid!");
			process.exit();
		}
		idData = JSON.parse(received);

		idData[user.player.uuid] = message.author.id;
		idData[message.author.id] = user.player.uuid;

		fs.writeFileSync("../global/IDS.json", JSON.stringify(idData));

		await db.set(message.author.id, {
			verbose: false,
			reset: true
		});

		aait;

		return message.channel.send("Successfully set your ign to " + args[0]);
	}
};
