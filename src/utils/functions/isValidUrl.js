const { URL } = require('url');


const isValidUrl = (str) => {
    try {
        new URL(str);
        return true;
    } catch (err) {
        return false;
    }
}

module.exports.isValidUrl = isValidUrl;