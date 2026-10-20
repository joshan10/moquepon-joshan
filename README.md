# 🎮 Mokepon

Juego web multijugador de batalla de mascotas elementales. Cada jugador elige uno de tres Mokepones, lo mueve por un mapa en tiempo real y combate contra otros jugadores con ataques de fuego, agua y tierra.

Hecho con HTML5, CSS3, JavaScript vanilla (DOM + Canvas) y un backend en Node.js con Express.

---

## 🎓 Certificado

[Ver certificado de Programación Básica (Joshan Pereira)](./certificado-platzi.pdf)

---

## 🚀 Cómo ejecutar

```bash
npm install
npm start
```

Luego abre **http://localhost:8080** en tu navegador.

> Necesitas Node.js instalado. El servidor corre en el puerto `8080`.
>
> ⚠ **Para detener el servidor usa `Ctrl+C`.** Si presionas `Ctrl+Z` el proceso queda *suspendido*: el puerto sigue abierto pero no responde, el juego no verá a los demás jugadores y aparecerá un aviso naranja en pantalla avisando de la falta de conexión.

---

## 🕹️ Cómo jugar

1. **Elige tu mascota**: Hipodoge (agua), Capipepo (tierra) o Ratigueya (fuego).
2. **Explora el mapa**: muévete con las flechas del teclado o los botones en pantalla (en celular, usa los botones táctiles).
3. **Encuentra un rival**: al tocar a otro Mokepon en el mapa comienza el combate.
4. **Selecciona 5 ataques**: cada Mokepon tiene 5 ataques (3 de su elemento principal y 2 adicionales). El juego los sincroniza con tu oponente.
5. **Gana las rondas**: fuego vence a tierra, tierra vence a agua, agua vence a fuego. Empates cuando ambos usan el mismo elemento. El que gane más rondas gana el combate.

---

## 📱 Jugar entre celular y PC (misma red Wi-Fi)

El frontend usa `http://localhost:8080` por defecto, lo que solo funciona en la misma máquina. Para jugar desde otro dispositivo:

1. Obtén la **IPv4** de tu computadora:
   - **Windows**: ejecuta `ipconfig` en la terminal y busca *Dirección IPv4*.
   - **Linux/Mac**: ejecuta `ip addr` o `ifconfig`.
2. Abre `public/js/script.js` y reemplaza la constante del inicio del archivo:
   ```javascript
   const DIRECCION_SERVIDOR = "http://TU_IPV4:8080";
   ```
3. Inicia el servidor con `npm start` y entra desde ambos dispositivos a `http://TU_IPV4:8080`.

---

## 📁 Estructura del proyecto

```text
moquepon-joshan/
├── servidor.js              # Backend: API REST y archivos estáticos
├── package.json             # Dependencias y scripts
├── certificado-platzi.pdf   # Certificado del curso
├── .gitignore
└── public/
    ├── index.html           # Vista 1: selección de mascota
    ├── mapa.html            # Vista 2: recorrido por el mapa (Canvas)
    ├── combate.html         # Vista 3: batalla de ataques
    ├── styles.css           # Diseño responsivo (tema cálido)
    ├── js/
    │   ├── comun.js         # Configuración, sesión y catálogo compartidos
    │   ├── seleccion.js     # Lógica de la vista 1
    │   ├── mapa.js          # Lógica de la vista 2
    │   └── combate.js       # Lógica de la vista 3
    └── assets/
        └── img/             # Sprites de los Mokepones y fondo del mapa
```

El avance entre pantallas se guarda en `sessionStorage`, así que al chocar con un rival en el mapa pasas al combate y al reiniciar vuelves a la selección con una partida nueva.

---

## 🔌 Endpoints del servidor

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/unirse` | Registra un jugador y devuelve su id |
| POST | `/mascota/:jugador` | Asigna la mascota elegida |
| POST | `/ubicacion/:jugador` | Actualiza la posición y devuelve los rivales visibles |
| POST | `/ataques/:jugador` | Guarda los 5 ataques del jugador |
| GET | `/ataques/:jugador` | Consulta los ataques de un jugador (para sincronizar el combate) |
| POST | `/salir/:jugador` | Da de baja al jugador para que no quede como fantasma en el mapa |

Los jugadores sin actividad durante 2 minutos se eliminan automáticamente del servidor.
