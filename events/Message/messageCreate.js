import { EmbedBuilder } from "discord.js";

export default client => {

    const config = client.config; // config'i kullanıyoruz
    const prefix = config.prefix;

    client.on("messageCreate", async message => {

        // Bot tarafından gönderilen mesajları yok say
        if (message.author.bot) return;

        if (message.content === 'sa') {
            message.channel.send(`<@${message.author.id}> Selam! Sunucumuzda tatil havası var gibi görünüyor. Keyifli vakit geçirmenizi dilerim! :relaxed:`);
        }

        // Prefix ile başlamayan mesajları yok say
        if (!message.content.startsWith(prefix)) return;

        // Mesaj komutlarını ayırıyoruz
        const args = message.content.slice(prefix.length).trim().split(/ +/);
        const command = args.shift().toLowerCase();

        // Komutlara göre işlem yapıyoruz
        switch (command) {
            case 'ip':
                // IP embed'ini sadece bu komutta oluşturuyoruz
                const ipEmbed = new EmbedBuilder()
                    .setAuthor({ name: "Turkish Army", iconURL: message.client.user.displayAvatarURL({ dynamic: true }) }) // "dynmaic" typo'su düzeltildi
                    .setTitle("Sunucu Bilgileri")
                    .setDescription("Counter-Strike 2 topluluğumuza ait sunucu bilgilerini buradan bulabilirsin.")
                    .addFields(
                        { name: "TurkishArmy PRO", value: "```\n185.193.165.12:27015\n```", inline: false },
                        { name: "TurkishArmy JailBreak", value: "```\n185.193.165.203:27015\n```", inline: false }
                    )
                    .setImage("attachment://logo.png")
                    .setColor("#00b0f4")
                    .setFooter({ text: "Turkish Army", iconURL: message.client.user.displayAvatarURL({ dynamic: true }) })
                    .setTimestamp();

                // Embed mesajını gönder
                await message.channel.send({ embeds: [ipEmbed] });
                break;
            case 'ping':
                
                const ping = Date.now() - message.createdTimestamp;
        		message.channel.send(`Pong! Bot gecikmesi: ${ping}ms`);

            // Başka komutlar buraya eklenebilir
            default:
                break;
        }
    });
};
