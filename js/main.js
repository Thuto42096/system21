// ─── MOBILE MENU TOGGLE ───
const hamburger = document.getElementById('hamburgerBtn');
const menu = document.getElementById('mobileMenu');
const backdrop = document.getElementById('menuBackdrop');
const menuLinks = document.querySelectorAll('.menu-link');

function openMenu() {
  hamburger.classList.add('open');
  menu.classList.add('open');
  backdrop.classList.add('open');
}

function closeMenu() {
  hamburger.classList.remove('open');
  menu.classList.remove('open');
  backdrop.classList.remove('open');
}

if (hamburger && menu && backdrop) {
  hamburger.addEventListener('click', () => {
    menu.classList.contains('open') ? closeMenu() : openMenu();
  });

  backdrop.addEventListener('click', closeMenu);

  menuLinks.forEach(link => {
    link.addEventListener('click', closeMenu);
  });
}

const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// ─── SCROLL REVEAL ───
const revealTargets = document.querySelectorAll(
  '.section-label, .section-title, .section-subtitle, .card, .about-why-title, .process-title, .packages-note, .marquee-wrapper, .footer-inner'
);
revealTargets.forEach(el => el.classList.add('reveal'));

if ('IntersectionObserver' in window && !reducedMotion) {
  // Stagger siblings inside grids and lists
  document.querySelectorAll('.about-grid, .about-list, .process-grid, .services-list, .packages-grid').forEach(container => {
    [...container.children].forEach((card, i) => { card.style.transitionDelay = `${i * 0.08}s`; });
  });
  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('reveal-in');
        revealObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -5% 0px' });
  revealTargets.forEach(el => revealObserver.observe(el));
} else {
  revealTargets.forEach(el => el.classList.add('reveal-in'));
}

// ─── SMART NAV (shrink on scroll, hide on scroll down) ───
const nav = document.querySelector('nav');
if (nav) {
  let lastY = window.scrollY;
  window.addEventListener('scroll', () => {
    const y = window.scrollY;
    nav.classList.toggle('scrolled', y > 40);
    if (menu && !menu.classList.contains('open')) {
      nav.classList.toggle('nav-hidden', y > lastY && y > 300);
    }
    lastY = y;
  }, { passive: true });
}
