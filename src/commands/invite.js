module.exports = {
    run: async (client, message, args) => {
        return message.channel.send(
            "Use `/TNTconfigure` to set up the bot:\n" +
            "https://discord.com/oauth2/authorize?client_id=735055542178938960&scope=bot&permissions=2147994688"
        );
    },
    aliases: []
};