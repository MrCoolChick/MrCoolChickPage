const COLORS = [
  {name:"紅", cls:"red"}, {name:"藍", cls:"blue"},
  {name:"綠", cls:"green"}, {name:"黃", cls:"yellow"}
];

let N=64, cells=[], players=4, current=0, selected=null, passed=0, gameOver=false;

const board=document.getElementById("board");
const turnEl=document.getElementById("turn");
const statusEl=document.getElementById("status");
const scoresEl=document.getElementById("scores");

function shuffle(a){for(let i=a.length-1;i>0;i--){let j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a}

function makeHexLayout(){
  // 杯子形狀是「平頂六邊形」(clip-path 的頂/底邊是平的，左右兩側是尖角)，
  // 寬 64 / 高 56。平頂六邊形要組成蜂巢，必須用「欄」為單位互相垂直錯開，
  // 而不是像原本那樣把「列」水平錯開，否則杯子彼此無法真正相鄰密合。
  //
  // 以六邊形外接圓半徑 s = 寬度/2 = 32 計算：
  //   欄距 (colSpacing) = 3/4 * 寬度 = 48
  //   列距 (rowSpacing) = 高度 = 56
  //   奇數欄要往下位移半個列距 (colOffset = rowSpacing / 2 = 28)
  const pts=[];
  const cols=8, rows=8;
  const colSpacing=48;
  const rowSpacing=56;
  const colOffset=rowSpacing/2;
  const ox=232, oy=115;

  for(let c=0;c<cols;c++){
    for(let r=0;r<rows;r++){
      const x=ox+c*colSpacing;
      const y=oy+r*rowSpacing+(c%2)*colOffset;
      pts.push({x,y});
    }
  }
  return pts;
}

function adjacent(a,b){
  // 蜂巢密排的平頂六邊形，相鄰中心距離約為 55–56（不論是同欄上下相鄰，
  // 還是相鄰欄的斜向相鄰）。下一圈的杯子距離會跳到 96 以上，
  // 所以門檻設在 58 可以準確只抓到真正相鄰的六個方向。
  return Math.hypot(a.x-b.x, a.y-b.y) <= 58;
}

function legalMoves(p=current){
  const moves=[];
  for(const a of cells){
    if(a.owner!==p) continue;
    for(const b of cells){
      if(a===b) continue;
      if(adjacent(a,b) && a.h>=b.h) moves.push([a,b]);
    }
  }
  return moves;
}

function render(){
  board.innerHTML="";
  cells.forEach((c,i)=>{
    const el=document.createElement("div");
    el.className=`cup ${COLORS[c.owner].cls}`;
    if(selected===c) el.classList.add("selected");
    if(selected && c!==selected && adjacent(selected,c) && selected.h>=c.h) el.classList.add("target");
    el.style.left=c.x+"px"; el.style.top=c.y+"px";
    el.textContent=c.h;
    el.title=`${COLORS[c.owner].name}色 · 高度 ${c.h}`;
    el.onclick=()=>clickCell(c);
    board.appendChild(el);
  });
  updateScores();
  turnEl.textContent=gameOver?"遊戲結束":`目前回合：${COLORS[current].name}色`;
  turnEl.style.background=`color-mix(in srgb, var(--panel) 65%, ${getColor(current)} 35%)`;
}

function getColor(i){return ["#d94a4a","#3f7bd9","#3fa267","#d5a62d"][i]}

function clickCell(c){
  if(gameOver) return;
  if(document.getElementById("ai").checked && current!==0) return;
  if(!selected){
    if(c.owner!==current){statusEl.textContent="你只能選擇自己控制的堆疊。";return}
    selected=c; statusEl.textContent=`已選擇 ${COLORS[c.owner].name}色堆疊（高度 ${c.h}），請選擇相鄰目標。`;
  }else{
    if(c===selected){selected=null;statusEl.textContent="已取消選擇。";render();return}
    if(c.owner===current && !adjacent(selected,c)){selected=c;render();return}
    if(adjacent(selected,c) && selected.h>=c.h) moveStack(selected,c);
    else statusEl.textContent="不能移動：必須相鄰，而且移動堆疊高度要 ≥ 目標高度。";
  }
  render();
}

function moveStack(a,b){
  b.h += a.h; b.owner=a.owner;
  cells=cells.filter(x=>x!==a);
  selected=null; passed=0;
  statusEl.textContent=`${COLORS[b.owner].name}色成功吃掉目標，形成高度 ${b.h} 的新堆疊。`;
  nextTurn();
}

function nextTurn(){
  if(checkEnd()) return;
  let tries=0;
  do{current=(current+1)%players;tries++}while(tries<=players && legalMoves(current).length===0);
  if(tries>players){endGame();return}
  render();
  if(document.getElementById("ai").checked && current!==0) setTimeout(aiMove,550);
}

function aiMove(){
  if(gameOver || current===0) return;
  const moves=legalMoves(current);
  if(!moves.length){nextTurn();return}
  // 簡單但合理的 AI：優先吃掉較高的目標堆疊，再偏好形成較高自己的堆疊。
  moves.sort((m1,m2)=>{
    const s=m=>m[1].h*5 + m[0].h + Math.random()*5;
    return s(m2)-s(m1);
  });
  moveStack(...moves[0]);
}

function checkEnd(){
  for(let p=0;p<players;p++) if(legalMoves(p).length) return false;
  endGame(); return true;
}

function endGame(){
  gameOver=true; selected=null;
  const totals=COLORS.map((_,p)=>cells.filter(c=>c.owner===p).reduce((s,c)=>s+c.h,0));
  const active=totals.slice(0,players), max=Math.max(...active);
  const winners=active.map((v,i)=>v===max?COLORS[i].name:null).filter(Boolean);
  statusEl.textContent=`沒有任何合法移動。${winners.join("、")}色獲勝！最高總高度：${max}`;
  turnEl.textContent="遊戲結束";
  render();
}

function updateScores(){
  const totals=COLORS.map((_,p)=>cells.filter(c=>c.owner===p).reduce((s,c)=>s+c.h,0));
  scoresEl.innerHTML="<strong>目前控制杯數／總高度</strong>"+totals.slice(0,players).map((v,p)=>{
    const stacks=cells.filter(c=>c.owner===p).length;
    return `<div class="score" style="background:${getColor(p)}22;border-left:4px solid ${getColor(p)}">
      <span>${COLORS[p].name}色</span><span>${stacks} 堆／${v}</span>
    </div>`;
  }).join("");
}

function newGame(){
  players=+document.getElementById("playerCount").value;
  current=0; selected=null; passed=0; gameOver=false;
  const owners=[];
  for(let p=0;p<players;p++) for(let i=0;i<16;i++) owners.push(p);
  shuffle(owners);
  const pts=makeHexLayout();
  cells=pts.map((pt,i)=>({x:pt.x,y:pt.y,h:1,owner:owners[i]}));
  statusEl.textContent="遊戲開始！你是紅色，請選擇一個紅色堆疊。";
  render();
}

document.getElementById("newGame").onclick=newGame;
document.getElementById("pass").onclick=()=>{
  if(gameOver) return;
  if(document.getElementById("ai").checked && current!==0) return;
  if(legalMoves(current).length){statusEl.textContent="你仍有合法移動，不能跳過。";return}
  nextTurn();
};

document.getElementById("playerCount").onchange=newGame;
newGame();