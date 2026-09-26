/**
 * ORIVIA — Core Application Logic
 * Accessible navigation, scroll elevation, and interactive controls
 */

document.addEventListener('DOMContentLoaded', () => {
  // 1. Navigation Header Scroll Effect
  const header = document.querySelector('.site-header');
  if (header) {
    window.addEventListener('scroll', () => {
      if (window.scrollY > 40) {
        header.classList.add('scrolled');
      } else {
        header.classList.remove('scrolled');
      }
    }, { passive: true });
  }

  // 2. Mobile Menu Toggle
  const mobileToggle = document.querySelector('.mobile-toggle');
  const navLinks = document.querySelector('.nav-links');

  if (mobileToggle && navLinks) {
    mobileToggle.addEventListener('click', () => {
      const isExpanded = mobileToggle.getAttribute('aria-expanded') === 'true';
      mobileToggle.setAttribute('aria-expanded', String(!isExpanded));
      navLinks.classList.toggle('mobile-open');
    });

    // Close mobile menu on ESC
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && navLinks.classList.contains('mobile-open')) {
        navLinks.classList.remove('mobile-open');
        mobileToggle.setAttribute('aria-expanded', 'false');
        mobileToggle.focus();
      }
    });
  }

  // 3. Accessible FAQ Accordions
  const faqQuestions = document.querySelectorAll('.faq-question');
  faqQuestions.forEach((button) => {
    button.addEventListener('click', () => {
      const item = button.closest('.faq-item');
      if (!item) return;

      const isExpanded = button.getAttribute('aria-expanded') === 'true';
      button.setAttribute('aria-expanded', String(!isExpanded));
      item.classList.toggle('active', !isExpanded);
    });
  });

  // 4. Highlight Active Navigation Item
  const currentPath = window.location.pathname;
  const navAnchors = document.querySelectorAll('.nav-links a');
  navAnchors.forEach((link) => {
    const href = link.getAttribute('href');
    if (href && (currentPath.endsWith(href) || (currentPath === '/' && href === 'index.html'))) {
      link.classList.add('active');
    }
  });
});
