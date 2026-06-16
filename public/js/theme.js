// Theme Management Script (Light/Dark mode toggle)
(function() {
  const currentTheme = localStorage.getItem('theme') || 'light';
  document.documentElement.setAttribute('data-theme', currentTheme);

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
