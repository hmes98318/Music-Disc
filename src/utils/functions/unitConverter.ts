import i18next from 'i18next';

const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 ' + i18next.t('commands:UNIT_BYTES');

    const k = 1024;
    const sizes = [
        i18next.t('commands:UNIT_BYTES'),
        i18next.t('commands:UNIT_KB'),
        i18next.t('commands:UNIT_MB'),
        i18next.t('commands:UNIT_GB'),
        i18next.t('commands:UNIT_TB')
    ];

    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + (sizes[i] || '??');
};

const msToTime = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) {
        return `${days}${i18next.t('commands:UNIT_DAYS')} ${hours % 24}${i18next.t('commands:UNIT_HOURS')}`;
    }
    else if (hours > 0) {
        return `${hours}${i18next.t('commands:UNIT_HOURS')} ${minutes % 60}${i18next.t('commands:UNIT_MINUTES')}`;
    }
    else if (minutes > 0) {
        return `${minutes}${i18next.t('commands:UNIT_MINUTES')} ${seconds % 60}${i18next.t('commands:UNIT_SECONDS')}`;
    }
    else {
        return `${seconds % 60}${i18next.t('commands:UNIT_SECONDS')}`;
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
        const regex = /(\d+)\s*(h|m|s|d|일|시간|분|초)/g;
        let match;
        let valid = false; // Flag to track if any valid match is found

        const unitDays = i18next.t('commands:UNIT_DAYS');
        const unitHours = i18next.t('commands:UNIT_HOURS');
        const unitMinutes = i18next.t('commands:UNIT_MINUTES');
        const unitSeconds = i18next.t('commands:UNIT_SECONDS');

        while ((match = regex.exec(timeString)) !== null) {
            const value = parseInt(match[1]);
            const unit = match[2];

            if (unit === 'd' || unit === '일' || unit === unitDays) {
                hours += value * 24;
                valid = true;
            }
            else if (unit === 'h' || unit === '시간' || unit === unitHours) {
                hours += value;
                valid = true;
            }
            else if (unit === 'm' || unit === '분' || unit === unitMinutes) {
                minutes += value;
                valid = true;
            }
            else if (unit === 's' || unit === '초' || unit === unitSeconds) {
                seconds += value;
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