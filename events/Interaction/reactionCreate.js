import { Events } from "discord.js";
import chalk from "chalk";

export default client => {
    const config = client.config;

    client.on(Events.MessageReactionAdd, async (reaction, user) => {
        if (user.bot) return; // Botları yok say

        const tepkiRolleri = config.reactRoles; // Tepkiler ve roller config'de tanımlanmalı

        if (reaction.message.id !== config.reactMessageID) return; // Doğru mesaj olduğundan emin ol

        const guild = reaction.message.guild;
        const member = guild.members.cache.get(user.id);
        const emoji = reaction.emoji.name;

        const rolBilgisi = tepkiRolleri.find(r => r.emoji === emoji);
        if (!rolBilgisi) return; // Emoji bir role bağlı değilse çık

        const rol = guild.roles.cache.get(rolBilgisi.rolId);
        if (!rol) {
            console.error(chalk.red(`[ERROR]` + ` Rol ID'si ${rolBilgisi.rolId} bulunamadı.`));
            return;
        }

        try {
            await member.roles.add(rol);
            await user.send(`**${rol.name}** rolü size verildi.`);
        } catch (error) {
            console.error(chalk.red(`[ERROR]` + ` Kullanıcıya rol eklenirken bir hata oluştu: ${error}`));
        }
    });

    client.on(Events.MessageReactionRemove, async (reaction, user) => {
        reactionRemove(reaction, user)
    });

    const reactionRemove = async (reaction, user) => {
        if (user.bot) return; // Botları yok say

        const tepkiRolleri = config.reactRoles;

        if (reaction.message.id !== config.reactMessageID) return; // Doğru mesaj olduğundan emin ol

        const guild = reaction.message.guild;
        const member = guild.members.cache.get(user.id);
        const emoji = reaction.emoji.name;

        const rolBilgisi = tepkiRolleri.find(r => r.emoji === emoji);
        if (!rolBilgisi) return; // Emoji bir role bağlı değilse çık

        const rol = guild.roles.cache.get(rolBilgisi.rolId);
        if (!rol) {
            console.error(chalk.red("[ERROR]" + ` Rol ID'si ${rolBilgisi.rolId} bulunamadı.`));
            return;
        }

        try {
            await member.roles.remove(rol);
            await user.send(`**${rol.name}** rolü sizden alındı.`);
        } catch (error) {
            console.error(chalk.red("[ERROR]" + ` Kullanıcıdan rol kaldırılırken bir hata oluştu: ${error}`));
        }
    }

}