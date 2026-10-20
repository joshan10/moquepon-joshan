// ============================================================
// Vista 3: combate de ataques
// ============================================================

const idJugador = leerDeSesion("miId");
const mascotaPropia = leerDeSesion("mascota");
const idRival = leerDeSesion("idRival");
const nombreRival = leerDeSesion("nombreRival");

const listaAtaques = document.getElementById("lista-ataques");
const textoResultado = document.getElementById("texto-resultado");
const marcadorPropio = document.getElementById("marcador-propio");
const marcadorRival = document.getElementById("marcador-rival");
const historialJugador = document.getElementById("historial-jugador");
const historialEnemigo = document.getElementById("historial-enemigo");
const nombreJugador = document.getElementById("nombre-jugador");
const nombreEnemigo = document.getElementById("nombre-enemigo");
const botonReiniciar = document.getElementById("btn-reiniciar");
const zonaReiniciar = document.getElementById("zona-reiniciar");

let misAtaques = [];
let ataquesRivales = [];
let misVictorias = 0;
let victoriasRivales = 0;
let cicloSincronizacion = null;

// ------------------- Preparación ----------------------------
function pintarBotonesDeAtaque() {
    const informacion = buscarMokepon(mascotaPropia);
    informacion.ataques.forEach((tipo) => {
        listaAtaques.innerHTML += `
            <button class="boton-ataque ataque-${tipo.toLowerCase()}" data-tipo="${tipo}">
                ${EMOJI_ATAQUE[tipo]}
            </button>
        `;
    });

    document.querySelectorAll(".boton-ataque").forEach((boton) => {
        boton.addEventListener("click", () => elegirAtaque(boton));
    });
}

function prepararCombate() {
    guardarEnSesion("yendoAlCombate", false);
    nombreJugador.innerHTML = mascotaPropia;
    nombreEnemigo.innerHTML = nombreRival;
    pintarBotonesDeAtaque();
    botonReiniciar.addEventListener("click", reiniciarPartida);
}

// ------------------- Selección de ataques -------------------
function elegirAtaque(boton) {
    if (boton.disabled) {
        return;
    }

    misAtaques.push(boton.dataset.tipo);
    boton.disabled = true;
    boton.classList.add("usado");

    if (misAtaques.length === 5) {
        enviarAtaquesYEsperar();
    }
}

// ------------------- Red ------------------------------------
async function enviarAtaquesYEsperar() {
    try {
        await fetch(`${DIRECCION_SERVIDOR}/ataques/${idJugador}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ ataques: misAtaques }),
            signal: crearTiempoLimite(),
        });
    } catch (error) {
        mostrarAvisoConexion();
    }
    cicloSincronizacion = setInterval(preguntarAtaquesDelRival, INTERVALO_RED);
}

let consultaEnCurso = false;

async function preguntarAtaquesDelRival() {
    if (consultaEnCurso) {
        return;
    }
    consultaEnCurso = true;
    try {
        const respuesta = await fetch(`${DIRECCION_SERVIDOR}/ataques/${idRival}`, {
            signal: crearTiempoLimite(),
        });
        if (!respuesta.ok) {
            return;
        }
        const { ataques } = await respuesta.json();
        if (ataques.length === 5) {
            clearInterval(cicloSincronizacion);
            ataquesRivales = ataques;
            resolverCombate();
        }
    } catch (error) {
        // Sin respuesta: se avisa en pantalla y se reintenta en el siguiente ciclo
        mostrarAvisoConexion();
    } finally {
        consultaEnCurso = false;
    }
}

// ------------------- Resolución -----------------------------
function esFavorable(mio, suyo) {
    return (
        (mio === "FUEGO" && suyo === "TIERRA") ||
        (mio === "AGUA" && suyo === "FUEGO") ||
        (mio === "TIERRA" && suyo === "AGUA")
    );
}

function resolverCombate() {
    for (let ronda = 0; ronda < 5; ronda++) {
        const mio = misAtaques[ronda];
        const suyo = ataquesRivales[ronda];

        anotarEnHistorial(mio, suyo);

        if (mio === suyo) {
            textoResultado.innerHTML = "EMPATE";
        } else if (esFavorable(mio, suyo)) {
            misVictorias++;
            marcadorPropio.innerHTML = misVictorias;
            textoResultado.innerHTML = "GANASTE";
        } else {
            victoriasRivales++;
            marcadorRival.innerHTML = victoriasRivales;
            textoResultado.innerHTML = "PERDISTE";
        }
    }
    anunciarDesenlace();
}

function anotarEnHistorial(mio, suyo) {
    const filaPropia = document.createElement("p");
    filaPropia.innerHTML = EMOJI_ATAQUE[mio];
    historialJugador.appendChild(filaPropia);

    const filaRival = document.createElement("p");
    filaRival.innerHTML = EMOJI_ATAQUE[suyo];
    historialEnemigo.appendChild(filaRival);
}

function anunciarDesenlace() {
    if (misVictorias === victoriasRivales) {
        textoResultado.innerHTML = "Esto fue un empate";
    } else if (misVictorias > victoriasRivales) {
        textoResultado.innerHTML = "FELICIDADES! Ganaste 😎";
    } else {
        textoResultado.innerHTML = "Lo siento, perdiste 😢";
    }
    zonaReiniciar.hidden = false;
}

function reiniciarPartida() {
    abandonarPartida(idJugador);
    vaciarSesion();
    window.location.href = "index.html";
}

// Cerrar o salir del combate sin reiniciar también da de baja
window.addEventListener("pagehide", () => {
    abandonarPartida(idJugador);
});

// ------------------- Arranque -------------------------------
if (!mascotaPropia || !idRival) {
    window.location.replace("index.html");
} else {
    prepararCombate();
}
