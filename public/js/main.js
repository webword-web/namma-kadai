// public/js/main.js
// Handles language switcher and theme toggle (light/dark)

// Theme toggle
const themeToggleBtn = document.getElementById('theme-toggle');
if (themeToggleBtn) {
  const currentTheme = localStorage.getItem('theme') || 'light';
  document.documentElement.setAttribute('data-theme', currentTheme);
  themeToggleBtn.querySelector('i').className = currentTheme === 'dark' ? 'bi bi-sun-fill' : 'bi bi-moon-stars-fill';

  themeToggleBtn.addEventListener('click', () => {
    const newTheme = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    themeToggleBtn.querySelector('i').className = newTheme === 'dark' ? 'bi bi-sun-fill' : 'bi bi-moon-stars-fill';
  });
}

// Language switcher
const langSwitcher = document.getElementById('langSwitcher');
if (langSwitcher) {
  const langOptions = document.querySelectorAll('.lang-option');
  const currentLang = localStorage.getItem('lang') || 'en';
  setLanguage(currentLang);

  langOptions.forEach(opt => {
    opt.addEventListener('click', (e) => {
      e.preventDefault();
      const lang = opt.getAttribute('data-lang');
      setLanguage(lang);
    });
  });
}

function setLanguage(lang) {
  document.documentElement.setAttribute('lang', lang);
  localStorage.setItem('lang', lang);
  // Update text elements with data-en / data-ta attributes
  document.querySelectorAll('[data-en]').forEach(el => {
    const enText = el.getAttribute('data-en');
    const taText = el.getAttribute('data-ta');
    if (lang === 'en') el.textContent = enText;
    else if (lang === 'ta') el.textContent = taText;
  });
  // Update nav links text if needed (they may not have data attributes)
}
