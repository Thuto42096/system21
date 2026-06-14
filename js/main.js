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
  '.section-label, .section-title, .packages-subtitle, .glass-card, .about-why-title, .process-title, .packages-note, .marquee-wrapper, .footer-inner'
);
revealTargets.forEach(el => el.classList.add('reveal'));

if ('IntersectionObserver' in window && !reducedMotion) {
  // Stagger siblings inside grids
  document.querySelectorAll('.about-grid, .process-grid, .services-grid, .packages-grid').forEach(grid => {
    [...grid.children].forEach((card, i) => { card.style.transitionDelay = `${i * 0.1}s`; });
  });
  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('reveal-in');
        revealObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15, rootMargin: '0px 0px -8% 0px' });
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

// ─── 3D TILT ON CARDS (desktop / fine pointers only) ───
if (window.matchMedia('(pointer: fine)').matches && !reducedMotion) {
  document.querySelectorAll('.about-card, .process-card, .service-card, .package-card').forEach(card => {
    let raf = null;
    card.addEventListener('pointermove', (e) => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        const r = card.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width - 0.5;
        const py = (e.clientY - r.top) / r.height - 0.5;
        card.style.transform = `perspective(900px) rotateX(${-py * 6}deg) rotateY(${px * 6}deg) translateY(-6px)`;
        card.style.setProperty('--glow-x', `${(px + 0.5) * 100}%`);
        card.style.setProperty('--glow-y', `${(py + 0.5) * 100}%`);
        raf = null;
      });
    });
    card.addEventListener('pointerleave', () => {
      if (raf) { cancelAnimationFrame(raf); raf = null; }
      card.style.transform = '';
    });
  });
}
