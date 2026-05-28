const Gamedig = require('gamedig');

async function test() {

    try {

        const state = await Gamedig.GameDig.query({
            type: 'dayz',
            host: '178.33.122.90',
            port: 27211
        });

        console.log('✅ SERVIDOR ONLINE');

        console.log('Nombre:', state.name);

        console.log('JUGADORES:');

        console.log(state.players);

    } catch (error) {

        console.log('❌ ERROR');

        console.log(error);

    }

}

test();