// Theme Management Script (Light/Dark mode toggle & Custom Colors)
(function() {
  const currentTheme = localStorage.getItem('theme') || 'light';
  document.documentElement.setAttribute('data-theme', currentTheme);

  // Fetch Custom Theme Settings
  fetch('/api/theme')
    .then(res => res.json())
    .then(theme => {
      if (theme) {
        if (theme.primaryColor) document.documentElement.style.setProperty('--primary', theme.primaryColor);
        if (theme.secondaryColor) document.documentElement.style.setProperty('--accent', theme.secondaryColor);
        if (theme.headerBg) document.documentElement.style.setProperty('--header-bg', theme.headerBg);
        if (theme.footerBg) document.documentElement.style.setProperty('--footer-bg', theme.footerBg);
        if (theme.pageBg) {
          document.documentElement.style.setProperty('--bg-primary', theme.pageBg);
          document.documentElement.style.setProperty('--bg-secondary', theme.pageBg);
        }
        if (theme.textColor) document.documentElement.style.setProperty('--text-primary', theme.textColor);
      }
    })
    .catch(err => console.error('Failed to load custom theme:', err));

  document.addEventListener('DOMContentLoaded', () => {
    const themeToggleBtn = document.getElementById('theme-toggle');
    if (themeToggleBtn) {
      updateToggleIcon(themeToggleBtn, currentTheme);
      
      themeToggleBtn.addEventListener('click', () => {
        let theme = document.documentElement.getAttribute('data-theme');
        let newTheme = theme === 'dark' ? 'light' : 'dark';
        
        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
        updateToggleIcon(themeToggleBtn, newTheme);
      });
    }
  });

  function updateToggleIcon(btn, theme) {
    if (theme === 'dark') {
      btn.innerHTML = '<i class="bi bi-sun-fill"></i>';
      btn.setAttribute('title', 'Switch to Light Mode');
    } else {
      btn.innerHTML = '<i class="bi bi-moon-stars-fill"></i>';
      btn.setAttribute('title', 'Switch to Dark Mode');
    }
  }
})();
