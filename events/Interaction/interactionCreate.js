import chalk from "chalk";
import moment from "moment"
import { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder, ChannelType, PermissionsBitField, ModalBuilder, TextInputBuilder, TextInputStyle, UserSelectMenuBuilder } from "discord.js";

export default (client) => {

    const config = client.config;
    const database = client.database;

    client.on('interactionCreate', async (interaction) => {
        try {
            const { customId, message } = interaction;
            if (!interaction.isCommand() && interaction.isStringSelectMenu() && interaction.isModalSubmit()) return;

            if (customId === "newTicket") {
                await handleNewTicket(interaction);
            }

            if (customId === "closeTicket") {
                await handleCloseTicket(interaction);
            }

            if (customId === "newRegist") {
                await openModalReg(interaction)
            }

            if (customId === 'registrationModal') {
                await completeReg(interaction)
            }

            if (customId === "newApp") {
                await openModalApp(interaction)
            }

            if (customId === "applicationModal") {
                await completeApp(interaction)
            }
            
            if (customId === "application_resolve") {
                await appSucces(interaction)
            }

            if (customId === "application_cancel") {
                await appDecline(interaction)
            }
            
            if (customId === "addUserToTicket") {
                await handleAddUserToTicket(interaction)
            }

            if (customId === "selectUser") {
                await handleSelectUser(interaction)
            }

            if (customId === "delUserToTicket") {
                await handleDelUserToTicket(interaction)
            }

            if (customId === "selectUserDel") {
                await handleDelSelectUser(interaction)
            }
            
            if (customId === "proPub") {
                await handleReactProPublic(interaction)
            }
            
            if (customId === "jail") {
                await handleReactJailbreak(interaction)
            }

        } catch (error) {
            console.error(`[ERROR] Beklenmeyen bir hata oluştu: ${error}`);
        }

    });

    // Yeni ticket oluşturma fonksiyonu
    const handleNewTicket = async (interaction) => {
        const ticketSistem = database.fetch(`ticketSistem_${interaction.guild.id}`);
        const ticketKatagor = database.fetch(`ticketKatagor_${interaction.guild.id}`);

        if (!ticketSistem || !ticketKatagor) {
            return interaction.reply({ content: "❌ Ticket sistemi veya kategorisi ayarlanmamış!", ephemeral: true });
        }

        if (database.has(`ticket_${interaction.user.id}`)) {
            return interaction.reply({ content: `Zaten açık bir destek talebiniz var.`, ephemeral: true });
        }

        // Yeni destek kanalı oluşturma
        const channel = await createTicketChannel(interaction, ticketKatagor.category);

        // Embed ve butonları oluşturma
        const openTicEmbed = createTicketEmbed(interaction);
        const closeButton = createCloseButton();
        const addButton = createAddButton()
        const delButton = createDelButton()
        const buttonRow = new ActionRowBuilder().addComponents(closeButton, addButton, delButton);

        interaction.reply({ content: `Sorunun için [destek kanalı](https://discord.com/channels/${interaction.guild.id}/${channel.id}) oluşturuldu!`, ephemeral: true });

        // Kanalda mesaj gönderme
        const chnlMessage = await channel.send({ embeds: [openTicEmbed], components: [buttonRow] });

        // Veritabanına kayıt etme
        database.set(`ticket_${chnlMessage.id}`, { channelId: channel.id, userId: interaction.user.id });
        database.set(`ticket_${interaction.user.id}`, { userId: interaction.user.id });

        // Mesajı sabitle
        await chnlMessage.pin();
    };

    // Ticket kanalı oluşturma fonksiyonu
    const createTicketChannel = async (interaction, parentCategoryId) => {
        const guild = interaction.guild;
        const userId = interaction.user.id;

        return await guild.channels.create({
            name: `destek-${interaction.user.username}`,
            type: ChannelType.GuildText,
            parent: parentCategoryId,
            permissionOverwrites: [
                {
                    id: guild.roles.everyone,
                    deny: [PermissionsBitField.Flags.ViewChannel],
                },
                {
                    id: userId,
                    allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages],
                },
                {
                    id: config.ticketRol,
                    allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages],
                },
            ],
        });
    };

    // Destek açıldığında gönderilecek embed
    const createTicketEmbed = (interaction) => {
        return new EmbedBuilder()
            .setAuthor({ name: "Turkish Army Destek", iconURL: interaction.client.user.displayAvatarURL({ dynamic: true }) })
            .setDescription(`<@${interaction.user.id}> destek talebin oluşturuldu. Yetkili kişiler en kısa sürede iletişim kuracaktır. Sorununuzu belirtmeniz süreci hızlandıracaktır.`)
            .setColor("#00b0f4");
    };

    // Kapat butonu oluşturma fonksiyonu
    const createCloseButton = () => {
        return new ButtonBuilder()
            .setCustomId("closeTicket")
            .setEmoji('❌')
            .setLabel("Bileti Kapat")
            .setStyle(ButtonStyle.Success);
    };

    // Kişi ekle butonu oluşturmaa fonksiyonu
    const createAddButton = () => {
        return new ButtonBuilder()
        .setCustomId("addUserToTicket")
        .setEmoji('➕')
        .setLabel("Kişi Ekle")
        .setStyle(ButtonStyle.Primary);
    }

    // Kişi çıkar butonu oluşturma fonksiyonu
    const createDelButton = () => {
        return new ButtonBuilder()
        .setCustomId("delUserToTicket")
        .setEmoji('❌')
        .setLabel("Kişi Çıkar")
        .setStyle(ButtonStyle.Primary);
    }

    // Kullanıcıyı seçme ve ekleme menüsü oluşturma
    const handleAddUserToTicket = async (interaction) => {
        // UserSelectMenu oluşturma
        const userSelectMenu = new UserSelectMenuBuilder()
        .setCustomId("selectUser")
        .setPlaceholder("Kişi Seç")
        .setMinValues(1)

        const row = new ActionRowBuilder().addComponents(userSelectMenu);

        // Menüyü gösterme
        await interaction.reply({ content: "Kanala eklemek istediğiniz kişiyi seçin:", components: [row], ephemeral: true });
    };

    // Kullanıcıyı seçme ve çıkarma menüsü oluşturma
    const handleDelUserToTicket = async (interaction) => {
        // UserSelectMenu oluşturma
        const userSelectMenu = new UserSelectMenuBuilder()
        .setCustomId("selectUserDel")
        .setPlaceholder("Kişi Seç")
        .setMinValues(1)

        const row = new ActionRowBuilder().addComponents(userSelectMenu);

        // Menüyü gösterme
        await interaction.reply({ content: "Kanaldan çıkarmak istediğiniz kişiyi seçin:", components: [row], ephemeral: true });
    }

    // Seçilen kullanıcıyı destek kanalına ekleme
    const handleSelectUser = async (interaction) => {
        const selectedUserId = interaction.values[0];
        const channel = interaction.channel;
    
        // Kanalda kullanıcının izinlerini kontrol et
        const existingPermissions = channel.permissionOverwrites.cache.get(selectedUserId);
    
        if (existingPermissions) {
            // Kullanıcının zaten kanal izinleri varsa uyarı mesajı gönder
            return await interaction.reply({ content: `<@${selectedUserId}> zaten bu kanalda mevcut.`, ephemeral: true });
        }
    
        // Kullanıcıyı kanala ekleme
        await channel.permissionOverwrites.edit(selectedUserId, {
            ViewChannel: true,
            SendMessages: true
        });
    
        // Bilgilendirme mesajı
        const user = await interaction.guild.members.fetch(selectedUserId);
        await interaction.reply({ content: `<@${user.id}> başarıyla kanala eklendi!`, ephemeral: true });
    };

    // Seçilen kullanıcıyı destek kanalından çıkarma
    const handleDelSelectUser = async (interaction) => {
        const selectedUserId = interaction.values[0];
        const channel = interaction.channel;

        // Kanalda kullanıcının izinlerini kontrol et
        const existingPermissions = channel.permissionOverwrites.cache.get(selectedUserId);

        if (existingPermissions) {

            // Kullanıcının izinlerini sil
            await channel.permissionOverwrites.delete(selectedUserId);
            // Bilgilendirme mesajı
            await interaction.reply({ content: `<@${selectedUserId}> başarıyla kanaldan çıkarıldı!`, ephemeral: true });

        } else {
            // Kullanıcının kanal izinleri yoksa mesaj gönder
            return await interaction.reply({ content: `<@${selectedUserId}> zaten bu kanalda mevcut değil.`, ephemeral: true });
        }
    
    }

// Ticket kapatma fonksiyonu
    const handleCloseTicket = async (interaction) => {
        const ticket = database.get(`ticket_${interaction.message.id}`);
        const logChannel = await interaction.client.channels.cache.get(database.fetch(`ticketKatagor_${interaction.guild.id}`).log);

        if (!interaction.member.roles.cache.has(config.ticketRol)) {
            return interaction.reply({ content: "❌ Bu komutu kullanmaya yetkiniz yok!", ephemeral: true });
        }

        const channel = interaction.guild.channels.cache.get(ticket.channelId);
        const user = await interaction.client.users.fetch(ticket.userId);

        const logEmbed = createCloseTicketEmbed(user, channel, interaction);

        await logChannel.send({ embeds: [logEmbed] });
        await user.send({ embeds: [logEmbed] });

        database.delete(`ticket_${interaction.message.id}`);
        database.delete(`ticket_${user.id}`);
        await channel.delete();
    };

    // Ticket kapatıldığında gönderilecek embed
    const createCloseTicketEmbed = (user, channel, interaction) => {
        return new EmbedBuilder()
            .setColor("Red")
            .setTitle("Bir Talep Kapatıldı.")
            .setThumbnail(interaction.client.user.displayAvatarURL({ dynamic: true }))
            .addFields([
                { name: `Talep Sahibi`, value: `<@${user.id}> - \`\`${user.id}\`\`` },
                { name: `Talep Sonlandıran`, value: `<@${interaction.user.id}> - \`\`${interaction.user.id}\`\`` },
                { name: `Kanal`, value: `<#${channel.id}> - \`\`Ticket-${user.username}\`\` ` },
            ])
            .setFooter({ text: "Turkish Army | Copyright ©️ 2024 Tüm Hakları Saklıdır." });
    };

    // Kayıt butonunda açılacak menü
    const openModalReg = async (interaction) => {

        const modal = new ModalBuilder()
        .setCustomId('registrationModal')
        .setTitle('Kayıt Ol');

        const nameInput = new TextInputBuilder()
        .setCustomId('userName')
        .setLabel('Adınız')
        .setStyle(TextInputStyle.Short)
        .setRequired(true);

        const ageInput = new TextInputBuilder()
        .setCustomId('userAge')
        .setLabel('Yaşınız')
        .setStyle(TextInputStyle.Short)
        .setRequired(true);

        const actionRow1 = new ActionRowBuilder().addComponents(nameInput);
        const actionRow2 = new ActionRowBuilder().addComponents(ageInput);

        modal.addComponents(actionRow1, actionRow2);

        // Kullanıcıya modal'ı göster
        await interaction.showModal(modal);

    }

    // Kayıt işleminin tamamlanması
const completeReg = async (interaction) => {

    const enteredName = interaction.fields.getTextInputValue('userName');
    const enteredAge = interaction.fields.getTextInputValue('userAge');

    // Yaş doğrulama
    const age = parseInt(enteredAge);
    if (isNaN(age) || age < 13 || age > 100) {
        return await interaction.reply({ content: '❌ Geçersiz yaş girdiniz. Yaşınız 13 ile 100 arasında olmalıdır.', ephemeral: true });
    }

    // Kullanıcıya yeni rolü ver
    const role = interaction.guild.roles.cache.get(config.registryRol);
    if (role) {
        await interaction.member.roles.add(role);
    }

    // Kullanıcının ismini güncelleme
    const newNickname = `${enteredName} | ${enteredAge}`;
    await interaction.member.setNickname(newNickname);

    // Kullanıcıya DM ile başarı mesajı gönderme
    try {
        await interaction.user.send({
            content: `Başarıyla kayıt oldunuz! Adınız: **${enteredName}**, Yaşınız: **${enteredAge}**`
        });
    } catch (error) {
        console.error(`[ERROR] Kullanıcıya DM gönderilemedi: ${error.message}`);
        await interaction.reply({ content: '❌ Özel mesaj gönderilemedi, DM kutunuz kapalı olabilir.', ephemeral: true });
    }

    // Sunucu kanalında sessiz yanıt gönderme
    await interaction.reply({ content: 'Kayıt işleminiz tamamlandı! DM kutunuzu kontrol edin.', ephemeral: true });

}

    // Başvuru butonunda açılacak menü
    const openModalApp = async (interaction) => {

        // Veritabanından başvuru verilerini çekiyoruz
        const applicationData = database.get('applications') || [];
        const applicationIndex = applicationData.findIndex(data => data.user === interaction.user.id);

        // Kullanıcının başvuru verisini alıyoruz
        const userData = applicationData[applicationIndex];
    
        // Başvuru zamanını çekip timestamp'e dönüştürüyoruz
        //const applicationTime = Math.floor(new Date(userData.applicationTime).getTime() / 1000);
 
        if (database.has(`appComp_${interaction.user.id}`)) return interaction.reply({ content: `<t:${applicationTime}:R> Yaptığınız başvurunun sonucu henüz belirlenmediği için yeni bir başvuru yapmanıza ne yazık ki izin veremiyoruz. Başvurunuzun üzerinden uzun bir süre geçtiyse, destek ekibimizden bilgi talep edebilirsiniz.`, ephemeral: true})

        const modal = new ModalBuilder()
        .setCustomId('applicationModal')
        .setTitle('Başvuru Yap');

        const nameInput = new TextInputBuilder()
        .setCustomId('userName')
        .setLabel('Adınız?')
        .setStyle(TextInputStyle.Short)
        .setRequired(true);

        const ageInput = new TextInputBuilder()
        .setCustomId('userAge')
        .setLabel('Yaşınız?')
        .setStyle(TextInputStyle.Short)
        .setRequired(true);

        const steamNameInput = new TextInputBuilder()
        .setCustomId('steamName')
        .setLabel('Steam adınız?')
        .setStyle(TextInputStyle.Short)
        .setRequired(true);

        const lınkInput = new TextInputBuilder()
        .setCustomId('steamLınk')
        .setLabel('Steam adresiniz?')
        .setStyle(TextInputStyle.Short)
        .setRequired(true);

        const actionRow1 = new ActionRowBuilder().addComponents(nameInput);
        const actionRow2 = new ActionRowBuilder().addComponents(ageInput);
        const actionRow3 = new ActionRowBuilder().addComponents(steamNameInput);
        const actionRow4 = new ActionRowBuilder().addComponents(lınkInput);

        modal.addComponents(actionRow1, actionRow2, actionRow3, actionRow4);

        // Kullanıcıya modal'ı göster
        await interaction.showModal(modal);
    }

    // Başvuru işleminin tamamlanması ve onaylama işlemi için bekletilmesi
    const completeApp = async (interaction) => {
        const enteredName = interaction.fields.getTextInputValue('userName');
        const enteredAge = interaction.fields.getTextInputValue('userAge');
        const enteredSteamName = interaction.fields.getTextInputValue('steamName');
        const enteredSteamLink = interaction.fields.getTextInputValue('steamLınk');
    
        const applicationLog = client.channels.cache.get(config.applicationLog);
    
        try {
            const applicationTime = new Date().toISOString();
            const userID = interaction.user.id;
    
            const applicationData = {
                user: userID,
                applicationTime: applicationTime,
                messageId: null
            };
    
            const appLog = new EmbedBuilder()
                .setAuthor({ name: "Turkish Army Başvuru", iconURL: interaction.client.user.displayAvatarURL({ dynamic: true }) })
                .setDescription(`<@${userID}> - \`${userID}\` kullanıcısı başvuruda bulundu! Başvurusunu değerlendirmeyi unutma!`)
                .addFields(
                    { name: "(Soru) Adınız?", value: `${enteredName}`, inline: false },
                    { name: "(Soru) Yaşınız?", value: `${enteredAge}`, inline: false },
                    { name: "(Soru) Steam Adınız?", value: `${enteredSteamName}`, inline: false },
                    { name: "(Soru) Steam Adresiniz", value: `${enteredSteamLink}`, inline: false }
                )
                .setColor("#00b0f4");
    
            const appButton = new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setCustomId(`application_resolve`)
                    .setLabel(`Kabul Et`)
                    .setEmoji(`✅`)
                    .setStyle(ButtonStyle.Success),
                new ButtonBuilder()
                    .setCustomId(`application_cancel`)
                    .setLabel(`Reddet`)
                    .setEmoji(`❌`)
                    .setStyle(ButtonStyle.Danger)
            );
    
            const appMessage = await applicationLog.send({ embeds: [appLog], components: [appButton] });
            applicationData.messageId = appMessage.id;
            database.push(`applications`, applicationData);
            database.set(`appComp_${userID}`, userID)
    
            interaction.reply({ content: `Başvurunuz değerlendirilmek üzere sıraya alındı. Başvurunuz ile ilgili herhangi bir eylemde bilgilendirileceksiniz!`, ephemeral: true});
        } catch (error) {
            console.error(chalk.red("[ERROR]" + ` ${interaction.user.username} kullanıcısının başvuru işlemi tamamlanamadı: ${error}`));
        }
    }

    // Başvuru onaylama fonksiyonu
    const appSucces = async (interaction) => {
        const applicationData = database.get('applications') || [];
        const applicationIndex = applicationData.findIndex(data => data.messageId === interaction.message.id);
    
        if (!applicationIndex === -1) {
            interaction.reply({
                content: `❌ Ops, Görünüşe göre başvuru verisi bulunamadı. Lütfen bu durumu yetkililere bildir!`,
                ephemeral: true
            });
    
            const button = new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setCustomId('appNotFound')
                    .setLabel('Otomatik RED')
                    .setStyle(ButtonStyle.Primary)
                    .setEmoji('❌')
                    .setDisabled(true)
            );
    
            await interaction.update({ components: [button] });
            return;
        }
    
        const message = await interaction.channel.messages.fetch(interaction.message.id);
        const oldEmbed = message.embeds[0]; // Eski embed'i alıyoruz
    
        const userData = applicationData[applicationIndex];
        const user = await interaction.client.users.fetch(userData.user); // Kullanıcıyı getiriyoruz
        const applicationTime = Math.floor(new Date(userData.applicationTime).getTime() / 1000); // Zamanı düzeltiyoruz
    
        // Eski embed'in tüm alanlarını kopyalayarak yeni embed oluşturuyoruz
        const newEmbed = EmbedBuilder.from(oldEmbed) 
            .setDescription(`\`${user.username}\` - \`${user.id}\` kullanıcısının başvurusu <@${interaction.user.id}> - \`${interaction.user.id}\` tarafından onaylandı. Geri kalan işlemler için kullanıcı ile iletişim kurmanız gerekebilir!`);
    
        const button = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId('appSucces')
                .setLabel('Onaylandı')
                .setStyle(ButtonStyle.Primary)
                .setEmoji('✅')
                .setDisabled(true)
        );
    
        await interaction.update({ embeds: [newEmbed], components: [button] });
    
        // Kullanıcıya özel mesaj gönderiyoruz
        user.send({
            content: `Merhaba <@${user.id}>, <t:${applicationTime}:R> yapmış olduğun başvuru kabul edildi. Yetkili kişilerin seninle iletişim kurma ihtimali olduğunu lütfen unutma!`
        });
    
        // Veritabanından başvuruyu siliyoruz
        applicationData.splice(applicationIndex, 1);
        database.set('applications', applicationData);
        database.delete(`appComp_${user.id}`);
    };

    // Başvuru reddetme fonksiyonu
    const appDecline = async (interaction) => {

        const applicationData = database.get('applications') || [];
        const applicationIndex = applicationData.findIndex(data => data.messageId === interaction.message.id);
    
        // Kontrolü düzeltiyoruz
        if (!applicationIndex === -1) {
            interaction.reply({
                content: `❌ Ops, Görünüşe göre başvuru verisi bulunamadı. Bu aşamada hiç bir şey yapmazsın, lütfen bu durumu yetkililere bildir!`,
                ephemeral: true
            });
    
            const button = new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setCustomId('appNotFound')
                    .setLabel('Otomatik RED')
                    .setStyle(ButtonStyle.Primary)
                    .setEmoji('❌')
                    .setDisabled(true)
            );
    
            await interaction.update({ components: [button] });
            return;
        }
    
        const message = await interaction.channel.messages.fetch(interaction.message.id);
        const oldEmbed = message.embeds[0]; // Eski embed'i alıyoruz
    
        const userData = applicationData[applicationIndex];
        const user = await interaction.client.users.fetch(userData.user); // Kullanıcıyı getiriyoruz
        const applicationTime = Math.floor(new Date(userData.applicationTime).getTime() / 1000); // Zamanı düzeltiyoruz
    
        const button = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId('appDecline')
                .setLabel('Reddedildi')
                .setStyle(ButtonStyle.Primary)
                .setEmoji('❌')
                .setDisabled(true)
        );
    
        // Eski embed'in tüm alanlarını kopyalayarak yeni embed oluşturuyoruz
        const newEmbed = EmbedBuilder.from(oldEmbed)
            .setDescription(`\`${user.username}\` - \`${user.id}\` kullanıcısının başvurusu <@${interaction.user.id}> - \`${interaction.user.id}\` tarafından reddedildi!`);
    
        await interaction.update({ embeds: [newEmbed], components: [button] });
    
        user.send({
            content: `Merhaba <@${user.id}>, <t:${applicationTime}:R> yapmış olduğun başvuru ne yazık ki reddedildi! Gerekli şartları karşıladığını düşündüğün zaman tekrar başvuruda bulunabilirsin.`
        });
    
        applicationData.splice(applicationIndex, 1); // Başvuruyu veritabanından çıkarıyoruz
        database.set('applications', applicationData);
        database.delete(`appComp_${user.id}`);
    };
    
    const handleReactProPublic = async (interaction) => {
        
        const role = interaction.guild.roles.cache.get(config.tepkiRolleri.ProPublic)
        
        if (!role) {
            await interaction.reply({ content: "Üzgünüm sunucudan belirlenen rol bulunamadı. Yetkili kişilere bu durumu iletmen gerekiyor!", ephemeral: true })
        }
        
        const hasRole = interaction.member.roles.cache.has(role.id)
        
        try {
            
            if (hasRole) {
                // Eğer kullanıcıda rol varsa, rolü kaldır
                await interaction.member.roles.remove(role);
                await interaction.reply({ content: `❌ **${role.name}** rolü sizden alındı!`, ephemeral: true });
            } else {
                // Eğer kullanıcıda rol yoksa, rolü ekle
                await interaction.member.roles.add(role);
                await interaction.reply({ content: `✅ **${role.name}** rolü size verildi!`, ephemeral: true });
            }
            
        } catch (error) {
            console.error(chalk.red(`[ERROR] Rol işlenirken bir hata oluştu: ${error}`));
            await interaction.reply({ content: 'Rol işleminde bir hata oluştu. Lütfen daha sonra tekrar deneyin.', ephemeral: true });
        }
        
    }
    
    const handleReactJailbreak = async (interaction) => {
        
        const role = interaction.guild.roles.cache.get(config.tepkiRolleri.Jailbreak)
        
        if (!role) {
            await interaction.reply({ content: "Üzgünüm sunucudan belirlenen rol bulunamadı. Yetkili kişilere bu durumu iletmen gerekiyor!", ephemeral: true })
        }
        
        const hasRole = interaction.member.roles.cache.has(role.id)
        
        try {
            
            if (hasRole) {
                // Eğer kullanıcıda rol varsa, rolü kaldır
                await interaction.member.roles.remove(role);
                await interaction.reply({ content: `❌ **${role.name}** rolü sizden alındı!`, ephemeral: true });
            } else {
                // Eğer kullanıcıda rol yoksa, rolü ekle
                await interaction.member.roles.add(role);
                await interaction.reply({ content: `✅ **${role.name}** rolü size verildi!`, ephemeral: true });
            }
            
        } catch (error) {
            console.error(chalk.red(`[ERROR] Rol işlenirken bir hata oluştu: ${error}`));
            await interaction.reply({ content: 'Rol işleminde bir hata oluştu. Lütfen daha sonra tekrar deneyin.', ephemeral: true });
        }
        
    }

};
