/* ==========================================================================
   DETwal — Main JS
   Modular, dependency-free. Safe to extend with Cloudflare Workers /
   Supabase integrations later (see TODO markers).
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  initMobileNav();
  initFaqAccordion();
  initRevealAnimations();
  setCurrentYear();
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
    navToggle.setAttribute('aria-expanded', 'false');
  };

  const toggleNav = () => {
    const isOpen = mainNav.classList.toggle('open');
    navToggle.classList.toggle('open', isOpen);
    navToggle.setAttribute('aria-expanded', String(isOpen));
  };

  navToggle.addEventListener('click', toggleNav);

  // Close menu after clicking a nav link (mobile UX)
  mainNav.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', closeNav);
  });

  // Close menu if viewport is resized back to desktop
  window.addEventListener('resize', () => {
    if (window.innerWidth > 768) closeNav();
  });

  // Close menu when clicking outside of it
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

      // Close all other open items (single-open accordion behavior)
      faqItems.forEach((otherItem) => {
        if (otherItem === item) return;
        const otherQuestion = otherItem.querySelector('.faq-question');
        const otherAnswer = otherItem.querySelector('.faq-answer');
        if (otherQuestion && otherAnswer) {
          otherQuestion.setAttribute('aria-expanded', 'false');
          otherAnswer.style.maxHeight = null;
        }
      });

      // Toggle the clicked item
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
   TODO (future integration points):
   - Hook "Sign Up" / "Login" buttons to Supabase Auth.
   - Hook "Join Community" buttons to community onboarding flow.
   - Replace static Product "Explore" buttons with routing to product pages
     once those pages/APIs (Cloudflare Workers) are available.
   -------------------------------------------------------------------------- */
