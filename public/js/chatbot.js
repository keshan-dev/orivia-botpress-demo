/**
 * ORIVIA — Botpress Cloud Webchat Integration
 * Production loader for Botpress v2 API with CSP & live environment support
 */

const BOTPRESS_CONFIG = {
  botId: window.BOTPRESS_BOT_ID || 'b88efb05-98a6-4f0e-bf79-c8e444499a19',
  clientId: window.BOTPRESS_CLIENT_ID || 'cab71427-7661-476d-8119-a2fab79c6105',
  hostUrl: 'https://cdn.botpress.cloud/webchat/v2',
  botName: 'ORIVIA Assistant'
};

class OriviaChatbot {
  constructor() {
    this.isInitialized = false;
    this.triggerBtn = document.getElementById('chatbot-toggle-btn');
    this.fallbackCard = document.getElementById('chatbot-fallback');
    this.setupFallbackContent();
    this.init();
  }

  init() {
    // 1. Wire the gold "ASK CONCIERGE" button
    if (this.triggerBtn) {
      this.triggerBtn.addEventListener('click', (e) => {
        e.preventDefault();
        this.openChat();
      });
    }

    // 2. Ensure Botpress script is loaded
    this.ensureScriptLoaded()
      .then(() => {
        this.initBotpress();
      })
      .catch((err) => {
        console.warn('Botpress script failed to load from CDN:', err.message);
      });
  }

  ensureScriptLoaded() {
    return new Promise((resolve, reject) => {
      if (window.botpress) {
        resolve();
        return;
      }

      // Check if script tag already exists in DOM
      let script = document.getElementById('botpress-webchat-script');
      if (!script) {
        script = document.createElement('script');
        script.id = 'botpress-webchat-script';
        script.src = `${BOTPRESS_CONFIG.hostUrl}/inject.js`;
        script.async = true;
        document.head.appendChild(script);
      }

      const timeout = setTimeout(() => {
        if (window.botpress) resolve();
        else reject(new Error('Timeout loading Botpress inject.js'));
      }, 7000);

      script.onload = () => {
        clearTimeout(timeout);
        resolve();
      };

      script.onerror = () => {
        clearTimeout(timeout);
        reject(new Error('Network error loading Botpress inject.js'));
      };
    });
  }

  initBotpress() {
    if (this.isInitialized) return;

    if (window.botpress && typeof window.botpress.init === 'function') {
      try {
        window.botpress.init({
          botId: BOTPRESS_CONFIG.botId,
          clientId: BOTPRESS_CONFIG.clientId,
          configuration: {
            botName: BOTPRESS_CONFIG.botName
          }
        });
        this.isInitialized = true;
      } catch (err) {
        console.error('Botpress initialization error:', err);
      }
    }
  }

  openChat() {
    // Hide fallback card if active
    if (this.fallbackCard) {
      this.fallbackCard.classList.remove('visible');
    }

    // Modern window.botpress API
    if (window.botpress) {
      if (!this.isInitialized) {
        this.initBotpress();
      }

      if (typeof window.botpress.open === 'function') {
        window.botpress.open();
        return;
      }
      if (typeof window.botpress.toggle === 'function') {
        window.botpress.toggle();
        return;
      }
    }

    // If script hasn't arrived yet, attempt emergency load & open
    this.ensureScriptLoaded()
      .then(() => {
        this.initBotpress();
        if (window.botpress && typeof window.botpress.open === 'function') {
          window.botpress.open();
        } else {
          this.showFallbackMessage();
        }
      })
      .catch(() => {
        this.showFallbackMessage();
      });
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
    desc.textContent = 'Our real-time assistant is connecting or blocked by browser extensions. For bespoke itineraries and inquiries, contact our atelier directors directly.';
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

// Start immediately on DOM ready
document.addEventListener('DOMContentLoaded', () => {
  window.oriviaChatbot = new OriviaChatbot();
});
