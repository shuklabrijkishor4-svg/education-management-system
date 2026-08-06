(function () {
  const API = window.APP_CONFIG.API_BASE;
  let currentUser = null;
  let newPhotoDataUrl = '';

  function setError(input, msg) {
    const field = input.closest('.field');
    field.classList.toggle('has-error', !!msg);
    field.querySelector('.field-error').textContent = msg || '';
  }

  async function loadProfile() {
    try {
      const res = await fetch(`${API}/session`, { credentials: 'include' });
      const data = await res.json();
      if (!data.loggedIn) { window.location.href = 'login.html'; return; }
      currentUser = data.user;
      const u = currentUser;

      document.getElementById('profileEnrollBadge').textContent = u.enrollmentNumber;
      document.getElementById('pFullName').value = u.fullName;
      document.getElementById('pMobile').value = u.mobile;
      document.getElementById('pEmail').value = u.email;
      document.getElementById('pAddress').value = u.address;
      document.getElementById('pCity').value = u.city;
      document.getElementById('pState').value = u.state;

      const courseSelect = document.getElementById('pCourse');
      window.APP_CONFIG.COURSES.forEach((c) => {
        const opt = document.createElement('option');
        opt.value = c.name;
        opt.textContent = c.name;
        if (c.name === u.course) opt.selected = true;
        courseSelect.appendChild(opt);
      });

      document.getElementById('roEnroll').textContent = u.enrollmentNumber;
      document.getElementById('roDate').textContent = u.registrationDate || '—';
      document.getElementById('roFather').textContent = u.fatherName || '—';
      document.getElementById('roMother').textContent = u.motherName || '—';
      document.getElementById('roDob').textContent = u.dob || '—';
      document.getElementById('roQual').textContent = u.qualification || '—';

      if (u.profilePhoto) {
        document.getElementById('profilePhotoImg').src = u.profilePhoto;
        document.getElementById('profilePhotoImg').style.display = 'block';
        document.getElementById('profilePhotoFallback').style.display = 'none';
      }
    } catch (err) {
      showToast('Could not load your profile.', 'error');
    }
  }
  document.addEventListener('DOMContentLoaded', loadProfile);

  document.getElementById('profilePhotoInput')?.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) { showToast('Photo must be under 2MB.', 'error'); e.target.value = ''; return; }
    const reader = new FileReader();
    reader.onload = (ev) => {
      newPhotoDataUrl = ev.target.result;
      document.getElementById('profilePhotoImg').src = newPhotoDataUrl;
      document.getElementById('profilePhotoImg').style.display = 'block';
      document.getElementById('profilePhotoFallback').style.display = 'none';
    };
    reader.readAsDataURL(file);
  });

  const form = document.getElementById('profileForm');
  form?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const fullName = document.getElementById('pFullName');
    const mobile = document.getElementById('pMobile');
    const email = document.getElementById('pEmail');
    const address = document.getElementById('pAddress');
    const city = document.getElementById('pCity');
    const state = document.getElementById('pState');
    const course = document.getElementById('pCourse');
    let valid = true;
    [fullName, mobile, email, address, city, state, course].forEach((el) => setError(el, ''));

    if (fullName.value.trim().length < 3) { setError(fullName, 'Enter your full name.'); valid = false; }
    if (!/^[6-9]\d{9}$/.test(mobile.value.trim())) { setError(mobile, 'Enter a valid 10-digit mobile number.'); valid = false; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value.trim())) { setError(email, 'Enter a valid email address.'); valid = false; }
    if (address.value.trim().length < 6) { setError(address, 'Enter your full address.'); valid = false; }
    if (city.value.trim().length < 2) { setError(city, 'Enter your city.'); valid = false; }
    if (state.value.trim().length < 2) { setError(state, 'Enter your state.'); valid = false; }
    if (!valid) { showToast('Please fix the highlighted fields.', 'error'); return; }

    const btn = document.getElementById('profileSaveBtn');
    btn.disabled = true;
    btn.innerHTML = 'Saving...';

    try {
      const res = await fetch(`${API}/profile`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          fullName: fullName.value.trim(),
          mobile: mobile.value.trim(),
          email: email.value.trim(),
          address: address.value.trim(),
          city: city.value.trim(),
          state: state.value.trim(),
          course: course.value,
          profilePhoto: newPhotoDataUrl || undefined,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        showToast('Profile updated successfully.', 'success');
      } else {
        showToast(data.message || 'Could not update profile.', 'error');
      }
    } catch (err) {
      showToast('Could not reach the server.', 'error');
    } finally {
      btn.disabled = false;
      btn.innerHTML = '<i class="fa-solid fa-floppy-disk"></i> Save Changes';
    }
  });

  document.getElementById('profilePrintBtn')?.addEventListener('click', () => window.print());

  /* ---------- Delete account ---------- */
  const deleteModal = document.getElementById('deleteModal');
  document.getElementById('profileDeleteBtn')?.addEventListener('click', () => deleteModal.classList.add('show'));
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
        showToast('Account deleted.', 'success');
        setTimeout(() => (window.location.href = 'index.html'), 1000);
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

  document.getElementById('sidebarLogout')?.addEventListener('click', async (e) => {
    e.preventDefault();
    await fetch(`${API}/logout`, { method: 'POST', credentials: 'include' }).catch(() => {});
    window.location.href = 'index.html';
  });
})();
