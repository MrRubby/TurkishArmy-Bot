export default (client, type = config.registryType) => {

    const commands = client.commands.map(command => command.slash_data)
    const config = client.config
    
    if(type == config.registryType) {
        client.application.commands.set(commands)
        .then(() => {})
    }
    else if(type == config.registryType) {
        const guild = client.guilds.cache.get(client.config.sunucuID)
        guild.commands.set(commands)
        .then(() => {})
    }

}