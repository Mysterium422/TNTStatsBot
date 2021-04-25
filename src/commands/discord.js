const TEXT = 
`**Discord Links**
**TNT Games** - <https://discord.gg/5gTM5UZdQb>
**TNT Wizards** - <https://discord.gg/95T6ZHa>
**TNT Run** - <https://discord.gg/W9xBSjt>
**TNT Tag** - <https://discord.gg/FsneyHHRRt>
**PVP Run** - <https://discord.gg/DRX8Jkt>
**Bow Spleef** - <https://discord.gg/sE4uNVs6MF>

**My Server** - <https://discord.gg/7Qb5xuJD4C> `;

module.exports = {
	run: async (client, message, args) => {
		return message.channel.send(TEXT);
	}
};
