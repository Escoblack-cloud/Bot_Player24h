let playersSeen = {};

require('dotenv').config();

const {
    Client,
    GatewayIntentBits,
    EmbedBuilder
} = require('discord.js');

const fs = require('fs');

const hallMessageFile = './hallMessage.json';

const ClientSFTP =
    require('ssh2-sftp-client');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds
    ]
});

const JOIN_CHANNEL_ID =
    '1490712034579316857';

const HALL_OF_FAME_CHANNEL_ID =
    process.env.HALL_OF_FAME;

const KOKE_INFORMA_CHANNEL_ID =
    process.env.KOKE_INFORMA;

const logPath =
    './server_console.log';

const playersFile =
    './players.json';

const pendingVerifications =
    './pendingVerifications.json';

const linkedAccountsPath =
    './linkedAccounts.json';

let lastSize =
    fs.existsSync(logPath)
        ? fs.statSync(logPath).size
        : 0;

let onlinePlayers = {};

let steamIDs = {};

let currentOnline = 0;
let lastOnline = -1;

console.log('👀 Leyendo logs...');

client.once('clientReady', () => {

    console.log('✅ Discord conectado');

});

client.login(
    process.env.DISCORD_TOKEN
);

function loadPlayers() {

    if (!fs.existsSync(playersFile)) {

        fs.writeFileSync(
            playersFile,
            '{}'
        );

    }

    return JSON.parse(
        fs.readFileSync(
            playersFile,
            'utf8'
        ) || '{}'
    );

}

function savePlayers(data) {

    fs.writeFileSync(
        playersFile,
        JSON.stringify(
            data,
            null,
            2
        )
    );

}

async function downloadLog() {

    const sftp =
        new ClientSFTP();

    try {

        await sftp.connect({

            host:
                process.env.SFTP_HOST,

            port:
                process.env.SFTP_PORT,

            username:
                process.env.SFTP_USER,

            password:
                process.env.SFTP_PASS

        });

        await sftp.fastGet(
            '178.33.122.90_2491/profiles/server_console.log',
            './server_console.log'
        );

    } catch (err) {

        console.log(
            '❌ Error SFTP:',
            err.message
        );

    } finally {

        try {

            await sftp.end();

        } catch { }

    }

}

setInterval(async () => {

    await downloadLog();

    fs.stat(
        logPath,
        async (err, stats) => {

            if (err) {

                console.log(
                    '❌ No encuentro server_console.log'
                );

                return;

            }

            if (stats.size <= lastSize) {
                return;
            }

            const stream =
                fs.createReadStream(
                    logPath,
                    {
                        start: lastSize,
                        end: stats.size
                    }
                );

            let text = '';

            stream.on(
                'data',
                data => {

                    text += data.toString();

                });

            stream.on(
                'end',
                async () => {

                    const lines =
                        text.split('\n');


                    text = null;

                    for (const line of lines) {

                        const steamMatch =
                            line.match(
                                /Player "(.+?)" \(steamID=(\d+)/
                            );

                        if (steamMatch) {

                            const playerName =
                                steamMatch[1];

                            const steamID =
                                steamMatch[2];

                            steamIDs[playerName] =
                                steamID;

                            console.log(
                                `🆔 ${playerName} => ${steamID}`
                            );

                        }

                        // =========================
                        // VERIFY
                        // =========================

                        const verifyMatch =
                            line.match(
                                /BattlEye Server: \(Global\) (.+?): \+?\/[Vv]erificar (.+)/
                            );

                        if (verifyMatch) {

                            const playerName =
                                verifyMatch[1];

                            const code =
                                verifyMatch[2]
                                    .trim()
                                    .toUpperCase();

                            let pending = {};

                            if (
                                fs.existsSync(
                                    pendingVerifications
                                )
                            ) {

                                pending =
                                    JSON.parse(
                                        fs.readFileSync(
                                            pendingVerifications,
                                            'utf8'
                                        ) || '{}'
                                    );

                            }

                            let linked = {};

                            if (
                                fs.existsSync(
                                    linkedAccountsPath
                                )
                            ) {

                                linked =
                                    JSON.parse(
                                        fs.readFileSync(
                                            linkedAccountsPath,
                                            'utf8'
                                        ) || '{}'
                                    );

                            }

                            if (
                                pending[code] &&
                                pending[code]
                                    .expires > Date.now()
                            ) {

                                linked[
                                    pending[code].discordId
                                ] = {

                                    playerName:
                                        playerName,

                                    steamID:
                                        steamIDs[playerName] || null,

                                    verified: true,

                                    verifiedAt:
                                        new Date()
                                            .toISOString()

                                };

                                fs.writeFileSync(
                                    linkedAccountsPath,
                                    JSON.stringify(
                                        linked,
                                        null,
                                        2
                                    )
                                );
                                const discordId =
                                    pending[code].discordId;
                                delete pending[code];

                                fs.writeFileSync(
                                    pendingVerifications,
                                    JSON.stringify(
                                        pending,
                                        null,
                                        2
                                    )
                                );

                                console.log(
                                    `✅ ${playerName} verificado correctamente`
                                );
                                try {

                                    const guild =
                                        client.guilds.cache.first();

                                    const member =
                                        await guild.members.fetch(
                                            discordId
                                        );

                                    // SIN VERIFICAR
                                    const unverifiedRole =
                                        guild.roles.cache.get(
                                            '1509583483289210921'
                                        );

                                    if (
                                        unverifiedRole &&
                                        member.roles.cache.has(
                                            unverifiedRole.id
                                        )
                                    ) {

                                        await member.roles.remove(
                                            unverifiedRole
                                        );

                                        console.log(
                                            `🗑️ Rol Sin Verificar quitado a ${playerName}`
                                        );

                                    }

                                } catch (err) {

                                    console.log(
                                        '❌ Error quitando rol Sin Verificar:',
                                        err.message
                                    );

                                }
                                try {

                                    const guild =
                                        client.guilds.cache.first();

                                    const generalChannel =
                                        guild.channels.cache.get(
                                            '1490290252521275597'
                                        );

                                    const embed =
                                        new EmbedBuilder()
                                            .setColor('#00ff88')
                                            .setTitle('✅ NUEVO SUPERVIVIENTE VERIFICADO')
                                            .setDescription(
                                                `📢 Antonio Recio informa:

**${playerName}**
ya forma parte oficialmente de MontepinarZ 😭🔥

Este individuo ya puede:
🚬 acceder a sugerencias
🔥 participar en eventos
🏆 competir en rankings

Espero que no robe cobre del vecindario.`
                                            )
                                            .setTimestamp();

                                    // generalChannel.send({
                                    //     embeds: [embed]
                                    // });

                                }

                                catch (err) {

                                    console.log(
                                        '❌ Error enviando mensaje verify'
                                    );

                                }

                            } else {

                                console.log(
                                    `❌ Código inválido para ${playerName}`
                                );

                            }

                        }

                        // =========================
                        // ONLINE
                        // =========================

                        const onlineMatch =
                            line.match(
                                /Players:\s(\d+)\sin total/
                            );

                        if (onlineMatch) {

                            currentOnline =
                                parseInt(
                                    onlineMatch[1]
                                );

                            if (
                                currentOnline !==
                                lastOnline
                            ) {

                                lastOnline =
                                    currentOnline;

                                fs.writeFileSync(
                                    './online.json',
                                    JSON.stringify(
                                        {
                                            online:
                                                currentOnline
                                        },
                                        null,
                                        2
                                    )
                                );

                                console.log(
                                    `👥 ONLINE REAL ACTUALIZADO: ${currentOnline}`
                                );

                            }

                        }

                        // =========================
                        // JOIN
                        // =========================

                        if (
                            line.includes(
                                'BattlEye Server: Player'
                            ) &&
                            line.includes(
                                'connected'
                            )
                        ) {

                            console.log(line);

                            const match =
                                line.match(
                                    /Player #\d+ (.+?) \(.+?\) connected/
                                );

                            if (match) {

                                const name =
                                    match[1];

                                const steamID =
                                    name;

                                if (
                                    playersSeen[
                                    steamID
                                    ]
                                ) {
                                    continue;
                                }

                                playersSeen[
                                    steamID
                                ] = true;


                                console.log(
                                    `🟢 ${name} conectado`
                                );

                                const channel =
                                    await client
                                        .channels
                                        .fetch(
                                            JOIN_CHANNEL_ID
                                        );

                                const embed =
                                    new EmbedBuilder()
                                        .setColor(
                                            '#00ff88'
                                        )
                                        .setTitle(
                                            '🟢 PLAYER CONNECTED'
                                        )
                                        .setDescription(
                                            `**${name}** ha entrado al servidor`
                                        )
                                        .setTimestamp();

                                channel.send({
                                    embeds: [embed]
                                });

                                const players =
                                    loadPlayers();

                                if (
                                    !players[
                                    steamID
                                    ]
                                ) {

                                    players[
                                        steamID
                                    ] = {

                                        name:
                                            name,

                                        joins: 0,

                                        minutesPlayed: 0

                                    };

                                }

                                players[
                                    steamID
                                ].name = name;

                                players[
                                    steamID
                                ].joins += 1;

                                savePlayers(
                                    players
                                );

                                onlinePlayers[
                                    steamID
                                ] = {

                                    name,

                                    joinTime:
                                        Date.now()

                                };

                            }

                        }

                        // =========================
                        // LEAVE
                        // =========================

                        if (

                            line.includes(
                                'BattlEye Server: Player'
                            ) &&

                            (
                                line.includes(
                                    'disconnected'
                                ) ||

                                line.includes(
                                    'kicked'
                                )
                            )

                        ) {

                            const disconnectMatch =
                                line.match(
                                    /Player #\d+ (.+?) disconnected/
                                );

                            if (disconnectMatch) {

                                const name =
                                    disconnectMatch[1];

                                const steamID =
                                    Object.keys(
                                        onlinePlayers
                                    ).find(
                                        id =>
                                            onlinePlayers[id]
                                                .name === name
                                    );

                                console.log(
                                    `🔴 ${name} desconectado`
                                );

                                delete playersSeen[
                                    steamID
                                ];

                                const channel =
                                    await client
                                        .channels
                                        .fetch(
                                            JOIN_CHANNEL_ID
                                        );

                                const embed =
                                    new EmbedBuilder()
                                        .setColor(
                                            '#ff0000'
                                        )
                                        .setTitle(
                                            '🔴 PLAYER DISCONNECTED'
                                        )
                                        .setDescription(
                                            `**${name}** ha salido del servidor`
                                        )
                                        .setTimestamp();

                                channel.send({
                                    embeds: [embed]
                                });

                                const players =
                                    loadPlayers();

                                if (
                                    onlinePlayers[
                                    steamID
                                    ] &&

                                    players[
                                    steamID
                                    ]
                                ) {

                                    const sessionMinutes =
                                        (
                                            Date.now() -

                                            onlinePlayers[
                                                steamID
                                            ]
                                                .joinTime

                                        ) / 60000;

                                    players[
                                        steamID
                                    ]
                                        .minutesPlayed +=
                                        sessionMinutes;

                                    savePlayers(
                                        players
                                    );

                                    delete onlinePlayers[
                                        steamID
                                    ];

                                }

                            }

                        }

                    }

                    lastSize =
                        stats.size;

                });

        });

}, 10000);

setInterval(() => {

    const players =
        loadPlayers();

    for (
        const steamID
        in onlinePlayers
    ) {

        if (
            players[steamID]
        ) {

            players[
                steamID
            ].minutesPlayed += 1;

        }

    }

    savePlayers(players);

}, 60000);

setInterval(async () => {

    try {

        await updateHallOfFame();

    } catch (err) {

        console.log(
            '❌ Error Hall Of Fame:',
            err.message
        );

    }

}, 30000);

async function updateHallOfFame() {

    const players = loadPlayers();

    const sortedPlayers =
        Object.values(players)
            .sort(
                (a, b) =>
                    b.minutesPlayed -
                    a.minutesPlayed
            );

    if (sortedPlayers.length === 0) {

        console.log(
            '⚠️ No hay jugadores todavía'
        );

        return;

    }

    const hallChannel =
        await client.channels.fetch(
            HALL_OF_FAME_CHANNEL_ID
        );

    const top1 =
        sortedPlayers[0];

    const top2to5 =
        sortedPlayers.slice(1, 5);

    const topHours =
        (
            top1.minutesPlayed / 60
        ).toFixed(1);

    let topText = '';

    const medals =
        ['🥈', '🥉', '🏅', '🏅'];

    top2to5.forEach(
        (player, index) => {

            const hours =
                (
                    player.minutesPlayed / 60
                ).toFixed(1);

            topText +=
                `${medals[index]} ${player.name} — ${hours}h\n`;

        });

    const embedTop =
        new EmbedBuilder()
            .setColor('#ffaa00')
            .setTitle(
                '🏆 TOP SUPERVIVIENTES'
            )
            .setDescription(
                topText || 'Sin datos'
            )
            .setFooter({
                text:
                    'MontepinarZ • Hall Of Fame'
            })
            .setTimestamp();

    const embedKing =
        new EmbedBuilder()
            .setColor('#00ff88')
            .setTitle(
                '👑 REY DE CHERNARUS'
            )
            .setDescription(
                `🔥 ${top1.name}

⏳ ${topHours} horas jugadas

“Este ya paga IBI en Chernarus.” 😭`
            )
            .setFooter({
                text:
                    'El esfuerzo deja huella'
            })
            .setTimestamp();

    let saved = {};

    if (fs.existsSync(hallMessageFile)) {
        saved = JSON.parse(fs.readFileSync(hallMessageFile, 'utf8') || '{}');
    }

    //  ====================
    // TOP MESSAGE
    // ====================
    const existingMessages =
        await hallChannel.messages.fetch({
            limit: 20
        });

    const existingTop =
        existingMessages.find(
            m =>
                m.author.id ===
                client.user.id &&

                m.embeds.length > 0 &&

                m.embeds[0]
                    ?.title ===
                '🏆 TOP SUPERVIVIENTES'
        );

    if (existingTop) {

        saved.topMessageId =
            existingTop.id;

        await existingTop.edit({
            embeds: [embedTop]
        });

    } else {

        const msg =
            await hallChannel.send({
                embeds: [embedTop]
            });

        saved.topMessageId =
            msg.id;

    }
    // ====================
    // KING MESSAGE
    // ====================

    const existingKingMessages =
        await hallChannel.messages.fetch({
            limit: 20
        });

    const existingKing =
        existingKingMessages.find(
            m =>
                m.author.id ===
                client.user.id &&

                m.embeds.length > 0 &&

                m.embeds[0]
                    ?.title ===
                '👑 REY DE CHERNARUS'
        );

    if (existingKing) {

        saved.kingMessageId =
            existingKing.id;

        await existingKing.edit({
            embeds: [embedKing]
        });

    } else {

        const msg =
            await hallChannel.send({
                embeds: [embedKing]
            });

        saved.kingMessageId =
            msg.id;

    }
}
