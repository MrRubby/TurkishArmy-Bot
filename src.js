import { Client, Collection, GatewayIntentBits, Partials } from "discord.js"
import { readdirSync, readFileSync } from "fs"
import { createRequire } from "node:module"

import path from "path"
import chalk from "chalk"
import database from "croxydb"

const client = new Client({
    partials: [
        Partials.Channel,
        Partials.GuildMember,
        Partials.User,
        Partials.Message
    ],
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildIntegrations,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildPresences,
        GatewayIntentBits.GuildVoiceStates
    ]
})

const require = createRequire(import.meta.url)

const configPath = path.resolve('config/config.json');
const configFile = readFileSync(configPath);
const config = JSON.parse(configFile);

database.setReadable(true)

client.serverIP = config.serverIP
client.serverPORT = config.serverPORT
client.steamAPI = config.steamAPI

client.commands = new Collection
client.database = database
client.config = config
client.require = require

readdirSync("./events").forEach(eventcategory => {

    readdirSync(`./events/${eventcategory}`).forEach(async file => {
        const event = await import(`./events/${eventcategory}/${file}`).then(m => m.default)
        const name = file.split(".")[0];
        event(client)
        console.log(chalk.blue`[EVENT]` + ` ${name} loaded.`)
    })
})

try {
    client.login(config.token)
} catch (err) {
    switch (err.code) {
        case 'TokenInvalid':
            console.error(chalk.red(`[ERROR-TOKEN]` + " Yanlış TOKEN bilgisi sağlandı, TOKEN bilgisini kontrol edin!"));
            process.exit()
            break;
        case 'PrivilegedIntent':
            console.error(chalk.red(`[ERROR-INTENT]` + " INTENTS gereksinimleri karşılanmadı, INTENTS ayarlarını kontrol edin!"))
            process.exit()
            break;
        default:
            console.error(chalk.red(`[ERROR-LOGIN]` + ` Bot çalıştırılırken beklenmedik bir hata oluştu: ${err.message}`))
            process.exit()
            break;
    }
}