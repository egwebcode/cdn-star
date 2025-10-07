javascript:(function(){
if(document.getElementById('egpanel')){document.getElementById('egpanel').remove();return;}
let p=document.createElement('div');p.id='egpanel';
p.style.cssText='position:fixed;top:40px;left:5px;width:95%;max-width:500px;height:70%;background:#0d0d0d;color:#fff;z-index:999999;border-radius:8px;display:flex;flex-direction:column;overflow:hidden;font-family:monospace;font-size:13px;box-shadow:0 0 10px #000;';
let bar=document.createElement('div');
bar.style.cssText='background:#111;padding:6px;display:flex;align-items:center;justify-content:space-between;cursor:move;';
let title=document.createElement('span');title.textContent='HTML+JS Explorer';bar.appendChild(title);
let btns=document.createElement('div');
let close=document.createElement('button');close.textContent='×';close.style.cssText='background:#444;color:#fff;border:none;padding:2px 6px;border-radius:4px;cursor:pointer;';
close.onclick=()=>p.remove();btns.appendChild(close);bar.appendChild(btns);p.appendChild(bar);
let files=document.createElement('select');files.style.cssText='width:100%;padding:5px;background:#1a1a1a;color:#fff;border:none;outline:none;margin-top:5px;';
p.appendChild(files);
let search=document.createElement('input');search.placeholder='🔍 Pesquisar...';
search.style.cssText='width:100%;padding:5px;background:#1a1a1a;color:#fff;border:none;outline:none;margin-top:5px;';
p.appendChild(search);
let content=document.createElement('pre');
content.style.cssText='flex:1;overflow:auto;margin:0;padding:10px;background:#0d0d0d;color:#eee;white-space:pre-wrap;word-break:break-word;border-top:1px solid #222;user-select:text;-webkit-user-select:text;';
p.appendChild(content);document.body.appendChild(p);

// Arrastar painel (mouse e touch)
let isDown=false,offsetX,offsetY;
bar.addEventListener('mousedown',e=>{isDown=true;offsetX=e.clientX-p.offsetLeft;offsetY=e.clientY-p.offsetTop;});
bar.addEventListener('mousemove',e=>{if(!isDown)return;p.style.left=(e.clientX-offsetX)+'px';p.style.top=(e.clientY-offsetY)+'px';});
bar.addEventListener('mouseup',()=>isDown=false);
bar.addEventListener('mouseleave',()=>isDown=false);
bar.addEventListener('touchstart',e=>{isDown=true;let t=e.touches[0];offsetX=t.clientX-p.offsetLeft;offsetY=t.clientY-p.offsetTop;});
bar.addEventListener('touchmove',e=>{if(!isDown)return;let t=e.touches[0];p.style.left=(t.clientX-offsetX)+'px';p.style.top=(t.clientY-offsetY)+'px';});
bar.addEventListener('touchend',()=>isDown=false);

// Carregar HTML e scripts
let codes={'index.html':document.documentElement.outerHTML};
let opt=document.createElement('option');opt.value='index.html';opt.textContent='index.html';files.appendChild(opt);
Array.from(document.querySelectorAll('script[src]')).forEach(el=>{
  let src=el.src;
  if(!src) return;
  fetch(src).then(r=>r.text()).then(t=>{
    codes[src]=t;
    let o=document.createElement('option');o.value=src;o.textContent=src.split('/').pop();files.appendChild(o);
  }).catch(console.error);
});

// Função de escape
function escapeHtml(t){return t.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');}

// Renderizar arquivo e buscar
function renderFile(u){
  let text=codes[u]||'';
  let term=search.value.trim();
  if(!term){content.textContent=text;return;}
  let re=new RegExp(term,'gi');
  content.innerHTML=escapeHtml(text).replace(re,m=>'<span style="background:red;color:#fff;">'+m+'</span>');
  let first=content.querySelector('span');if(first)first.scrollIntoView({behavior:"smooth",block:"center"});
}
files.onchange=()=>{renderFile(files.value);search.value='';};
search.oninput=()=>renderFile(files.value);

// Render inicial
setTimeout(()=>{files.selectedIndex=0;renderFile(files.value);},1000);
})();