module.exports = {
    name: "template",
    run: async (client, message, args) => {
        message.channel.send("Message Handled!");
    },
	aliases: ["bug","reportbug","report","issue","issues"]
};