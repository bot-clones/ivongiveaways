const Discord = require("discord.js")
const messages = require("../utils/message");
const ms = require("ms")
module.exports = {
  name: 'start',
  description: '🎉 Start a giveaway',

  options: [
    {
      name: 'duration',
      description: 'How long the giveaway should last for. Example values: 1m, 1h, 1d',
      type: 'STRING',
      required: true
    },
    {
      name: 'winners',
      description: 'How many winners the giveaway should have',
      type: 'INTEGER',
      required: true
    },
    {
      name: 'prize',
      description: 'What the prize of the giveaway should be',
      type: 'STRING',
      required: true
    },
    {
      name: 'channel',
      description: 'The channel to start the giveaway in',
      type: 'CHANNEL',
      required: true
    },
    {
      name: 'bonusrole',
      description: 'Role which would recieve bonus entries',
      type: 'ROLE',
      required: false
    },
    {
      name: 'bonusamount',
      description: 'The amount of bonus entries the role will recieve',
      type: 'INTEGER',
      required: false
    },
    {
      name: 'invite',
      description: 'Invite of the server you want to add as giveaway joining requirement',
      type: 'STRING',
      required: false
    },
    {
      name: 'role',
      description: 'Role you want to add as giveaway joining requirement',
      type: 'ROLE',
      required: false
    },
  ],

  run: async (client, interaction) => {

    // If the member doesn't have enough permissions
    if (!interaction.member.permissions.has('MANAGE_MESSAGES') && !interaction.member.roles.cache.some((r) => r.name === "Giveaways")) {
      return interaction.reply({
        content: '❌ | You need to have the manage messages permissions to start giveaways.',
        ephemeral: true
      });
    }

    const giveawayChannel = interaction.options.getChannel('channel');
    const giveawayDuration = interaction.options.getString('duration');
    const giveawayWinnerCount = interaction.options.getInteger('winners');
    const giveawayPrize = interaction.options.getString('prize');

    if (!giveawayChannel.isText()) {
      return interaction.reply({
        content: '❌ | Please select a text channel!',
        ephemeral: true
      });
    }
   if(isNaN(ms(giveawayDuration))) {
    return interaction.reply({
      content: '❌ | Please select a valid duration!',
      ephemeral: true
    });
  }
    if (giveawayWinnerCount < 1) {
      return interaction.reply({
        content: '❌ | Please select a valid winner count! greater or equal to one.',
      })
    }

    const bonusRole = interaction.options.getRole('bonusrole')
    const bonusEntries = interaction.options.getInteger('bonusamount')
    let rolereq = interaction.options.getRole('role')
    let invite = interaction.options.getString('invite')

    if (bonusRole) {
      if (!bonusEntries) {
        return interaction.reply({
          content: `❌ | You must specify how many bonus entries would ${bonusRole} recieve!`,
          ephemeral: true
        });
      }
    }


    await interaction.deferReply({ ephemeral: true })
    let reqinvite;
    if (invite) {
      let invitex = await client.fetchInvite(invite)
      let client_is_in_server = client.guilds.cache.get(
        invitex.guild.id
      )
      reqinvite = invitex
      if (!client_is_in_server) {
        return interaction.editReply({
          embeds: [{
            color: "#2F3136",
            author: {
              name: client.user.username,
              iconURL: client.user.displayAvatarURL() 
            },
            title: "Server Check!",
            description:
              "Oops! New server detected! are you sure I am in that? You need to invite me there to set that as a requirement!",
            timestamp: new Date(),
            footer: {
              iconURL: client.user.displayAvatarURL(),
              text: "Server Check"
            }
          }]
        })
      }
    }

    if (rolereq && !invite) {
      messages.inviteToParticipate = `**React with 🎉 to participate!**\n>>> - Only members having ${rolereq} are allowed to participate in this giveaway!`
    }
    if (rolereq && invite) {
      messages.inviteToParticipate = `**React with 🎉 to participate!**\n>>> - Only members having ${rolereq} are allowed to participate in this giveaway!\n- Members are required to join [this server](${invite}) to participate in this giveaway!`
    }
    if (!rolereq && invite) {
      messages.inviteToParticipate = `**React with 🎉 to participate!**\n>>> - Members must join the reqired server to participate in this giveaway!`
    }


    // start giveaway
    client.giveawaysManager.start(giveawayChannel, {
      // The giveaway duration
      duration: ms(giveawayDuration),
      // The giveaway prize
      prize: giveawayPrize,
      // The giveaway Host
      hostedBy: `<@${interaction.user.id}>`,
      // The giveaway winner count
      winnerCount: parseInt(giveawayWinnerCount),
      // BonusEntries If Provided
      bonusEntries: [
        {
          // Members who have the role which is assigned to "rolename" get the amount of bonus entries which are assigned to "BonusEntries"
          bonus: new Function('member', `return member.roles.cache.some((r) => r.name === \'${bonusRole ?.name}\') ? ${bonusEntries} : null`),
          cumulative: false
        }
      ],
      // Messages
      messages,
      extraData: {
        server: reqinvite == null ? "null" : reqinvite.guild.id,
        role: rolereq == null ? "null" : rolereq.id,
      }
    });
    interaction.editReply({
      content:
        `Giveaway started in ${giveawayChannel}!`,
      ephemeral: true
    })

    if (bonusRole) {
      let giveaway = new Discord.MessageEmbed()
        .setAuthor({ name: `Bonus Entries Alert!` })
        .setDescription(
          `**${bonusRole}** Has **${bonusEntries}** Extra Entries in this giveaway!`
        )
        .setColor("#2F3136")
        .setTimestamp();
      giveawayChannel.send({ embeds: [giveaway] });
    }

    if (invite) {
      let giveaway = new Discord.MessageEmbed()
        .setAuthor({ name: `Server Joining Required!` })
        .setDescription(`**You need to join this server to enter the giveaway!**\n Join the server by clicking the button \n Join the server first and react 🎉 to participate \n Afraid of buttons? Here is the [link](${invite})`)
        .setImage('https://i.imgur.com/JXQeKyr.png')
        .setColor("#2F3136")
        .setFooter({ text: '©️ IVON', iconURL: (process.env.FOOTERIMG) })
        .setTimestamp();

      const row = new MessageActionRow()
    .addComponents(
        new MessageButton()
        .setLabel('Join the Server')
        .setStyle('LINK')
        .setEmoji('903201241184751618')
        .setURL(`${invite}`))
      
      giveawayChannel.send({ embeds: [giveaway], components: [row] });
    }

  }

};
