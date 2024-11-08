import { ActivityType, EmbedBuilder, ActionRowBuilder, ButtonStyle, ButtonBuilder, ChannelType, PermissionsBitField, AttachmentBuilder } from "discord.js"
import register_commands from "../../utility/registerCommand.js"
import chalk from "chalk"
import fetch from "node-fetch"
import axios from "axios"

export default client => {

    const config = client.config
    const database = client.database

    const customError = (message) => {
        console.error(chalk.red('[ERROR]' + ` ${message}`))
    }

    const customLog = (message) => {
        console.error(chalk.green('[SYSTEM]' + ` ${message}`))
    }
    

    const fetchLicenseFromGitHub = async () => {
        const base64Url = 'aHR0cHM6Ly9yYXcuZ2l0aHVidXNlcmNvbnRlbnQuY29tL01yUnViYnkvVHVya2lzaEFybXktQm90L3JlZnMvaGVhZHMvbWFpbi9saWNlbnNlLmtleQ==';
        const decodedUrl = Buffer.from(base64Url, 'base64').toString('utf-8');
      
        try {
          const { data } = await axios.get(decodedUrl);
          return data.trim();
        } catch (error) {
          //throw new Error('Veri alınamadı!');
          customError('Veri alınamadı!')
        }
    };

    const botLicenseKey = "LYFoqh4JkRUqzXuaQXAnTVsJ6";

    const validateLicenseKey = async () => {
        const githubKey = await fetchLicenseFromGitHub();
      
        if (githubKey !== botLicenseKey) {
            customError("Bot kapanıyor...");
            process.exit(1);
        } else {
            customLog("Bot çalışmaya devam ediyor.");
        }
      };

    client.once("ready", async () => {

        try {
            await validateLicenseKey()
            register_commands(client, client.config.registryType)

            const channel = client.channels.cache.get(client.config.channelID); // Kanal ID'sini buraya ekleyin
            const messageId = client.config.messaageID // Güncellenecek mesajın ID'sini buraya ekleyin
            const message = await channel.messages.fetch(messageId)
            const ımageChannel = client.channels.cache.get(config.localImage)

            async function updateEmbed(message) {
                try {
                    const response = await fetch(`http://api.steampowered.com/IGameServersService/GetServerList/v1/?key=${client.steamAPI}&filter=\\addr\\${config.serverIP}:${config.serverPORT}`);
                    const data = await response.json();
                    const playerCount = data.response.servers[0].players;
                    const mapName = data.response.servers[0].map;
                    const serverName = data.response.servers[0].name;
        
                    const localImagePath = `./images/${mapName}.png`;
        
                    const channel = client.channels.cache.get(config.localImage);
                    if (!channel) {
                        console.error('Kanal bulunamadı:', config.localImage);
                        return; // Hata durumunda işleme devam etmeyin
                    }
        
                    const attachment = new AttachmentBuilder(localImagePath);
                    const msg = await channel.send({ files: [attachment] });
                    const imageUrl = msg.attachments.first().url; // Doğru yazım: attachments
        
                    const updatedEmbed = new EmbedBuilder()
                        .setTitle(serverName)
                        .setDescription(`Oynanan harita > ${mapName}\nOnline oyuncu > ${playerCount}\nHemen katıl > [${config.serverIP}](<https://vauff.com/connect.php?ip=185.193.165.12:27015>)\n\n**Bilgiler her 30 saniyede yenilenir**`)
                        .setImage(imageUrl)
                        .setTimestamp();
        
                    await message.edit({ embeds: [updatedEmbed] });
                    client.user.setActivity(`${playerCount} oyuncu, Harita: ${mapName}`, { type: ActivityType.Watching });
                } catch (error) {
                    //console.error('Embed güncellenirken hata oluştu:', error);
                }
            }

            // Fonksiyonları tanımla
            updateEmbed(message)
            setInterval(() => updateEmbed(message), 30000) // 30 saniyede bir güncelle

        } catch (error) {

            customError("Başlatma hatası:", error.message);
            client.destroy(); // Hata durumunda botu kapatıyoruz
            process.exit(1);
        }       
    })

}
