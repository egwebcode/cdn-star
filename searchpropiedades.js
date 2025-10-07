javascript:(function(){
if(document.getElementById('egpanel')){document.getElementById('egpanel').remove();return;}
let p=document.createElement('div');p.id='egpanel';
p.style.cssText='position:fixed;top:40px;left:5px;width:95%;max-width:600px;height:70%;background:#0d0d0d;color:#fff;z-index:999999;border-radius:8px;display:flex;flex-direction:column;overflow:hidden;font-family:monospace;font-size:13px;box-shadow:0 0 10px #000;';
let bar=document.createElement('div');bar.style.cssText='background:#111;padding:6px;display:flex;align-items:center;justify-content:space-between;cursor:move;';
let title=document.createElement('span');title.textContent='Property Explorer';bar.appendChild(title);
let btns=document.createElement('div');
let close=document.createElement('button');close.textContent='×';close.style.cssText='background:#444;color:#fff;border:none;padding:2px 6px;border-radius:4px;cursor:pointer;';
close.onclick=()=>p.remove();btns.appendChild(close);bar.appendChild(btns);p.appendChild(bar);

// filtros e busca
let typeFilter=document.createElement('select');typeFilter.style.cssText='width:100%;padding:5px;background:#1a1a1a;color:#fff;border:none;outline:none;margin-top:5px;';
typeFilter.innerHTML="<option value='all'>Todos</option><option value='js'>.js</option><option value='html'>.html</option>";
p.appendChild(typeFilter);

let fileFilter=document.createElement('select');fileFilter.style.cssText='width:100%;padding:5px;background:#1a1a1a;color:#fff;border:none;outline:none;margin-top:5px;';
p.appendChild(fileFilter);

let search=document.createElement('input');search.placeholder='🔍 Pesquisar propriedade...';
search.style.cssText='width:100%;padding:5px;background:#1a1a1a;color:#fff;border:none;outline:none;margin-top:5px;';
p.appendChild(search);

let content=document.createElement('pre');
content.style.cssText='flex:1;overflow:auto;margin:0;padding:10px;background:#0d0d0d;color:#eee;white-space:pre-wrap;word-break:break-word;border-top:1px solid #222;user-select:text;-webkit-user-select:text;';
p.appendChild(content);document.body.appendChild(p);

// arrastar painel
let isDown=false,offsetX,offsetY;
bar.addEventListener('mousedown',e=>{isDown=true;offsetX=e.clientX-p.offsetLeft;offsetY=e.clientY-p.offsetTop;});
bar.addEventListener('mousemove',e=>{if(!isDown)return;p.style.left=(e.clientX-offsetX)+'px';p.style.top=(e.clientY-offsetY)+'px';});
bar.addEventListener('mouseup',()=>isDown=false);
bar.addEventListener('mouseleave',()=>isDown=false);
bar.addEventListener('touchstart',e=>{isDown=true;let t=e.touches[0];offsetX=t.clientX-p.offsetLeft;offsetY=t.clientY-p.offsetTop;});
bar.addEventListener('touchmove',e=>{if(!isDown)return;let t=e.touches[0];p.style.left=(t.clientX-offsetX)+'px';p.style.top=(t.clientY-offsetY)+'px';});
bar.addEventListener('touchend',()=>isDown=false);

// carregar arquivos
let codes={'index.html':document.documentElement.outerHTML};
let fileList=['index.html'];
fileFilter.innerHTML='';fileFilter.appendChild(new Option('index.html','index.html'));

// carregar scripts externos de forma assíncrona
let scripts=Array.from(document.querySelectorAll('script[src]')).map(el=>el.src);
let fetchNext=()=>{
  if(scripts.length===0)return renderProps();
  let src=scripts.shift();
  fetch(src).then(r=>r.text()).then(t=>{
    codes[src]=t;
    fileList.push(src);
    fileFilter.appendChild(new Option(src.split('/').pop(),src));
    fetchNext();
  }).catch(fetchNext);
};
fetchNext();

// extrair propriedades com regex simples
function extractProps(text){
  let props=new Set();
  let regex=/([a-zA-Z_$][\w$]*(?:\.[a-zA-Z_$][\w$]*)+)/g;
  let m;
  while(m=regex.exec(text))props.add(m[1]);
  return Array.from(props);
}

// obter valor seguro (somente globais existentes)
function getValueSafe(prop){
  try{
    let parts=prop.split('.');
    let obj=window;
    for(let i=0;i<parts.length;i++){
      if(obj[parts[i]]===undefined)return undefined;
      obj=obj[parts[i]];
    }
    return obj;
  }catch(e){return undefined;}
}

// renderizar propriedades
function renderProps(){
  let type=typeFilter.value;
  let file=fileFilter.value;
  let selectedFiles=file==='all'?fileList:[file];
  let props=[];
  selectedFiles.forEach(f=>{
    if(type!=='all' && !f.endsWith(type))return;
    props=props.concat(extractProps(codes[f]));
  });
  if(search.value.trim()){
    props=props.filter(p=>p.includes(search.value.trim()));
  }
  content.innerHTML='';
  let uniq=[...new Set(props)];
  uniq.forEach(p=>{
    let val=getValueSafe(p);
    content.innerHTML+='<span style="color:#0f0;">'+p+'</span> = <span style="color:#ff0;">'+(val===undefined?'undefined':JSON.stringify(val))+'</span>\n';
  });
}

// eventos
search.oninput=renderProps;
fileFilter.onchange=renderProps;
typeFilter.onchange=renderProps;

// inicial
setTimeout(renderProps,1500);
})();