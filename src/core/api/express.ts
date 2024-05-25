import bodyParser from 'body-parser';
import cookie from "cookie";
import express from 'express';
import undici from "undici";

import { hashGenerator } from '../lib/hashGenerator';
import { LoginType } from '../../@types';

import type { Client } from 'discord.js';
import type { Express } from 'express';
import type { Bot } from '../../@types';
import type { SessionManager } from '../lib/SessionManager';
import type { LocalNodeController } from '../lib/LocalNodeController';


interface IPInfo {
    retry: number;
    block: boolean;
}

const blockedIP = new Map<string, IPInfo>();


const registerExpressEvents = (bot: Bot, client: Client, localNodeController: LocalNodeController, app: Express, sessionManager: SessionManager) => {
    const siteConfig = bot.config.site;

    const cssPath = `${process.cwd()}/views/css`;
    const jsPath = `${process.cwd()}/views/js`;
    const libPath = `${process.cwd()}/js/lib`;
    const viewsPath = `${process.cwd()}/views`;

    app.use('/static/css', express.static(cssPath));
    app.use('/static/js', express.static(jsPath));
    app.use('/static/js/lib', express.static(libPath));
    // app.use(express.static(viewsPath));

    app.use(bodyParser.json());
    app.use(bodyParser.urlencoded({ extended: true }));


    /**
     * ---------- Middleware ----------
     */
    const verifyLogin = (req: any, res: any, next: any) => {
        const cookies = cookie.parse(req.headers.cookie as string || '');
        const sessionId = cookies.sessionID;
        const session = sessionManager.getSession(sessionId);

        if (session) {
            sessionManager.refreshSession(sessionId);
            next();
        }
        else {
            res.redirect('/login');
        }
    };


    /**
     * ---------- Site ----------
     */

    if (bot.config.site.loginType === LoginType.OAUTH2) {
        app.get('/login', async (req, res) => {
            const cookies = cookie.parse(req.headers.cookie as string || '');
            const sessionId = cookies.sessionID;
            const session = sessionManager.getSession(sessionId);

            if (session) {
                res.redirect('/dashboard');
            }


            const userIP = (req.headers['x-real-ip'] || req.headers['x-forwarded-for'] || req.ip) as string;
            const ipInfo = blockedIP.get(userIP);

            if (ipInfo) {
                if (ipInfo.block) {
                    bot.logger.emit('api', `Blocked IP: ${userIP}, attempts to log in.`);
                    return res.send('Too many login attempts, locked for 5 minutes.');
                }
                else if (!ipInfo.block && ipInfo.retry > 5) {
                    bot.logger.emit('api', `IP: ${userIP}, failed to log in too many times, blocked for 5 minutes`);
                    ipInfo.block = true;

                    setTimeout(() => {
                        blockedIP.delete(userIP);
                    }, 5 * 60 * 1000); // Block 5 minutes

                    return res.send('Too many login attempts, locked for 5 minutes.');
                }
            }


            const { code } = req.query;

            if (code) {
                try {
                    const tokenResponseData = await undici.request('https://discord.com/api/oauth2/token', {
                        method: 'POST',
                        body: new URLSearchParams({
                            client_id: client.user?.id,
                            client_secret: bot.config.clientSecret,
                            code,
                            grant_type: 'authorization_code',
                            redirect_uri: bot.config.site.oauth2RedirectUri,
                            scope: 'identify',
                        } as any).toString(),
                        headers: {
                            'Content-Type': 'application/x-www-form-urlencoded',
                        },
                    }); console.log('tokenResponseData', tokenResponseData.statusCode);

                    const oauthData = await tokenResponseData.body.json() as any;

                    const userResult = await undici.request('https://discord.com/api/users/@me', {
                        headers: {
                            authorization: `${oauthData.token_type} ${oauthData.access_token}`,
                        },
                    });


                    if (userResult.statusCode === 200) {
                        const user = await userResult.body.json() as any;
                        console.log(user);

                        if (user.id === bot.config.admin) {
                            const cookies = cookie.parse(req.headers.cookie as string || '');
                            let sessionId = cookies.sessionID;

                            if (!sessionId) {
                                sessionId = hashGenerator.generateRandomKey();
                            }

                            sessionManager.createSession(sessionId);
                            res.cookie('sessionID', sessionId);

                            return res.redirect('/dashboard');
                        }
                        else {
                            return res.send('You are not an administrator. If there is an error, please check your BOT_ADMIN setting value.');
                        }
                    }
                    else {
                        if (!ipInfo) {
                            blockedIP.set(userIP, { retry: 1, block: false });
                        }
                        else {
                            blockedIP.set(userIP, { retry: ipInfo.retry + 1, block: false });
                        }

                        //res.send('FAILED');
                        return res.redirect('/login');
                    }
                } catch (error) {
                    console.error(error);
                    return res.json(error);
                }
            }


            res.sendFile(`${viewsPath}/login-oauth2.html`);
        });
    }
    else {
        app.get('/login', (req, res) => {
            const cookies = cookie.parse(req.headers.cookie as string || '');
            const sessionId = cookies.sessionID;
            const session = sessionManager.getSession(sessionId);

            if (session) {
                res.redirect('/dashboard');
            }

            res.sendFile(`${viewsPath}/login.html`);
        });
    }

    app.get('/dashboard', verifyLogin, (req, res) => {
        res.sendFile(`${viewsPath}/dashboard.html`);
    });

    app.get('/nodeslist', verifyLogin, (req, res) => {
        res.sendFile(`${viewsPath}/nodeslist.html`);
    });

    app.get('/serverlist', verifyLogin, (req, res) => {
        res.sendFile(`${viewsPath}/serverlist.html`);
    });

    app.get('/servers/:id', verifyLogin, (req, res) => {
        const server = client.guilds.cache.find((x) => x.id === req.params.id);

        if (!server) {
            res.redirect('/serverlist');
        }
        else {
            res.sendFile(`${viewsPath}/server.html`);
        }
    });

    app.get('/localnode', verifyLogin, (req, res) => {
        res.sendFile(`${viewsPath}/localnode.html`);
    });

    app.get('/logs', verifyLogin, (req, res) => {
        res.sendFile(`${viewsPath}/logs.html`);
    });


    /**
     * ---------- API ----------
     */

    app.post('/api/login', (req, res) => {
        // bot.logger.emit('api', '[POST] ' + req.body);

        const admin = {
            username: siteConfig.username,
            password: siteConfig.password
        };

        const { username, password } = req.body;
        const userIP = (req.headers['x-real-ip'] || req.headers['x-forwarded-for'] || req.ip) as string;
        const ipInfo = blockedIP.get(userIP);

        if (ipInfo) {
            if (ipInfo.block) {
                bot.logger.emit('api', `Blocked IP: ${userIP}, attempts to log in.`);
                return res.send('BLOCKED_5');
            }
            else if (!ipInfo.block && ipInfo.retry > 5) {
                bot.logger.emit('api', `IP: ${userIP}, failed to log in too many times, blocked for 5 minutes`);
                ipInfo.block = true;

                setTimeout(() => {
                    blockedIP.delete(userIP);
                }, 5 * 60 * 1000); // Block 5 minutes

                return res.send('BLOCKED_5');
            }
        }


        if (username === admin.username && hashGenerator.generateHash(password) === admin.password) {
            if (ipInfo) {
                blockedIP.delete(userIP);
            }

            const cookies = cookie.parse(req.headers.cookie as string || '');
            let sessionId = cookies.sessionID;

            if (!sessionId) {
                sessionId = hashGenerator.generateRandomKey();
            }

            sessionManager.createSession(sessionId);
            res.cookie('sessionID', sessionId);

            return res.send('SUCCEED');
        }
        else {
            if (!ipInfo) {
                blockedIP.set(userIP, { retry: 1, block: false });
            }
            else {
                blockedIP.set(userIP, { retry: ipInfo.retry + 1, block: false });
            }

            return res.send('FAILED');
        }
    });

    app.get('/api/logout', (req, res) => {
        const cookies = cookie.parse(req.headers.cookie as string || '');
        const sessionId = cookies.sessionID;

        sessionManager.destroySession(sessionId);
        return res.redirect('/login');
    });

    app.get('/api/info', verifyLogin, (req, res) => {
        // bot.logger.emit('api', '[GET] /api/info ' + req.ip);
        const info = { 
            ...bot.sysInfo, 
            serverCount: client.guilds.cache.size,
            totalMembers: client.guilds.cache.reduce((acc, guild) => acc + guild.memberCount, 0)
        };
        res.json(info);
    });

    app.get('/api/serverlist', verifyLogin, (req, res) => {
        // bot.logger.emit('api', '[GET] /api/serverlist ' + req.ip);

        const allServer = client.guilds.cache;
        const playingServers = new Set(client.lavashark.players.keys());

        const serverlist = allServer.map((guild) => ({
            data: guild,
            active: playingServers.has(guild.id),
        }));

        res.send(serverlist);
    });

    app.get('/api/server/info/:guildID', verifyLogin, async (req, res) => {
        // bot.logger.emit('api', `[GET] /api/server/info/${req.params.guildID} ` + req.ip);

        const guild = await client.guilds.fetch(req.params.guildID);

        if (!guild) {
            res.send({});
        }
        else {
            res.send(guild);
        }
    });

    app.post('/api/server/leave', verifyLogin, async (req, res) => {
        const { guildID } = req.body;

        if (!guildID) {
            return res.send('PARAMETER_ERROR');
        }

        const guild = client.guilds.cache.get(guildID);

        if (!guild) {
            return res.send('PARAMETER_ERROR');
        }


        try {
            const player = client.lavashark.getPlayer(guildID);

            if (player) {
                player.destroy();
            }

            await guild?.leave();
        } catch (error) {
            bot.logger.emit('error', `There was an error leaving the guild: \n ${error}`);
            return res.send('FAILED');
        }

        return res.send('SUCCESS');
    });

    app.get('/api/user/:userID', verifyLogin, (req, res) => {
        // bot.logger.emit('api', `[GET] /api/user/avatar/${req.params.id} ` + req.ip);

        const user = client.users.cache.get(req.params.userID);
        res.send(user);
    });

    app.get('/api/lavashark/getThumbnail/:source/:id', verifyLogin, (req, res) => {
        // bot.logger.emit('api', `[GET] /api/lavashark/getThumbnail/${req.params.source}/${req.params.id} ` + req.ip);

        if (req.params.source === 'youtube') {
            res.send(`https://img.youtube.com/vi/${req.params.id}/sddefault.jpg`);
        }
        else {
            res.send('NOT_FOUND');
        }
    });

    app.get('/api/localnode/hasEnable', verifyLogin, (req, res) => {
        res.json({ enable: bot.config.enableLocalNode });
    });

    app.get('/api/localnode/getLogs', verifyLogin, (req, res) => {
        res.json({ logs: localNodeController.lavalinkLogs });
    });

    app.post('/api/localnode/controller', async (req, res) => {
        const { type } = req.body;
        let result;

        if (type === 'RESTART') {
            result = await localNodeController.restart() ? 'SUCCEED' : 'FAILED';
        }
        else if (type === 'STOP') {
            result = await localNodeController.stop() ? 'SUCCEED' : 'FAILED';
        }
        else {
            result = 'FAILED';
        }

        res.json({ type, result });
    });

    app.get('/api/logger/getLogs', verifyLogin, (req, res) => {
        res.json({ logs: bot.logger.logs });
    });

    app.get('/api/oauth2-link', (req, res) => {
        res.json({ link: bot.config.site.oauth2Link });
    });




    app.use('*', (req, res) => {
        res.redirect('/dashboard');
    });
};

export { registerExpressEvents };