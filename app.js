const skeletonContainer = document.getElementById('skeleton-container');
const calendarView = document.getElementById('calendar-view');
const appTitle = document.getElementById('app-title');
const calendarGrid = document.getElementById('calendar-grid');
const monthlyList = document.getElementById('monthly-list');

let currentDates = [];

const lightColors = [
    'rgba(132, 82, 220, 0.56)',  // morado
    'rgba(45, 118, 230, 0.52)',  // azul
    'rgba(34, 190, 170, 0.48)',  // verde aqua
    'rgba(72, 185, 105, 0.44)',  // verde
    'rgba(220, 68, 88, 0.46)'    // rojo suave
];

const lightConfigs = [
    {
        selector: '.light-1',
        desktop: {
            width: [34, 50],
            height: [28, 46],
            x: [-4, 28],
            y: [-4, 28],
            scale: [0.95, 1.28],
            opacity: [0.34, 0.52],
            blur: [105, 135]
        },
        mobile: {
            width: [68, 92],
            height: [58, 86],
            x: [-6, 18],
            y: [-4, 26],
            scale: [0.95, 1.24],
            opacity: [0.36, 0.54],
            blur: [82, 110]
        },
        lastColorIndex: null
    },
    {
        selector: '.light-2',
        desktop: {
            width: [32, 48],
            height: [28, 44],
            x: [-28, 4],
            y: [-4, 30],
            scale: [0.96, 1.26],
            opacity: [0.34, 0.52],
            blur: [105, 135]
        },
        mobile: {
            width: [70, 96],
            height: [58, 88],
            x: [-22, 4],
            y: [-4, 28],
            scale: [0.95, 1.24],
            opacity: [0.36, 0.54],
            blur: [82, 110]
        },
        lastColorIndex: null
    },
    {
        selector: '.light-3',
        desktop: {
            width: [34, 54],
            height: [28, 46],
            x: [-18, 18],
            y: [-22, 8],
            scale: [0.95, 1.30],
            opacity: [0.32, 0.50],
            blur: [108, 140]
        },
        mobile: {
            width: [72, 100],
            height: [56, 88],
            x: [-14, 14],
            y: [-24, 8],
            scale: [0.95, 1.26],
            opacity: [0.34, 0.52],
            blur: [86, 115]
        },
        lastColorIndex: null
    }
];

function randomBetween(min, max, decimals = 2) {
    const value = Math.random() * (max - min) + min;
    return Number(value.toFixed(decimals));
}

function randomColorIndex(previousIndex) {
    let index = Math.floor(Math.random() * lightColors.length);

    if (lightColors.length > 1) {
        while (index === previousIndex) {
            index = Math.floor(Math.random() * lightColors.length);
        }
    }

    return index;
}

function randomRadius() {
    const values = [
        '50% 50% 50% 50%',
        '58% 42% 48% 52%',
        '44% 56% 60% 40%',
        '62% 38% 44% 56%',
        '48% 52% 38% 62%'
    ];

    return values[Math.floor(Math.random() * values.length)];
}

function getResponsiveConfig(config) {
    return window.innerWidth <= 640 ? config.mobile : config.desktop;
}

function updateBackgroundLights() {
    lightConfigs.forEach(config => {
        const light = document.querySelector(config.selector);

        if (!light) return;

        const responsiveConfig = getResponsiveConfig(config);

        const width = randomBetween(responsiveConfig.width[0], responsiveConfig.width[1]);
        const height = randomBetween(responsiveConfig.height[0], responsiveConfig.height[1]);
        const x = randomBetween(responsiveConfig.x[0], responsiveConfig.x[1]);
        const y = randomBetween(responsiveConfig.y[0], responsiveConfig.y[1]);
        const scale = randomBetween(responsiveConfig.scale[0], responsiveConfig.scale[1]);
        const opacity = randomBetween(responsiveConfig.opacity[0], responsiveConfig.opacity[1]);
        const blur = randomBetween(responsiveConfig.blur[0], responsiveConfig.blur[1], 0);
        const rotate = randomBetween(-18, 18, 0);
        const skewX = randomBetween(-4, 4, 0);
        const skewY = randomBetween(-4, 4, 0);
        const radius = randomRadius();

        const colorIndex = randomColorIndex(config.lastColorIndex);
        config.lastColorIndex = colorIndex;

        light.style.setProperty('--light-width', `${width}vw`);
        light.style.setProperty('--light-height', `${height}vw`);
        light.style.setProperty('--light-x', `${x}vw`);
        light.style.setProperty('--light-y', `${y}vh`);
        light.style.setProperty('--light-scale', scale);
        light.style.setProperty('--light-opacity', opacity);
        light.style.setProperty('--light-blur', `${blur}px`);
        light.style.setProperty('--light-color', lightColors[colorIndex]);
        light.style.setProperty('--light-radius', radius);
        light.style.setProperty('--light-rotate', `${rotate}deg`);
        light.style.setProperty('--light-skew-x', `${skewX}deg`);
        light.style.setProperty('--light-skew-y', `${skewY}deg`);
    });
}

function initBackgroundLights() {
    updateBackgroundLights();

    setInterval(() => {
        updateBackgroundLights();
    }, 6200);

    window.addEventListener('resize', () => {
        updateBackgroundLights();
    });
}

function getCurrentMonthTitle() {
    const now = new Date();

    const month = now.toLocaleDateString('es-ES', {
        month: 'long'
    });

    const year = now.getFullYear();

    return `Nuestras citas de ${month} del ${year}`;
}

function formatDate(dateString) {
    const date = new Date(dateString + 'T00:00:00');

    return date.toLocaleDateString('es-ES', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric'
    });
}

function renderCalendar() {
    calendarGrid.innerHTML = '';

    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();

    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const datesMap = {};

    currentDates.forEach(dateObj => {
        const day = parseInt(dateObj.date.split('-')[2], 10);

        if (!datesMap[day]) {
            datesMap[day] = [];
        }

        datesMap[day].push(dateObj);
    });

    for (let i = 0; i < firstDay; i++) {
        const emptyDiv = document.createElement('div');
        emptyDiv.className = 'cal-day empty';
        calendarGrid.appendChild(emptyDiv);
    }

    for (let day = 1; day <= daysInMonth; day++) {
        const dayDiv = document.createElement('div');
        dayDiv.className = 'cal-day';
        dayDiv.innerHTML = `<span class="day-num">${day}</span>`;

        if (datesMap[day]) {
            dayDiv.classList.add('has-date');

            const refs = document.createElement('div');
            refs.className = 'cal-refs';

            datesMap[day].forEach(dateObj => {
                const ref = document.createElement('span');
                ref.className = 'cal-ref';
                ref.textContent = dateObj.ref;
                refs.appendChild(ref);
            });

            dayDiv.appendChild(refs);
        }

        calendarGrid.appendChild(dayDiv);
    }
}

function renderMonthlyList() {
    if (!currentDates.length) {
        monthlyList.innerHTML = `
            <div class="empty-state">
                No hay citas registradas para este mes.
            </div>
        `;
        return;
    }

    monthlyList.innerHTML = currentDates.map(dateObj => {
        const description = dateObj.description
            ? `<p>${dateObj.description}</p>`
            : '';

        const budget = dateObj.budget
            ? `<div class="budget">Presupuesto: $${dateObj.budget}</div>`
            : '';

        return `
            <article class="date-item">
                <span class="ref-circle">${dateObj.ref}</span>

                <div class="date-info">
                    <h3>${dateObj.title}</h3>
                    <div class="date-meta">${formatDate(dateObj.date)}</div>
                    ${description}
                    ${budget}
                </div>
            </article>
        `;
    }).join('');
}

async function init() {
    initBackgroundLights();

    appTitle.textContent = getCurrentMonthTitle();

    const minWait = new Promise(resolve => setTimeout(resolve, 1500));

    const fetchData = fetch('./dates.json')
        .then(res => res.json())
        .catch(() => []);

    const [_, data] = await Promise.all([minWait, fetchData]);

    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();

    currentDates = data
        .filter(dateObj => {
            const [year, month] = dateObj.date.split('-');

            return (
                parseInt(year, 10) === currentYear &&
                parseInt(month, 10) === currentMonth
            );
        })
        .sort((a, b) => a.date.localeCompare(b.date))
        .map((dateObj, index) => ({
            ...dateObj,
            ref: index + 1
        }));

    skeletonContainer.classList.remove('active');
    calendarView.classList.add('active');

    renderCalendar();
    renderMonthlyList();
}

init();