/* ===== PUZZLE ===== */
let puzzleSize=4,puzzleTiles=[];
function isAdj(i,j,s){
  const r=Math.floor(i/s),c=i%s;
  const r2=Math.floor(j/s),c2=j%s;
  return Math.abs(r-r2)+Math.abs(c-c2)===1;
}

async function initPuzzle(){
  const map={3:3,4:4,5:5};
  puzzleSize=map[parseInt(document.getElementById("level").value)];
  const imgs=await getImages();
  const img="../img/"+rand(imgs);

  const puzzle=document.getElementById("puzzle");
  puzzle.innerHTML="";
  puzzle.style.gridTemplateColumns=`repeat(${puzzleSize},1fr)`;

  const order=[...Array(puzzleSize*puzzleSize).keys()].sort(()=>Math.random()-0.5);
  puzzleTiles=[];
  order.forEach(v=>{
    const t=document.createElement("div");
    t.className="tile";
    t.dataset.val=v;
    if(v===order.length-1)t.classList.add("empty");
    else{
      t.style.backgroundImage=`url(${img})`;
      t.style.backgroundSize=`${puzzleSize*100}% ${puzzleSize*100}%`;
      t.style.backgroundPosition=
        `${(v%puzzleSize)*(100/(puzzleSize-1))}% ${(Math.floor(v/puzzleSize))*(100/(puzzleSize-1))}%`;
    }
    t.onclick=()=>moveTile(t);
    puzzle.appendChild(t);
    puzzleTiles.push(t);
  });
}

function moveTile(tile){
  const puzzle=document.getElementById("puzzle");
  const i=puzzleTiles.indexOf(tile);
  const ei=puzzleTiles.findIndex(t=>t.classList.contains("empty"));
  if(!isAdj(i,ei,puzzleSize))return;

  const dx=(ei%puzzleSize)-(i%puzzleSize);
  const dy=Math.floor(ei/puzzleSize)-Math.floor(i/puzzleSize);
  tile.style.transform=`translate(${dx*100}%,${dy*100}%)`;

  setTimeout(()=>{
    tile.style.transform="";
    [puzzleTiles[i],puzzleTiles[ei]]=[puzzleTiles[ei],puzzleTiles[i]];
    puzzle.innerHTML="";
    puzzleTiles.forEach(t=>puzzle.appendChild(t));
    if(puzzleTiles.every((t,i)=>t.dataset.val==i))
      alert(rand(["Ganaste","Perfecto","Lo lograste"]));
  },260);
}