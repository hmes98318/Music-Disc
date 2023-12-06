import { EventEmitter } from "events";


export type EventListeners<T> = {
    (event: 'api', listener: (message: string) => void): T;
    (event: 'error', listener: (message: string) => void): T;
    (event: 'lavashark', listener: (message: string) => void): T;
    (event: 'localNode', listener: (message: string) => void): T;
    (event: 'log', listener: (message: string) => void): T;
    (event: 'discord', listener: (message: string) => void): T;
};

export interface LoggerEvents {
    once: EventListeners<this>;
    on: EventListeners<this>;
}

export class Logger extends EventEmitter implements LoggerEvents {
    public logs: string[];
    public format: string;

    #formatTokens: string[];

    /**
     * @param {string} format - Time format `yyyy/mm/dd HH(hh):MM:ss.l`  
     *                          If the format value is updated,  
     *                          you need to call `this.parseFormatTokens()` to recalculate the time format.
     */
    constructor(format: string = 'yyyy/mm/dd HH:MM:ss.l') {
        super();
        this.logs = [];
        this.format = format;
        this.#formatTokens = this.parseFormatTokens();
        this.#setListener();
    }


    /**
     * Get the formatted current time
     * @returns 
     */
    public getFormatTime(): string {
        const now = new Date();

        const timeValues: { [token: string]: string } = {
            'yyyy': String(now.getFullYear()),
            'mm': String(now.getMonth() + 1).padStart(2, '0'),
            'dd': String(now.getDate()).padStart(2, '0'),
            'HH': String(now.getHours()).padStart(2, '0'),
            'hh': String(now.getHours() % 12 || 12).padStart(2, '0'),
            'MM': String(now.getMinutes()).padStart(2, '0'),
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
     * @returns 
     */
    public parseFormatTokens(): string[] {
        // Regular expression to match time tokens in the format string
        const timeTokenRegex = /(yyyy|mm|dd|HH|hh|MM|ss|l)/g;
        const matches = this.format.match(timeTokenRegex);

        // If there are matches, return the array of matched tokens
        return matches ? matches : [];
    }

    /**
     * @private
     */
    #addLog(message: string): void {
        this.logs.push(message);
    }

    /**
     * @private
     */
    #setListener() {
        this.on('api', (message: string) => {
            const msg = `${this.getFormatTime()} [api] ${message}`;

            this.#addLog(msg);
            console.log(msg);
        });

        this.on('error', (message: string) => {
            const msg = `${this.getFormatTime()} [error] ${message}`;

            this.#addLog(msg);
            console.log(msg);
        });

        this.on('lavashark', (message: string) => {
            const msg = `${this.getFormatTime()} [lavashark] ${message}`;

            this.#addLog(msg);
            console.log(msg);
        });

        this.on('localNode', (message: string) => {
            const msg = `${this.getFormatTime()} [localNode] ${message}`;

            this.#addLog(msg);
            console.log(msg);
        });

        this.on('log', (message: string) => {
            const msg = `${this.getFormatTime()} ${message}`;

            this.#addLog(msg);
            console.log(msg);
        });

        this.on('discord', (message: string) => {
            const msg = `${this.getFormatTime()} [discord] ${message}`;

            this.#addLog(msg);
            console.log(msg);
        });
    }
}
