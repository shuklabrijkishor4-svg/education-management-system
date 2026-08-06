(function () {
  const API = () => window.APP_CONFIG.API_BASE;

  /* ---------- Shared: password show/hide ---------- */
  document.addEventListener('click', (e) => {
    const btn = e.target.closest('.toggle-pw');
    if (!btn) return;
    const input = document.getElementById(btn.dataset.target);
    if (!input) return;
    const isPw = input.type === 'password';
    input.type = isPw ? 'text' : 'password';
    btn.innerHTML = isPw ? '<i class="fa-solid fa-eye-slash"></i>' : '<i class="fa-solid fa-eye"></i>';
  });

  function setError(input, msg) {
    const field = input.closest('.field');
    field.classList.toggle('has-error', !!msg);
    field.querySelector('.field-error').textContent = msg || '';
  }

  /* =========================================================
     REGISTER PAGE
     ========================================================= */
  const registerForm = document.getElementById('registerForm');
  if (registerForm) {
    // Populate course dropdown
    const courseSelect = document.getElementById('course');
    window.APP_CONFIG.COURSES.forEach((c) => {
      const opt = document.createElement('option');
      opt.value = c.id;
      opt.textContent = `${c.name} (${c.duration})`;
      courseSelect.appendChild(opt);
    });
    // Pre-select course from ?course= query param
    // Note: State→District dropdown logic lives inline in register.html
    // (kept self-contained there so it can't break due to script order/paths).
    const params = new URLSearchParams(window.location.search);
    const preselect = params.get('course');
    if (preselect) courseSelect.value = preselect;

    // Photo preview
    const photoInput = document.getElementById('profilePhoto');
    const photoPreview = document.getElementById('photoPreview');
    let photoDataUrl = '';
    photoInput.addEventListener('change', () => {
      const file = photoInput.files[0];
      if (!file) return;
      if (file.size > 2 * 1024 * 1024) {
        showToast('Photo must be under 2MB.', 'error');
        photoInput.value = '';
        return;
      }
      const reader = new FileReader();
      reader.onload = (ev) => {
        photoDataUrl = ev.target.result;
        photoPreview.innerHTML = `<img src="${photoDataUrl}" alt="Profile preview">`;
      };
      reader.readAsDataURL(file);
    });

    const fields = {
      fullName: document.getElementById('fullName'),
      dob: document.getElementById('dob'),
      fatherName: document.getElementById('fatherName'),
      motherName: document.getElementById('motherName'),
      gender: document.getElementById('gender'),
      qualification: document.getElementById('qualification'),
      mobile: document.getElementById('mobile'),
      email: document.getElementById('email'),
      address: document.getElementById('address'),
      city: document.getElementById('city'),
      state: document.getElementById('state'),
      pincode: document.getElementById('pincode'),
      course: courseSelect,
      password: document.getElementById('password'),
      confirmPassword: document.getElementById('confirmPassword'),
    };

    function validateRegister() {
      let valid = true;
      const v = {};
      Object.entries(fields).forEach(([key, el]) => { v[key] = el.value.trim(); setError(el, ''); });

      if (v.fullName.length < 3) { setError(fields.fullName, 'Enter your full name (min 3 characters).'); valid = false; }
      if (!v.dob) { setError(fields.dob, 'Date of birth is required.'); valid = false; }
      else {
        const age = (Date.now() - new Date(v.dob).getTime()) / (1000 * 60 * 60 * 24 * 365.25);
        if (age < 10 || age > 100) { setError(fields.dob, 'Enter a realistic date of birth.'); valid = false; }
      }
      if (v.fatherName.length < 3) { setError(fields.fatherName, "Enter father's full name."); valid = false; }
      if (v.motherName.length < 3) { setError(fields.motherName, "Enter mother's full name."); valid = false; }
      if (!v.gender) { setError(fields.gender, 'Please select a gender.'); valid = false; }
      if (!v.qualification) { setError(fields.qualification, 'Please select a qualification.'); valid = false; }
      if (!/^[6-9]\d{9}$/.test(v.mobile)) { setError(fields.mobile, 'Enter a valid 10-digit mobile number.'); valid = false; }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.email)) { setError(fields.email, 'Enter a valid email address.'); valid = false; }
      if (v.address.length < 6) { setError(fields.address, 'Enter your full address.'); valid = false; }
      if (v.city.length < 2) { setError(fields.city, 'Enter your city.'); valid = false; }
      if (v.state.length < 2) { setError(fields.state, 'Enter your state.'); valid = false; }
      if (!/^\d{6}$/.test(v.pincode)) { setError(fields.pincode, 'Enter a valid 6-digit PIN code.'); valid = false; }
      if (!v.course) { setError(fields.course, 'Please select a course.'); valid = false; }
      if (v.password.length < 8 || !/[A-Z]/.test(v.password) || !/[0-9]/.test(v.password)) {
        setError(fields.password, 'Min 8 characters, include one uppercase letter and one number.'); valid = false;
      }
      if (v.confirmPassword !== v.password || !v.confirmPassword) {
        setError(fields.confirmPassword, 'Passwords do not match.'); valid = false;
      }
      return { valid, v };
    }

    registerForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const { valid, v } = validateRegister();
      if (!valid) { showToast('Please fix the highlighted fields.', 'error'); return; }

      const courseName = window.APP_CONFIG.COURSES.find((c) => c.id === v.course)?.name || v.course;
      const payload = {
        fullName: v.fullName, dob: v.dob, fatherName: v.fatherName, motherName: v.motherName,
        gender: v.gender, mobile: v.mobile, email: v.email, address: v.address, city: v.city,
        state: v.state, pincode: v.pincode, course: courseName, qualification: v.qualification,
        password: v.password, profilePhoto: photoDataUrl,
      };

      const btn = document.getElementById('registerSubmit');
      btn.disabled = true;
      btn.textContent = 'Creating account...';

      try {
        const res = await fetch(`${API()}/register`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
          credentials: 'include',
        });
        const data = await res.json();
        if (!res.ok) {
          showToast(data.message || 'Registration failed.', 'error');
          if (data.field) setError(fields[data.field], data.message);
          return;
        }
        registerForm.style.display = 'none';
        document.getElementById('successCard').style.display = 'block';
        document.getElementById('successName').textContent = v.fullName;
        document.getElementById('successCourse').textContent = courseName;
        document.getElementById('successEnroll').textContent = data.enrollmentNumber;
        showToast('Registration successful! Your enrollment number is ready.', 'success');

        document.getElementById('downloadReceiptBtn').addEventListener('click', () => {
          downloadReceipt({ ...payload, enrollmentNumber: data.enrollmentNumber, registrationDate: new Date().toLocaleDateString('en-IN') });
        });
      } catch (err) {
        showToast('Could not reach the server. Please try again.', 'error');
      } finally {
        btn.disabled = false;
        btn.textContent = 'Create Account';
      }
    });
  }

  /* Simple print-based "PDF" receipt so no extra library is required */
  function downloadReceipt(data) {
    const win = window.open('', '_blank');
    win.document.write(`
      <html><head><title>Registration Receipt</title>
      <style>
        body{font-family:Arial,sans-serif;padding:40px;color:#12211d;}
        h1{color:#163832;} .row{display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid #ddd;max-width:480px;}
        .k{color:#666;} .enroll{font-family:monospace;font-weight:bold;font-size:1.4rem;color:#3f7a6b;}
      </style></head><body>
      <h1>Learners Academy — Registration Receipt</h1>
      <div class="row"><span class="k">Enrollment Number</span><span class="enroll">${data.enrollmentNumber}</span></div>
      <div class="row"><span class="k">Name</span><span>${data.fullName}</span></div>
      <div class="row"><span class="k">Course</span><span>${data.course}</span></div>
      <div class="row"><span class="k">Email</span><span>${data.email}</span></div>
      <div class="row"><span class="k">Mobile</span><span>${data.mobile}</span></div>
      <div class="row"><span class="k">Registration Date</span><span>${data.registrationDate}</span></div>
      <script>window.onload = () => window.print();</script>
      </body></html>
    `);
    win.document.close();
  }
  window.downloadReceipt = downloadReceipt;

  /* =========================================================
     LOGIN PAGE
     ========================================================= */
  const loginForm = document.getElementById('loginForm');
  if (loginForm) {
    const identifier = document.getElementById('loginIdentifier');
    const password = document.getElementById('loginPassword');

    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      let valid = true;
      setError(identifier, ''); setError(password, '');
      if (!identifier.value.trim()) { setError(identifier, 'Enter your email or enrollment number.'); valid = false; }
      if (!password.value) { setError(password, 'Enter your password.'); valid = false; }
      if (!valid) return;

      const btn = document.getElementById('loginSubmit');
      btn.disabled = true;
      btn.textContent = 'Logging in...';

      try {
        const res = await fetch(`${API()}/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            identifier: identifier.value.trim(),
            password: password.value,
            remember: document.getElementById('rememberMe')?.checked || false,
          }),
          credentials: 'include',
        });
        const data = await res.json();
        if (!res.ok) {
          showToast(data.message || 'Invalid credentials.', 'error');
          setError(password, data.message || 'Incorrect enrollment/email or password.');
          return;
        }
        showToast(`Welcome back, ${data.user.fullName.split(' ')[0]}!`, 'success');
        window.location.href = 'dashboard.html';
      } catch (err) {
        showToast('Could not reach the server. Please try again.', 'error');
      } finally {
        btn.disabled = false;
        btn.textContent = 'Login';
      }
    });
  }

  /* ---------- Forgot password (modal-driven, simple flow) ---------- */
  const forgotLink = document.getElementById('forgotPasswordLink');
  const forgotModal = document.getElementById('forgotModal');
  if (forgotLink && forgotModal) {
    forgotLink.addEventListener('click', (e) => { e.preventDefault(); forgotModal.classList.add('show'); });
    forgotModal.addEventListener('click', (e) => { if (e.target === forgotModal) forgotModal.classList.remove('show'); });
    const forgotForm = document.getElementById('forgotForm');
    forgotForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = document.getElementById('forgotEmail').value.trim();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { showToast('Enter a valid email address.', 'error'); return; }
      try {
        const res = await fetch(`${API()}/forgot-password`, {
          method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email }),
        });
        const data = await res.json();
        showToast(data.message || 'If that email exists, reset instructions were sent.', 'success');
        forgotModal.classList.remove('show');
      } catch (err) {
        showToast('Could not reach the server.', 'error');
      }
    });
  }

  /* Redirect already-logged-in users away from login/register pages */
  if (loginForm || registerForm) {
    fetch(`${API()}/session`, { credentials: 'include' })
      .then((r) => r.json())
      .then((data) => { if (data.loggedIn) window.location.href = 'dashboard.html'; })
      .catch(() => {});
  }
})();
