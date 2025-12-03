import { html } from 'lit';
import { localize } from '../../utils/localize';

export const cameraFeedTemplate = ({ isOnline, hasError, currentStage, cameraSource, cameraType, cameraEntity, onError, onLoad }) => {
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
    console.warn('[PrintWatch] No camera source available for entity:', cameraEntity);
    return html`
      <div class="offline-message">
        <ha-icon icon="mdi:camera-off"></ha-icon>
        <span>${localize.t('camera_unavailable')}</span>
      </div>
    `;
  }

  // For camera entities, we can optionally use ha-camera-stream for better streaming support
  // But for now, let's use img with the camera proxy which should work for most cases
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