const phrases = [
    "You are stronger than you think.",
    "Every setback is a setup for a comeback.",
    "Discipline is choosing between what you want now and what you want most.",
    "Your future self is watching you through memories. Make them proud.",
    "The pain you feel today will be the strength you feel tomorrow.",
    "You don’t have to be extreme, just consistent.",
    "Small steps every day lead to big results.",
    "Storms make trees take deeper roots.",
    "You are becoming the best version of yourself.",
    "Push yourself, no one else is going to do it for you."
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
