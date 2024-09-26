import { EventEmitter } from 'events';
import fs, { promises as fsPromises } from 'fs';
import * as path from 'path';
import * as zlib from 'zlib';


export type LoggerEvents = {
    'api': (message: string) => void;
    'error': (shardId:number, message: string) => void;
    'lavashark': (shardId:number, message: string) => void;
    'localNode': (message: string) => void;
    'log': (shardId:number, message: string) => void;
    'discord': (shardId:number, message: string) => void;
    'shard': (message: string) => void;
};


export class Logger extends EventEmitter {
    public readonly logDir: string;
    public format: string;

    readonly #logFilePath: string;
    #currentLogDate: string;
    #formatTokens: string[];
    #isWriting: boolean;
    #logQueue: string[];


    /**
     * @param {string} format - Time format `YYYY-MM-DD HH(hh):mm:ss.l`  
     * @param {string} logDir - Directory to store log files, default is './logs'
     */
    constructor(format: string = 'YYYY-MM-DD HH:mm:ss.l', logDir: string = './logs') {
        super();

        this.format = format;
        this.logDir = logDir;

        this.#currentLogDate = this.getCurrentDate();   // 'YYYY-MM-DD'
        this.#formatTokens = this.#parseFormatTokens();
        this.#isWriting = false;
        this.#logQueue = [];

        console.log(this.getFormatTime(), 'Initialize Logger ......');

        // Ensure the log directory exists
        if (!fs.existsSync(this.logDir)) {
            fs.mkdirSync(this.logDir, { recursive: true });
        }

        this.#logFilePath = path.join(this.logDir, 'bot.log');

        this.#checkAndArchiveLogFile();

        this.#setListener();
    }

    public emit<EventName extends keyof LoggerEvents>(event: EventName, ...args: Parameters<LoggerEvents[EventName]>): boolean {
        return super.emit(event, ...args);
    }

    public on<EventName extends keyof LoggerEvents>(event: EventName, listener: LoggerEvents[EventName]): this {
        return super.on(event, listener);
    }

    public once<EventName extends keyof LoggerEvents>(event: EventName, listener: LoggerEvents[EventName]): this {
        return super.once(event, listener);
    }


    /**
     * @private
     */
    #setListener() {
        this.on('api', (message: string) => {
            const msg = `${this.getFormatTime()} [api] ${message}`;
            this.#addLog(msg);
        });

        this.on('error', (shardId:number, message: string) => {
            const msg = `${this.getFormatTime()} [#${shardId}] [error] ${message}`;
            this.#addLog(msg);
        });

        this.on('lavashark', (shardId:number, message: string) => {
            const msg = `${this.getFormatTime()} [#${shardId}] [lavashark] ${message}`;
            this.#addLog(msg);
        });

        this.on('localNode', (message: string) => {
            const msg = `${this.getFormatTime()} [localNode] ${message}`;
            this.#addLog(msg);
        });

        this.on('log', (shardId:number, message: string) => {
            const msg = `${this.getFormatTime()} [#${shardId}] ${message}`;
            this.#addLog(msg);
        });

        this.on('discord', (shardId:number, message: string) => {
            const msg = `${this.getFormatTime()} [#${shardId}] [discord] ${message}`;
            this.#addLog(msg);
        });

        this.on('shard', (message: string) => {
            const msg = `${this.getFormatTime()} [shard] ${message}`;
            this.#addLog(msg);
        });
    }

    /**
     * Returns the current date in 'YYYY-MM-DD' format.
     * @returns {string} - 'YYYY-MM-DD'
     */
    public getCurrentDate(): string {
        const now = new Date();
        return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    }

    /**
     * Get the formatted current time
     * @returns {string} - 'YYYY-MM-DD HH(hh):mm:ss.l'
     */
    public getFormatTime(): string {
        const now = new Date();

        const timeValues: { [token: string]: string } = {
            'YYYY': String(now.getFullYear()),
            'MM': String(now.getMonth() + 1).padStart(2, '0'),
            'DD': String(now.getDate()).padStart(2, '0'),
            'HH': String(now.getHours()).padStart(2, '0'),
            'hh': String(now.getHours() % 12 || 12).padStart(2, '0'),
            'mm': String(now.getMinutes()).padStart(2, '0'),
            'ss': String(now.getSeconds()).padStart(2, '0'),
            'l': String(now.getMilliseconds()).padStart(3, '0'),
        };

        // Replace each token in the format string with its corresponding value
        const formattedTime = this.#formatTokens.reduce(
            (result, token) => result.replace(token, timeValues[token]),
            this.format
        );

        // 12-hour clock
        if (this.#formatTokens.includes('hh')) {
            const period = Number(timeValues['HH']) < 12 ? 'AM' : 'PM';
            return formattedTime + ` ${period}`;
        }

        return '[' + formattedTime + ']';
    }

    /**
     * Calculation time format  
     * @private
     */
    #parseFormatTokens(): string[] {
        // Regular expression to match time tokens in the format string
        const timeTokenRegex = /(YYYY|MM|DD|HH|hh|mm|ss|l)/g;
        const matches = this.format.match(timeTokenRegex);

        // If there are matches, return the array of matched tokens
        return matches ? matches : [];
    }

    public async getAllLogs(): Promise<string[] | false> {
        try {
            const fileContent = await fsPromises.readFile(this.#logFilePath, 'utf-8');
            return fileContent.trim().split('\n');
        } catch (error) {
            console.error(this.getFormatTime(), 'Failed to read log file:', error);
            return false;
        }
    }

    /**
     * Reads log content from the specified line number onward.
     * @param {number} lineNumber - The line number to start reading from (1-based index).
     * @returns {Promise<string[] | false>} - Returns a promise resolving to an array of log lines after the specified line number, 
     *                                        or `false` if the line number does not exist.
     */
    public async getLogsFromLine(lineNumber: number): Promise<string[] | false> {
        if (lineNumber < 1) {
            return false;
        }

        try {
            const fileContent = await fsPromises.readFile(this.#logFilePath, 'utf-8');
            const lines = fileContent.trim().split('\n');

            if (lineNumber > lines.length) {
                return false;
            }

            return lines.slice(lineNumber);
        } catch (error) {
            console.error('Failed to read logs:', error);
            return false;
        }
    }

    /**
     * @private
     */
    #addLog(message: string): void {
        console.log(message);

        const currentDate = message.replace(/\r\n|\r|\n/g, ' ').replace(/.*\[(\d{4}-\d{2}-\d{2}).*\].*/, '$1');  // 'YYYY-MM-DD'

        if (currentDate !== this.#currentLogDate) {
            this.#archiveLogFile();
            this.#currentLogDate = currentDate;
        }

        this.#logQueue.push(message);
        this.#processLogQueue();
    }

    /**
     * Processes the log queue and writes each log message to the log file in sequence.
     * Ensures that log messages are written in the order they are received.
     * If a write operation is in progress, the function exits early and will be called again
     * after the current write operation completes.
     * @private
     */
    #processLogQueue(): void {
        if (this.#isWriting || this.#logQueue.length === 0) {
            return;
        }

        this.#isWriting = true;
        const message = this.#logQueue.shift() + '\n';

        fs.appendFile(this.#logFilePath, message, 'utf-8', (error) => {
            if (error) {
                console.log('Logger writing error', error);
            }
            this.#isWriting = false;
            this.#processLogQueue();  // Continue processing the queue
        });
    }

    /**
     * Archives the current log file by compressing it and appending the date to the filename.
     * @private
     */
    #archiveLogFile(archiveDate: string = this.#currentLogDate): void {
        console.log(this.getFormatTime(), `Starting to archive log file: bot.log.${archiveDate}.gz`);

        try {
            const archiveName = `bot.log.${archiveDate}.gz`;
            const archivePath = path.join(this.logDir, archiveName);

            const fileContent = fs.readFileSync(this.#logFilePath, 'utf-8');
            const compressedContent = zlib.gzipSync(fileContent);

            fs.writeFileSync(archivePath, compressedContent);
            fs.unlinkSync(this.#logFilePath);

            console.log(this.getFormatTime(), 'Log file archiving completed.');
        } catch (error) {
            console.error(this.getFormatTime(), 'Failed to archive log file:', error);
        }
    }

    /**
     * Checks if the last log entry in the current log file is from today. If not, archives the log file.
     * @private
     */
    #checkAndArchiveLogFile(): void {
        if (fs.existsSync(this.#logFilePath)) {
            const fileContent = fs.readFileSync(this.#logFilePath, 'utf-8');

            const lines = fileContent.trim().split('\n');
            const lastLine = lines[lines.length - 1];

            if (lastLine) {
                // Extract the date from the last line
                const logDateMatch = lastLine.match(/^\[(\d{4}-\d{2}-\d{2})[^]*?\]/);  // [YYYY-MM-DD]

                if (logDateMatch) {
                    const logDate = lastLine.replace(/\r\n|\r|\n/g, ' ').replace(/.*\[(\d{4}-\d{2}-\d{2}).*\].*/, '$1');
                    const currentDate = this.getFormatTime().replace(/.*\[(\d{4}-\d{2}-\d{2}).*\].*/, '$1');

                    // Archive the log file if the date is different
                    if (logDate !== currentDate) {
                        this.#archiveLogFile(logDate);
                    }
                }
                else {
                    this.#archiveLogFile();
                }
            }
        }
    }
}
