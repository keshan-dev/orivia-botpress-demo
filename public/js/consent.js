/**
 * ORIVIA — AI Disclosure and Consent Management
 * Compliant transparent third-party notice for Botpress integration
 */

export function initDisclosure() {
  const disclosureContainer = document.getElementById('ai-disclosure-banner');
  if (!disclosureContainer) return;

  // Render accessible disclosure notice without innerHTML
  const noticeText = document.createElement('p');
  noticeText.textContent = 'ORIVIA uses a third-party AI assistant powered by Botpress. Do not submit passwords, payment information, or confidential details into the chat. Review our ';

  const privacyLink = document.createElement('a');
  privacyLink.href = 'privacy.html';
  privacyLink.textContent = 'Privacy Policy';
  privacyLink.setAttribute('target', '_blank');
  privacyLink.setAttribute('rel', 'noopener noreferrer');

  noticeText.appendChild(privacyLink);
  noticeText.appendChild(document.createTextNode('.'));

  disclosureContainer.appendChild(noticeText);
}

document.addEventListener('DOMContentLoaded', initDisclosure);
