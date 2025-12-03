/**
 * Format duration into human readable format
 * Duration entities in Home Assistant provide values with a unit_of_measurement
 * @param {string|number} duration - Duration value from entity
 * @param {string} unit - Unit of measurement (h, min, s)
 * @param {object} options - Formatting options
 * @returns {string} Formatted duration string
 */
export const formatDuration = (duration, unit = 'min', options = {}) => {
  const {
    showComplete = true,
    completeText = 'Complete'
  } = options;

  // Parse the duration value
  let value;

  if (typeof duration === 'string') {
    value = parseFloat(duration);
  } else if (typeof duration === 'number') {
    value = duration;
  } else {
    return showComplete ? completeText : '0m';
  }

  // Handle invalid or zero values
  if (isNaN(value) || value <= 0) {
    return showComplete ? completeText : '0m';
  }

  // Convert to seconds based on unit
  let totalSeconds;
  switch (unit) {
    case 'h':
    case 'hr':
    case 'hour':
    case 'hours':
      totalSeconds = value * 3600;
      break;
    case 'min':
    case 'minute':
    case 'minutes':
      totalSeconds = value * 60;
      break;
    case 's':
    case 'sec':
    case 'second':
    case 'seconds':
      totalSeconds = value;
      break;
    default:
      // Default to minutes if unknown unit
      totalSeconds = value * 60;
  }

  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = Math.floor(totalSeconds % 60);

  // Format based on duration length
  if (hours > 0) {
    // For hours, show minutes too if present
    return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
  }
  if (minutes > 0) {
    // For minutes, show seconds only if less than 5 minutes
    return seconds > 0 && minutes < 5 ? `${minutes}m ${seconds}s` : `${minutes}m`;
  }
  // Less than a minute, show seconds
  return `${seconds}s`;
};

/**
 * Format end time from entity timestamp
 * @param {string} endTimeValue - ISO timestamp from end_time entity
 * @param {object} hass - Home Assistant instance
 * @returns {string} Formatted end time in user's locale
 */
export const formatEndTime = (endTimeValue, hass) => {
  if (!endTimeValue || endTimeValue === 'unknown' || endTimeValue === 'unavailable' || !hass) {
    return '---';
  }

  try {
    // Parse the ISO timestamp
    const endTime = new Date(endTimeValue);

    // Check if valid date
    if (isNaN(endTime.getTime())) {
      return '---';
    }

    const timeFormat = {
      hour: 'numeric',
      minute: '2-digit',
      hour12: !hass.locale?.time_format?.includes('24')
    };

    // Format with user's locale
    const formatted = new Intl.DateTimeFormat(hass.language || 'en-US', timeFormat).format(endTime);
    return formatted;
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