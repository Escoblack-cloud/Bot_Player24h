const fs = require('fs');

const players = JSON.parse(
    fs.readFileSync('./players.json')
);

const sortedPlayers = Object.values(players)
.sort((a, b) => b.minutesPlayed - a.minutesPlayed);

console.log('🏆 TOP JUGADORES\n');

sortedPlayers.slice(0, 3).forEach((player, index) => {

    const hours = (player.minutesPlayed / 60).toFixed(1);

    console.log(
        `${index + 1}. ${player.name} — ${hours}h`
    );

});