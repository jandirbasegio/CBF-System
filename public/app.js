// public/js/app.js
const API_BASE = '/api';
let token = localStorage.getItem('token');

document.addEventListener('DOMContentLoaded', () => {
  const authSection = document.getElementById('auth-section');
  const appSection = document.getElementById('app-section');
  const loginForm = document.getElementById('login-form');
  const loginError = document.getElementById('login-error');
  const logoutBtn = document.getElementById('logoutBtn');

  function setAuthUILocal() {
    if (token) {
      // Redireciona para o layout com dashboard
      window.location.href = '/layout.html?page=dashboard.html';
      return;
    }
    authSection.style.display = 'block';
    appSection.style.display = 'none';
  }

  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    loginError.textContent = '';
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    try {
      const res = await fetch(API_BASE + '/auth/login', {
        method: 'POST',
        headers: {'Content-Type':'application/json'},
        body: JSON.stringify({username,password})
      });
      const data = await res.json();
      if (!res.ok) {
        loginError.textContent = data.error || 'Falha no login';
        return;
      }
      localStorage.setItem('token', data.token);
      token = data.token;

      // Redireciona correto
      window.location.href = '/layout.html?page=dashboard.html';

    } catch (err) {
      loginError.textContent = 'Erro de rede';
    }
  });

  logoutBtn.addEventListener('click', () => {
    localStorage.removeItem('token');
    token = null;
    setAuthUILocal();
  });

  setAuthUILocal();
});
