const express = require("express");
const cors = require("cors");
const crypto = require("crypto");
const path = require("path");

const PUERTO = 8080;
const app = express();

app.use(cors());
// Permite peticiones de Red Privada (por si se abre el juego desde file://)
app.use((_peticion, respuesta, siguiente) => {
  respuesta.setHeader("Access-Control-Allow-Private-Network", "true");
  siguiente();
});
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

// Registro de participantes en memoria: clave = id del jugador
const participantes = new Map();

// Un jugador sin actividad durante este tiempo se elimina solo
// (cubre pestañas cerradas de golpe o navegador crashado)
const VIDA_SIN_ACTIVIDAD = 120000;
const FRECUENCIA_REVISION = 5000;

class Participante {
  constructor(id) {
    this.id = id;
    this.mascota = null;
    this.x = 0;
    this.y = 0;
    this.ataques = [];
    this.actividad = Date.now();
  }

  refrescar() {
    this.actividad = Date.now();
  }

  elegirMascota(nombre) {
    this.mascota = { nombre };
  }

  moverA(x, y) {
    this.x = x;
    this.y = y;
  }

  guardarAtaques(lista) {
    this.ataques = lista;
  }
}

function obtenerParticipante(id) {
  return participantes.get(id) || null;
}

function listarRivales(idActual) {
  return Array.from(participantes.values()).filter(
    (otro) => otro.id !== idActual && otro.mascota !== null
  );
}

// Alta de jugador: devuelve un id único para la sesión
app.get("/unirse", (_peticion, respuesta) => {
  const id = crypto.randomUUID();
  participantes.set(id, new Participante(id));
  respuesta.set("Access-Control-Allow-Origin", "*");
  respuesta.send(id);
});

// Asigna la mascota elegida al jugador
app.post("/mascota/:jugador", (peticion, respuesta) => {
  const jugador = obtenerParticipante(peticion.params.jugador);
  if (jugador) {
    jugador.refrescar();
    jugador.elegirMascota(peticion.body.mascota || "");
  }
  respuesta.end();
});

// Recibe la posición en el mapa y responde con los rivales visibles
app.post("/ubicacion/:jugador", (peticion, respuesta) => {
  const jugador = obtenerParticipante(peticion.params.jugador);
  if (jugador) {
    jugador.refrescar();
    jugador.moverA(peticion.body.x || 0, peticion.body.y || 0);
  }
  respuesta.json({ enemigos: listarRivales(peticion.params.jugador) });
});

// Guarda los 5 ataques del jugador
app.post("/ataques/:jugador", (peticion, respuesta) => {
  const jugador = obtenerParticipante(peticion.params.jugador);
  if (jugador) {
    jugador.refrescar();
    jugador.guardarAtaques(peticion.body.ataques || []);
  }
  respuesta.end();
});

// Devuelve los ataques del jugador consultado
app.get("/ataques/:jugador", (peticion, respuesta) => {
  const jugador = obtenerParticipante(peticion.params.jugador);
  if (jugador) {
    jugador.refrescar();
  }
  respuesta.json({ ataques: jugador ? jugador.ataques : [] });
});

// Baja inmediata: al reiniciar, cerrar la pestaña o salir del mapa
app.post("/salir/:jugador", (peticion, respuesta) => {
  participantes.delete(peticion.params.jugador);
  respuesta.end();
});

// Limpieza periódica de jugadores inactivos
setInterval(() => {
  const ahora = Date.now();
  for (const [id, participante] of participantes) {
    if (ahora - participante.actividad > VIDA_SIN_ACTIVIDAD) {
      participantes.delete(id);
    }
  }
}, FRECUENCIA_REVISION);

app.listen(PUERTO, () => {
  console.log(`Servidor de Mokepon activo en http://localhost:${PUERTO}`);
});
