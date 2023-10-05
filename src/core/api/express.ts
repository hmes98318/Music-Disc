import express from 'express';

import type { Express } from 'express';
import type { Client } from 'discord.js';


const registerExpressEvents = (client: Client, app: Express) => {
    const views = `./views`;

    app.use(express.static(views));

    /**
     * ---------- Site ----------
     */
    app.get('/', function (req, res) {
        res.sendFile(`${views}/index.html`);
    });


    /**
     * ---------- API ----------
     */
    app.get("/api/info", (req, res) => {
        console.log('[api] /api/info', req.ip);
        const info = client.info
        res.json(info);
    });
};

export { registerExpressEvents };