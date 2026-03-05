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

