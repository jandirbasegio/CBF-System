async function login(username, password) {
  const resp = await fetch("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password })
  });

  if (!resp.ok) return null;

  return resp.json();
}

// Função de logout disponível globalmente
function logout() {
  localStorage.removeItem("token");
  localStorage.removeItem("username");
  window.location.href = "/index.html";
}

// Tornar logout disponível globalmente
window.logout = logout;

// Configurar botão de logout quando a página carregar
document.addEventListener("DOMContentLoaded", () => {
  const logoutBtn = document.getElementById("logoutBtn");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", (e) => {
      e.preventDefault();
      logout();
    });
  }
  
  // Também configurar para links com onclick="logout()"
  document.querySelectorAll('a[onclick*="logout"]').forEach(link => {
    link.addEventListener("click", (e) => {
      e.preventDefault();
      logout();
    });
  });
});

document.getElementById("login-form")?.addEventListener("submit", async (e) => {
  e.preventDefault();

  const username = document.getElementById("username").value;
  const password = document.getElementById("password").value;

  const data = await login(username, password);

  if (!data) {
    document.getElementById("login-error").textContent = "Usuário ou senha inválidos";
    return;
  }

  localStorage.setItem("token", data.token);
  localStorage.setItem("username", username);

  window.location.href = "/dashboard.html";
});
