const rows = 6;
const cols = 5;

let validWords = new Set();
let answerWords = [];
let loadingWords = null;
let answer = "";
let activeRow = 0;
let activeCol = 0;
let grid = [];
let tileStates = [];
let keyState = {};
let playing = false;
let bombUsed = false;
let lensUsed = false;
let lock = false;
let lockedHints = new Set();
let loadingTimer = null;
let loadingValue = 0;

const board = document.getElementById("board");
const keyboard = document.getElementById("keyboard");
const home = document.getElementById("home");
const game = document.getElementById("game");
const statusBox = document.getElementById("status");
const overlay = document.getElementById("overlay");
const overlayTitle = document.getElementById("overlayTitle");
const overlayText = document.getElementById("overlayText");
const answerBox = document.getElementById("answer");
const bombBtn = document.getElementById("bomb");
const lensBtn = document.getElementById("lens");
const playBtn = document.getElementById("play");
const backHomeBtn = document.getElementById("backHome");
const againBtn = document.getElementById("again");
const closeOverlayBtn = document.getElementById("closeOverlay");
const submitGuessBtn = document.getElementById("submitGuess");
const loadingOverlay = document.getElementById("loadingOverlay");
const loadingProgress = document.getElementById("loadingProgress");
const loadingPercent = document.getElementById("loadingPercent");
const loadingText = document.getElementById("loadingText");

function normalize(value){
  return String(value)
    .trim()
    .toLowerCase()
    .replace(/ñ/g,"__enie__")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g,"")
    .replace(/__enie__/g,"ñ")
    .replace(/[^a-zñ]/g,"");
}

function cleanWordList(list){
  return [...new Set(
    list
      .map(normalize)
      .filter(word => word.length === 5)
      .filter(word => /^[a-zñ]+$/.test(word))
  )];
}

function sleep(ms){
  return new Promise(resolve => setTimeout(resolve,ms));
}

async function ensureWords(){
  if(validWords.size) return;

  if(!loadingWords){
    loadingWords = loadWords();
  }

  await loadingWords;
}

async function ensureWordsWithLoading(){
  if(validWords.size) return;

  showLoadingOverlay();

  const start = Date.now();
  await ensureWords();
  const elapsed = Date.now() - start;

  if(elapsed < 1100){
    await sleep(1100 - elapsed);
  }

  await finishLoadingOverlay();
}

async function loadWords(){
  const localWords =
    Array.isArray(window.WORDS_BANK)
      ? window.WORDS_BANK
      : typeof WORDS_BANK !== "undefined" && Array.isArray(WORDS_BANK)
        ? WORDS_BANK
        : [];

  const sources =
    Array.isArray(window.WORD_SOURCES)
      ? window.WORD_SOURCES
      : typeof WORD_SOURCES !== "undefined" && Array.isArray(WORD_SOURCES)
        ? WORD_SOURCES
        : [];

  let externalWords = [];

  const jobs = sources.map(source => fetchWordsFromSource(source));
  const results = await Promise.allSettled(jobs);

  results.forEach(result => {
    if(result.status === "fulfilled"){
      externalWords = externalWords.concat(result.value);
    }
  });

  const cleanExternal = cleanWordList(externalWords);
  const cleanLocal = cleanWordList(localWords);
  const merged = cleanWordList([...cleanExternal, ...cleanLocal]);

  if(merged.length){
    validWords = new Set(merged);
  }

  if(cleanExternal.length >= 200){
    answerWords = cleanExternal;
  }else{
    answerWords = cleanLocal;
  }

  if(!answerWords.length){
    answerWords = cleanWordList([
      "cielo","campo","verde","playa","mundo","clase","papel","datos",
      "valor","lugar","banco","calor","norte","vista","salud","llave"
    ]);
  }

  answerWords.forEach(word => validWords.add(word));

  if(!validWords.size){
    validWords = new Set(answerWords);
  }
}

async function fetchWordsFromSource(source){
  try{
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), source.timeout || 6000);
    const response = await fetch(source.url, {
      signal:controller.signal,
      cache:"force-cache"
    });
    clearTimeout(timer);

    if(!response.ok) return [];

    const text = await response.text();

    if(source.type === "json" || text.trim().startsWith("[") || text.trim().startsWith("{")){
      return extractWords(JSON.parse(text));
    }

    return text.split(/[\s,;:"'“”‘’()[\]{}<>.!¡?¿/\\|]+/g);
  }catch(error){
    return [];
  }
}

function extractWords(data){
  if(Array.isArray(data)){
    return data.flatMap(item => extractWords(item));
  }

  if(typeof data === "string"){
    return [data];
  }

  if(data && typeof data === "object"){
    return Object.values(data).flatMap(value => extractWords(value));
  }

  return [];
}

function setLoadingProgress(value){
  const progress = Math.max(0,Math.min(100,value));
  loadingValue = progress;

  if(loadingProgress){
    loadingProgress.style.width = `${progress}%`;
  }

  if(loadingPercent){
    loadingPercent.textContent = `${Math.round(progress)}%`;
  }

  if(loadingText){
    if(progress < 35){
      loadingText.textContent = "Conectando con las fuentes de palabras...";
    }else if(progress < 70){
      loadingText.textContent = "Filtrando palabras de cinco letras...";
    }else if(progress < 93){
      loadingText.textContent = "Optimizando el banco para la partida...";
    }else{
      loadingText.textContent = "Listo. Preparando el tablero...";
    }
  }
}

function showLoadingOverlay(){
  clearInterval(loadingTimer);
  setLoadingProgress(0);
  loadingOverlay.classList.add("show");

  loadingTimer = setInterval(() => {
    const distance = 92 - loadingValue;
    const increment = Math.max(.25,distance * .075) + Math.random() * .8;
    setLoadingProgress(Math.min(92,loadingValue + increment));
  },90);
}

function finishLoadingOverlay(){
  return new Promise(resolve => {
    clearInterval(loadingTimer);

    const timer = setInterval(() => {
      const distance = 100 - loadingValue;
      const increment = Math.max(1,distance * .28);
      setLoadingProgress(Math.min(100,loadingValue + increment));

      if(loadingValue >= 99.8){
        clearInterval(timer);
        setLoadingProgress(100);

        setTimeout(() => {
          loadingOverlay.classList.remove("show");
          resolve();
        },420);
      }
    },45);
  });
}

function usedWords(){
  try{
    return JSON.parse(sessionStorage.getItem("usedWordleWords") || "[]");
  }catch(error){
    return [];
  }
}

function saveUsed(word){
  const used = usedWords();
  used.push(word);
  sessionStorage.setItem("usedWordleWords", JSON.stringify([...new Set(used)]));
}

function pickWord(){
  let used = usedWords();
  let available = answerWords.filter(word => !used.includes(word));

  if(!available.length){
    sessionStorage.removeItem("usedWordleWords");
    available = [...answerWords];
  }

  const word = available[Math.floor(Math.random() * available.length)];
  saveUsed(word);
  return word;
}

async function showGame(){
  home.style.display = "none";
  game.style.display = "block";
  statusBox.textContent = "";

  await ensureWordsWithLoading();

  startGame();
}

function emptyMatrix(value = ""){
  return Array.from({length:rows}, () => Array(cols).fill(value));
}

function startGame(){
  if(!answerWords.length){
    answerWords = cleanWordList(["cielo","campo","verde","playa","mundo","clase","papel","datos","valor","lugar"]);
    validWords = new Set(answerWords);
  }

  answer = pickWord();
  activeRow = 0;
  activeCol = 0;
  grid = emptyMatrix("");
  tileStates = emptyMatrix("");
  keyState = {};
  lockedHints = new Set();
  playing = true;
  lock = false;
  bombUsed = false;
  lensUsed = false;

  bombBtn.classList.remove("used");
  lensBtn.classList.remove("used");
  statusBox.textContent = "";
  overlay.classList.remove("show");

  renderBoard();
  renderKeyboard();
  setActiveTile();
}

function renderBoard(){
  board.innerHTML = "";

  for(let r = 0; r < rows; r++){
    const row = document.createElement("div");
    row.className = "row";

    for(let c = 0; c < cols; c++){
      const tile = document.createElement("button");
      const state = tileStates[r][c];
      tile.className = "tile";
      tile.type = "button";
      tile.textContent = grid[r][c];
      tile.dataset.row = r;
      tile.dataset.col = c;

      if(state){
        tile.classList.add(state);
      }

      if(state && r < activeRow){
        tile.classList.add("locked");
      }

      if(isLockedCell(r,c)){
        tile.classList.add("correct","hint","locked");
      }

      tile.addEventListener("click", () => {
        if(!playing || lock || r !== activeRow || isLockedCell(r,c)) return;
        activeCol = c;
        setActiveTile();
      });

      row.appendChild(tile);
    }

    board.appendChild(row);
  }
}

function renderKeyboard(){
  const keyboardRows = [
    ["Q","W","E","R","T","Y","U","I","O","P"],
    ["A","S","D","F","G","H","J","K","L","Ñ"],
    ["SPACER","Z","X","C","V","B","N","M","BORRAR"]
  ];

  keyboard.innerHTML = "";

  keyboardRows.forEach(line => {
    const row = document.createElement("div");
    row.className = "key-row";

    line.forEach(value => {
      if(value === "SPACER"){
        const spacer = document.createElement("div");
        spacer.className = "key wide spacer";
        row.appendChild(spacer);
        return;
      }

      const label = value === "BORRAR" ? "Borrar" : value;
      row.appendChild(keyButton(label,value,value.length > 1));
    });

    keyboard.appendChild(row);
  });
}

function keyButton(label,value,wide = false){
  const btn = document.createElement("button");
  btn.className = "key" + (wide ? " wide" : "");

  if(value === "BORRAR"){
    btn.classList.add("delete");
  }

  btn.textContent = label;
  btn.type = "button";

  const state = keyState[value.toLowerCase()];

  if(state){
    btn.classList.add(state);
  }

  btn.addEventListener("click", () => handleInput(value));

  return btn;
}

function cellKey(row,col){
  return `${row}-${col}`;
}

function isLockedCell(row,col){
  return lockedHints.has(cellKey(row,col));
}

function getTile(row,col){
  return board.querySelector(`[data-row="${row}"][data-col="${col}"]`);
}

function setActiveTile(){
  document.querySelectorAll(".tile").forEach(tile => tile.classList.remove("active"));

  if(!playing || lock) return;

  if(isLockedCell(activeRow,activeCol)){
    const next = findNextEditable(activeRow,activeCol + 1);
    const previous = findPreviousEditable(activeRow,activeCol - 1);
    activeCol = next !== -1 ? next : previous !== -1 ? previous : activeCol;
  }

  const tile = getTile(activeRow,activeCol);

  if(tile && !isLockedCell(activeRow,activeCol)){
    tile.classList.add("active");
  }
}

function findNextEditable(row,start){
  for(let c = Math.max(0,start); c < cols; c++){
    if(!isLockedCell(row,c)) return c;
  }

  for(let c = 0; c < Math.max(0,start); c++){
    if(!isLockedCell(row,c)) return c;
  }

  return -1;
}

function findPreviousEditable(row,start){
  for(let c = Math.min(cols - 1,start); c >= 0; c--){
    if(!isLockedCell(row,c)) return c;
  }

  for(let c = cols - 1; c > Math.min(cols - 1,start); c--){
    if(!isLockedCell(row,c)) return c;
  }

  return -1;
}

function findNextEmptyEditable(row,start){
  for(let c = Math.max(0,start); c < cols; c++){
    if(!isLockedCell(row,c) && !grid[row][c]) return c;
  }

  for(let c = 0; c < Math.max(0,start); c++){
    if(!isLockedCell(row,c) && !grid[row][c]) return c;
  }

  return findNextEditable(row,start);
}

function handleInput(value){
  if(!playing || lock) return;

  if(value === "ENTER"){
    submitGuess();
    return;
  }

  if(value === "BORRAR"){
    removeLetter();
    return;
  }

  if(/^[A-ZÑ]$/i.test(value)){
    insertLetter(normalize(value));
  }
}

function insertLetter(letter){
  if(!letter) return;

  if(isLockedCell(activeRow,activeCol)){
    const next = findNextEmptyEditable(activeRow,activeCol + 1);
    if(next === -1) return;
    activeCol = next;
  }

  grid[activeRow][activeCol] = letter.toUpperCase();
  tileStates[activeRow][activeCol] = "";

  const tile = getTile(activeRow,activeCol);

  if(tile){
    tile.textContent = letter.toUpperCase();
    tile.classList.remove("correct","present","absent","reveal","win-glow","hint");
    tile.classList.add("filled");
    setTimeout(() => tile.classList.remove("filled"),140);
  }

  const next = findNextEmptyEditable(activeRow,activeCol + 1);

  if(next !== -1){
    activeCol = next;
  }

  setActiveTile();
}

function removeLetter(){
  if(isLockedCell(activeRow,activeCol) || !grid[activeRow][activeCol]){
    for(let c = activeCol - 1; c >= 0; c--){
      if(!isLockedCell(activeRow,c) && grid[activeRow][c]){
        activeCol = c;
        break;
      }
    }
  }

  if(isLockedCell(activeRow,activeCol)) return;

  if(grid[activeRow][activeCol]){
    grid[activeRow][activeCol] = "";
    tileStates[activeRow][activeCol] = "";
    const tile = getTile(activeRow,activeCol);

    if(tile){
      tile.textContent = "";
      tile.classList.remove("correct","present","absent","reveal","win-glow","hint");
    }
  }

  setActiveTile();
}

function submitGuess(){
  const guess = grid[activeRow].join("").toLowerCase();

  if(guess.length < cols){
    showMessage("Completa las cinco letras.");
    return;
  }

  if(!validWords.has(guess)){
    showMessage("La palabra no está en el banco.");
    return;
  }

  statusBox.textContent = "";
  lock = true;

  const rowIndex = activeRow;
  const result = scoreGuess(guess,answer);

  result.forEach((state,index) => {
    setTimeout(() => {
      tileStates[rowIndex][index] = state;
      const tile = getTile(rowIndex,index);

      if(tile){
        tile.classList.remove("correct","present","absent");
        tile.classList.add("reveal",state);
      }

      updateKey(guess[index],state);
      renderKeyboard();

      if(index === cols - 1){
        setTimeout(() => afterReveal(guess,rowIndex),230);
      }
    },index * 150);
  });
}

function scoreGuess(guess,target){
  const result = Array(cols).fill("absent");
  const targetChars = target.split("");

  for(let i = 0; i < cols; i++){
    if(guess[i] === target[i]){
      result[i] = "correct";
      targetChars[i] = null;
    }
  }

  for(let i = 0; i < cols; i++){
    if(result[i] === "correct") continue;

    const index = targetChars.indexOf(guess[i]);

    if(index !== -1){
      result[i] = "present";
      targetChars[index] = null;
    }
  }

  return result;
}

function updateKey(letter,state){
  const priority = {
    absent:1,
    present:2,
    correct:3
  };

  const current = keyState[letter] || "";

  if(!current || priority[state] > priority[current]){
    keyState[letter] = state;
  }
}

function afterReveal(guess,rowIndex){
  document.querySelectorAll(`.row:nth-child(${rowIndex + 1}) .tile`).forEach(tile => tile.classList.add("locked"));

  if(guess === answer){
    document.querySelectorAll(`.row:nth-child(${rowIndex + 1}) .tile`).forEach(tile => tile.classList.add("win-glow"));
    playing = false;
    setTimeout(() => showResult(true,rowIndex + 1),520);
    return;
  }

  activeRow++;
  activeCol = 0;
  lock = false;

  if(activeRow >= rows){
    playing = false;
    setTimeout(() => showResult(false,rows),420);
    return;
  }

  setActiveTile();
}

function showMessage(message){
  statusBox.textContent = message;
  board.classList.remove("shake");
  void board.offsetWidth;
  board.classList.add("shake");
}

function showResult(win,attempts){
  overlay.classList.add("show");
  answerBox.textContent = answer.toUpperCase();

  if(win){
    const messages = {
      1:[
        "Excelente inicio",
        "Acertaste la palabra en el primer intento. Fue una jugada muy precisa."
      ],
      2:[
        "Muy buena partida",
        "Resolviste la palabra en solo dos intentos. Leíste muy bien las pistas."
      ],
      3:[
        "Gran resultado",
        "Encontraste la palabra con rapidez y buen criterio. Vas muy bien."
      ],
      4:[
        "Bien jugado",
        "Usaste las pistas con calma y lograste llegar a la respuesta correctamente."
      ],
      5:[
        "Buena recuperación",
        "La partida se puso más difícil, pero lograste encontrar la palabra a tiempo."
      ],
      6:[
        "Lo lograste",
        "Llegaste al último intento y encontraste la palabra. Fue una partida muy cerrada."
      ]
    };

    overlayTitle.textContent = messages[attempts][0];
    overlayText.textContent = messages[attempts][1];
  }else{
    overlayTitle.textContent = "Buen intento";
    overlayText.textContent = "Esta vez no se encontró la palabra, pero puedes intentarlo nuevamente con una palabra distinta.";
  }
}

function useBomb(){
  if(!playing || lock || bombUsed) return;

  const absent = "abcdefghijklmnñopqrstuvwxyz"
    .split("")
    .filter(letter => !answer.includes(letter) && !keyState[letter]);

  shuffle(absent).slice(0,6).forEach(letter => keyState[letter] = "absent");

  bombUsed = true;
  bombBtn.classList.add("used");
  renderKeyboard();
  statusBox.textContent = "La bomba descartó letras que no pertenecen a la palabra.";
}

function useLens(){
  if(!playing || lock || lensUsed) return;

  const candidates = [];

  for(let i = 0; i < cols; i++){
    if(!isLockedCell(activeRow,i) && grid[activeRow][i].toLowerCase() !== answer[i]){
      candidates.push(i);
    }
  }

  if(!candidates.length){
    statusBox.textContent = "La línea activa ya tiene sus letras correctas.";
    return;
  }

  const col = candidates[Math.floor(Math.random() * candidates.length)];

  grid[activeRow][col] = answer[col].toUpperCase();
  tileStates[activeRow][col] = "correct";
  lockedHints.add(cellKey(activeRow,col));
  activeCol = findNextEmptyEditable(activeRow,col + 1);

  updateKey(answer[col],"correct");

  lensUsed = true;
  lensBtn.classList.add("used");

  renderBoard();
  renderKeyboard();
  setActiveTile();

  const tile = getTile(activeRow,col);

  if(tile){
    tile.classList.add("win-glow");
  }

  statusBox.textContent = "La lupa reveló una letra correcta. Esa casilla quedó bloqueada.";
}

function shuffle(array){
  for(let i = array.length - 1; i > 0; i--){
    const j = Math.floor(Math.random() * (i + 1));
    [array[i],array[j]] = [array[j],array[i]];
  }

  return array;
}

function moveCursor(direction){
  if(!playing || lock) return;

  if(direction < 0){
    const previous = findPreviousEditable(activeRow,activeCol - 1);
    if(previous !== -1) activeCol = previous;
  }else{
    const next = findNextEditable(activeRow,activeCol + 1);
    if(next !== -1) activeCol = next;
  }

  setActiveTile();
}

document.addEventListener("keydown", event => {
  if((event.ctrlKey || event.metaKey) && ["+","-","=","0"].includes(event.key)){
    event.preventDefault();
  }

  if(game.style.display !== "block") return;

  if(event.key === "Enter"){
    event.preventDefault();
    handleInput("ENTER");
  }else if(event.key === "Backspace"){
    event.preventDefault();
    handleInput("BORRAR");
  }else if(/^[a-zA-ZñÑ]$/.test(event.key)){
    event.preventDefault();
    handleInput(event.key.toUpperCase());
  }else if(event.key === "ArrowLeft"){
    event.preventDefault();
    moveCursor(-1);
  }else if(event.key === "ArrowRight"){
    event.preventDefault();
    moveCursor(1);
  }
});

document.addEventListener("wheel", event => {
  if(event.ctrlKey){
    event.preventDefault();
  }
}, {passive:false});

document.addEventListener("gesturestart", event => {
  event.preventDefault();
});

playBtn.addEventListener("click", showGame);

submitGuessBtn.addEventListener("click", () => {
  handleInput("ENTER");
});

againBtn.addEventListener("click", async () => {
  await ensureWordsWithLoading();
  startGame();
});

closeOverlayBtn.addEventListener("click", () => {
  overlay.classList.remove("show");
});

backHomeBtn.addEventListener("click", () => {
  game.style.display = "none";
  home.style.display = "grid";
  playing = false;
  overlay.classList.remove("show");
});

bombBtn.addEventListener("click", useBomb);
lensBtn.addEventListener("click", useLens);