const phrases = [
    "De los escombros se construyen ciudades",
    "No te defraudes a ti mismo",
    "Sedo ante mi Ocaso",
    "Todos tenemos intenciones en nuestras acciones",
    "Divide y vencerás",
    "... no olvides tu látigo",
    "No le agradezcas a Asclepio",
    "Tus emociones conectan tu mente con tu cuerpo",
    "Los parásitos tienen hapetito por ti",
    "Canta al son de Memphis May Fire con alegría"
];

let phraseIndex = 0;

function calculateDaysSince(dateString) {
    const startDate = new Date(dateString);
    const today = new Date();

    startDate.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);

    const diffTime = today - startDate;
    return Math.floor(diffTime / (1000 * 60 * 60 * 24));
}

function updateContent() {
    const phraseEl = document.getElementById("phrase");
    const counterEl = document.getElementById("counter");

    phraseEl.classList.remove("fade");
    void phraseEl.offsetWidth;
    phraseEl.classList.add("fade");
    phraseEl.textContent = phrases[phraseIndex];

    const days = calculateDaysSince("2025-03-21");
    counterEl.textContent = `${days} día${days !== 1 ? "s" : ""}`;

    phraseIndex = (phraseIndex + 1) % phrases.length;
}

updateContent();

setInterval(updateContent, 7000);

const style = document.createElement("style");
style.innerHTML = `
    #phrase.fade {
        animation: fadePhrase 0.8s ease-in-out;
    }
    @keyframes fadePhrase {
        0% { opacity: 0; transform: translateY(20px); }
        100% { opacity: 1; transform: translateY(0); }
    }
`;
document.head.appendChild(style);
