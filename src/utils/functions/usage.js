const os = require('os');


const usage = {
    cpu: () => {
        const avg_load = os.loadavg();
        console.log('CPU:', avg_load);
        return avg_load[0] + '%';
    },
    ram: () => {
        const using = Math.round((os.totalmem() - os.freemem()) / (1000 * 1000)) + 'MB';
        console.log('RAM:', using);
        return using;
    }
};

module.exports.usage = usage;