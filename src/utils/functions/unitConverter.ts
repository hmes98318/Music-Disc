const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];

    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const msToTime = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) {
        return `${days} day${days > 1 ? 's' : ''} ${hours % 24} hour${hours % 24 > 1 ? 's' : ''}`;
    }
    else if (hours > 0) {
        return `${hours} hour${hours > 1 ? 's' : ''} ${minutes % 60} minute${minutes % 60 > 1 ? 's' : ''}`;
    }
    else if (minutes > 0) {
        return `${minutes} minute${minutes > 1 ? 's' : ''} ${seconds % 60} second${seconds % 60 > 1 ? 's' : ''}`;
    }
    else {
        return `${seconds % 60} second${seconds % 60 > 1 ? 's' : ''}`;
    }
};

const timestampToTime = (timestamp: number) => {
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

const timeToSeconds = (time: string) => {
    const timeString = time.toLowerCase();
    let hours = 0,
        minutes = 0,
        seconds = 0;

    // Check if the timeString consists only of digits
    if (/^\d+$/.test(timeString)) {
        seconds = parseInt(timeString);
    }

    // Check if the timeString is in the format "m:s" or "h:m:s"
    else if (/^\d+:\d+(\:\d+)?$/.test(timeString)) {
        const timeParts = timeString.split(":");
        const numParts = timeParts.length;

        if (numParts === 2) {
            minutes = parseInt(timeParts[0]);
            seconds = parseInt(timeParts[1]);
        } else if (numParts === 3) {
            hours = parseInt(timeParts[0]);
            minutes = parseInt(timeParts[1]);
            seconds = parseInt(timeParts[2]);
        }
    }

    // Otherwise, parse the timeString into hours, minutes, and seconds
    else {
        const regex = /(\d+)\s*(h|m|s)/g;
        let match;
        let valid = false; // Flag to track if any valid match is found

        while ((match = regex.exec(timeString)) !== null) {
            const value = parseInt(match[1]);

            if (match[2] === 'h') {
                hours = value;
                valid = true;
            }
            else if (match[2] === 'm') {
                minutes = value;
                valid = true;
            }
            else if (match[2] === 's') {
                seconds = value;
                valid = true;
            }
        }

        // If no valid match is found, return false
        if (!valid) {
            return false;
        }
    }

    const totalSeconds = hours * 3600 + minutes * 60 + seconds;
    return totalSeconds;
};


export { formatBytes, msToTime, timestampToTime, timeToSeconds };