/**
 * Converts a byte size to string with appropriate units (e.g., KB, MB).
 *
 * @param {number} bytes - The byte size.
 * @returns {string} - Ｕnits.
 */
const formatBytes = (bytes) => {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];

    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};