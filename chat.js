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
  { from: "left", author: "Luis ❤️", text: "Recuerdas el examen de la UTP?" },
  { from: "right", author: "Tú", text: "No me lo recuerdes..." },
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

// Render logic
const container = document.getElementById("chat-container");
const typing = document.getElementById("typing-indicator");

async function addMessage(msg) {
  if (msg.from === "center") {
    const notice = document.createElement("div");
    notice.classList.add("encrypted-notice");
    notice.innerText = msg.text;
    container.appendChild(notice);
    container.scrollTop = container.scrollHeight;
    await new Promise(res => setTimeout(res, 700));
    return;
  }

  typing.style.display = "flex";
  await new Promise(res => setTimeout(res, 1500 + Math.random() * 2000));
  typing.style.display = "none";

  const bubble = document.createElement("div");
  bubble.classList.add("bubble", msg.from);

  bubble.innerHTML = `
    ${msg.author ? `<div class="author">${msg.author}</div>` : ""}
    <div class="text">${msg.text}</div>
  `;

  container.appendChild(bubble);
  container.scrollTop = container.scrollHeight;
  await new Promise(res => setTimeout(res, 200));
}

async function playChat() {
  for (const msg of chat) {
    await addMessage(msg);
  }
}

playChat();
