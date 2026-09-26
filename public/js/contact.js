/**
 * ORIVIA — Contact Form & Turnstile Handler
 * First-party secure inquiry submission with client-side validation and rate-limit feedback
 */

document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('contact-form');
  const statusMsg = document.getElementById('form-status-msg');
  const submitBtn = document.getElementById('form-submit-btn');

  if (!form) return;

  function setStatus(text, type = 'error') {
    if (!statusMsg) return;
    statusMsg.textContent = text;
    statusMsg.className = `status-msg ${type}`;
    statusMsg.setAttribute('role', 'alert');
  }

  function clearStatus() {
    if (!statusMsg) return;
    statusMsg.textContent = '';
    statusMsg.className = 'status-msg';
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    clearStatus();

    const formData = new FormData(form);
    const name = (formData.get('name') || '').toString().trim();
    const email = (formData.get('email') || '').toString().trim();
    const message = (formData.get('message') || '').toString().trim();
    const honeypot = (formData.get('website') || '').toString().trim();
    
    // Cloudflare Turnstile token
    const turnstileToken = (formData.get('cf-turnstile-response') || '').toString().trim();

    // 1. Client-Side Sanitization & Validation Checks
    if (honeypot.length > 0) {
      // Honeypot trapped; simulate normal response
      setStatus('Your inquiry has been received.', 'success');
      form.reset();
      return;
    }

    if (name.length < 2 || name.length > 100) {
      setStatus('Please provide a valid name between 2 and 100 characters.');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email) || email.length > 100) {
      setStatus('Please provide a valid email address.');
      return;
    }

    if (message.length < 10 || message.length > 2000) {
      setStatus('Your message must be between 10 and 2000 characters.');
      return;
    }

    if (!turnstileToken) {
      setStatus('Please complete the security verification challenge.');
      return;
    }

    // 2. Submit to first-party API endpoint
    submitBtn.disabled = true;
    submitBtn.textContent = 'Transmitting...';

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          name,
          email,
          message,
          turnstileToken
        })
      });

      const data = await response.json().catch(() => ({}));

      if (response.ok) {
        setStatus('Thank you. Your inquiry has been securely delivered to our concierge.', 'success');
        form.reset();
        if (window.turnstile) {
          window.turnstile.reset();
        }
      } else if (response.status === 429) {
        setStatus('Rate limit exceeded: You have submitted too many inquiries recently. Please wait a moment before trying again.');
      } else {
        setStatus(data.error || 'Unable to process your inquiry at this moment. Please try again later.');
        if (window.turnstile) {
          window.turnstile.reset();
        }
      }
    } catch (err) {
      setStatus('A network error occurred. Please check your connection and retry.');
      if (window.turnstile) {
        window.turnstile.reset();
      }
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Submit Inquiry';
    }
  });
});
