module.exports = {
    run: async (client, message, args) => {
        return m.channel.send(
            "Use /TNTconfigure to setup the bot: \n" +
            "https://discord.com/oauth2/authorize?client_id=735055542178938960&scope=bot&permissions=2147994688"
        );
    },
    aliases: []
};