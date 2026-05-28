const express = require('express');
const app = express();

app.get('/', (req, res) => {
    res.send(
        '🛡️ Sentinel active | BlackForge Systems'
    );
});

app.listen(process.env.PORT || 3000, () => {
    console.log('🌐 Web server fake iniciado');
});
require('dotenv').config();
process.on(
    'unhandledRejection',
    err => {

        console.log(
            '❌ UNHANDLED REJECTION',
            err
        );

    }
);

process.on(
    'uncaughtException',
    err => {

        console.log(
            '❌ UNCAUGHT EXCEPTION',
            err
        );

    }
);
require('./logReader');

const {
    Client,
    GatewayIntentBits,
    EmbedBuilder,
    SlashCommandBuilder,
    REST,
    Routes
} = require('discord.js');

const fs = require('fs');

const crypto = require('crypto');

function cleanExpiredCodes() {

    if (
        !fs.existsSync(
            './pendingVerifications.json'
        )
    ) return;

    let pending =
        JSON.parse(
            fs.readFileSync(
                './pendingVerifications.json',
                'utf8'
            ) || '{}'
        );

    let changed = false;

    for (const code in pending) {

        if (
            pending[code].expires <
            Date.now()
        ) {

            delete pending[code];

            changed = true;

            console.log(
                `🧹 Código expirado eliminado: ${code}`
            );

        }

    }

    if (changed) {

        fs.writeFileSync(
            './pendingVerifications.json',
            JSON.stringify(
                pending,
                null,
                2
            )
        );

    }

}

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers
    ]
});

const GENERAL_CHANNEL_ID = '1490290252521275597';
const KOKE_CHANNEL_ID = '1509278581094879233';
const PLAYER_ROLE_ID = '1508481070289649786';


let onlineCooldown = false;




const commands = [

    new SlashCommandBuilder()
        .setName('online')
        .setDescription('Ver jugadores online'),

    new SlashCommandBuilder()
        .setName('horas')
        .setDescription('Ver horas de un jugador')
        .addStringOption(option =>
            option
                .setName('nombre')
                .setDescription('Nombre del jugador')
                .setRequired(true)
        ),

    new SlashCommandBuilder()
        .setName('verificar')
        .setDescription('Verificar cuenta DayZ'),

    new SlashCommandBuilder()
        .setName('testrol')
        .setDescription('Dar rol Sin Verificar'),

    new SlashCommandBuilder()
        .setName('quitarrol')
        .setDescription('Quitar rol Sin Verificar')

].map(command => command.toJSON());

const rest =
    new REST({ version: '10' })
        .setToken(process.env.TOKEN);

client.once('clientReady', async () => {

    console.log(
        '🛡️ Sentinel online | BlackForge Systems'
    );

    try {

        await rest.put(
            Routes.applicationCommands(client.user.id),
            { body: [] }
        );

        console.log(
            '🧹 Comandos antiguos eliminados'
        );

        await new Promise(resolve =>
            setTimeout(resolve, 5000)
        );

        await rest.put(
            Routes.applicationCommands(client.user.id),
            { body: commands }
        );

        console.log(
            '⚡ Sentinel commands loaded'
        );
        setInterval(checkPlayerRoles, 60000);

        setInterval(cleanExpiredCodes, 60000);

    } catch (error) {

        console.log(error);

    }

    const channel =
        await client.channels.fetch(CHANNEL_ID);


    async function checkPlayerRoles() {


        const guild =
            client.guilds.cache.first();

        if (!guild) return;

        const role =
            guild.roles.cache.get(
                PLAYER_ROLE_ID
            );

        if (!role) return;

        let players = {};

        if (fs.existsSync('./players.json')) {

            players =
                JSON.parse(
                    fs.readFileSync(
                        './players.json',
                        'utf8'
                    )
                );

        }

        let milestones = {};

        if (fs.existsSync('./milestones.json')) {

            milestones =
                JSON.parse(
                    fs.readFileSync(
                        './milestones.json',
                        'utf8'
                    ) || '{}'
                );

        }

        const kokeChannel =
            guild.channels.cache.get(
                KOKE_CHANNEL_ID
            );

        const blockedRoles = [
            'Admin',
            'Dev',
            'Owner',
            'Staff',
            'TopGG'
        ];

        const funnyMessages = {

            24:
                `📢 Antonio Recio informa:\n\n{player} acaba de desbloquear acceso a sugerencias.\n\nEste personaje ya es oficialmente un superviviente de MontepinarZ. 🚬🔥`,

            100:
                `📢 Amador Rivas comunica:\n\n{player} acaba de alcanzar 100h.\n\nEste tío ya cotiza en Chernarus. 😭🔥`,

            250:
                `📢 Enrique Pastor informa:\n\n{player} ya lleva 250h.\n\nEmpiezo a preocuparme seriamente por su salud mental. ☠️`,

            500:
                `📢 Coque Calatrava avisa:\n\n{player} ha llegado a 500h.\n\nCreo que ya duerme dentro de una base militar. 😭🔥`,

            1000:
                `📢 Antonio Recio anuncia:\n\n{player} ha alcanzado 1000h.\n\nEste hombre YA ES parte del mapa. 🚬🔥`

        };

        const milestonesList =
            [24, 100, 250, 500, 1000];

        const members =
            await guild.members.fetch();

        members.forEach(async member => {

            const discordName =
                member.displayName
                    .toLowerCase()
                    .replace(/[^a-z0-9]/g, '');

            for (const id in players) {

                const player =
                    players[id];

                const playerName =
                    player.name
                        .toLowerCase()
                        .replace(/[^a-z0-9]/g, '');

                const hours =
                    player.minutesPlayed / 60;

                if (
                    discordName === playerName &&
                    hours >= 24
                ) {

                    const hasBlockedRole =
                        member.roles.cache.some(r =>
                            blockedRoles.includes(
                                r.name
                            )
                        );

                    if (
                        !member.roles.cache.has(role.id) &&
                        !hasBlockedRole
                    ) {

                        member.roles.add(role)
                            .then(() => {

                                console.log(
                                    `🎖️ Rol dado a ${player.name}`
                                );

                            })
                            .catch(err =>
                                console.log(err.message)
                            );

                    }

                    const playerHours =
                        Math.floor(hours);

                    milestonesList.forEach(async milestone => {

                        const key =
                            `${player.name}_${milestone}`;

                        if (
                            playerHours >= milestone &&
                            !milestones[key]
                        ) {

                            milestones[key] = true;

                            fs.writeFileSync(
                                './milestones.json',
                                JSON.stringify(
                                    milestones,
                                    null,
                                    2
                                )
                            );

                            const embed =
                                new EmbedBuilder()
                                    .setColor('#ff9900')
                                    .setTitle('🏆 NUEVO LOGRO')
                                    .setDescription(
                                        funnyMessages[
                                            milestone
                                        ].replace(
                                            '{player}',
                                            player.name
                                        )
                                    )
                                    .setTimestamp();

                            if (kokeChannel) {

                                kokeChannel.send({
                                    embeds: [embed]
                                });

                            }

                        }

                    });

                }

            }

        });

    }

    client.on(
        'interactionCreate',
        async interaction => {

            if (
                !interaction.isChatInputCommand()
            ) return;

            // ONLINE
            if (
                interaction.commandName === 'online'
            ) {

                if (onlineCooldown) {

                    return interaction.reply({
                        content:
                            '⏳ Espera unos segundos antes de volver a usar este comando.',
                        ephemeral: true
                    });

                }

                onlineCooldown = true;

                setTimeout(() => {

                    onlineCooldown = false;

                }, 15000);

                let online = 0;

                if (fs.existsSync('./online.json')) {

                    const data =
                        JSON.parse(
                            fs.readFileSync(
                                './online.json',
                                'utf8'
                            )
                        );

                    online = data.online || 0;

                }

                const embed =
                    new EmbedBuilder()
                        .setColor('#00ff88')
                        .setTitle('👥 JUGADORES ONLINE')
                        .setDescription(
                            `Hay **${online}/40** jugadores conectados`
                        )
                        .setTimestamp();

                const onlineFile =
                    './onlineMessage.json';

                let saved = {};

                if (fs.existsSync(onlineFile)) {

                    saved =
                        JSON.parse(
                            fs.readFileSync(
                                onlineFile,
                                'utf8'
                            ) || '{}'
                        );

                }

                try {

                    if (
                        saved.messageId &&
                        saved.channelId
                    ) {

                        const oldChannel =
                            await client.channels.fetch(
                                saved.channelId
                            );

                        const oldMsg =
                            await oldChannel.messages.fetch(
                                saved.messageId
                            );

                        await oldMsg.delete();

                    }
                } catch { }

                const newMsg =
                    await interaction.channel.send({
                        embeds: [embed]
                    });

                saved.messageId =
                    newMsg.id;
                saved.channelId =
                    interaction.channel.id;

                fs.writeFileSync(
                    onlineFile,
                    JSON.stringify(
                        saved,
                        null,
                        2
                    )

                );

                return interaction.reply({
                    content:
                        '✅ Online actualizado.',
                    ephemeral: true
                });

            }


            // HORAS
            if (
                interaction.commandName === 'horas'
            ) {

                const nombre =
                    interaction.options.getString(
                        'nombre'
                    );

                let players = {};

                if (fs.existsSync('./players.json')) {

                    players =
                        JSON.parse(
                            fs.readFileSync(
                                './players.json',
                                'utf8'
                            )
                        );

                }

                let foundPlayer = null;

                for (const id in players) {

                    if (
                        players[id].name
                            .toLowerCase()
                            .includes(
                                nombre.toLowerCase()
                            )
                    ) {

                        foundPlayer =
                            players[id];

                        break;

                    }

                }

                if (!foundPlayer) {

                    return interaction.reply({
                        content:
                            '❌ Jugador no encontrado',
                        ephemeral: true
                    });

                }

                const hours =
                    (
                        foundPlayer.minutesPlayed / 60
                    ).toFixed(1);

                const embed =
                    new EmbedBuilder()
                        .setColor('#ffaa00')
                        .setTitle('⏳ HORAS JUGADAS')
                        .setDescription(
                            `**${foundPlayer.name}** tiene **${hours}h**`
                        )
                        .setTimestamp();

                return interaction.reply({
                    embeds: [embed]
                });

            }
            // TESTROL
            if (
                interaction.commandName === 'testrol'
            ) {

                if (
                    !interaction.member.permissions.has(
                        'Administrator'
                    )
                ) {

                    return interaction.reply({
                        content:
                            '❌ No tienes permisos.',
                        ephemeral: true
                    });

                }
                {

                    try {

                        const role =
                            interaction.guild.roles.cache.get(
                                '1509583483289210921'
                            );

                        if (!role) {

                            return interaction.reply({
                                content:
                                    '❌ Rol no encontrado.',
                                ephemeral: true
                            });

                        }

                        await interaction.member.roles.add(
                            role
                        );

                        return interaction.reply({
                            content:
                                '✅ Rol Sin Verificar dado.',
                            ephemeral: true
                        });

                    } catch (err) {

                        console.log(err);

                        return interaction.reply({
                            content:
                                '❌ Error dando rol.',
                            ephemeral: true
                        });

                    }

                }
            }
            // QUITARROL
            if (
                interaction.commandName === 'quitarrol'
            ) {

                if (
                    !interaction.member.permissions.has(
                        'Administrator'
                    )
                ) {

                    return interaction.reply({
                        content:
                            '❌ No tienes permisos.',
                        ephemeral: true
                    });

                }
                {

                    try {

                        const role =
                            interaction.guild.roles.cache.get(
                                '1509583483289210921'
                            );

                        if (!role) {

                            return interaction.reply({
                                content:
                                    '❌ Rol no encontrado.',
                                ephemeral: true
                            });

                        }

                        await interaction.member.roles.remove(
                            role
                        );

                        return interaction.reply({
                            content:
                                '✅ Rol Sin Verificar quitado.',
                            ephemeral: true
                        });

                    } catch (err) {

                        console.log(err);

                        return interaction.reply({
                            content:
                                '❌ Error quitando rol.',
                            ephemeral: true
                        });

                    }

                }
            }

            // VERIFICAR
            if (
                interaction.commandName === 'verificar'
            ) {

                let linkedAccounts = {};

                if (
                    fs.existsSync(
                        './linkedAccounts.json'
                    )
                ) {

                    linkedAccounts =
                        JSON.parse(
                            fs.readFileSync(
                                './linkedAccounts.json',
                                'utf8'
                            ) || '{}'
                        );

                }

                if (
                    linkedAccounts[
                    interaction.user.id
                    ]
                ) {

                    return interaction.reply({

                        embeds: [

                            new EmbedBuilder()
                                .setColor('#ff9900')
                                .setTitle('✅ YA VERIFICADO')
                                .setDescription(
                                    `📢 Antonio Recio informa:

Tú ya estás verificado máquina 😭🔥

No intentes hacer trampas que aquí no somos amateurs. 🚬`
                                )

                        ],

                        ephemeral: true

                    });

                }

                let pending = {};

                if (
                    fs.existsSync(
                        './pendingVerifications.json'
                    )
                ) {

                    pending =
                        JSON.parse(
                            fs.readFileSync(
                                './pendingVerifications.json',
                                'utf8'
                            ) || '{}'
                        );

                }

                for (const code in pending) {

                    if (
                        pending[code].expires <
                        Date.now()
                    ) {

                        delete pending[code];

                    }

                }

                fs.writeFileSync(
                    './pendingVerifications.json',
                    JSON.stringify(
                        pending,
                        null,
                        2
                    )
                );

                const alreadyPending =
                    Object.values(pending)
                        .find(v =>
                            v.discordId ===
                            interaction.user.id
                        );

                if (alreadyPending) {

                    return interaction.reply({

                        content:
                            '❌ Ya tienes una verificación pendiente.',

                        ephemeral: true

                    });

                }

                const code =
                    crypto.randomBytes(2)
                        .toString('hex')
                        .toUpperCase();

                pending[code] = {

                    discordId:
                        interaction.user.id,

                    expires:
                        Date.now() +
                        (10 * 60 * 1000)

                };

                fs.writeFileSync(
                    './pendingVerifications.json',
                    JSON.stringify(
                        pending,
                        null,
                        2
                    )
                );

                const embed =
                    new EmbedBuilder()
                        .setColor('#00ff88')
                        .setTitle('🔐 VERIFICACIÓN DAYZ')
                        .setDescription(

                            `📢 Antonio Recio informa:

Para verificar tu cuenta,
COPIA exactamente este comando
y pégalo en el chat global de DayZ 😭🔥

━━━━━━━━━━━━━━

\`/verificar ${code}\`

━━━━━━━━━━━━━━

⏰ El código expira en 10 minutos.`
                        )
                        .setTimestamp();

                return interaction.reply({
                    embeds: [embed],
                    ephemeral: true
                });

            }
        }

    );

    client.on(
        'guildMemberAdd',
        async member => {

            try {

                const role =
                    member.guild.roles.cache.get(
                        '1509583483289210921'
                    );

                if (role) {

                    await member.roles.add(role);

                    console.log(
                        `🛑 Rol Sin Verificar dado a ${member.user.tag}`
                    );

                }

            } catch (err) {

                console.log(
                    '❌ Error dando rol:',
                    err
                );

            }

        }
    );

    // client.login(process.env.TOKEN);
});