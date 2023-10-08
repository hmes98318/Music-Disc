import express from 'express';

import type { Express } from 'express';
import type { Client } from 'discord.js';


const registerExpressEvents = (client: Client, app: Express) => {
    const views = `${process.cwd()}/views`;
    const js = `${process.cwd()}/views/js`
    const css = `${process.cwd()}/views/css`

    // app.use(express.static(views));
    app.use('/static/js', express.static(js));
    app.use('/static/css', express.static(css));


    /**
     * ---------- Site ----------
     */
    app.get('/', function (req, res) {
        res.sendFile(`${views}/index.html`);
    });

    app.get('/dashboard', function (req, res) {
        res.sendFile(`${views}/dashboard.html`);
    });

    app.get('/dashboard/serverlist', function (req, res) {
        res.sendFile(`${views}/dashboard/serverlist.html`);
    });

    app.get('/dashboard/nodeslist', function (req, res) {
        res.sendFile(`${views}/dashboard/nodeslist.html`);
    });

    app.get('/servers/:id', function (req, res) {
        const server = client.guilds.cache.find((x) => x.id === req.params.id);

        if (!server) {
            res.redirect('/dashboard/serverlist');
        }
        else {
            res.sendFile(`${views}/server.html`);
        }
    });


    /**
     * ---------- API ----------
     */
    app.get('/api/info', (req, res) => {
        console.log('[api] /api/info', req.ip);
        const info = client.info
        res.json(info);
    });

    app.get('/api/serverlist', (req, res) => {
        console.log('[api] /api/serverlist', req.ip);
        const serverlist = client.guilds.cache
        res.send(serverlist);
    });

    app.get('/api/server/info/:guildID', async (req, res) => {
        console.log(`[api] /api/server/info/${req.params.guildID}`, req.ip);
        const guild = client.guilds.cache.get(req.params.guildID);

        await guild!.members.fetch()
            .catch((_) => console.log(`Cache guild:${req.params.guildID} members list failed`));

        if (!guild) {
            res.send({});
        }
        else {
            res.send(guild);
        }
    });

    app.get('/api/user/:userID', (req, res) => {
        // console.log(`[api] /api/user/avatar/${req.params.id}`, req.ip);
        const user = client.users.cache.get(req.params.userID);

        res.send(user);
    });

    app.get('/api/lavashark/nowPlaying/:guildID', (req, res) => {
        // console.log(`[api] /api/lavashark/getPlayer/${req.params.guildID}`, req.ip);
        const player = client.lavashark.getPlayer(req.params.guildID);

        if (!player) {
            res.send('NOT_FOUND');
        }
        else {
            res.send('EXIST');
        }
    });

    app.get('/api/lavashark/getThumbnail/:source/:id', (req, res) => {
        // console.log(`[api] /api/lavashark/getThumbnail/${req.params.source}/${req.params.id}`, req.ip);

        if (req.params.source === 'youtube') {
            res.send(`https://img.youtube.com/vi/${req.params.id}/sddefault.jpg`);
        }
        else {
            res.send('NOT_FOUND');
        }
    });
};

export { registerExpressEvents };