const VALID_USERNAME = 'admin';
const VALID_PASSWORD = 'admin123';

function handleLogin() {
  const username = document.getElementById('username').value.trim();
  const password = document.getElementById('password').value.trim();
  const errorEl  = document.getElementById('error-msg');

  errorEl.textContent = '';
  errorEl.classList.add('hidden');

  if (!username || !password) {
    showError(errorEl, 'Please enter both username and password.');
    return;
  }

  if (username === VALID_USERNAME && password === VALID_PASSWORD) {
    sessionStorage.setItem('isLoggedIn', 'true');
    window.location.href = 'dashboard.html';
  } else {
    showError(errorEl, 'Invalid username or password. Please try again.');
  }
}

function showError(el, msg) {
  el.textContent = msg;
  el.classList.remove('hidden');
}

document.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') handleLogin();
});
