const timeToSeconds = (time) => {
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
}

module.exports.timeToSeconds = timeToSeconds;