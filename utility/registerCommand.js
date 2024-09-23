export default (client, type = config.registryType) => {

    const commands = client.commands.map(command => command.slash_data)
    const config = client.config
    
    if(type == config.system.registryType) {
        client.application.commands.set(commands)
        .then(() => {})
    }
    else if(type == config.system.registryType) {
        const guild = client.guilds.cache.get(client.config.system.sunucuID)
        guild.commands.set(commands)
        .then(() => {})
    }

}