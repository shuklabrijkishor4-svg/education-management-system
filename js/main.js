/* =========================================================
   Shared behaviour for every page: nav, theme, reveal, toast,
   loader, and session-aware header state.
   ========================================================= */

(function () {
  /* ---------- Page loader ---------- */
  window.addEventListener('load', () => {
    const loader = document.getElementById('pageLoader');
    if (loader) setTimeout(() => loader.classList.add('hide'), 250);
  });

  /* ---------- Theme toggle (persists across pages) ---------- */
  const THEME_KEY = 'ascend_theme';
  function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    document.querySelectorAll('.theme-toggle i').forEach((icon) => {
      icon.className = theme === 'dark' ? 'fa-solid fa-sun' : 'fa-solid fa-moon';
    });
  }
  const savedTheme = localStorage.getItem(THEME_KEY) || 'light';
  applyTheme(savedTheme);

  document.addEventListener('click', (e) => {
    const toggle = e.target.closest('.theme-toggle');
    if (!toggle) return;
    const current = document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
    const next = current === 'dark' ? 'light' : 'dark';
    applyTheme(next);
    localStorage.setItem(THEME_KEY, next);
  });

  /* ---------- Mobile nav toggle ---------- */
  document.addEventListener('click', (e) => {
    const btn = e.target.closest('.nav-toggle');
    const navLinks = document.querySelector('.nav-links');
    if (btn && navLinks) {
      navLinks.classList.toggle('open');
      btn.innerHTML = navLinks.classList.contains('open') ? '<i class="fa-solid fa-xmark"></i>' : '<i class="fa-solid fa-bars"></i>';
      return;
    }
    if (navLinks && navLinks.classList.contains('open') && e.target.closest('.nav-links a')) {
      navLinks.classList.remove('open');
    }
  });

  /* ---------- Scroll reveal ---------- */
  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('in');
          io.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.15 }
  );
  document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('.reveal').forEach((el) => io.observe(el));
  });

  /* ---------- Toast notifications ---------- */
  window.showToast = function showToast(message, type = 'success') {
    let stack = document.querySelector('.toast-stack');
    if (!stack) {
      stack = document.createElement('div');
      stack.className = 'toast-stack';
      document.body.appendChild(stack);
    }
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    stack.appendChild(toast);
    setTimeout(() => {
      toast.style.transition = 'opacity 0.3s ease';
      toast.style.opacity = '0';
      setTimeout(() => toast.remove(), 300);
    }, 3500);
  };

  /* ---------- Session-aware navbar ----------
     Checks the backend session and swaps nav links + CTA buttons
     between "guest" and "logged in" states on every page. */
  window.refreshAuthNav = async function refreshAuthNav() {
    const nav = document.querySelector('[data-auth-nav]');
    if (!nav) return null;
    try {
      const res = await fetch(`${window.APP_CONFIG.API_BASE}/session`, { credentials: 'include' });
      const data = await res.json();
      if (data.loggedIn) {
        nav.innerHTML = `
          <a href="index.html">Home</a>
          <a href="courses.html">Courses</a>
          <a href="dashboard.html">Dashboard</a>
          <a href="profile.html">Profile</a>
          <a href="contact.html">Contact Us</a>
          <a href="#" id="logoutLink">Logout</a>
        `;
        const guestActions = document.querySelector('[data-guest-actions]');
        if (guestActions) guestActions.style.display = 'none';
      }
      return data;
    } catch (err) {
      console.warn('Could not reach backend for session check:', err.message);
      return { loggedIn: false };
    }
  };

  document.addEventListener('click', async (e) => {
    if (e.target && e.target.id === 'logoutLink') {
      e.preventDefault();
      try {
        await fetch(`${window.APP_CONFIG.API_BASE}/logout`, { method: 'POST', credentials: 'include' });
      } catch (err) { /* ignore network errors on logout */ }
      window.location.href = 'index.html';
    }
  });

  document.addEventListener('DOMContentLoaded', () => {
    if (typeof window.refreshAuthNav === 'function') window.refreshAuthNav();
  });
})();
