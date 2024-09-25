import child_process, { ChildProcess } from 'child_process';
import fs from 'fs';
import path from 'path';
import readline from 'readline';

import { cst } from '../../utils/constants';
import { formatBytes } from '../../utils/functions/unitConverter';

import type { Logger } from '../Logger';


export class LocalNodeController {
    /** Local node download link */
    public readonly downloadLink: string;

    /** Automatically restart when node crashes (default: true) */
    public readonly autoRestart: boolean;

    /** Local node lavalink logs */
    public lavalinkLogs: string[];

    /** Local node lavalink pid */
    public lavalinkPid: number | null;

    /** Local node listenong port */
    public port: number;

    /** @inner Manually set up the logger */
    public logger: Logger;

    #lavalinkProcessController: ChildProcess | null;
    #lavalinkProcessFileName: string;
    #manualRestart: boolean;

    constructor(downloadLink: string, logger: Logger, autoRestart: boolean = true) {
        this.downloadLink = downloadLink;
        this.autoRestart = autoRestart;
        this.logger = logger;

        this.lavalinkLogs = [];
        this.#lavalinkProcessController = null;
        this.#lavalinkProcessFileName = (path.extname(__filename) === '.ts') ? 'LavalinkProcess.ts' : 'LavalinkProcess.js';
        this.#manualRestart = false;
    }


    public async checkJavaVersion(output: boolean = false) {
        return new Promise<boolean>((resolve, _reject) => {
            child_process.exec('java -version', (error, stdout, stderr) => {
                if (output) {
                    this.logger.emit('localNode', stdout);
                    this.logger.emit('localNode', stderr);
                }

                if (error) {
                    resolve(false);
                }
                else {
                    resolve(true);
                }
            });
        });
    }

    public async restart() {
        if (!this.#manualRestart || !this.#lavalinkProcessController) {
            this.#manualRestart = true;
            await this.stop();
            await this.initialize();

            return true;
        }

        // If the node is restarting, return false
        return false;
    }

    public async stop() {
        return new Promise<boolean>((resolve, _reject) => {
            if (this.#lavalinkProcessController) {
                this.#lavalinkProcessController.once('exit', (_code, _signal) => {
                    this.logger.emit('localNode', 'Local Lavalink node stopped.');

                    this.#lavalinkProcessController = null;
                    if (this.lavalinkPid) this.#killProcess(this.lavalinkPid);
                    this.lavalinkPid = null;

                    return resolve(true);
                });

                this.#manualRestart = true;
                this.#lavalinkProcessController.kill('SIGINT');
            }
            else {
                this.logger.emit('localNode', 'Local Lavalink node does not exist.');
                return resolve(false);
            }
        });
    }

    public async initialize() {
        const filename = 'Lavalink.jar';
        await this.#downloadFile(this.downloadLink, filename);

        return new Promise<void>((resolve, _reject) => {
            this.#lavalinkProcessController = child_process.fork(path.resolve(__dirname, this.#lavalinkProcessFileName));

            // Send .jar path
            this.#lavalinkProcessController.once('spawn', () => {
                this.#lavalinkProcessController!.send(`./server/${filename}`);
            });


            this.#lavalinkProcessController.on('message', (message: string) => {
                // Lavalink log records
                this.lavalinkLogs.push(message);

                /**
                 * Status code handling
                 * LAVALINK_STARTED
                 * LAVALINK_READY
                 * LAVALINK_PORT_${number}
                 * LAVALINK_PID_${number}
                 */
                if (message.includes('LAVALINK_')) {
                    if (message === 'LAVALINK_STARTED') {
                        this.logger.emit('localNode', 'The local node is starting ...');
                    }
                    else if (message === 'LAVALINK_READY') {
                        this.logger.emit('localNode', 'The local node started successfully.');
                        this.#manualRestart = false;
                        return resolve();
                    }
                    else if ((/^LAVALINK_PORT_(\d+)$/).test(message)) {
                        const portRegex = /^LAVALINK_PORT_(\d+)$/;
                        const portMatch = message.match(portRegex);
                        this.port = Number(portMatch![1]);

                        this.logger.emit('localNode', `The local node listening on port ${this.port}`);
                    }
                    else if (/^LAVALINK_PID_(\d+)$/.test(message)) {
                        const pidRegex = /^LAVALINK_PID_(\d+)$/;
                        const pidMatch = message.match(pidRegex);

                        this.lavalinkPid = Number(pidMatch![1]);
                    }
                }
            });


            this.#lavalinkProcessController.on('exit', async (code, signal) => {
                this.logger.emit('localNode', cst.color.yellow + `Local Lavalink node exited with code ${code ?? signal}` + cst.color.white);

                this.#lavalinkProcessController = null;

                if (this.lavalinkPid) this.#killProcess(this.lavalinkPid);
                this.lavalinkPid = null;

                // Try to restart automatically
                if (this.autoRestart && !this.#manualRestart) {
                    this.logger.emit('localNode', 'Try to restart automatically.');
                    this.initialize();
                }
            });
        });
    }

    /**
     * @private
     */
    async #downloadFile(url: string, filename: string) {
        if (!fs.existsSync('server')) {
            await fs.promises.mkdir('server');
        }

        const destination = path.resolve('./server', filename);

        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`[localNode] Failed to fetch the file: ${response.statusText}`);
        }


        const contentLength = Number(response.headers.get('content-length'));
        const tragetSize = formatBytes(contentLength);

        if (fs.existsSync(destination)) {
            const existingFileSize = fs.statSync(destination).size;

            if (existingFileSize === contentLength) {
                this.logger.emit('localNode', 'File already exists. Skipping download.');
                return;
            }
            else {
                fs.unlinkSync(destination);
            }
        }


        const fileStream = fs.createWriteStream(destination, { flags: 'wx' });
        const reader = response.body!.getReader();
        let downloadedBytes = 0;

        this.logger.emit('localNode', `Download Lavalink from: ${this.downloadLink}`);
        this.logger.emit('localNode', 'Start downloading file ...');

        while (true) {
            const { done, value } = await reader.read();

            if (done) {
                process.stdout.write('\n');
                break;
            }

            fileStream.write(value);
            downloadedBytes += value.length;

            // Calculate and log download progress
            if (contentLength) {
                const progress = (downloadedBytes / contentLength) * 100;
                readline.clearLine(process.stdout, 0);
                readline.cursorTo(process.stdout, 0);
                process.stdout.write(`Download Progress: ${~~progress} % (${formatBytes(downloadedBytes)} / ${tragetSize})`);
            }
        }

        fileStream.end();


        fileStream.on('close', () => {
            this.logger.emit('localNode', 'File downloaded successfully.');
        });

        fileStream.on('error', (err) => {
            console.error('[localNode] Error writing the file:', err);
        });
    }

    /**
     * Oracle JDK for windows platform
     * @private
     */
    async #winGetPid(port: number): Promise<number[]> {
        return new Promise((resolve, _reject) => {
            child_process.exec(`netstat -ano | findstr :${port}`, (error, stdout, stderr) => {
                if (error) {
                    this.logger.emit('localNode', `[error] winGetPid error executing command: ${error.message}`);
                    return resolve([]);
                }

                if (stderr) {
                    this.logger.emit('localNode', `[error] winGetPid stderr: ${stderr}`);
                    return resolve([]);
                }

                const lines = stdout.trim().split('\n');
                const pidSet: Set<number> = new Set();

                lines.forEach((line) => {
                    const parts = line.trim().split(/\s+/);
                    const pid = parseInt(parts[parts.length - 1], 10);

                    /**
                     * process.pid is the main process
                     * Pid 0 is the parent process
                     */
                    if (!isNaN(pid) && pid !== process.pid && pid !== 0) {
                        pidSet.add(pid);
                    }
                });

                const pidList = Array.from(pidSet);
                return resolve(pidList);
            });
        });
    }

    /**
     * @private
     */
    async #killProcess(pid: number) {
        try {
            /**
             * In Windows, you can terminate a child process and release the port directly 
             * by using `ChildProcess.kill('SIGINT')`, without the need for `process.kill(pid)`.
             * 
             * OpenJDK normal.
             * However, Oracle JDK will open two processes, 
             * making it impossible to completely shut down the child process. 
             * It is necessary to scan all pid occupying the port to forcefully terminate all pid.
             */
            if (process.platform === 'win32') {
                const winPidList = await this.#winGetPid(this.port);

                for (const winPid of winPidList) {
                    process.kill(winPid, 'SIGINT');
                }

                return true;
            }


            /**
             * MacOS, Linux need to kill pid to release port
             */
            process.kill(pid, 'SIGINT');
            return true;
        } catch (_) {
            return false;
        }
    }
}