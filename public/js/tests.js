// public/js/tests.js
// funções para carregar testes, autocomplete de atleta e criar teste
document.addEventListener('DOMContentLoaded', () => {
  // se existir a página de listagem
  if (document.getElementById('testsList')) carregarTestes();
  if (document.getElementById('saveTestBtn')) setupNovoTeste();
});

async function carregarTestes(filter = '') {
  const token = localStorage.getItem('token');
  const res = await fetch('/api/tests' + (filter ? ('?search=' + encodeURIComponent(filter)) : ''), {
    headers: { 'Authorization': 'Bearer ' + token }
  });
  const data = await res.json();
  const container = document.getElementById('testsList');
  if (!container) return;
  container.innerHTML = data.map(t => {
    // Formatar data corretamente
    let dataFormatada = '—';
    const dataOriginal = t.scheduled_date || t.test_date || t.collected_date;
    if (dataOriginal) {
      try {
        const date = new Date(dataOriginal);
        if (!isNaN(date.getTime())) {
          dataFormatada = date.toLocaleDateString('pt-BR', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
          });
        }
      } catch (e) {
        console.error('Erro ao formatar data:', e, dataOriginal);
      }
    }
    
    // Traduzir situação/status para português
    let situacaoTraduzida = t.status || '—';
    if (situacaoTraduzida !== '—') {
      const statusLower = situacaoTraduzida.toLowerCase();
      const traducoes = {
        'pending': 'Pendente',
        'scheduled': 'Agendado',
        'completed': 'Concluído',
        'in_progress': 'Em Andamento',
        'cancelled': 'Cancelado',
        'collected': 'Coletado',
        'analyzed': 'Analisado',
        'awaiting': 'Aguardando',
        'awaiting_results': 'Aguardando Resultados'
      };
      situacaoTraduzida = traducoes[statusLower] || situacaoTraduzida;
    }
    
    return `
    <div class="card">
      <b>${t.first_name ? (t.first_name + ' ' + (t.last_name||'')) : 'Atleta desconhecido'}</b><br>
      Teste: ${t.id}<br>
      Sample: ${t.sample_id || '—'}<br>
      Data agendada: ${dataFormatada}<br>
      Laboratório: ${t.laboratory || '—'}<br>
      Situação: ${situacaoTraduzida}<br>
    </div>
  `;
  }).join('');
}

// --- AUTOCOMPLETE e criação de novo teste ---
function setupNovoTeste() {
  const inputAth = document.getElementById('athlete_name');
  const resultsBox = document.getElementById('athleteResults');
  let selectedAthlete = null;

  inputAth.addEventListener('input', async () => {
    const q = inputAth.value.trim();
    if (q.length < 2) { resultsBox.innerHTML = ''; return; }

    const token = localStorage.getItem('token');
    const r = await fetch('/api/athletes?search=' + encodeURIComponent(q), {
      headers: { 'Authorization': 'Bearer ' + token }
    });
    const list = await r.json();

    resultsBox.innerHTML = list.map(a => {
      const fullname = (a.first_name + ' ' + a.last_name).trim();
      return `<div class="autocomplete-item" data-id="${a.id}" data-name="${fullname}">${fullname} <small>${a.id_document || ''}</small></div>`;
    }).join('');

    // click handlers
    resultsBox.querySelectorAll('.autocomplete-item').forEach(el => {
      el.addEventListener('click', () => {
        selectedAthlete = { id: el.dataset.id, name: el.dataset.name };
        inputAth.value = el.dataset.name;
        resultsBox.innerHTML = '';
        inputAth.dataset.athleteId = selectedAthlete.id; // store id for submit
      });
    });
  });

  // salvar
  document.getElementById('saveTestBtn').addEventListener('click', async () => {
    const token = localStorage.getItem('token');

    const athlete_id = document.getElementById('athlete_name').dataset.athleteId || null;
    const athlete_name = document.getElementById('athlete_name').value || null;
    const body = {
      athlete_id: athlete_id || null,
      athlete_name: athlete_id ? undefined : athlete_name,
      sample_id: document.getElementById('sample_id').value || null,
      scheduled_date: document.getElementById('scheduled_date').value || null,
      laboratory: document.getElementById('laboratory').value || null,
    };

    // clean undefined prop
    if (body.athlete_name === undefined) delete body.athlete_name;

    const res = await fetch('/api/tests', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
      body: JSON.stringify(body)
    });

    if (res.ok) {
      document.getElementById('testMsg').innerText = 'Teste cadastrado com sucesso';
      // clear
      document.getElementById('athlete_name').value = '';
      document.getElementById('athlete_name').dataset.athleteId = '';
      document.getElementById('sample_id').value = '';
      document.getElementById('scheduled_date').value = '';
      document.getElementById('laboratory').value = '';
      carregarTestes();
    } else {
      const err = await res.json();
      document.getElementById('testMsg').innerText = err.error || 'Erro ao cadastrar';
    }
  });
}
