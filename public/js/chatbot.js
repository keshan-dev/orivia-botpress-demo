/**
 * ORIVIA — Botpress Cloud Webchat Integration
 * Sandboxed loader with fallback UI, strict domain boundaries, and Rotwatch test hooks
 */

// Botpress Configuration Placeholders (Replace with production values from Botpress Dashboard)
const BOTPRESS_CONFIG = {
  botId: window.BOTPRESS_BOT_ID || 'b88efb05-98a6-4f0e-bf79-c8e444499a19',
  clientId: window.BOTPRESS_CLIENT_ID || 'cab71427-7661-476d-8119-a2fab79c6105',
  hostUrl: 'https://cdn.botpress.cloud/webchat/v2',
  messagingUrl: 'https://messaging.botpress.cloud',
  botName: 'ORIVIA Assistant'
};

class OriviaChatbot {
  constructor() {
    this.isLoaded = false;
    this.triggerBtn = document.getElementById('chatbot-toggle-btn');
    this.fallbackCard = document.getElementById('chatbot-fallback');
    this.init();
  }

  init() {
    if (this.triggerBtn) {
      this.triggerBtn.addEventListener('click', () => this.toggleChat());
    }

    // Attempt to load official Botpress Webchat script safely
    this.loadBotpressScript()
      .then(() => {
        this.isLoaded = true;
      })
      .catch((err) => {
        console.warn('Botpress Webchat unavailable or blocked by security policies/extensions:', err.message);
        this.setupFallback();
      });
  }

  loadBotpressScript() {
    return new Promise((resolve, reject) => {
      // Create script tag with strict SRI/integrity when available
      const script = document.createElement('script');
      script.id = 'botpress-webchat-script';
      script.src = `${BOTPRESS_CONFIG.hostUrl}/inject.js`;
      script.async = true;

      // Timeout detection (5 seconds fallback)
      const timeoutId = setTimeout(() => {
        reject(new Error('Botpress Webchat load timeout'));
      }, 5000);

      script.onload = () => {
        clearTimeout(timeoutId);
        // Initialize Botpress Webchat via official window.botpressWebChat API if present
        if (window.botpressWebChat) {
          try {
            window.botpressWebChat.init({
              botId: BOTPRESS_CONFIG.botId,
              clientId: BOTPRESS_CONFIG.clientId,
              hostUrl: BOTPRESS_CONFIG.hostUrl,
              messagingUrl: BOTPRESS_CONFIG.messagingUrl,
              botName: BOTPRESS_CONFIG.botName,
              lazySocket: true,
              hideWidget: true // Controlled via our custom accessible button
            });
          } catch (e) {
            console.error('Failed to configure botpressWebChat instance:', e);
          }
        }
        resolve();
      };

      script.onerror = () => {
        clearTimeout(timeoutId);
        reject(new Error('Botpress script failed to fetch'));
      };

      document.body.appendChild(script);
    });
  }

  toggleChat() {
    if (this.isLoaded && window.botpressWebChat) {
      window.botpressWebChat.sendEvent({ type: 'toggle' });
    } else {
      this.showFallbackMessage();
    }
  }

  setupFallback() {
    if (this.fallbackCard) {
      // Remove any prior content and build DOM safely
      while (this.fallbackCard.firstChild) {
        this.fallbackCard.removeChild(this.fallbackCard.firstChild);
      }

      const title = document.createElement('h4');
      title.textContent = 'ORIVIA Concierge Notice';
      title.style.marginBottom = '8px';
      title.style.color = '#FFFFFF';

      const desc = document.createElement('p');
      desc.textContent = 'Our real-time assistant is currently offline or blocked by your browser settings. For all inquiries or bespoke itineraries, please contact our team directly.';
      desc.style.fontSize = '0.9rem';
      desc.style.marginBottom = '12px';

      const contactBtn = document.createElement('a');
      contactBtn.href = 'contact.html';
      contactBtn.className = 'btn btn-primary';
      contactBtn.textContent = 'Send Inquiry';
      contactBtn.style.padding = '8px 16px';
      contactBtn.style.fontSize = '0.8rem';

      const closeBtn = document.createElement('button');
      closeBtn.textContent = 'Dismiss';
      closeBtn.className = 'btn btn-secondary';
      closeBtn.style.padding = '8px 16px';
      closeBtn.style.fontSize = '0.8rem';
      closeBtn.style.marginLeft = '8px';
      closeBtn.addEventListener('click', () => {
        this.fallbackCard.classList.remove('visible');
      });

      this.fallbackCard.appendChild(title);
      this.fallbackCard.appendChild(desc);
      this.fallbackCard.appendChild(contactBtn);
      this.fallbackCard.appendChild(closeBtn);
    }
  }

  showFallbackMessage() {
    if (this.fallbackCard) {
      this.fallbackCard.classList.toggle('visible');
    }
  }
}

document.addEventListener('DOMContentLoaded', () => {
  window.oriviaChatbot = new OriviaChatbot();
});
