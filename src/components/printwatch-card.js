// src/components/printwatch-card.js
import { LitElement, html } from 'lit';
import { cardTemplate } from '../templates/card-template';
import { cardStyles } from '../styles/card-styles';
import { formatDuration, formatEndTime } from '../utils/formatters';
import { isPrinting, isPaused, getAmsSlots, getEntityStates, getCameraEntityType } from '../utils/state-helpers';
import { DEFAULT_CONFIG, DEFAULT_CAMERA_REFRESH_RATE } from '../constants/config';
import { localize } from '../utils/localize';
import { discoverPrinterEntities, discoverAMSEntities, discoverExternalSpoolEntity } from '../utils/device-helpers';

class PrintWatchCard extends LitElement {
  static get properties() {
    return {
      hass: { type: Object },
      config: { type: Object },
      _lastCameraUpdate: { type: Number },
      _cameraUpdateInterval: { type: Number },
      _cameraError: { type: Boolean },
      _dialogConfig: { state: true },
      _confirmDialog: { state: true }
    };
  }

  static get styles() {
    return cardStyles;
  }

  constructor() {
    super();
    this._lastCameraUpdate = 0;
    this._cameraUpdateInterval = DEFAULT_CAMERA_REFRESH_RATE;
    this._cameraError = false;
    this._dialogConfig = { open: false };
    this._confirmDialog = { open: false };
    this._cameraTimestamp = Date.now();
    this.formatters = {
      formatDuration,
      formatEndTime
    };
  }

  setConfig(config) {
    if (!config.printer_name) {
      throw new Error('Please define printer_name');
    }

    // Check if using new device-based config or legacy entity-based config
    if (config.printer_device) {
      // New device-based configuration
      this._configMode = 'device';
      this._rawConfig = config;
      // Entity discovery will happen when hass is available
      this.config = { ...DEFAULT_CONFIG, printer_name: config.printer_name };
    } else {
      // Legacy entity-based configuration
      this._configMode = 'entity';
      this.config = { ...DEFAULT_CONFIG, ...config };
    }

    this._cameraUpdateInterval = config.camera_refresh_rate || DEFAULT_CAMERA_REFRESH_RATE;
  }

  updated(changedProps) {
    super.updated(changedProps);

    // Discover entities from devices when hass becomes available
    if (changedProps.has('hass') && this._configMode === 'device' && this._rawConfig && this.hass) {
      this._discoverEntitiesFromDevices();
    }

    if (changedProps.has('hass')) {
      if (this.shouldUpdateCamera()) {
        this._updateCameraFeed();
      }
    }
  }

  _discoverEntitiesFromDevices() {
    const { printer_device, ams_devices, external_spool_device } = this._rawConfig;

    let discoveredEntities = {};

    // Discover printer entities
    if (printer_device && this.hass.entities) {
      const printerEntities = discoverPrinterEntities(this.hass, printer_device);
      discoveredEntities = { ...discoveredEntities, ...printerEntities };
    }

    // Discover AMS entities
    if (ams_devices && Array.isArray(ams_devices) && ams_devices.length > 0 && this.hass.entities) {
      const amsEntities = discoverAMSEntities(this.hass, ams_devices);
      discoveredEntities = { ...discoveredEntities, ...amsEntities };
    }

    // Discover external spool entity
    if (external_spool_device && this.hass.entities) {
      const spoolEntities = discoverExternalSpoolEntity(this.hass, external_spool_device);
      discoveredEntities = { ...discoveredEntities, ...spoolEntities };
    }

    // Merge with defaults and raw config
    this.config = {
      ...DEFAULT_CONFIG,
      ...this._rawConfig,
      ...discoveredEntities
    };

    console.log('[PrintWatch] Discovered entities from devices:', discoveredEntities);
  }

  isOnline() {
    const onlineEntity = this.hass?.states[this.config.online_entity];
    return onlineEntity?.state === 'on';
  }

  shouldUpdateCamera() {
    if (!this.isOnline()) {
      return false;
    }

    // Camera entities (live streaming) don't need periodic updates
    const cameraType = getCameraEntityType(this.config.camera_entity);
    if (cameraType === 'camera') {
      return false;
    }

    // Only update image entities periodically
    const now = Date.now();
    return now - this._lastCameraUpdate > this._cameraUpdateInterval;
  }

  handleImageError() {
    this._cameraError = true;
    this.requestUpdate();
  }

  handleImageLoad() {
    this._cameraError = false;
  }

  _toggleLight() {
    const lightEntity = this.hass.states[this.config.chamber_light_entity];
    if (!lightEntity) return;

    const service = lightEntity.state === 'on' ? 'turn_off' : 'turn_on';
    this.hass.callService('light', service, {
      entity_id: this.config.chamber_light_entity,
    });
  }

  _toggleFan() {
    const fanEntity = this.hass.states[this.config.aux_fan_entity];
    if (!fanEntity) return;

    const service = fanEntity.state === 'on' ? 'turn_off' : 'turn_on';
    this.hass.callService('fan', service, {
      entity_id: this.config.aux_fan_entity,
    });
  }


  _updateCameraFeed() {
    if (!this.isOnline()) {
      return;
    }

    // Only update image entities - camera entities handle their own streaming
    const cameraType = getCameraEntityType(this.config.camera_entity);
    if (cameraType === 'camera') {
      return;
    }

    this._lastCameraUpdate = Date.now();
    this._cameraTimestamp = Date.now();

    // Trigger a re-render to update the timestamp in the template
    this.requestUpdate();

    // Also update cover image if it's an image entity
    const coverImg = this.shadowRoot?.querySelector('.preview-image img');
    if (coverImg) {
      const coverEntity = this.hass.states[this.config.cover_image_entity];
      if (coverEntity?.attributes?.entity_picture) {
        const timestamp = new Date().getTime();
        coverImg.src = `${coverEntity.attributes.entity_picture}&t=${timestamp}`;
      }
    }
  }

  handlePauseDialog() {
    this._confirmDialog = {
      open: true,
      type: 'pause',
      title: localize.t('dialogs.pause.title'),
      message: localize.t('dialogs.pause.message'),
      onConfirm: () => {
        const entity = isPaused(this.hass, this.config) 
          ? this.config.resume_button_entity 
          : this.config.pause_button_entity;
        
        this.hass.callService('button', 'press', {
          entity_id: entity
        });
        this._confirmDialog = { open: false };
      },
      onCancel: () => {
        this._confirmDialog = { open: false };
      }
    };
    this.requestUpdate();
  }

  handleStopDialog() {
    this._confirmDialog = {
      open: true,
      type: 'stop',
      title: localize.t('dialogs.stop.title'),
      message: localize.t('dialogs.stop.message'),
      onConfirm: () => {
        this.hass.callService('button', 'press', {
          entity_id: this.config.stop_button_entity
        });
        this._confirmDialog = { open: false };
      },
      onCancel: () => {
        this._confirmDialog = { open: false };
      }
    };
    this.requestUpdate();
  }

  render() {
    if (!this.hass || !this.config) {
      return html``;
    }

    const entities = getEntityStates(this.hass, this.config);
    const amsSlots = getAmsSlots(this.hass, this.config);
    
    const setDialogConfig = (config) => {
      this._dialogConfig = config;
      this.requestUpdate();
    };

    return cardTemplate({
      entities,
      hass: this.hass,
      amsSlots,
      formatters: this.formatters,
      _toggleLight: () => this._toggleLight(),
      _toggleFan: () => this._toggleFan(),
      _cameraError: this._cameraError,
      cameraTimestamp: this._cameraTimestamp,
      isOnline: this.isOnline(),
      handleImageError: () => this.handleImageError(),
      handleImageLoad: () => this.handleImageLoad(),
      dialogConfig: this._dialogConfig,
      confirmDialog: this._confirmDialog,
      setDialogConfig,
      handlePauseDialog: () => this.handlePauseDialog(),
      handleStopDialog: () => this.handleStopDialog(),
    });
  }

  // This is used by Home Assistant for card size calculation
  getCardSize() {
    return 6;
  }

  // Enable visual UI editor
  static getConfigElement() {
    return document.createElement('printwatch-card-editor');
  }

  // Provide stub config for the card picker
  static getStubConfig() {
    return {
      printer_name: 'My 3D Printer',
      printer_device: '',
      ams_devices: [],
      camera_refresh_rate: 1000
    };
  }
}

customElements.define('printwatch-card', PrintWatchCard);

export default PrintWatchCard;