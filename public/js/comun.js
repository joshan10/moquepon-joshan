// ============================================================
// Elementos compartidos por las tres vistas del juego
// ============================================================

const DIRECCION_SERVIDOR = "http://localhost:8080";
const INTERVALO_RED = 50;
const VELOCIDAD_MOKEPON = 5;
const ANCHO_MAXIMO_MAPA = 350;

const EMOJI_ATAQUE = { FUEGO: "🔥", AGUA: "💧", TIERRA: "🌱" };

const CATALOGO_MOKEPONES = [
    {
        nombre: "Hipodoge",
        tarjeta: "assets/img/hipodoge.png",
        mapa: "assets/img/hipodoge-avatar.png",
        ataques: ["AGUA", "AGUA", "AGUA", "FUEGO", "TIERRA"],
    },
    {
        nombre: "Capipepo",
        tarjeta: "assets/img/capipepo.png",
        mapa: "assets/img/capipepo-avatar.png",
        ataques: ["TIERRA", "TIERRA", "TIERRA", "AGUA", "FUEGO"],
    },
    {
        nombre: "Ratigueya",
        tarjeta: "assets/img/ratigueya.png",
        mapa: "assets/img/ratigueya-avatar.png",
        ataques: ["FUEGO", "FUEGO", "FUEGO", "AGUA", "TIERRA"],
    },
];

// ------------------- Utilidades -----------------------------
function buscarMokepon(nombre) {
    return CATALOGO_MOKEPONES.find((mokepon) => mokepon.nombre === nombre) || null;
}

function enteroAlAzar(minimo, maximo) {
    return Math.floor(Math.random() * (maximo - minimo + 1) + minimo);
}

// ------------------- Sesión entre páginas -------------------
function guardarEnSesion(clave, valor) {
    sessionStorage.setItem(clave, JSON.stringify(valor));
}

function leerDeSesion(clave, respaldo = null) {
    const guardado = sessionStorage.getItem(clave);
    if (guardado === null) {
        return respaldo;
    }
    try {
        return JSON.parse(guardado);
    } catch (error) {
        return respaldo;
    }
}

function vaciarSesion() {
    sessionStorage.clear();
}

// ------------------- Red ------------------------------------
const TIEMPO_LIMITE_PETICION = 4000;

function crearTiempoLimite() {
    if (typeof AbortSignal !== "undefined" && AbortSignal.timeout) {
        return AbortSignal.timeout(TIEMPO_LIMITE_PETICION);
    }
    return undefined;
}

function mostrarAvisoConexion() {
    if (document.getElementById("aviso-conexion")) {
        return;
    }
    const aviso = document.createElement("div");
    aviso.id = "aviso-conexion";
    aviso.innerHTML =
        '⚠ Sin respuesta del servidor en <b>localhost:8080</b>. ' +
        "Comprueba que esté corriendo con <code>npm start</code> " +
        "(para detenerlo usa <b>Ctrl+C</b>, nunca <b>Ctrl+Z</b>: eso lo deja suspendido y el juego deja de responder). " +
        "<u>Haz clic para cerrar</u>.";
    aviso.addEventListener("click", () => aviso.remove());
    document.body.prepend(aviso);
}

async function pedirIdDeJugador() {
    try {
        const respuesta = await fetch(`${DIRECCION_SERVIDOR}/unirse`, {
            signal: crearTiempoLimite(),
        });
        if (respuesta.ok) {
            return await respuesta.text();
        }
    } catch (error) {
        console.error("No hay respuesta del servidor", error);
    }
    mostrarAvisoConexion();
    return null;
}

// Da de baja al jugador para que no quede como fantasma en el mapa
function abandonarPartida(id) {
    if (!id) {
        return;
    }
    if (navigator.sendBeacon) {
        navigator.sendBeacon(`${DIRECCION_SERVIDOR}/salir/${id}`);
        return;
    }
    fetch(`${DIRECCION_SERVIDOR}/salir/${id}`, { method: "POST" }).catch(() => {});
}
