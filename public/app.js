// Simple frontend that talks to the serverless /api endpoints
const API_BASE = '/api';
let token = localStorage.getItem('token');

document.addEventListener('DOMContentLoaded', () => {
  const authSection = document.getElementById('auth-section');
  const appSection = document.getElementById('app-section');
  const loginForm = document.getElementById('login-form');
  const loginError = document.getElementById('login-error');
  const who = document.getElementById('who');
  const logoutBtn = document.getElementById('logoutBtn');
  const athleteList = document.getElementById('athleteList');
  const btnNewAth = document.getElementById('btnNewAth');
  const athleteForm = document.getElementById('athleteForm');
  const btnCancel = document.getElementById('btnCancel');
  const btnSearch = document.getElementById('btnSearch');
  const searchAth = document.getElementById('searchAth');
  const btnSummary = document.getElementById('btnSummary');
  const reportArea = document.getElementById('reportArea');

  function setAuthUI() {
    if (token) {
      authSection.style.display = 'none';
      appSection.style.display = 'block';
      who.textContent = 'Logado';
      loadAthletes();
    } else {
      authSection.style.display = 'block';
      appSection.style.display = 'none';
    }
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
      token = data.token;
      localStorage.setItem('token', token);
      setAuthUI();
    } catch (err) {
      loginError.textContent = 'Erro de rede';
    }
  });

  logoutBtn.addEventListener('click', () => {
    token = null;
    localStorage.removeItem('token');
    setAuthUI();
  });

  async function api(path, opts = {}) {
    opts.headers = opts.headers || {};
    if (token) opts.headers['Authorization'] = 'Bearer ' + token;
    const res = await fetch(API_BASE + path, opts);
    if (res.status === 401) {
      token = null;
      localStorage.removeItem('token');
      setAuthUI();
      throw new Error('Unauthorized');
    }
    return res;
  }

  async function loadAthletes(q) {
    athleteList.innerHTML = 'Carregando...';
    try {
      const res = await api('/athletes' + (q ? '?q=' + encodeURIComponent(q) : ''));
      const data = await res.json();
      athleteList.innerHTML = '';
      data.forEach(a => {
        const li = document.createElement('li');
        li.innerHTML = `<div>${a.first_name} ${a.last_name} <small>${a.id_document||''}</small></div>
                        <div>
                          <button data-id="${a.id}" class="edit">Editar</button>
                          <button data-id="${a.id}" class="del">Excluir</button>
                        </div>`;
        athleteList.appendChild(li);
      });
      athleteList.querySelectorAll('.edit').forEach(b => b.addEventListener('click', async (e) => {
        const id = e.target.dataset.id;
        const r = await api('/athletes/' + id);
        const a = await r.json();
        document.getElementById('athleteId').value = a.id;
        document.getElementById('first_name').value = a.first_name;
        document.getElementById('last_name').value = a.last_name;
        document.getElementById('date_of_birth').value = a.date_of_birth ? a.date_of_birth.split('T')[0] : '';
        document.getElementById('nationality').value = a.nationality || '';
        document.getElementById('gender').value = a.gender || '';
        document.getElementById('id_document').value = a.id_document || '';
      }));
      athleteList.querySelectorAll('.del').forEach(b => b.addEventListener('click', async (e) => {
        if (!confirm('Excluir atleta?')) return;
        const id = e.target.dataset.id;
        await api('/athletes/' + id, { method:'DELETE' });
        loadAthletes();
      }));
    } catch (err) {
      athleteList.innerHTML = 'Erro ao carregar';
    }
  }

  btnNewAth.addEventListener('click', () => {
    document.getElementById('athleteForm').reset();
    document.getElementById('athleteId').value = '';
  });

  athleteForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = document.getElementById('athleteId').value;
    const payload = {
      first_name: document.getElementById('first_name').value,
      last_name: document.getElementById('last_name').value,
      date_of_birth: document.getElementById('date_of_birth').value || null,
      nationality: document.getElementById('nationality').value,
      gender: document.getElementById('gender').value,
      id_document: document.getElementById('id_document').value
    };
    try {
      if (id) {
        await api('/athletes/' + id, { method:'PUT', headers:{'Content-Type':'application/json'}, body: JSON.stringify(payload) });
      } else {
        await api('/athletes', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(payload) });
      }
      athleteForm.reset();
      loadAthletes();
    } catch (err) {
      alert('Erro ao salvar');
    }
  });

  btnCancel.addEventListener('click', () => athleteForm.reset());
  btnSearch.addEventListener('click', () => loadAthletes(searchAth.value));
  btnSummary.addEventListener('click', async () => {
    try {
      const r = await api('/reports/summary');
      const d = await r.json();
      reportArea.textContent = JSON.stringify(d, null, 2);
    } catch (err) {
      reportArea.textContent = 'Erro ao buscar relatório';
    }
  });

  setAuthUI();
});
