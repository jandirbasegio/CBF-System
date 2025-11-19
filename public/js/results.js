// public/js/results.js
document.addEventListener('DOMContentLoaded', () => {
  if (document.getElementById('resultsList')) carregarResultados();
  if (document.getElementById('saveResultBtn')) setupNovoResultado();
});

async function carregarResultados() {
  const token = localStorage.getItem('token');
  const res = await fetch('/api/test-results', {
    headers: { 'Authorization': 'Bearer ' + token }
  });
  const data = await res.json();
  const container = document.getElementById('resultsList');
  if (!container) return;
  container.innerHTML = data.map(r => `
    <div class="card">
      <b>${r.first_name ? (r.first_name + ' ' + (r.last_name||'')) : '---'}</b><br>
      Teste: ${r.test_id}<br>
      Resultado: ${r.result}<br>
      Substâncias: ${r.substances ? JSON.stringify(r.substances) : '—'}<br>
      Reportado em: ${r.reported_at || ''}
    </div>
  `).join('');
}

function setupNovoResultado() {
  // We'll implement autocomplete for athlete -> then load tests for that athlete
  const athleteInput = document.getElementById('res_athlete_name');
  const athleteResults = document.getElementById('resAthResults');
  const testsSelect = document.getElementById('res_test_select');

  athleteInput.addEventListener('input', async () => {
    const q = athleteInput.value.trim();
    athleteResults.innerHTML = '';
    testsSelect.innerHTML = '<option value="">Selecione teste</option>';
    if (q.length < 2) return;

    const token = localStorage.getItem('token');
    const r = await fetch('/api/athletes?search=' + encodeURIComponent(q), {
      headers: { 'Authorization': 'Bearer ' + token }
    });
    const list = await r.json();

    athleteResults.innerHTML = list.map(a => {
      const fullname = (a.first_name + ' ' + a.last_name).trim();
      return `<div class="autocomplete-item" data-id="${a.id}" data-name="${fullname}">${fullname} <small>${a.id_document || ''}</small></div>`;
    }).join('');

    athleteResults.querySelectorAll('.autocomplete-item').forEach(el => {
      el.addEventListener('click', async () => {
        athleteInput.value = el.dataset.name;
        athleteInput.dataset.athleteId = el.dataset.id;
        athleteResults.innerHTML = '';

        // load tests for this athlete
        const res = await fetch('/api/tests?search=' + encodeURIComponent(el.dataset.name), {
          headers: { 'Authorization': 'Bearer ' + token }
        });
        const tests = await res.json();
        testsSelect.innerHTML = '<option value="">Selecione teste</option>' + tests.map(t => `<option value="${t.id}">${t.sample_id || t.id} — ${t.scheduled_date || '—'}</option>`).join('');
      });
    });
  });

  document.getElementById('saveResultBtn').addEventListener('click', async () => {
    const token = localStorage.getItem('token');
    const test_id = document.getElementById('res_test_select').value;
    const result = document.getElementById('res_result').value;
    const substances = document.getElementById('res_substances').value.split(',').map(s => s.trim()).filter(Boolean);
    const analysis_report = document.getElementById('res_report').value;

    if (!test_id || !result) {
      document.getElementById('resMsg').innerText = 'Selecione teste e resultado';
      return;
    }

    const res = await fetch('/api/test-results', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
      body: JSON.stringify({ test_id, result, substances, analysis_report })
    });

    if (res.ok) {
      document.getElementById('resMsg').innerText = 'Resultado salvo';
      carregarResultados();
    } else {
      const err = await res.json();
      document.getElementById('resMsg').innerText = err.error || 'Erro';
    }
  });
}
