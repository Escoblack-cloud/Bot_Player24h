const express = require('express');

const app = express();

app.get('/callback', async (req, res) => {

    const code = req.query.code;

    console.log('CODE OAUTH:');
    console.log(code);

    res.send('OAuth completado. Puedes cerrar esta ventana.');

});

app.listen(3000, () => {

    console.log('Servidor OAuth activo en puerto 3000');

});