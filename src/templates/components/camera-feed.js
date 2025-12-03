import { html } from 'lit';
import { localize } from '../../utils/localize';

export const cameraFeedTemplate = ({ isOnline, hasError, currentStage, cameraSource, cameraType, onError, onLoad }) => {
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

  if (!cameraSource) {
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