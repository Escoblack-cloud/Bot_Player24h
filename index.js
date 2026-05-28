const express = require('express');
const app = express();

app.get('/', (req, res) => {
    res.send('Bot online 😎');
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

const CHANNEL_ID = '1508926837332508672';
const GENERAL_CHANNEL_ID = '1490290252521275597';
const KOKE_CHANNEL_ID = '1509278581094879233';
const PLAYER_ROLE_ID = '1508481070289649786';

let messageId = null;

if (fs.existsSync('./messageId.txt')) {

    messageId =
        fs.readFileSync(
            './messageId.txt',
            'utf8'
        );

}

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
        .setDescription('Verificar cuenta DayZ')

].map(command => command.toJSON());

const rest =
    new REST({ version: '10' })
        .setToken(process.env.TOKEN);

client.once('ready', async () => {

    console.log('✅ Bot conectado');

    try {

        await rest.put(
            Routes.applicationCommands(client.user.id),
            { body: commands }
        );

        console.log('✅ Comandos registrados');

    } catch (error) {

        console.log(error);

    }

    const channel =
        await client.channels.fetch(CHANNEL_ID);

    async function updateTop() {

        let players = {};

        if (fs.existsSync('./players.json')) {
            players = JSON.parse(fs.readFileSync('./players.json', 'utf8'));
        }

        const sortedPlayers = Object.values(players).sort((a, b) => b.minutesPlayed - a.minutesPlayed);

        if (sortedPlayers.length === 0) return;

        // TOP 1
        const top1 = sortedPlayers[0];

        // TOP 2-5
        const top2to5 = sortedPlayers.slice(1, 5);

        // FRASES KOKE
        const kokePhrases = [
            `“Este tío ya paga alquiler en NWAF.” 😭🔥`,
            `“Creo que ya tiene más horas aquí que en la vida real.” 😄🔥`,
            `“Este notas ya conoce más Chernarus que su barrio.” 🚬🔥`,
            `“Yo creo que ya respawnea hasta dormido.” 😭🔥`
        ];

        const randomPhrase = kokePhrases[Math.floor(Math.random() * kokePhrases.length)];

        // DESCRIPCIÓN TOP 2-5
        let topDescription = '';
        const medals = ['🥈', '🥉', '🏅', '🏅'];

        top2to5.forEach((player, index) => {
            const medal = medals[index] || '🏅';
            const hours = (player.minutesPlayed / 60).toFixed(1);
            topDescription += `${medal} **${player.name}** — ${hours}h\n`;
        });

        // EMBED TOP 2-5
        const topEmbed = new EmbedBuilder()
            .setColor('#ff9900')
            .setTitle('🏆 TOP SUPERVIVIENTES')
            .setDescription(topDescription || 'Todavía no hay jugadores 😄🔥')
            .setFooter({ text: '🔥 Gracias por apoyar MontepinarZ' })
            .setTimestamp();

        // EMBED REY DE CHERNARUS
        const kingHours = (top1.minutesPlayed / 60).toFixed(1);
        const kingEmbed = new EmbedBuilder()
            .setColor('#ff9900')
            .setTitle('🥇 EL REY DE CHERNARUS')
            .setDescription(
                `━━━━━━━━━━━━━━

👑 **${top1.name}**
⏳ ${kingHours}h

━━━━━━━━━━━━━━

📢 Koke Calatrava informa:

${randomPhrase}`
            )
            .setFooter({ text: '🔥 Gracias por apoyar MontepinarZ' })
            .setTimestamp();

        // CREAR MENSAJES
        if (!messageId) {

            const msgTop = await channel.send({ embeds: [topEmbed] });
            const msgKing = await channel.send({ embeds: [kingEmbed] });

            messageId = { top: msgTop.id, king: msgKing.id };

            fs.writeFileSync('./messageId.txt', JSON.stringify(messageId, null, 2));

        } else {

            let ids = messageId;

            if (typeof ids === 'string') {
                try {
                    ids = JSON.parse(fs.readFileSync('./messageId.txt', 'utf8'));
                } catch { ids = null; }
            }

            if (!ids) return;

            // EDITAR TOP
            let topMsg = null;

            try {

                topMsg =
                    await channel.messages.fetch(ids.top);

            } catch {

                topMsg = null;

            }
            if (topMsg) await topMsg.edit({ embeds: [topEmbed] });

            // EDITAR REY
            let kingMsg = null;

            try {

                kingMsg =
                    await channel.messages.fetch(ids.king);

            } catch {

                kingMsg = null;

            }
            if (kingMsg) await kingMsg.edit({ embeds: [kingEmbed] });

        }
    }

    updateTop();

    setInterval(updateTop, 30000);

    setInterval(cleanExpiredCodes, 60000);

    setInterval(checkPlayerRoles, 60000);

});

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

            return interaction.reply({
                embeds: [embed]
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

client.login(process.env.TOKEN);