import { EmbedBuilder, AuditLogEvent } from "discord.js";

export default (client) => {
    const config = client.config;

    client.on('guildMemberRemove', async (member) => {
        try {
            const { guild, user, client: memberClient } = member;

            // Son kullanıcı çıkış logunu çek
            const auditLog = await fetchAuditLog(guild, AuditLogEvent.guildMemberRemove);
            const executor = auditLog.executor;

            const channel = memberClient.channels.cache.get(config.sayacChannel);
            if (!channel) {
                console.error(`[ERROR] Giriş kanalı bulunamadı.`);
                return;
            }

            const toplamUye = guild.memberCount;
            const kalanUye = config.hedefUye - toplamUye;

            // Kullanıcı ve sunucu bilgilerini al
            const userInfo = {
                name: user.username,
                id: executor.id,
                avatar: user.displayAvatarURL({ dynamic: true }),
                joinedAt: member.joinedTimestamp,
            };

            const clientInfo = {
                name: memberClient.user.username,
                avatar: memberClient.user.displayAvatarURL({ dynamic: true })
            };

            // Embed oluştur
            const logEmbed = createLeaveEmbed(userInfo, clientInfo, toplamUye, config.hedefUye, kalanUye);

            // Mesajı gönder
            await channel.send({ embeds: [logEmbed] });

        } catch (error) {
            console.error(`[ERROR] Beklenmeyen bir hata oluştu: ${error}`);
        }
    });

    // Audit log alma fonksiyonu
    const fetchAuditLog = async (guild, logType) => {
        const auditLog = await guild.fetchAuditLogs({ limit: 1, type: logType });
        return auditLog.entries.first();
    };

    // Ayrılma Embed'i oluşturma fonksiyonu
    const createLeaveEmbed = (userInfo, clientInfo, totalMembers, goalMembers, remainingMembers) => {
        return new EmbedBuilder()
            .setColor('Red')
            .setAuthor({ name: `${userInfo.name} aramızdan ayrıldı`, iconURL: userInfo.avatar })
            .setDescription(
                `Sunucumuzdan [${userInfo.name}](https://discord.com/users/${userInfo.id}) adlı kullanıcı ayrıldı, görüşmek üzere!\n` +
                `**${goalMembers}** üye olmamıza **${remainingMembers}** kişi kaldı.\n` +
                `Onun ayrılmasıyla **${totalMembers}** kişi kaldık!\n` +
                `:calendar: Sunucuya <t:${parseInt(userInfo.joinedAt / 1000)}:R> katılmıştı.`
            )
            .setThumbnail(userInfo.avatar)
            .setFooter({ text: `${clientInfo.name}: Kendine iyi bak!`, iconURL: clientInfo.avatar });
    };
};
