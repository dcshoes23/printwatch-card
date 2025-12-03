import { html } from 'lit';
import { localize } from '../../utils/localize';

export const cameraFeedTemplate = ({ isOnline, hasError, currentStage, cameraSource, cameraType, cameraEntity, hass, onError, onLoad }) => {
  if (!isOnline || hasError) {
    return html`
      <div class="offline-message">
        <ha-icon icon="mdi:printer-off"></ha-icon>
        <span>
          ${isOnline ? localize.t('camera_unavailable') : localize.t('printer_offline')}
        </span>
      </div>
    `;
  }

  if (!cameraEntity || !hass.states[cameraEntity]) {
    console.warn('[PrintWatch] No camera entity available:', cameraEntity);
    return html`
      <div class="offline-message">
        <ha-icon icon="mdi:camera-off"></ha-icon>
        <span>${localize.t('camera_unavailable')}</span>
      </div>
    `;
  }

  // For camera entities, use ha-camera-stream for live streaming (like picture entity card)
  // For image entities, use img tag with periodic refresh
  if (cameraType === 'camera') {
    return html`
      <div class="camera-feed">
        <div class="camera-label">${currentStage}</div>
        <ha-camera-stream
          .hass=${hass}
          .stateObj=${hass.states[cameraEntity]}
          allow-exiting-pip
          controls
          muted
          style="width: 100%; height: 100%; border-radius: 12px;"
        ></ha-camera-stream>
      </div>
    `;
  }

  // Image entities use img tag with cache-busting
  if (!cameraSource) {
    console.warn('[PrintWatch] No camera source available for entity:', cameraEntity);
    return html`
      <div class="offline-message">
        <ha-icon icon="mdi:camera-off"></ha-icon>
        <span>${localize.t('camera_unavailable')}</span>
      </div>
    `;
  }

  return html`
    <div class="camera-feed">
      <div class="camera-label">${currentStage}</div>
      <img
        src="${cameraSource}"
        style="width: 100%; height: 100%; object-fit: cover; border-radius: 12px;"
        alt="Camera Feed"
        @error=${onError}
        @load=${onLoad}
        data-camera-type="${cameraType}"
      />
    </div>
  `;
};