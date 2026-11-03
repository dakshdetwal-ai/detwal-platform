/* ==========================================================================
   DETwal · TopG Algo — Main JS
   Modular, dependency-free. Structured for future integration with
   Cloudflare Workers, Cloudflare D1 and Supabase Auth.
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  initMobileNav();
  initFaqAccordion();
  initRevealAnimations();
  setCurrentYear();
  initAccessButton();
});

/* --------------------------------------------------------------------------
   Mobile Navigation Toggle
   -------------------------------------------------------------------------- */
function initMobileNav() {
  const navToggle = document.getElementById('navToggle');
  const mainNav = document.getElementById('mainNav');

  if (!navToggle || !mainNav) return;

  const closeNav = () => {
    mainNav.classList.remove('open');
    navToggle.classList.remove('open');
    document.body.classList.remove('nav-open');
    navToggle.setAttribute('aria-expanded', 'false');
  };

  const toggleNav = () => {
    const isOpen = mainNav.classList.toggle('open');
    navToggle.classList.toggle('open', isOpen);
    document.body.classList.toggle('nav-open', isOpen);
    navToggle.setAttribute('aria-expanded', String(isOpen));
  };

  navToggle.addEventListener('click', toggleNav);

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && mainNav.classList.contains('open')) {
      closeNav();
      navToggle.focus();
    }
  });

  mainNav.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', closeNav);
  });

  window.addEventListener('resize', () => {
    if (window.innerWidth > 768) closeNav();
  });

  document.addEventListener('click', (e) => {
    const isClickInside = mainNav.contains(e.target) || navToggle.contains(e.target);
    if (!isClickInside && mainNav.classList.contains('open')) closeNav();
  });
}

/* --------------------------------------------------------------------------
   FAQ Accordion
   -------------------------------------------------------------------------- */
function initFaqAccordion() {
  const faqItems = document.querySelectorAll('.faq-item');

  faqItems.forEach((item) => {
    const question = item.querySelector('.faq-question');
    const answer = item.querySelector('.faq-answer');

    if (!question || !answer) return;

    question.addEventListener('click', () => {
      const isExpanded = question.getAttribute('aria-expanded') === 'true';

      // Single-open accordion behavior
      faqItems.forEach((otherItem) => {
        if (otherItem === item) return;
        const otherQuestion = otherItem.querySelector('.faq-question');
        const otherAnswer = otherItem.querySelector('.faq-answer');
        if (otherQuestion && otherAnswer) {
          otherQuestion.setAttribute('aria-expanded', 'false');
          otherAnswer.style.maxHeight = null;
        }
      });

      question.setAttribute('aria-expanded', String(!isExpanded));
      answer.style.maxHeight = isExpanded ? null : `${answer.scrollHeight}px`;
    });
  });
}

/* --------------------------------------------------------------------------
   Scroll Reveal Animations
   -------------------------------------------------------------------------- */
function initRevealAnimations() {
  const revealEls = document.querySelectorAll('.reveal');

  if (!('IntersectionObserver' in window) || revealEls.length === 0) {
    revealEls.forEach((el) => el.classList.add('in-view'));
    return;
  }

  const observer = new IntersectionObserver(
    (entries, obs) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('in-view');
          obs.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.15, rootMargin: '0px 0px -40px 0px' }
  );

  revealEls.forEach((el) => observer.observe(el));
}

/* --------------------------------------------------------------------------
   Dynamic Copyright Year
   -------------------------------------------------------------------------- */
function setCurrentYear() {
  const yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();
}

/* --------------------------------------------------------------------------
   Access Button Placeholder
   This button is intentionally not wired to any purchase/auth flow yet.
   It is isolated here so the future purchase-page redirect or Supabase/
   Cloudflare Workers integration can be dropped in with a single change.
   -------------------------------------------------------------------------- */
function initAccessButton() {
  const accessBtn = document.getElementById('getAccessBtn');
  if (!accessBtn) return;

  accessBtn.addEventListener('click', () => {
    // TODO: Connect to the DETwal purchase/access page once available.
    // Example (future): window.location.href = 'https://access.detwal.com';
    console.info('TopG Algo access flow not yet connected.');
  });
}

/* --------------------------------------------------------------------------
   Future integration points:
   - Login / Sign Up → Supabase Auth.
   - Get Access / Get TopG Algo Access → Payment/purchase system.
   - Dashboard data (trade monitoring, preferences) → Cloudflare Workers + D1.
   -------------------------------------------------------------------------- */
