import { ActivityType, EmbedBuilder, ActionRowBuilder, ButtonStyle, ButtonBuilder, ChannelType, PermissionsBitField, AttachmentBuilder } from "discord.js"
import register_commands from "../../utility/registerCommand.js"
import chalk from "chalk"
import fetch from "node-fetch"

export default client => {

    const config = client.config
    const database = client.database

    client.once("ready", async () => {

        register_commands(client, client.config.registryType)

        const channel = client.channels.cache.get(client.config.channelSet.statChannelID); // Kanal ID'sini buraya ekleyin
        const messageId = client.config.channelSet.statMessageID // Güncellenecek mesajın ID'sini buraya ekleyin
        const message = await channel.messages.fetch(messageId)
        const ımageChannel = client.channels.cache.get(config.localImage)


async function updateEmbed(message) {
    try {
        const response = await fetch(`http://api.steampowered.com/IGameServersService/GetServerList/v1/?key=${client.serverInfo.steamAPI}&filter=\\addr\\${config.serverInfo.serverIP}:${config.serverInfo.serverPORT}`);
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
    } catch (error) {
        console.error('Embed güncellenirken hata oluştu:', error);
    }
}

        async function updatePlayerCount() {
            try {
                const response = await fetch(`http://api.steampowered.com/IGameServersService/GetServerList/v1/?key=${config.steamAPI}&filter=\\addr\\${config.serverIP}:${config.serverPORT}`);
                const data = await response.json();
                const playerCount = data.response.servers[0].players;
                const mapName = data.response.servers[0].map;
                const serverName = data.response.servers[0].name;
                client.user.setActivity(`${serverName} (${playerCount} oyuncu, Harita: ${mapName})`, { type: ActivityType.Watching });
                    console.log(chalk.green("[Server]") + chalk.cyan(` ${serverName} sunucusunda toplam ${playerCount} oyuncu oynuyor!`));
            } catch (error) {
                console.error(chalk.red("[API-ERROR]") + ` API isteği sırasında bir hata oluştu, API bilgilerinizi kontrol edin! ${error}`);
                client.user.setActivity(`CS2: Bilgi alınamıyor`, { type: ActivityType.Watching })
            }
        }

        async function firstSetup() {
            const reactChannel = client.channels.cache.get(config.firstSetup.reactChannel);
            const ticketChannel = client.channels.cache.get(config.firstSetup.ticketChannel);
            const regChannel = client.channels.cache.get(config.channelSet.registryChannel);
            const linkedChannel = client.channels.cache.get(config.firstSetup.linkedChannel);
            const application = client.channels.cache.get(config.firstSetup.application);
        
            if (reactChannel) {
                const embed = new EmbedBuilder()
                    .setAuthor({ name: "Turkish Army React", iconURL: client.user.displayAvatarURL({ dynamic: true })})
                    .setDescription("Aşağıdaki emojilere tıklayarak ilgili odaları görünür veya gizli yapabilirsiniz. İstediğiniz zaman tekrar kullanarak mevcut rollerinizi değiştirebilirsiniz.\n\n👍 > Pro Public Server\n👎 > Jailbreak Server")
                    .setColor("#00b0f4");
        
                const reactMessage = await reactChannel.send({ embeds: [embed] });
                await reactMessage.react('👍');  // 1. tepki ekle
                await reactMessage.react('👎');  // 2. tepki ekle
        
                // Mesaj ID'sini config'e kaydetmeniz gerekebilir
                console.log(`Tepki mesajının ID'si: ${reactMessage.id}`);
            } else {
                console.error(`React kanalı bulunamadı: ${config.firstSetup.reactChannel}`);
            }
        
            if (ticketChannel) {
                const ticEmbed = new EmbedBuilder()
                    .setAuthor({ name: "Turkish Army Destek", iconURL: client.user.displayAvatarURL({ dynamic: true }) })
                    .setDescription("Yaşadığınız sorunları, şikayetleri veya önerilerinizi destek bileti üzerinden bizlere iletebilirsiniz. Aşağıdaki butonu kullanarak uygun kategori üzerinden destek talebinizi oluşturabilirsiniz.")
                    .setColor("#00b0f4")
        
                const ticButton = new ActionRowBuilder().addComponents(
                    new ButtonBuilder()
                        .setCustomId('newTicket')
                        .setLabel('Destek Oluştur')
                        .setEmoji('🎫')
                        .setStyle(ButtonStyle.Success)
                );
        
                const category = await ticketChannel.guild.channels.create({
                    name: 'Ticket Log',
                    type: ChannelType.GuildCategory,
                    permissionOverwrites: [
                        {
                            id: ticketChannel.guild.id,
                            deny: [PermissionsBitField.Flags.ViewChannel],
                        },
                    ],
                });
        
                const ticketLog = await ticketChannel.guild.channels.create({
                    name: 'ticket-log',
                    type: ChannelType.GuildText,
                    parent: category.id,
                    permissionOverwrites: [
                        {
                            id: ticketChannel.guild.id,
                            deny: [PermissionsBitField.Flags.ViewChannel],
                        },
                    ],
                });
        
                database.set(`ticketKatagor_${ticketChannel.guild.id}`, { category: category.id, log: ticketLog.id });
                database.set(`ticketSistem_${ticketChannel.guild.id}`, { isOpen: true });
        
                await ticketChannel.send({ embeds: [ticEmbed], components: [ticButton] });
            } else {
                console.error(`Ticket kanalı bulunamadı: ${config.firstSetup.ticketChannel}`);
            }
        
            if (regChannel) {
                const registEmbed = new EmbedBuilder()
                    .setAuthor({ name: "Turkish Army Kayıt Sistemi", iconURL: client.user.displayAvatarURL({ dynamic: true })})
                    .setDescription("Sunucumuza hoş geldiniz! 🎉 Sunucumuzun tüm avantajlarından faydalanabilmek için lütfen kaydınızı yaptırın. Aşağıdaki butona tıklayarak kaydınızı kolayca gerçekleştirebilirsiniz.")
                    .setColor("#00b0f4");
        
                const regButton = new ActionRowBuilder().addComponents(
                    new ButtonBuilder()
                        .setCustomId('newRegist')
                        .setLabel('Kayıt Oluştur')
                        .setEmoji('✔')
                        .setStyle(ButtonStyle.Success)
                );
        
                await regChannel.send({ embeds: [registEmbed], components: [regButton] });
            } else {
                console.error(`Kayıt kanalı bulunamadı: ${config.channelSet.registryChannel}`);
            }

            if (linkedChannel) {

                const embed = new EmbedBuilder()
                .setAuthor({name: "Turkish Army Gaming", iconURL: client.user.displayAvatarURL({ dynamic: true })})
                .setDescription("Topluluk bağlantılarımız 🌐\n\nAşağıdaki bağlantılardan topluluğumuzla daha fazla etkileşimde bulunabilirsiniz:\n\nSteam Community: Yeni Steam adresimiz - 2010 yılından beri Counter-Strike: Source’da adını duyurmuş efsanevi takımımızın yeni adresi.\n\nInstagram: Instagram’da bizi takip edin - Resimlerimizi beğenin ve topluluğumuzun bir parçası olun!\n\nDiscord: Discord sunucumuza katılın - Arkadaşlarınızla oyun oynayın ve sohbet edin!")
                .setColor("#00b0f4");

                const linkedButton = new ActionRowBuilder().addComponents(
                    new ButtonBuilder()
                        .setLabel('Steam Community')
                        .setEmoji('✔')
                        .setStyle(ButtonStyle.Link)
                        .setURL("https://steamcommunity.com/groups/trarmyturkish"),
                    new ButtonBuilder()
                        .setLabel("İnstagram")
                        .setEmoji('✔')
                        .setStyle(ButtonStyle.Link)
                        .setURL("https://www.instagram.com/trarmygaming/"),
                    new ButtonBuilder()
                        .setLabel("Discord")
                        .setEmoji('✔')
                        .setStyle(ButtonStyle.Link)
                        .setURL("https://www.discord.gg/tragg")
                );

                linkedChannel.send({ embeds: [embed], components: [linkedButton] })

            } else {
                console.error(`Linkler kanalı bulunamadı: ${config.channelSet.registryChannel}`);
            }

            if (application) {

                const embed = new EmbedBuilder()
                .setAuthor({name: "Turkish Army Başvuru", iconURL: client.user.displayAvatarURL({ dynamic: true })})
                .setDescription("Sunucumuzda yetkili olmak ister misiniz? Aşağıdaki formu doldurarak başvurunuzu tamamlayabilirsiniz. Başvurunuz değerlendirildikten sonra size geri dönüş yapılacaktır. Yetkili olarak sunucumuzun düzenini sağlamak ve topluluğumuza katkıda bulunmak için sabırsızlanıyoruz!")
                .setColor("#00b0f4");

                const appButton = new ActionRowBuilder().addComponents(
                    new ButtonBuilder()
                        .setCustomId('newApp')
                        .setLabel('Başvuru Oluştur')
                        .setEmoji('✔')
                        .setStyle(ButtonStyle.Success)
                );

                application.send({ embeds: [embed], components: [appButton]})

            } else {
                console.error(`Başvuru kanalı bulunamadı: ${config.firstSetup.application}`);
            }
        }

        async function updateMemberCounts() {
            const guild = client.guilds.cache.get(config.system.SunucuID); // Replace with your guild ID
            if (!guild) {
                console.log('Guild not found');
                return;
            }
        
            const totalMembers = guild.memberCount;
            const activeMembers = guild.members.cache.filter(member => member.presence?.status !== 'offline').size;
            const voiceMembers = guild.members.cache.filter(member => member.voice.channel).size;
        
            const activeMemberChannel = guild.channels.cache.get(config.activeMemberChannel); // Replace with your channel ID
            const voiceMemberChannel = guild.channels.cache.get(config.voiceMemberChannel); // Replace with your channel ID
        
            if (activeMemberChannel) {
                await activeMemberChannel.setName(`Aktif Üye - ${activeMembers} / ${totalMembers}`);
            }
        
            if (voiceMemberChannel) {
                await voiceMemberChannel.setName(`Ses Üye - ${voiceMembers}`);
            }
        }

        // Fonksiyonları tanımla
        updateEmbed(message)
        updatePlayerCount()
        updateMemberCounts()
        //firstSetup()

        console.log(chalk.blue("[READY]") + (" Bot sorunsuz çalışıyor!"))
        setInterval(updatePlayerCount, 10 * 60 * 1000) // 10 dakika
        //setInterval(() => updateEmbed(message), 30000) // 30 saniyede bir güncelle
        setInterval(updateMemberCounts, 60000) // 1 dakikada bir güncelle

    })

}