// Protege páginas internas
const token = localStorage.getItem("token");
if (!token) window.location.href = "/index.html";

function logout() {
  localStorage.removeItem("token");
  localStorage.removeItem("username");
  window.location.href = "/index.html";
}

// Mostra usuário no topo
document.getElementById("usernameDisplay")?.innerText =
  localStorage.getItem("username") || "";

// Fetch com JWT
async function api(url, method = "GET", body = null) {
  return fetch(url, {
    method,
    headers: {
      "Content-Type": "application/json",
      "Authorization": "Bearer " + localStorage.getItem("token"),
    },
    body: body ? JSON.stringify(body) : null
  });
}

// Autocomplete de atleta (busca por nome)
async function buscarAtletasPorNome(term) {
  if (term.length < 2) return [];

  const resp = await api(`/api/athletes/search?name=${encodeURIComponent(term)}`);
  if (!resp.ok) return [];

  return resp.json();
}
