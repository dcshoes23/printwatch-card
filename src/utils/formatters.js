/**
 * Parse ISO 8601 duration string into total seconds
 * @param {string} duration - ISO 8601 duration string (e.g., "PT2H34M12S")
 * @returns {number} Total seconds
 */
const parseDuration = (duration) => {
  if (!duration || typeof duration !== 'string') return 0;

  // Handle ISO 8601 duration format (PT2H34M12S)
  const iso8601Match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+(?:\.\d+)?)S)?/);
  if (iso8601Match) {
    const hours = parseInt(iso8601Match[1] || 0);
    const minutes = parseInt(iso8601Match[2] || 0);
    const seconds = parseFloat(iso8601Match[3] || 0);
    return hours * 3600 + minutes * 60 + seconds;
  }

  // Try parsing as number (assuming seconds)
  const numValue = parseFloat(duration);
  if (!isNaN(numValue)) {
    return numValue;
  }

  return 0;
};

/**
 * Format duration into human readable format
 * @param {string|number} duration - Duration string (ISO 8601) or number (seconds/minutes)
 * @param {object} options - Formatting options
 * @returns {string} Formatted duration string
 */
export const formatDuration = (duration, options = {}) => {
  const {
    showComplete = true,
    completeText = 'Complete',
    isMinutes = false
  } = options;

  let totalSeconds;

  if (typeof duration === 'string') {
    totalSeconds = parseDuration(duration);
  } else if (typeof duration === 'number') {
    totalSeconds = isMinutes ? duration * 60 : duration;
  } else {
    return showComplete ? completeText : '0m';
  }

  if (totalSeconds <= 0) {
    return showComplete ? completeText : '0m';
  }

  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = Math.floor(totalSeconds % 60);

  if (hours > 0) {
    return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
  }
  if (minutes > 0) {
    return seconds > 0 && minutes < 5 ? `${minutes}m ${seconds}s` : `${minutes}m`;
  }
  return `${seconds}s`;
};

/**
 * Calculate and format the end time based on remaining minutes
 * @param {number} remainingMinutes - Remaining time in minutes
 * @param {object} hass - Home Assistant instance
 * @returns {string} Formatted end time
 */
export const formatEndTime = (remainingMinutes, hass) => {
  if (!remainingMinutes || remainingMinutes <= 0 || !hass) {
    return '---';
  }

  try {
    const endTime = new Date(Date.now() + (remainingMinutes * 60000));
    const timeFormat = {
      hour: hass.locale.hour_24 ? '2-digit' : 'numeric',
      minute: '2-digit',
      hour12: !hass.locale.hour_24
    };

    return new Intl.DateTimeFormat(hass.locale.language, timeFormat)
      .format(endTime)
      .toLowerCase()
      .replace(/\s/g, '');
  } catch (error) {
    console.warn('Error formatting end time:', error);
    return '---';
  }
};

/**
 * Format a temperature value with unit
 * @param {number|string} value - Temperature value
 * @param {string} unit - Temperature unit
 * @returns {string} Formatted temperature
 */
export const formatTemperature = (value, unit) => {
  const temp = parseFloat(value);
  if (isNaN(temp)) return '---';
  return `${temp.toFixed(0)}${unit}`;
};