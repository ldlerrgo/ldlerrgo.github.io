const g2kContainer = document.getElementById('g2k-tiles');
const g2kOver = document.getElementById('g2k-over');
let g2kGrid = Array(16).fill(null);
let isMoving = false;

function initG2k() {
    g2kContainer.innerHTML = '';
    g2kGrid = Array(16).fill(null);
    g2kOver.classList.remove('show');
    isMoving = false;
    addRandomTile();
    addRandomTile();
}

function addRandomTile() {
    const emptyCells = g2kGrid.map((val, i) => val === null ? i : null).filter(i => i !== null);
    if (emptyCells.length > 0) {
        const idx = emptyCells[Math.floor(Math.random() * emptyCells.length)];
        const val = Math.random() < 0.9 ? 2 : 4;
        const tileEl = document.createElement('div');
        tileEl.className = `g2k-tile g2k-t-${val} g2k-new`;
        tileEl.textContent = val;
        
        const tileObj = { element: tileEl, value: val, merged: false };
        g2kGrid[idx] = tileObj;
        
        updatePosition(tileObj, idx);
        g2kContainer.appendChild(tileEl);
        
        setTimeout(() => tileEl.classList.remove('g2k-new'), 300);
    }
}

function updatePosition(tile, idx) {
    const x = (idx % 4) * 77.5;
    const y = Math.floor(idx / 4) * 77.5;
    tile.element.style.setProperty('--tx', `${x}px`);
    tile.element.style.setProperty('--ty', `${y}px`);
    tile.element.style.transform = `translate(${x}px, ${y}px)`;
}

function move(direction) {
    if (g2kOver.classList.contains('show') || isMoving) return;
    
    let hasChanged = false;
    const isVertical = direction === 'UP' || direction === 'DOWN';
    const isReverse = direction === 'RIGHT' || direction === 'DOWN';

    g2kGrid.forEach(t => { if (t) t.merged = false; });

    const getIdx = (row, col) => isVertical ? (col * 4 + row) : (row * 4 + col);

    for (let i = 0; i < 4; i++) {
        let line = [];
        for (let j = 0; j < 4; j++) {
            line.push(getIdx(i, j));
        }
        if (isReverse) line.reverse();

        for (let j = 1; j < 4; j++) {
            let currentIdx = line[j];
            if (!g2kGrid[currentIdx]) continue;

            let tile = g2kGrid[currentIdx];
            let targetIdx = null;
            let mergeIdx = null;

            for (let k = j - 1; k >= 0; k--) {
                let prevIdx = line[k];
                if (!g2kGrid[prevIdx]) {
                    targetIdx = prevIdx;
                } else if (g2kGrid[prevIdx].value === tile.value && !g2kGrid[prevIdx].merged) {
                    mergeIdx = prevIdx;
                    break;
                } else {
                    break;
                }
            }

            if (mergeIdx !== null) {
                isMoving = true;
                const targetTile = g2kGrid[mergeIdx];
                const oldVal = tile.value;
                const newVal = oldVal * 2;

                g2kGrid[currentIdx] = null;
                updatePosition(tile, mergeIdx);
                
                targetTile.merged = true;
                targetTile.value = newVal;

                setTimeout(() => {
                    tile.element.remove();
                    targetTile.element.textContent = newVal;
                    targetTile.element.className = `g2k-tile g2k-t-${newVal} g2k-merged`;
                    setTimeout(() => targetTile.element.classList.remove('g2k-merged'), 200);
                }, 150);

                hasChanged = true;
            } else if (targetIdx !== null) {
                isMoving = true;
                g2kGrid[targetIdx] = tile;
                g2kGrid[currentIdx] = null;
                updatePosition(tile, targetIdx);
                hasChanged = true;
            }
        }
    }

    if (hasChanged) {
        setTimeout(() => {
            addRandomTile();
            isMoving = false;
            if (isGameOver()) g2kOver.classList.add('show');
        }, 200);
    }
}

function isGameOver() {
    if (g2kGrid.includes(null)) return false;
    for (let i = 0; i < 16; i++) {
        const v = g2kGrid[i].value;
        if (i % 4 < 3 && g2kGrid[i + 1] && g2kGrid[i + 1].value === v) return false;
        if (i < 12 && g2kGrid[i + 4] && g2kGrid[i + 4].value === v) return false;
    }
    return true;
}

window.onkeydown = e => {
    if (e.key.includes('Arrow')) {
        e.preventDefault();
        move(e.key.replace('Arrow', '').toUpperCase());
    }
};

initG2k();

let touchStartX = 0;
let touchStartY = 0;
let touchEndX = 0;
let touchEndY = 0;

g2kContainer.parentElement.addEventListener('touchstart', function(e) {
    touchStartX = e.changedTouches[0].screenX;
    touchStartY = e.changedTouches[0].screenY;
}, {passive: true});

g2kContainer.parentElement.addEventListener('touchend', function(e) {
    touchEndX = e.changedTouches[0].screenX;
    touchEndY = e.changedTouches[0].screenY;
    handleSwipe();
}, {passive: true});

function handleSwipe() {
    const dx = touchEndX - touchStartX;
    const dy = touchEndY - touchStartY;
    const absDx = Math.abs(dx);
    const absDy = Math.abs(dy);

    if (Math.max(absDx, absDy) > 30) {
        if (absDx > absDy) {
            move(dx > 0 ? 'RIGHT' : 'LEFT');
        } else {
            move(dy > 0 ? 'DOWN' : 'UP');
        }
    }
}