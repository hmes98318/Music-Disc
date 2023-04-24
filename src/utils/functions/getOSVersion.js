const os = require('os');
const { exec } = require('child_process');


const getOSVersion = () => {
    return new Promise((resolve, reject) => {
        const platform = process.platform;

        if (platform === "win32") {
            resolve(os.type());
        }
        else if (platform === "linux") {
            exec('cat /etc/*release | grep -E ^PRETTY_NAME',
                (error, stdout, stderr) => {
                    if (error) {
                        resolve(process.platform);
                    } else {
                        const os_version = stdout.split('"')[1];
                        resolve(os_version);
                    }
                });
        }
        else {
            resolve(process.platform);
        }
    });
}

module.exports.getOSVersion = getOSVersion;