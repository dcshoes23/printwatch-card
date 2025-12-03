import { LitElement, html, css } from 'lit';

class PrintWatchCardEditor extends LitElement {
  static get properties() {
    return {
      hass: { type: Object },
      config: { type: Object }
    };
  }

  static get styles() {
    return css`
      .card-config {
        padding: 16px;
      }

      .option {
        margin-bottom: 16px;
      }

      .option label {
        display: block;
        margin-bottom: 4px;
        font-weight: 500;
        color: var(--primary-text-color);
      }

      .option ha-textfield,
      .option ha-select {
        width: 100%;
      }

      .option small {
        display: block;
        margin-top: 4px;
        color: var(--secondary-text-color);
        font-size: 12px;
      }

      .section-title {
        font-size: 16px;
        font-weight: 600;
        margin-top: 24px;
        margin-bottom: 12px;
        color: var(--primary-text-color);
      }

      .ams-device {
        display: flex;
        gap: 8px;
        align-items: flex-end;
        margin-bottom: 8px;
      }

      .ams-device ha-select {
        flex: 1;
      }

      .ams-device mwc-button {
        margin-bottom: 4px;
      }

      mwc-button {
        margin-top: 8px;
      }
    `;
  }

  setConfig(config) {
    this.config = config;
  }

  get _printerName() {
    return this.config?.printer_name || '';
  }

  get _printerDevice() {
    return this.config?.printer_device || '';
  }

  get _amsDevices() {
    return this.config?.ams_devices || [];
  }

  get _externalSpoolDevice() {
    return this.config?.external_spool_device || '';
  }

  get _cameraRefreshRate() {
    return this.config?.camera_refresh_rate || 1000;
  }

  _getDevices() {
    if (!this.hass) return [];

    const devices = [];

    // Get devices from entity registry
    Object.keys(this.hass.devices || {}).forEach((deviceId) => {
      const device = this.hass.devices[deviceId];
      devices.push({
        id: deviceId,
        name: device.name_by_user || device.name || deviceId,
        manufacturer: device.manufacturer || '',
        model: device.model || ''
      });
    });

    // Sort by name
    return devices.sort((a, b) => a.name.localeCompare(b.name));
  }

  _getBambuDevices() {
    return this._getDevices().filter(device =>
      device.manufacturer?.toLowerCase().includes('bambu') ||
      device.model?.toLowerCase().includes('bambu') ||
      device.name.toLowerCase().includes('bambu') ||
      device.name.toLowerCase().includes('p1s') ||
      device.name.toLowerCase().includes('p2s') ||
      device.name.toLowerCase().includes('x1')
    );
  }

  _getAMSDevices() {
    return this._getDevices().filter(device =>
      device.name.toLowerCase().includes('ams') ||
      device.model?.toLowerCase().includes('ams')
    );
  }

  _valueChanged(ev) {
    if (!this.config || !this.hass) {
      return;
    }

    const target = ev.target;
    const configValue = target.configValue;

    if (this[`_${configValue}`] === target.value) {
      return;
    }

    let newConfig;
    if (target.value === '') {
      newConfig = { ...this.config };
      delete newConfig[configValue];
    } else {
      newConfig = {
        ...this.config,
        [configValue]: target.value
      };
    }

    const event = new CustomEvent('config-changed', {
      detail: { config: newConfig },
      bubbles: true,
      composed: true
    });
    this.dispatchEvent(event);
  }

  _amsDeviceChanged(ev, index) {
    const newAmsDevices = [...this._amsDevices];
    newAmsDevices[index] = ev.target.value;

    const newConfig = {
      ...this.config,
      ams_devices: newAmsDevices.filter(d => d) // Remove empty values
    };

    const event = new CustomEvent('config-changed', {
      detail: { config: newConfig },
      bubbles: true,
      composed: true
    });
    this.dispatchEvent(event);
  }

  _addAmsDevice() {
    const newAmsDevices = [...this._amsDevices, ''];

    const newConfig = {
      ...this.config,
      ams_devices: newAmsDevices
    };

    const event = new CustomEvent('config-changed', {
      detail: { config: newConfig },
      bubbles: true,
      composed: true
    });
    this.dispatchEvent(event);
  }

  _removeAmsDevice(index) {
    const newAmsDevices = [...this._amsDevices];
    newAmsDevices.splice(index, 1);

    const newConfig = {
      ...this.config,
      ams_devices: newAmsDevices
    };

    const event = new CustomEvent('config-changed', {
      detail: { config: newConfig },
      bubbles: true,
      composed: true
    });
    this.dispatchEvent(event);
  }

  render() {
    if (!this.hass || !this.config) {
      return html``;
    }

    const bambuDevices = this._getBambuDevices();
    const amsDevices = this._getAMSDevices();

    return html`
      <div class="card-config">
        <div class="option">
          <label>Printer Name (Required)</label>
          <ha-textfield
            .configValue=${'printer_name'}
            .value=${this._printerName}
            @input=${this._valueChanged}
            placeholder="My 3D Printer"
          ></ha-textfield>
          <small>Display name for your printer</small>
        </div>

        <div class="section-title">Device Selection</div>

        <div class="option">
          <label>Printer Device (Required)</label>
          <ha-select
            .configValue=${'printer_device'}
            .value=${this._printerDevice}
            @selected=${this._valueChanged}
            @closed=${(ev) => ev.stopPropagation()}
          >
            <mwc-list-item value=""></mwc-list-item>
            ${bambuDevices.map(device => html`
              <mwc-list-item .value=${device.id}>
                ${device.name} ${device.model ? `(${device.model})` : ''}
              </mwc-list-item>
            `)}
          </ha-select>
          <small>Select your Bambu Lab printer device</small>
        </div>

        <div class="option">
          <label>AMS Devices (Optional)</label>
          ${this._amsDevices.map((deviceId, index) => html`
            <div class="ams-device">
              <ha-select
                .value=${deviceId}
                @selected=${(ev) => this._amsDeviceChanged(ev, index)}
                @closed=${(ev) => ev.stopPropagation()}
              >
                <mwc-list-item value=""></mwc-list-item>
                ${amsDevices.map(device => html`
                  <mwc-list-item .value=${device.id}>
                    ${device.name} ${device.model ? `(${device.model})` : ''}
                  </mwc-list-item>
                `)}
              </ha-select>
              <mwc-button
                @click=${() => this._removeAmsDevice(index)}
              >Remove</mwc-button>
            </div>
          `)}
          <mwc-button @click=${this._addAmsDevice}>
            Add AMS Device
          </mwc-button>
          <small>Select AMS devices for filament monitoring</small>
        </div>

        <div class="option">
          <label>External Spool Device (Optional)</label>
          <ha-select
            .configValue=${'external_spool_device'}
            .value=${this._externalSpoolDevice}
            @selected=${this._valueChanged}
            @closed=${(ev) => ev.stopPropagation()}
          >
            <mwc-list-item value=""></mwc-list-item>
            ${bambuDevices.map(device => html`
              <mwc-list-item .value=${device.id}>
                ${device.name} ${device.model ? `(${device.model})` : ''}
              </mwc-list-item>
            `)}
          </ha-select>
          <small>For non-AMS filament (external spool holder)</small>
        </div>

        <div class="section-title">Advanced Settings</div>

        <div class="option">
          <label>Camera Refresh Rate (ms)</label>
          <ha-textfield
            type="number"
            .configValue=${'camera_refresh_rate'}
            .value=${this._cameraRefreshRate}
            @input=${this._valueChanged}
            min="100"
            step="100"
          ></ha-textfield>
          <small>Only applies to image sensors (not camera entities). Default: 1000ms</small>
        </div>
      </div>
    `;
  }
}

customElements.define('printwatch-card-editor', PrintWatchCardEditor);

export default PrintWatchCardEditor;
