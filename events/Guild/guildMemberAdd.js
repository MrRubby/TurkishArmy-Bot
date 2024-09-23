import chalk from "chalk";
import { EmbedBuilder, AuditLogEvent } from "discord.js";

export default (client) => {
    const config = client.config;

    client.on('guildMemberAdd', async (member) => {
        try {
            const { guild, user, client: memberClient } = member;
            const { guildMemberAdd, BotAdd } = AuditLogEvent;

            // Son kullanıcı ekleme logunu çek
            const userLog = await fetchAuditLog(guild, guildMemberAdd);
            const inviteLog = await fetchAuditLog(guild, BotAdd);
            
            // loginEmbed'i önce tanımlıyoruz, sonra çağırıyoruz
            const loginEMBED = loginEmbed(member);

            const channel = memberClient.channels.cache.get(config.guildMemberAdd);
            if (!channel) {
                console.error(chalk.red(`[ERROR]` + ` Giriş kanalı bulunamadı.`));
                return;
            }

            const toplamUye = guild.memberCount;
            const kalanUye = config.hedefUye - toplamUye;

            // Kullanıcı ve sunucu bilgilerini al
            const userInfo = {
                name: user.username,
                id: userLog.executor.id,
                avatar: user.displayAvatarURL({ dynamic: true }),
                createdAt: user.createdTimestamp,
            };

            const clientInfo = {
                name: memberClient.user.username,
                avatar: memberClient.user.displayAvatarURL({ dynamic: true })
            };

            // Davet eden kişi bilgisi
            const inviter = inviteLog.executor;

            // Embedleri oluştur
            const embed = createEmbed(userInfo, clientInfo, toplamUye, config.hedefUye, kalanUye, inviter);
            const embedWithoutInviter = createEmbed(userInfo, clientInfo, toplamUye, config.hedefUye, kalanUye);

            // Hedef üye sayısına göre uygun mesajı gönder
            const embedToSend = toplamUye >= config.hedefUye ? embedWithoutInviter : embed;
            await channel.send({ embeds: [embedToSend] });

            // Sunucuya giren kişiye mesaj gönder
            await user.send({ embeds: [loginEMBED] });

            // Otomatik rol ver
            await assignRole(member, config.autoRol);

        } catch (error) {
            console.error(chalk.red(`[ERROR]` + ` Beklenmeyen bir hata oluştu: ${error}`));
        }
    });

    // Audit log alma fonksiyonu
    const fetchAuditLog = async (guild, logType) => {
        const auditLog = await guild.fetchAuditLogs({ limit: 1, type: logType });
        return auditLog.entries.first();
    };

    // Embed oluşturma fonksiyonu
    const createEmbed = (userInfo, clientInfo, totalMembers, goalMembers, remainingMembers, inviter = null) => {
        const description = [
            `Aramıza [${userInfo.name}](https://discord.com/users/${userInfo.id}) adlı kullanıcı katıldı, merhaba deyin :wave_tone1:`,
            `**${goalMembers}** üye olmamıza **${remainingMembers}** kişi kaldı`,
            `Onun katılmasıyla **${totalMembers}** kişi olduk!`,
            `:calendar: Hesabı <t:${parseInt(userInfo.createdAt / 1000)}:R> oluşturulmuş`,
        ];

        if (inviter) {
            description.push(
                `**Davet Bilgisi**`,
                `:bust_in_silhouette: Davet eden: [${inviter.username}](https://discord.com/users/${inviter.id})`
            );
        }

        return new EmbedBuilder()
            .setColor('Green')
            .setAuthor({ name: `${userInfo.name} aramıza katıldı`, iconURL: userInfo.avatar })
            .setDescription(description.join("\n"))
            .setThumbnail(userInfo.avatar)
            .setFooter({ text: `${clientInfo.name}: Sunucumuza hoş geldin!`, iconURL: clientInfo.avatar });
    };

    // User login Embed fonksiyonu (önce tanımlanmalı)
    const loginEmbed = (member) => {
        return new EmbedBuilder()
            .setAuthor({ name: "Turkish Army Gaming", iconURL: member.client.user.displayAvatarURL({ dynamic: true })})
            .setDescription(`Merhaba ${member.user.username}! 🎉\n\nSunucumuza hoş geldin! Seni aramızda görmekten mutluluk duyuyoruz. 🎊\n\nSunucumuzda tam erişim sağlamak ve topluluğumuzun bir parçası olmak için lütfen aşağıdaki adımları takip ederek kayıt ol:\n\nKayıt Kanalı: <#${client.config.registryChannel}>\nKayıt Talimatları: Kayıt kanalında belirtilen talimatları takip ederek bilgilerini gir ve kayıt işlemini tamamla.\nEğer herhangi bir sorunuz olursa, lütfen sunucudaki yetkililerle iletişime geçmekten çekinmeyin. İyi eğlenceler! 🎮`)
            .setColor("#00b0f4");
    };

    // Otomatik rol verme fonksiyonu
    const assignRole = async (member, roleId) => {
        const role = member.guild.roles.cache.get(roleId);
        if (!role) {
            console.error(chalk.red(`[ERROR]` + ` Belirtilen rol bulunamadı!`));
            return;
        }

        try {
            await member.roles.add(role);
            console.log(chalk.green(`[SUCCESS]` + ` ${member.user.tag} kullanıcısına rol verildi.`));
        } catch (error) {
            console.error(chalk.red(`[ERROR]` + ` Otomatik rol verilirken hata oluştu: ${error}`));
        }
    };
};
