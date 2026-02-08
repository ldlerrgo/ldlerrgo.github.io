async function getImages(){
  const res = await fetch("../img/list.json");
  return await res.json();
}
const rand = arr => arr[Math.floor(Math.random()*arr.length)];