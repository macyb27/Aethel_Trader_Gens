/**
 * ═══════════════════════════════════════════════════════════════════════════
 * ÆTHER-TRADER Ω v4.0 - APPLICATION ENTRY POINT
 * ═══════════════════════════════════════════════════════════════════════════
 */

import { render } from 'solid-js/web';
import App from './App';

const root = document.getElementById('root');

if (root) {
  // Remove preloader
  root.innerHTML = '';
  
  // Mount Solid.js application
  render(() => <App />, root);
} else {
  console.error('Root element not found');
}
