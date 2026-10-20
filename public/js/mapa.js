// ============================================================
// Vista 2: recorrido por el mapa
// ============================================================

const elementoLienzo = document.getElementById("mapa");
const lienzo = elementoLienzo.getContext("2d");

const fondoMapa = new Image();
fondoMapa.src = "assets/img/mokemap.png";

const nombreMascota = leerDeSesion("mascota");

if (!nombreMascota) {
    window.location.replace("index.html");
}

// Dimensiones responsivas del canvas
let anchoMapa = window.innerWidth - 20;
if (anchoMapa > ANCHO_MAXIMO_MAPA) {
    anchoMapa = ANCHO_MAXIMO_MAPA - 20;
}
const altoMapa = (anchoMapa * 600) / 800;
elementoLienzo.width = anchoMapa;
elementoLienzo.height = altoMapa;

class MokeponEnMapa {
    constructor(datos) {
        this.nombre = datos.nombre;
        this.ancho = 40;
        this.alto = 40;
        this.x = enteroAlAzar(0, anchoMapa - this.ancho);
        this.y = enteroAlAzar(0, altoMapa - this.alto);
        this.velocidadX = 0;
        this.velocidadY = 0;
        this.id = null;
        this.sprite = new Image();
        this.sprite.src = datos.mapa;
    }

    mover() {
        this.x += this.velocidadX;
        this.y += this.velocidadY;
    }

    dibujar() {
        lienzo.drawImage(this.sprite, this.x, this.y, this.ancho, this.alto);
    }
}

let miMokepon = null;
let mokeponesRivales = [];
let cicloMapa = null;
let posicionEnCurso = false;

// ------------------- Red ------------------------------------
async function prepararIdentidad() {
    // Cada pestaña obtiene su propio id al entrar al mapa,
    // así dos pestañas nunca comparten identidad aunque se dupliquen.
    const id = await pedirIdDeJugador();
    if (!id) {
        return;
    }
    guardarEnSesion("miId", id);

    try {
        await fetch(`${DIRECCION_SERVIDOR}/mascota/${id}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ mascota: nombreMascota }),
            signal: crearTiempoLimite(),
        });
    } catch (error) {
        mostrarAvisoConexion();
    }
}

async function publicarMiPosicion() {
    const id = leerDeSesion("miId");
    if (!id || posicionEnCurso) {
        return;
    }
    posicionEnCurso = true;
    try {
        const respuesta = await fetch(`${DIRECCION_SERVIDOR}/ubicacion/${id}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ x: miMokepon.x, y: miMokepon.y }),
            signal: crearTiempoLimite(),
        });
        if (!respuesta.ok) {
            return;
        }
        const { enemigos } = await respuesta.json();
        mokeponesRivales = enemigos
            .map((enemigo) => crearRival(enemigo))
            .filter((rival) => rival !== null);
    } catch (error) {
        // Sin respuesta del servidor: se avisa en pantalla y se reintenta
        mostrarAvisoConexion();
    } finally {
        posicionEnCurso = false;
    }
}

function crearRival(datos) {
    if (!datos.mascota) {
        return null;
    }
    const informacion = buscarMokepon(datos.mascota.nombre);
    if (!informacion) {
        return null;
    }
    const rival = new MokeponEnMapa(informacion);
    rival.id = datos.id;
    rival.x = datos.x;
    rival.y = datos.y;
    return rival;
}

// ------------------- Bucle del mapa -------------------------
function pasoDeJuego() {
    miMokepon.mover();

    lienzo.clearRect(0, 0, anchoMapa, altoMapa);
    lienzo.drawImage(fondoMapa, 0, 0, anchoMapa, altoMapa);
    miMokepon.dibujar();

    publicarMiPosicion();

    mokeponesRivales.forEach((rival) => {
        rival.dibujar();
        detectarChoque(rival);
    });
}

function comenzarMapa() {
    miMokepon = new MokeponEnMapa(buscarMokepon(nombreMascota));
    cicloMapa = setInterval(pasoDeJuego, INTERVALO_RED);

    prepararIdentidad();

    window.addEventListener("keydown", manejarTecla);
    window.addEventListener("keyup", detener);
}

// ------------------- Controles ------------------------------
function caminar(direccion) {
    const movimientos = {
        arriba: { x: 0, y: -VELOCIDAD_MOKEPON },
        abajo: { x: 0, y: VELOCIDAD_MOKEPON },
        izquierda: { x: -VELOCIDAD_MOKEPON, y: 0 },
        derecha: { x: VELOCIDAD_MOKEPON, y: 0 },
    };
    const movimiento = movimientos[direccion];
    if (movimiento) {
        miMokepon.velocidadX = movimiento.x;
        miMokepon.velocidadY = movimiento.y;
    }
}

function detener() {
    miMokepon.velocidadX = 0;
    miMokepon.velocidadY = 0;
}

function manejarTecla(evento) {
    const direcciones = {
        ArrowUp: "arriba",
        ArrowDown: "abajo",
        ArrowLeft: "izquierda",
        ArrowRight: "derecha",
    };
    const direccion = direcciones[evento.key];
    if (!direccion) {
        return;
    }
    // Evita que la página se desplace con las flechas
    evento.preventDefault();
    caminar(direccion);
}

// ------------------- Colisión -> combate --------------------
function detectarChoque(rival) {
    const contactoHorizontal =
        miMokepon.x <= rival.x + rival.ancho &&
        miMokepon.x + miMokepon.ancho >= rival.x;
    const contactoVertical =
        miMokepon.y <= rival.y + rival.alto &&
        miMokepon.y + miMokepon.alto >= rival.y;

    if (!contactoHorizontal || !contactoVertical) {
        return;
    }

    detener();
    clearInterval(cicloMapa);
    cicloMapa = null;

    guardarEnSesion("idRival", rival.id);
    guardarEnSesion("nombreRival", rival.nombre);
    guardarEnSesion("yendoAlCombate", true);
    window.location.href = "combate.html";
}

// Al salir del mapa (reinicio, volver atrás, cerrar o refrescar la
// pestaña) se da de baja al jugador salvo que vayamos al combate
window.addEventListener("pagehide", () => {
    if (leerDeSesion("yendoAlCombate")) {
        return;
    }
    abandonarPartida(leerDeSesion("miId"));
});

if (nombreMascota) {
    comenzarMapa();
}
