/**
 * Device entity discovery utilities for PrintWatch card
 */

/**
 * Get all entities for a given device ID
 * @param {Object} hass - Home Assistant object
 * @param {string} deviceId - Device ID to get entities for
 * @returns {Array} Array of entity IDs
 */
export const getDeviceEntities = (hass, deviceId) => {
  if (!deviceId || !hass.entities) {
    return [];
  }

  const entities = [];
  Object.keys(hass.entities).forEach((entityId) => {
    const entity = hass.entities[entityId];
    if (entity.device_id === deviceId) {
      entities.push(entityId);
    }
  });

  return entities;
};

/**
 * Find entity by domain and pattern matching
 * @param {Object} hass - Home Assistant object
 * @param {string} deviceId - Device ID
 * @param {string} domain - Entity domain (sensor, binary_sensor, etc)
 * @param {Array<string>} patterns - Array of string patterns to match in entity_id
 * @returns {string|null} Entity ID or null
 */
const findEntityByPattern = (hass, deviceId, domain, patterns) => {
  const entities = getDeviceEntities(hass, deviceId);

  for (const pattern of patterns) {
    const found = entities.find(entityId => {
      const matchesDomain = entityId.startsWith(`${domain}.`);
      const matchesPattern = entityId.toLowerCase().includes(pattern.toLowerCase());
      return matchesDomain && matchesPattern;
    });

    if (found) return found;
  }

  return null;
};

/**
 * Discover all printer entities from a device
 * @param {Object} hass - Home Assistant object
 * @param {string} deviceId - Printer device ID
 * @returns {Object} Object with all discovered entity IDs
 */
export const discoverPrinterEntities = (hass, deviceId) => {
  if (!deviceId || !hass.entities) {
    return {};
  }

  const entities = {};

  // Status entities
  entities.print_status_entity = findEntityByPattern(hass, deviceId, 'sensor', ['print_status', 'status']);
  entities.current_stage_entity = findEntityByPattern(hass, deviceId, 'sensor', ['current_stage', 'stage']);
  entities.task_name_entity = findEntityByPattern(hass, deviceId, 'sensor', ['task_name', 'print_name', 'job_name']);
  entities.online_entity = findEntityByPattern(hass, deviceId, 'binary_sensor', ['online', 'connected']);

  // Progress entities
  entities.progress_entity = findEntityByPattern(hass, deviceId, 'sensor', ['print_progress', 'progress']);
  entities.current_layer_entity = findEntityByPattern(hass, deviceId, 'sensor', ['current_layer', 'layer_num']);
  entities.total_layers_entity = findEntityByPattern(hass, deviceId, 'sensor', ['total_layer', 'layer_count']);

  // Time entities
  entities.remaining_time_entity = findEntityByPattern(hass, deviceId, 'sensor', ['remaining_time', 'time_remaining']);
  entities.end_time_entity = findEntityByPattern(hass, deviceId, 'sensor', ['end_time', 'finish_time']);

  // Temperature entities
  entities.bed_temp_entity = findEntityByPattern(hass, deviceId, 'sensor', ['bed_temperature', 'bed_temp']);
  entities.nozzle_temp_entity = findEntityByPattern(hass, deviceId, 'sensor', ['nozzle_temperature', 'nozzle_temp', 'hotend_temp']);
  entities.bed_target_temp_entity = findEntityByPattern(hass, deviceId, 'number', ['bed_target', 'target_bed']);
  entities.nozzle_target_temp_entity = findEntityByPattern(hass, deviceId, 'number', ['nozzle_target', 'target_nozzle', 'hotend_target']);

  // Control entities
  entities.pause_button_entity = findEntityByPattern(hass, deviceId, 'button', ['pause']);
  entities.resume_button_entity = findEntityByPattern(hass, deviceId, 'button', ['resume']);
  entities.stop_button_entity = findEntityByPattern(hass, deviceId, 'button', ['stop', 'cancel']);
  entities.speed_profile_entity = findEntityByPattern(hass, deviceId, 'select', ['speed', 'print_speed']);

  // Hardware entities
  entities.chamber_light_entity = findEntityByPattern(hass, deviceId, 'light', ['chamber', 'light']);
  entities.aux_fan_entity = findEntityByPattern(hass, deviceId, 'fan', ['aux', 'auxiliary', 'part_cooling']);

  // Camera entities - support both camera and image domains
  entities.camera_entity = findEntityByPattern(hass, deviceId, 'camera', ['camera', 'webcam']) ||
                          findEntityByPattern(hass, deviceId, 'image', ['camera', 'webcam']);
  entities.cover_image_entity = findEntityByPattern(hass, deviceId, 'image', ['cover', 'preview', 'thumbnail']);

  // Print info entities
  entities.print_weight_entity = findEntityByPattern(hass, deviceId, 'sensor', ['weight', 'filament_weight']);
  entities.print_length_entity = findEntityByPattern(hass, deviceId, 'sensor', ['length', 'filament_length']);

  // Active tray for AMS
  entities.active_tray_index_entity = findEntityByPattern(hass, deviceId, 'sensor', ['active_tray', 'tray_index']);

  return entities;
};

/**
 * Discover AMS tray entities from AMS devices
 * @param {Object} hass - Home Assistant object
 * @param {Array<string>} amsDeviceIds - Array of AMS device IDs
 * @returns {Object} Object with AMS slot entities (ams_slot1_entity, etc.)
 */
export const discoverAMSEntities = (hass, amsDeviceIds) => {
  if (!amsDeviceIds || !Array.isArray(amsDeviceIds) || !hass.entities) {
    return {};
  }

  const entities = {};
  let slotIndex = 1;

  // Process each AMS device
  for (const deviceId of amsDeviceIds) {
    if (!deviceId) continue;

    const deviceEntities = getDeviceEntities(hass, deviceId);

    // Find all tray entities (usually named like ams_1_tray_1, ams_1_tray_2, etc.)
    const trayEntities = deviceEntities
      .filter(entityId => {
        return entityId.startsWith('sensor.') &&
               (entityId.includes('tray') || entityId.includes('slot'));
      })
      .sort(); // Sort to maintain consistent order

    // Assign to slot entities
    for (const trayEntity of trayEntities) {
      entities[`ams_slot${slotIndex}_entity`] = trayEntity;
      slotIndex++;

      // Support up to 16 slots
      if (slotIndex > 16) break;
    }

    if (slotIndex > 16) break;
  }

  return entities;
};

/**
 * Discover external spool entity from device
 * @param {Object} hass - Home Assistant object
 * @param {string} deviceId - External spool device ID
 * @returns {Object} Object with external_spool_entity
 */
export const discoverExternalSpoolEntity = (hass, deviceId) => {
  if (!deviceId || !hass.entities) {
    return {};
  }

  const entity = findEntityByPattern(hass, deviceId, 'sensor', ['spool', 'filament', 'external']);

  return entity ? { external_spool_entity: entity } : {};
};
