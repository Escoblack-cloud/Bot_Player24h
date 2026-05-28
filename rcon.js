const { Rcon } =
    require('rcon-client');

async function start() {

    try {

        const rcon =
            await Rcon.connect({

                host: '178.33.122.90',
                port: 2497,
                password: 'RConAdmin1234'

            });

        console.log('✅ RCON conectado');

        const response =
            await rcon.send('players');

        console.log(response);

     } catch (err) {

        console.log(err);

    }

}

start();