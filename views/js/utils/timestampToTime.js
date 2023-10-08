/**
 * Converts a timestamp or Date object to a formatted string
 * 
 * @param {timestamp} - timestamp or Date
 * @returns {string} - YYYY-MM-DD HH:MM:SS
 */
const timestampToTime = (timestamp) => {
    const date = new Date(timestamp);

    // Get date
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();

    // Get time
    const hours = date.getHours();
    const minutes = date.getMinutes();
    const seconds = date.getSeconds();

    // Format date & time
    const formattedDate = `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
    const formattedTime = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

    return `${formattedDate} ${formattedTime}`;
};