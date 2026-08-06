(function () {
  const API = window.APP_CONFIG.API_BASE;

  async function loadDashboard() {
    try {
      const res = await fetch(`${API}/session`, { credentials: 'include' });
      const data = await res.json();
      if (!data.loggedIn) {
        window.location.href = 'login.html';
        return;
      }
      const u = data.user;
      document.getElementById('welcomeHeading').textContent = `Welcome, ${u.fullName.split(' ')[0]}`;
      document.getElementById('dashName').textContent = u.fullName;
      document.getElementById('dashEnroll').textContent = u.enrollmentNumber;
      document.getElementById('dashCourse').textContent = u.course;
      document.getElementById('dashEmail').textContent = u.email;
      document.getElementById('dashMobile').textContent = u.mobile;
      document.getElementById('dashRegDate').textContent = u.registrationDate || '—';
      document.getElementById('dashAddress').textContent = `${u.address}, ${u.city}, ${u.state} — ${u.pincode}`;

      if (u.profilePhoto) {
        const img = document.getElementById('dashPhoto');
        img.src = u.profilePhoto;
        img.style.display = 'block';
        document.getElementById('dashPhotoFallback').style.display = 'none';
      }
    } catch (err) {
      showToast('Could not load your dashboard. Please log in again.', 'error');
      setTimeout(() => (window.location.href = 'login.html'), 1200);
    }
  }

  document.addEventListener('DOMContentLoaded', loadDashboard);

  /* ---------- Delete account flow ---------- */
  const deleteModal = document.getElementById('deleteModal');
  document.getElementById('deleteAccountCard')?.addEventListener('click', () => deleteModal.classList.add('show'));
  document.getElementById('cancelDelete')?.addEventListener('click', () => deleteModal.classList.remove('show'));
  deleteModal?.addEventListener('click', (e) => { if (e.target === deleteModal) deleteModal.classList.remove('show'); });

  document.getElementById('confirmDelete')?.addEventListener('click', async () => {
    const btn = document.getElementById('confirmDelete');
    btn.disabled = true;
    btn.textContent = 'Deleting...';
    try {
      const res = await fetch(`${API}/profile`, { method: 'DELETE', credentials: 'include' });
      const data = await res.json();
      if (res.ok) {
        showToast('Account deleted. Redirecting home...', 'success');
        setTimeout(() => (window.location.href = 'index.html'), 1200);
      } else {
        showToast(data.message || 'Could not delete account.', 'error');
      }
    } catch (err) {
      showToast('Could not reach the server.', 'error');
    } finally {
      btn.disabled = false;
      btn.textContent = 'Yes, Delete';
    }
  });

  /* ---------- Logout (sidebar) ---------- */
  document.getElementById('sidebarLogout')?.addEventListener('click', async (e) => {
    e.preventDefault();
    await fetch(`${API}/logout`, { method: 'POST', credentials: 'include' }).catch(() => {});
    window.location.href = 'index.html';
  });

  /* ---------- Print profile ---------- */
  document.getElementById('printProfileBtn')?.addEventListener('click', () => window.print());
})();
