const chat = [
  // --- OCTUBRE: El inicio y el "Señor Luis" ---
  { from: "center", type: "system", text: "Esta es una conversación recreada para recordar algunos momentos lindos de nuestro 2025." },
  { from: "left", author: "Luis ❤️", text: "[Sticker indecente de Patricio]" },
  { from: "left", author: "Luis ❤️", text: "Oh, ese no era" },
  { from: "left", author: "Luis ❤️", text: "Patricio equivocado 🤦‍♂️" },
  { from: "right", author: "Tú", text: "JAJAJAJAJA qué manera de presentarse 😂" },
  { from: "right", author: "Tú", text: "Póngase a trabajar, Señor Luis" },
  { from: "left", author: "Luis ❤️", text: "Aysh, okay..." },
  { from: "left", author: "Luis ❤️", text: "Sabes..." },
  { from: "right", author: "Tú", text: "Dime" },

  { from: "left", author: "Luis ❤️", text: "Aún me acuerdo de cuando te vi en la obra... con las luces bajas y tu boquita pintadita ❤️" },
  { from: "left", author: "Luis ❤️", text: "Me costó un mundo no besarte ahí mismo" },
  { from: "right", author: "Tú", text: "Jajaja yo sabía que querías. Tus ojos te delataban 👀❤️" },
  { from: "left", author: "Luis ❤️", text: "Jsjsjs" },
  { from: "left", author: "Luis ❤️", text: "Tal vez" },
  { from: "right", author: "Tú", text: "Yo recuerdo el viaje a Coronado" },
  { from: "left", author: "Luis ❤️", text: "Ah si?" },
  { from: "right", author: "Tú", text: "Si" },
  { from: "right", author: "Tú", text: "Ya estabas cansado de mi 😭" },
  { from: "left", author: "Luis ❤️", text: "CLARO QUE NOOOO!!!" },
  { from: "left", author: "Luis ❤️", text: "Deja tu vainaaaa" },
  { from: "right", author: "Tú", text: "Jajajaja" },
  { from: "right", author: "Tú", text: "Fue muy lindo" },
  { from: "left", author: "Luis ❤️", text: "La pasé increíble" },
  { from: "left", author: "Luis ❤️", text: "Pude ver tu hermosa carita por la mañana" },
  { from: "right", author: "Tú", text: "Me gustó mucho acurrucarnos" },
  { from: "right", author: "Tú", text: "Me haces sentir segura" },
  { from: "left", author: "Luis ❤️", text: "Y tú a mi ❤️" },
  { from: "right", author: "Tú", text: "También me acuerdo de esa vez en Wimpys" },
  { from: "right", author: "Tú", text: "Que te chupaste el dedo JAJAJAJAJAJA" },
  { from: "left", author: "Luis ❤️", text: "JAJAJAJAJA noooo" },
  { from: "left", author: "Luis ❤️", text: "Cuanta clase la mía..." },
  { from: "right", author: "Tú", text: "Jajaja" },
  { from: "right", author: "Tú", text: "Pero fue lindo en parte" },
  { from: "left", author: "Luis ❤️", text: "Si?" },
  { from: "left", author: "Luis ❤️", text: "Yooo... recuerdo nuestra ida al cine" },
  { from: "left", author: "Luis ❤️", text: "Y cómo me dabas las cotufas en la boca 🥹" },
  { from: "right", author: "Tú", text: "Jajaja" },
  { from: "right", author: "Tú", text: "No segusite viendo el ánime" },
  { from: "left", author: "Luis ❤️", text: "Lo haré! A penas encuentre donde..." },
  { from: "right", author: "Tú", text: "Hmmm" },
  { from: "left", author: "Luis ❤️", text: "Oooohhh y nuestras caminatas juntos" },
  { from: "left", author: "Luis ❤️", text: "Por Multiplaza, Amador o Cinta Costera" },
  { from: "right", author: "Tú", text: "JAJAJAJA el mapache con los bracitoooos" },
  { from: "right", author: "Tú", text: "Qué lindoooooo" },
  { from: "left", author: "Luis ❤️", text: "JAJAJAJAJA siiiii" },
  { from: "left", author: "Luis ❤️", text: "Espero que esté bien" },
  { from: "right", author: "Tú", text: "Yo también" },
  { from: "left", author: "Luis ❤️", text: "Recuerdas nuestros besos en el carro?" },
  { from: "right", author: "Tú", text: "Cuál de todos?" },
  { from: "left", author: "Luis ❤️", text: "No me olvido de ninguno 👀" },
  { from: "left", author: "Luis ❤️", text: "Mmmm, en Amador, estacionamos en una rotonda" },
  { from: "left", author: "Luis ❤️", text: "Con los vidrios empañados, me acostaba en tus muslos y te regalé la pulsera" },
  { from: "right", author: "Tú", text: "Ay siii" },
  { from: "right", author: "Tú", text: "La guardo para un momento especial" },
  { from: "right", author: "Tú", text: "Estábamos escuchando a Damiano" },
  { from: "left", author: "Luis ❤️", text: "Chi" },
  { from: "left", author: "Luis ❤️", text: "Hiciste que le agarrara gusto" },
  { from: "right", author: "Tú", text: "Chi" },
  { from: "right", author: "Tú", text: "Qué buenooo" },
  { from: "left", author: "Luis ❤️", text: "Jajaja" },
  { from: "right", author: "Tú", text: "Estoy formando a mi hombre" },
  { from: "left", author: "Luis ❤️", text: "Ayyyy 😂" },
  { from: "left", author: "Luis ❤️", text: "Toy" },
  { from: "right", author: "Tú", text: "No tienes opción" },
  { from: "left", author: "Luis ❤️", text: "A bueno" },
  { from: "left", author: "Luis ❤️", text: "Sin quejas" },
  { from: "left", author: "Luis ❤️", text: "Mmmm" },
  { from: "right", author: "Tú", text: "Qué pashó?" },
  { from: "left", author: "Luis ❤️", text: "Eestoy recordando lo linda que te vaías poniendo los juguetes en la mesa y pintando las caritas de los niños" },
  { from: "right", author: "Tú", text: "Jajaja ay noo qué penaaaa" },
  { from: "left", author: "Luis ❤️", text: "Pero lo hiciste bien!!!" },
  { from: "right", author: "Tú", text: "Fue lindo" },
  { from: "left", author: "Luis ❤️", text: "Si" },
  { from: "left", author: "Luis ❤️", text: "Principalmente porque fue contigo" },
  { from: "right", author: "Tú", text: "Me vas a agradecer de nuevo?" },
  { from: "left", author: "Luis ❤️", text: "No... ya te tengo harta con eso" },
  { from: "right", author: "Tú", text: "Si" },
  { from: "right", author: "Tú", text: "😂😂😂" },
  { from: "left", author: "Luis ❤️", text: "Jsjsjs" },
  { from: "left", author: "Luis ❤️", text: "Ohhh" },
  { from: "left", author: "Luis ❤️", text: "Recuerdas el examen de la UTP?" },
  { from: "right", author: "Tú", text: "No y no quiero..." },
  { from: "right", author: "Tú", text: "Jajaja" },
  { from: "right", author: "Tú", text: "Fue muy lindo que me apoyaras en eso" },
  { from: "left", author: "Luis ❤️", text: "Quiero apoyarte en todo mi vida" },
  { from: "left", author: "Luis ❤️", text: "Eres un orgullo para mi" },
  { from: "right", author: "Tú", text: "Yo también estoy orgullosa de ti y de lo que has logrado" },
  { from: "left", author: "Luis ❤️", text: "Quiero que construllamos nuestro futuro juntos este 2026" },
  { from: "right", author: "Tú", text: "Yo igual" },

  { from: "left", author: "Luis ❤️", text: "Eres todo lo que siempre he querido, Selenys" },
  { from: "left", author: "Luis ❤️", text: "Ha sido una muy linda aventura y un lindo capítulo que quiero que se siga escribiendo" },
  { from: "left", author: "Luis ❤️", text: "Quiero que nuestra historia sea de esos libros que nunca terminan" },
  { from: "right", author: "Tú", text: "Te amo tanto, gracias por ser mi mejor aventura y mi lugar seguro 🥹❤️" },

  { from: "left", author: "Luis ❤️", text: "Feliz año nuevo, amor mío" },
  { from: "left", author: "Luis ❤️", text: "Y que sean muchos más" },
  { from: "right", author: "Tú", text: "Feliz año nuevo mi amor. Te amo ❤️" },
  { from: "left", author: "Luis ❤️", text: "Te amo ❤️" },
];

// Configuración de la fecha objetivo
const targetDate = new Date('January 01, 2026 0:00:00').getTime();

// Elementos del DOM
const container = document.getElementById("chat-container");
const typing = document.getElementById("typing-indicator");
const timerDisplay = document.getElementById("timer");
const countdownScreen = document.getElementById("countdown-container");
const header = document.getElementById("main-header");

function updateTimer() {
    const now = new Date().getTime();
    const distance = targetDate - now;

    if (distance <= 0) {
        startStory();
        return;
    }

    const days = Math.floor(distance / (1000 * 60 * 60 * 24));
    const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((distance % (1000 * 60)) / 1000);

    timerDisplay.innerText = 
        (days > 0 ? days + "d " : "") + 
        String(hours).padStart(2, '0') + ":" + 
        String(minutes).padStart(2, '0') + ":" + 
        String(seconds).padStart(2, '0');

    setTimeout(updateTimer, 1000);
}

function startStory() {
    countdownScreen.style.display = "none";
    header.style.display = "flex";
    container.style.display = "flex";
    playChat();
}

async function addMessage(msg) {
  // Manejo de mensajes de sistema y fechas
  if (msg.from === "center") {
    const div = document.createElement("div");
    if (msg.type === "date") {
      div.className = "date-separator";
      div.innerHTML = `<span>${msg.text}</span>`;
    } else {
      div.className = "encrypted-notice";
      div.innerText = msg.text;
    }
    container.appendChild(div);
    container.scrollTop = container.scrollHeight;
    await new Promise(res => setTimeout(res, 1000));
    return;
  }

  // Indicador de escribiendo
  typing.style.display = "flex";
  // Tiempo de escritura variable según el largo del texto
  const typingTime = Math.min(Math.max(msg.text.length * 50, 1500), 4000);
  await new Promise(res => setTimeout(res, typingTime));
  typing.style.display = "none";

  // Burbuja de mensaje
  const bubble = document.createElement("div");
  bubble.classList.add("bubble", msg.from);
  bubble.innerHTML = `
    ${msg.author ? `<div class="author">${msg.author}</div>` : ""}
    <div class="text">${msg.text}</div>
  `;

  container.appendChild(bubble);
  container.scrollTop = container.scrollHeight;
  await new Promise(res => setTimeout(res, 500));
}

async function playChat() {
    for (const msg of chat) {
        await addMessage(msg);
    }
}

// Iniciar contador
updateTimer();