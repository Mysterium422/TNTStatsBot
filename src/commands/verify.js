const config = require("../../config.json");

module.exports = {
	run: async (client, message, args) => {
		if (message.author.id !== config.masterID) return message.channel.send("This is a discord-bot-owner-only command");
        
        const mentioned = message.mentions.users.first();

		if (args.length != 2) {
			return message.channel.send("Incorrect amount of arguments");
		} else if (typeof mentioned === "undefined") {
			return message.channel.send("First argument must mention the member to verify!");
		} else if (args[1].length > 16) {
			data = await hypixelFetch(`player?uuid=${args[1]}`);
		} else {
			const uuidInput = await mojangUUIDFetch(args[1]).catch(() => {
				return {
					id: "UUIDINVALID12345678910"
				};
			});

			if (uuidInput.id.length > 16) {
				data = await hypixelFetch(`player?uuid=${uuidInput.id}`);
			} else {
				data = await hypixelFetch(`player?name=${args[1]}`);
			}
		}

		if (data == "API ERROR") {
			return message.channel.send("API Connection Issues, Hypixel might be offline");
		}
		if (!data.success || data.success == false || data.player == null || data.player == undefined || !data.player || data.player.stats == undefined) return message.channel.send("Invalid Something");
		if (data.player.stats.TNTGames == undefined) return sendErrorEmbed(message.channel, `Unknown Player`, `Player has no Data in Hypixel's TNT Database`);

		let received = "";
		try {
			received = await fs.readFileSync("../global/IDS.json");
		} catch (e) {
			console.warn("File is invalid!");
			process.exit();
		}
		idData = JSON.parse(received);

		idData[data.player.uuid] = args[0].replace("<", "").replace(">", "").replace("@", "").replace("!", "");
		idData[args[0].replace("<", "").replace(">", "").replace("@", "").replace("!", "")] = data.player.uuid;

		await setCacheDB(data.player, data.player.uuid, message.author.id);

		fs.writeFileSync("../global/IDS.json", JSON.stringify(idData));
		message.channel.send(`Registered ${data.player.displayname} to ${args[0]}`);
	},
	aliases: []
};
