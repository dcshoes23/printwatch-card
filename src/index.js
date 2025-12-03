import PrintWatchCard from './components/printwatch-card';
import PrintWatchCardEditor from './editor';
import { html, css, LitElement } from 'lit';
import { customElement, property } from 'lit/decorators.js';

// Ensure global availability of Lit core functions
window.LitElement = LitElement;
window.html = html;
window.css = css;

// Add version and build timestamp to window for debugging
window.PRINTWATCH_VERSION = process.env.VERSION;
window.PRINTWATCH_BUILD_TIME = process.env.BUILD_TIMESTAMP;

// Ensure the elements are registered
if (!customElements.get('printwatch-card')) {
  customElements.define('printwatch-card', PrintWatchCard);
}

if (!customElements.get('printwatch-card-editor')) {
  customElements.define('printwatch-card-editor', PrintWatchCardEditor);
}

// Export for potential reuse
export {
  PrintWatchCard,
  PrintWatchCardEditor,
  html,
  css,
  LitElement
};