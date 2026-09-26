/**
 * ORIVIA — Botpress Cloud Webchat Integration
 * Sandboxed loader supporting Botpress Cloud window.botpress v2 API with fallback UI
 */

const BOTPRESS_CONFIG = {
  botId: window.BOTPRESS_BOT_ID || 'b88efb05-98a6-4f0e-bf79-c8e444499a19',
  clientId: window.BOTPRESS_CLIENT_ID || 'cab71427-7661-476d-8119-a2fab79c6105',
  hostUrl: 'https://cdn.botpress.cloud/webchat/v2',
  botName: 'ORIVIA Assistant'
};

class OriviaChatbot {
  constructor() {
    this.isLoaded = false;
    this.triggerBtn = document.getElementById('chatbot-toggle-btn');
    this.fallbackCard = document.getElementById('chatbot-fallback');
    this.setupFallbackContent();
    this.init();
  }

  init() {
    if (this.triggerBtn) {
      this.triggerBtn.addEventListener('click', (e) => {
        e.preventDefault();
        this.toggleChat();
      });
    }

    // Load official Botpress Webchat script safely
    this.loadBotpressScript()
      .then(() => {
        this.initializeBotpress();
      })
      .catch((err) => {
        console.warn('Botpress Webchat unavailable or blocked:', err.message);
        this.isLoaded = false;
      });
  }

  loadBotpressScript() {
    return new Promise((resolve, reject) => {
      // If already present on window
      if (window.botpress || window.botpressWebChat) {
        resolve();
        return;
      }

      const script = document.createElement('script');
      script.id = 'botpress-webchat-script';
      script.src = `${BOTPRESS_CONFIG.hostUrl}/inject.js`;
      script.async = true;

      const timeoutId = setTimeout(() => {
        reject(new Error('Botpress Webchat script load timeout'));
      }, 7000);

      script.onload = () => {
        clearTimeout(timeoutId);
        resolve();
      };

      script.onerror = () => {
        clearTimeout(timeoutId);
        reject(new Error('Botpress script failed to load from CDN'));
      };

      document.body.appendChild(script);
    });
  }

  initializeBotpress() {
    // 1. Modern Botpress v2 API: window.botpress
    if (window.botpress && typeof window.botpress.init === 'function') {
      try {
        window.botpress.init({
          botId: BOTPRESS_CONFIG.botId,
          clientId: BOTPRESS_CONFIG.clientId,
          configuration: {
            botName: BOTPRESS_CONFIG.botName
          }
        });
        this.isLoaded = true;
        return;
      } catch (e) {
        console.error('Error initializing window.botpress:', e);
      }
    }

    // 2. Legacy/alternate Botpress API: window.botpressWebChat
    if (window.botpressWebChat && typeof window.botpressWebChat.init === 'function') {
      try {
        window.botpressWebChat.init({
          botId: BOTPRESS_CONFIG.botId,
          clientId: BOTPRESS_CONFIG.clientId,
          hostUrl: BOTPRESS_CONFIG.hostUrl,
          botName: BOTPRESS_CONFIG.botName,
          hideWidget: true
        });
        this.isLoaded = true;
        return;
      } catch (e) {
        console.error('Error initializing window.botpressWebChat:', e);
      }
    }

    this.isLoaded = false;
  }

  toggleChat() {
    // Close fallback card if currently open
    if (this.fallbackCard) {
      this.fallbackCard.classList.remove('visible');
    }

    // 1. Try window.botpress (v2)
    if (window.botpress) {
      if (typeof window.botpress.toggle === 'function') {
        window.botpress.toggle();
        return;
      }
      if (typeof window.botpress.open === 'function') {
        window.botpress.open();
        return;
      }
    }

    // 2. Try window.botpressWebChat (v1)
    if (window.botpressWebChat && typeof window.botpressWebChat.sendEvent === 'function') {
      window.botpressWebChat.sendEvent({ type: 'toggle' });
      return;
    }

    // 3. Fallback notice if script failed or was blocked by browser
    this.showFallbackMessage();
  }

  setupFallbackContent() {
    if (!this.fallbackCard) return;

    while (this.fallbackCard.firstChild) {
      this.fallbackCard.removeChild(this.fallbackCard.firstChild);
    }

    const title = document.createElement('h4');
    title.textContent = 'ORIVIA Concierge Notice';
    title.style.marginBottom = '8px';
    title.style.color = '#FFFFFF';
    title.style.fontFamily = 'var(--font-serif)';

    const desc = document.createElement('p');
    desc.textContent = 'Our conversational assistant is connecting or blocked by browser extensions. For bespoke itineraries and inquiries, contact our atelier directors directly.';
    desc.style.fontSize = '0.9rem';
    desc.style.marginBottom = '14px';
    desc.style.color = 'var(--color-text-muted)';

    const actions = document.createElement('div');
    actions.style.display = 'flex';
    actions.style.gap = '8px';

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
    closeBtn.addEventListener('click', () => {
      this.fallbackCard.classList.remove('visible');
    });

    actions.appendChild(contactBtn);
    actions.appendChild(closeBtn);

    this.fallbackCard.appendChild(title);
    this.fallbackCard.appendChild(desc);
    this.fallbackCard.appendChild(actions);
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
