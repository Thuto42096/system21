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

hamburger.addEventListener('click', () => {
  menu.classList.contains('open') ? closeMenu() : openMenu();
});

backdrop.addEventListener('click', closeMenu);

menuLinks.forEach(link => {
  link.addEventListener('click', closeMenu);
});

const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// ─── HERO TITLE WORD REVEAL ───
const heroTitle = document.getElementById('heroTitle');
if (heroTitle && !reducedMotion) {
  const splitWords = (node) => {
    [...node.childNodes].forEach(child => {
      if (child.nodeType === Node.TEXT_NODE) {
        const frag = document.createDocumentFragment();
        child.textContent.split(/(\s+)/).forEach(part => {
          if (!part) return;
          if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(' ')); return; }
          const w = document.createElement('span');
          w.className = 'word';
          w.innerHTML = `<span class="word-inner">${part}</span>`;
          frag.appendChild(w);
        });
        node.replaceChild(frag, child);
      } else if (child.nodeType === Node.ELEMENT_NODE) {
        splitWords(child);
      }
    });
  };
  splitWords(heroTitle);
  heroTitle.querySelectorAll('.word-inner').forEach((w, i) => {
    w.style.transitionDelay = `${0.15 + i * 0.06}s`;
  });
  requestAnimationFrame(() => requestAnimationFrame(() => heroTitle.classList.add('revealed')));
}

// ─── SCROLL REVEAL ───
const revealTargets = document.querySelectorAll(
  '.section-label, .section-title, .section-subtitle, .card, .about-why-title, .process-title, .packages-note, .marquee-wrapper, .footer-inner'
);
revealTargets.forEach(el => el.classList.add('reveal'));

if ('IntersectionObserver' in window && !reducedMotion) {
  // Stagger siblings inside grids
  document.querySelectorAll('.about-grid, .about-stories, .process-grid, .services-grid, .packages-grid').forEach(grid => {
    [...grid.children].forEach((card, i) => { card.style.transitionDelay = `${i * 0.08}s`; });
  });
  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('reveal-in');
        revealObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
  revealTargets.forEach(el => revealObserver.observe(el));
} else {
  revealTargets.forEach(el => el.classList.add('reveal-in'));
}

// ─── SMART NAV (shrink on scroll, hide on scroll down) ───
const nav = document.querySelector('nav');
let lastY = window.scrollY;
window.addEventListener('scroll', () => {
  const y = window.scrollY;
  nav.classList.toggle('scrolled', y > 40);
  if (!menu.classList.contains('open')) {
    nav.classList.toggle('nav-hidden', y > lastY && y > 300);
  }
  lastY = y;
}, { passive: true });
