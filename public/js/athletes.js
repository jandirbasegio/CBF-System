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

    data.forEach(a => {
        const li = document.createElement("li");
        li.innerHTML = `
            <strong>${a.first_name} ${a.last_name}</strong>  
            (${a.nationality ?? "?"})
            <button onclick="editAthlete('${a.first_name} ${a.last_name}')">Editar</button>
            <button onclick="deleteAthlete('${a.first_name} ${a.last_name}')">Excluir</button>
        `;
        list.appendChild(li);
    });
}

document.getElementById("btnSearch")?.addEventListener("click", () => {
    const name = document.getElementById("searchAthlete").value;
    loadAthletes(name);
});

// ========================
// CRIAR ATLETA
// ========================

const form = document.getElementById("formAtleta");
if (form) {
    form.addEventListener("submit", async (e) => {
        e.preventDefault();

        const token = localStorage.getItem("token");

        const body = {
            first_name: document.getElementById("first_name").value,
            last_name: document.getElementById("last_name").value,
            date_of_birth: document.getElementById("date_of_birth").value,
            nationality: document.getElementById("nationality").value,
            gender: document.getElementById("gender").value,
            id_document: document.getElementById("id_document").value
        };

        const res = await fetch("/api/athletes", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: "Bearer " + token
            },
            body: JSON.stringify(body)
        });

        const data = await res.json();
        document.getElementById("statusMsg").textContent = data.message;
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

    const res = await fetch(`/api/athletes/${encodeURIComponent(name)}`, {
        method: "DELETE",
        headers: { Authorization: "Bearer " + token }
    });

    loadAthletes();
}
