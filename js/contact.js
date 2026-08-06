(function () {
  const form = document.getElementById('contactForm');
  if (!form) return;

  function setError(id, msg) {
    const field = document.getElementById(id).closest('.field');
    field.classList.toggle('has-error', !!msg);
    field.querySelector('.field-error').textContent = msg || '';
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = document.getElementById('cName').value.trim();
    const email = document.getElementById('cEmail').value.trim();
    const subject = document.getElementById('cSubject').value.trim();
    const message = document.getElementById('cMessage').value.trim();
    let valid = true;

    setError('cName', ''); setError('cEmail', ''); setError('cSubject', ''); setError('cMessage', '');

    if (name.length < 2) { setError('cName', 'Please enter your full name.'); valid = false; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { setError('cEmail', 'Enter a valid email address.'); valid = false; }
    if (subject.length < 3) { setError('cSubject', 'Please add a short subject.'); valid = false; }
    if (message.length < 10) { setError('cMessage', 'Message should be at least 10 characters.'); valid = false; }
    if (!valid) return;

    const btn = document.getElementById('contactSubmit');
    btn.disabled = true;
    btn.textContent = 'Sending...';

    try {
      const res = await fetch(`${window.APP_CONFIG.API_BASE}/contact`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, subject, message }),
      });
      const data = await res.json();
      if (res.ok) {
        showToast('Message sent — we will get back to you soon.', 'success');
        form.reset();
      } else {
        showToast(data.message || 'Could not send message. Try again later.', 'error');
      }
    } catch (err) {
      showToast('Backend not reachable. Please try again shortly.', 'error');
    } finally {
      btn.disabled = false;
      btn.textContent = 'Send Message';
    }
  });
})();
