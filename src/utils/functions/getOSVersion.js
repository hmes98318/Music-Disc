const os = require('os');
const { exec } = require('child_process');


const getOSVersion = () => {
    return new Promise((resolve, reject) => {
        const platform = process.platform;

        if (platform === "win32") {
            resolve(os.version());
        }
        else if (platform === "linux" || platform === "freebsd") {
            exec('cat /etc/*release | grep -E ^PRETTY_NAME',
                (error, stdout, stderr) => {
                    if (error) {
                        resolve(os.type());
                    } else {
                        const os_version = stdout.split('"')[1];
                        resolve(os_version);
                    }
                });
        }
        else if (platform === "darwin") {
            exec('system_profiler SPSoftwareDataType',
                (error, stdout, stderr) => {
                    if (error) {
                        resolve(os.type());
                    } else {
                        const os_version = stdout.match(/System Version: (.+)\n/)[1];
                        resolve(os_version);
                    }
                });
        }
        else {
            resolve(os.type());
        }
    });
}

module.exports.getOSVersion = getOSVersion;