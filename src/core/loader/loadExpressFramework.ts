import express from 'express';
import type { Client } from 'discord.js';


const loadExpressFramework = (client: Client) => {
    console.log(`-> loading Web Framework ......`);
    return new Promise<void>((resolve, reject) => {
        const app = express();
        const port = client.config.port || 33333;

        app.get('/', function (req, res) {
            res.send('200 ok.');
        });

        app.listen(port, function () {
            console.log(`Server start listening port on ${port}`);
            resolve();
        });
    });
};

export { loadExpressFramework };