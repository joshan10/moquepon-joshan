// ============================================================
// Vista 1: selección de mascota
// ============================================================

const listaMascotas = document.getElementById("lista-mascotas");
const botonElegirMascota = document.getElementById("btn-mascota");

function pintarTarjetas() {
    CATALOGO_MOKEPONES.forEach((mokepon) => {
        listaMascotas.innerHTML += `
            <input type="radio" name="mascota" id="${mokepon.nombre}" />
            <label class="tarjeta-mokepon" for="${mokepon.nombre}">
                <p>${mokepon.nombre}</p>
                <img src="${mokepon.tarjeta}" alt="${mokepon.nombre}">
            </label>
        `;
    });
}

function mascotaMarcada() {
    return CATALOGO_MOKEPONES.find(
        (mokepon) => document.getElementById(mokepon.nombre).checked
    ) || null;
}

function pasarAlMapa() {
    const elegida = mascotaMarcada();
    if (!elegida) {
        alert("No has seleccionado ninguna mascota");
        return;
    }

    guardarEnSesion("mascota", elegida.nombre);
    window.location.href = "mapa.html";
}

function prepararVista() {
    pintarTarjetas();
    botonElegirMascota.addEventListener("click", pasarAlMapa);
}

prepararVista();
