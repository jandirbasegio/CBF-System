// ========================
// AUTOCOMPLETE + LISTA
// ========================

async function loadAthletes(filter = "") {
    const token = localStorage.getItem("token");
    const url = "/api/athletes?search=" + encodeURIComponent(filter);

    const res = await fetch(url, {
        headers: { Authorization: "Bearer " + token }
    });

    const data = await res.json();
    const list = document.getElementById("athleteList");
    if (!list) return;

    list.innerHTML = "";

    if (data.length === 0) {
        const li = document.createElement("li");
        li.innerHTML = '<p style="padding: 15px; text-align: center; color: #666;">Nenhum atleta encontrado.</p>';
        list.appendChild(li);
        return;
    }

    data.forEach(a => {
        const li = document.createElement("li");
        
        // Formatar data de nascimento
        let dataNasc = 'Não informado';
        if (a.date_of_birth) {
            try {
                const date = new Date(a.date_of_birth);
                dataNasc = date.toLocaleDateString('pt-BR');
            } catch (e) {
                dataNasc = a.date_of_birth;
            }
        }
        
        // Escapar caracteres especiais para evitar problemas no HTML
        const escapeHtml = (str) => {
            if (!str) return '';
            return String(str)
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;')
                .replace(/"/g, '&quot;')
                .replace(/'/g, '&#039;');
        };
        
        const nomeCompleto = `${a.first_name || ''} ${a.last_name || ''}`.trim();
        const nomeEscapado = escapeHtml(nomeCompleto);
        
        li.innerHTML = `
            <div class="card" style="margin-bottom: 15px;">
                <div style="display: flex; justify-content: space-between; align-items: start; flex-wrap: wrap; gap: 15px;">
                    <div style="flex: 1; min-width: 300px;">
                        <h3 style="margin: 0 0 15px 0; color: #0a3d62; font-size: 20px; border-bottom: 2px solid #0a3d62; padding-bottom: 8px;">
                            ${escapeHtml(a.first_name || '')} ${escapeHtml(a.last_name || '')}
                        </h3>
                        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 12px; font-size: 14px;">
                            <div style="padding: 8px; background: #f8f9fa; border-radius: 4px;">
                                <strong style="color: #2980b9; display: block; margin-bottom: 4px;">📅 Data de Nascimento</strong>
                                <span style="color: #555;">${dataNasc}</span>
                            </div>
                            <div style="padding: 8px; background: #f8f9fa; border-radius: 4px;">
                                <strong style="color: #2980b9; display: block; margin-bottom: 4px;">🌍 Nacionalidade</strong>
                                <span style="color: #555;">${escapeHtml(a.nationality || 'Não informado')}</span>
                            </div>
                            <div style="padding: 8px; background: #f8f9fa; border-radius: 4px;">
                                <strong style="color: #2980b9; display: block; margin-bottom: 4px;">⚧️ Gênero</strong>
                                <span style="color: #555;">${escapeHtml(a.gender || 'Não informado')}</span>
                            </div>
                            <div style="padding: 8px; background: #f8f9fa; border-radius: 4px;">
                                <strong style="color: #2980b9; display: block; margin-bottom: 4px;">🆔 Documento</strong>
                                <span style="color: #555; font-family: monospace;">${escapeHtml(a.id_document || 'Não informado')}</span>
                            </div>
                        </div>
                    </div>
                    <div style="display: flex; flex-direction: column; gap: 8px; flex-shrink: 0; min-width: 100px;">
                        <button onclick="editAthlete('${nomeEscapado.replace(/'/g, "\\'")}')" 
                                style="padding: 10px 20px; background: #2980b9; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 14px; white-space: nowrap;">
                            ✏️ Editar
                        </button>
                        <button onclick="deleteAthlete('${nomeEscapado.replace(/'/g, "\\'")}')" 
                                style="padding: 10px 20px; background: #e74c3c; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 14px; white-space: nowrap;">
                            🗑️ Excluir
                        </button>
                    </div>
                </div>
            </div>
        `;
        list.appendChild(li);
    });
}

document.getElementById("btnSearch")?.addEventListener("click", () => {
    const name = document.getElementById("searchAthlete").value;
    loadAthletes(name);
});

// Carrega todos os atletas quando a página carregar
document.addEventListener("DOMContentLoaded", () => {
    loadAthletes("");
});

// ========================
// CRIAR ATLETA
// ========================

const form = document.getElementById("formAtleta");
if (form) {
    form.addEventListener("submit", async (e) => {
        e.preventDefault();

        const token = localStorage.getItem("token");
        
        // Verificar se está editando
        const urlParams = new URLSearchParams(window.location.search);
        const editNameFromUrl = urlParams.get('edit');
        const editName = form.dataset.editName || editNameFromUrl;
        const isEdit = !!editName;

        const body = {
            first_name: document.getElementById("first_name").value,
            last_name: document.getElementById("last_name").value,
            date_of_birth: document.getElementById("date_of_birth").value,
            nationality: document.getElementById("nationality").value,
            gender: document.getElementById("gender").value,
            id_document: document.getElementById("id_document").value
        };

        try {
            let res;
            if (isEdit) {
                // Atualizar atleta existente
                res = await fetch(`/api/athletes/name?name=${encodeURIComponent(editName)}`, {
                    method: "PUT",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: "Bearer " + token
                    },
                    body: JSON.stringify(body)
                });
            } else {
                // Criar novo atleta
                res = await fetch("/api/athletes", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: "Bearer " + token
                    },
                    body: JSON.stringify(body)
                });
            }

            const data = await res.json();
            const statusMsg = document.getElementById("statusMsg");
            if (res.ok) {
                statusMsg.textContent = data.message || (isEdit ? "Atleta atualizado com sucesso!" : "Atleta cadastrado com sucesso!");
                statusMsg.style.color = "#27ae60";
                
                if (!isEdit) {
                    form.reset();
                } else {
                    // Redirecionar após atualização bem-sucedida
                    setTimeout(() => {
                        window.location.href = "/atletas.html";
                    }, 1500);
                }
            } else {
                statusMsg.textContent = data.error || data.message || (isEdit ? "Erro ao atualizar atleta" : "Erro ao cadastrar atleta");
                statusMsg.style.color = "#e74c3c";
                console.error("Erro ao salvar atleta:", data);
            }
        } catch (error) {
            const statusMsg = document.getElementById("statusMsg");
            statusMsg.textContent = "Erro de conexão: " + error.message;
            statusMsg.style.color = "#e74c3c";
            console.error("Erro ao fazer requisição:", error);
        }
    });
}

// ========================
// EDITAR ATLETA
// ========================

async function editAthlete(name) {
    const full = name.split(" ");
    const token = localStorage.getItem("token");

    window.location.href = `/novo-atleta.html?edit=${encodeURIComponent(name)}`;
}

// ========================
// APAGAR ATLETA
// ========================

async function deleteAthlete(name) {
    if (!confirm("Deseja excluir este atleta?")) return;

    const token = localStorage.getItem("token");

    try {
        const res = await fetch(`/api/athletes/name?name=${encodeURIComponent(name)}`, {
            method: "DELETE",
            headers: { 
                "Authorization": "Bearer " + token,
                "Content-Type": "application/json"
            }
        });

        const data = await res.json();
        
        if (res.ok) {
            loadAthletes();
        } else {
            alert("Erro ao excluir atleta: " + (data.error || data.message || "Erro desconhecido"));
            console.error("Erro ao excluir atleta:", data);
        }
    } catch (error) {
        alert("Erro de conexão ao excluir atleta: " + error.message);
        console.error("Erro ao fazer requisição:", error);
    }
}
