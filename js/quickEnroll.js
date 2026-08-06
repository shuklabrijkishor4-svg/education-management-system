(function () {
  const modal = document.getElementById('quickEnrollModal');
  if (!modal) return; // only present on courses.html

  const form = document.getElementById('quickEnrollForm');
  const successBox = document.getElementById('qeSuccess');
  const courseNameLabel = document.getElementById('qeCourseName');
  let selectedCourseId = '';
  let selectedCourseName = '';

  function setError(input, msg) {
    const field = input.closest('.field');
    field.classList.toggle('has-error', !!msg);
    field.querySelector('.field-error').textContent = msg || '';
  }

  function openModal(courseId, courseName) {
    selectedCourseId = courseId;
    selectedCourseName = courseName;
    courseNameLabel.textContent = courseName;
    form.reset();
    form.style.display = 'block';
    successBox.style.display = 'none';
    ['qeName', 'qeFatherName', 'qeMobile', 'qeEmail'].forEach((id) => setError(document.getElementById(id), ''));
    modal.classList.add('show');
  }

  function closeModal() {
    modal.classList.remove('show');
  }

  // Delegate clicks so this works for cards rendered dynamically by courses.html
  document.addEventListener('click', (e) => {
    const btn = e.target.closest('.quick-enroll-btn');
    if (btn) {
      openModal(btn.dataset.courseId, btn.dataset.courseName);
    }
  });

  document.getElementById('qeCancelBtn')?.addEventListener('click', closeModal);
  document.getElementById('qeCloseBtn')?.addEventListener('click', closeModal);
  modal.addEventListener('click', (e) => { if (e.target === modal) closeModal(); });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = document.getElementById('qeName');
    const fatherName = document.getElementById('qeFatherName');
    const mobile = document.getElementById('qeMobile');
    const email = document.getElementById('qeEmail');
    let valid = true;
    [name, fatherName, mobile, email].forEach((el) => setError(el, ''));

    if (name.value.trim().length < 3) { setError(name, "Enter the student's full name."); valid = false; }
    if (fatherName.value.trim().length < 3) { setError(fatherName, "Enter father's full name."); valid = false; }
    if (!/^[6-9]\d{9}$/.test(mobile.value.trim())) { setError(mobile, 'Enter a valid 10-digit mobile number.'); valid = false; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value.trim())) { setError(email, 'Enter a valid email address.'); valid = false; }
    if (!valid) return;

    const btn = document.getElementById('qeSubmitBtn');
    btn.disabled = true;
    btn.textContent = 'Submitting...';

    try {
      const res = await fetch(`${window.APP_CONFIG.API_BASE}/quick-enroll`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: name.value.trim(),
          fatherName: fatherName.value.trim(),
          mobile: mobile.value.trim(),
          email: email.value.trim(),
          course: selectedCourseName,
          courseId: selectedCourseId,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        form.style.display = 'none';
        successBox.style.display = 'block';
        showToast('Enrollment interest submitted!', 'success');
      } else {
        showToast(data.message || 'Could not submit. Please try again.', 'error');
      }
    } catch (err) {
      showToast('Could not reach the server. Please try again.', 'error');
    } finally {
      btn.disabled = false;
      btn.textContent = 'Submit';
    }
  });
})();
