javascript:(function(){
if(window.__si5){alert("Ativo");return}window.__si5=1;

// Estilos
const s=document.createElement("style");
s.innerHTML=`
#si5{position:fixed;bottom:18px;left:18px;width:95%;max-width:400px;max-height:70vh;z-index:999999;background:#222;color:#fff;padding:10px;font:13px monospace;border-radius:8px;box-shadow:0 2px 14px #0006;overflow:auto;touch-action:none}
#si5 h3{margin:0 0 5px 0;font-size:15px;color:#ffd700;cursor:move}
#si5 label{margin-right:10px;display:inline-block;font-size:13px}
#si5 input[type=checkbox]{vertical-align:middle}
#si5 textarea{width:100%;min-height:50px;margin:5px 0;background:#333;color:#ffe;border:1px solid #444;padding:5px;font-size:13px;resize:vertical;border-radius:4px;word-break:break-all;}
#si5 button{padding:4px 8px;font-size:12px;margin:3px 2px;background:#ffd700;color:#222;border:none;border-radius:4px;cursor:pointer}
#si5_close{position:absolute;top:7px;right:12px;color:#e74c3c;cursor:pointer;font-weight:bold;font-size:18px}`;
document.head.appendChild(s);

// Painel
const d=document.createElement("div");
d.id="si5";
d.innerHTML=`<div id="si5_close">✖</div>
<h3>Inspector</h3>
<label><input type="checkbox" id="si5_toggle">Inspecionar</label>
<label><input type="checkbox" id="si5_block">Bloquear</label>
<div><b>URL:</b><textarea id="si5_url" placeholder="URL absoluto"></textarea></div>
<div><b>Payload:</b><textarea id="si5_payload" placeholder="key=value&key2=value2"></textarea></div>
<button id="si5_send">Enviar</button>
<button id="si5_zoom_in">+</button><button id="si5_zoom_out">-</button>`;
document.body.appendChild(d);

// Elementos
const t=d.querySelector("#si5_toggle"),
      b=d.querySelector("#si5_block"),
      u=d.querySelector("#si5_url"),
      p=d.querySelector("#si5_payload");

// Fechar
d.querySelector("#si5_close").onclick=function(){d.remove();s.remove();window.__si5=0;};

// Drag (mouse + touch)
let dragging=false,dx=0,dy=0;
const startDrag=e=>{
  dragging=true;
  const rect=d.getBoundingClientRect();
  dx=(e.touches?e.touches[0].clientX:e.clientX)-rect.left;
  dy=(e.touches?e.touches[0].clientY:e.clientY)-rect.top;
};
const moveDrag=e=>{
  if(!dragging) return;
  const x=(e.touches?e.touches[0].clientX:e.clientX)-dx;
  const y=(e.touches?e.touches[0].clientY:e.clientY)-dy;
  d.style.left=x+"px"; d.style.top=y+"px";
};
const endDrag=()=>dragging=false;
d.querySelector("h3").addEventListener("mousedown",startDrag);
document.addEventListener("mousemove",moveDrag);
document.addEventListener("mouseup",endDrag);
d.querySelector("h3").addEventListener("touchstart",startDrag);
document.addEventListener("touchmove",moveDrag);
document.addEventListener("touchend",endDrag);

// Zoom
let scale=1;
d.querySelector("#si5_zoom_in").onclick=()=>{scale+=0.1; d.style.transform="scale("+scale+")";};
d.querySelector("#si5_zoom_out").onclick=()=>{scale=Math.max(0.5,scale-0.1); d.style.transform="scale("+scale+")";};

// Payload helper
function bodyToString(b){
  if(!b) return "";
  try{
    if(typeof b==="string") return b;
    if(b instanceof URLSearchParams) return b.toString();
    if(b instanceof FormData){
      let a=[]; for(const e of b.entries()){
        const k=e[0],v=e[1]; a.push(encodeURIComponent(k)+"="+encodeURIComponent(v instanceof File?(v.name+"[file]"):String(v)));
      } return a.join("&");
    }
    return JSON.stringify(b);
  }catch(e){return String(b);}
}

// Captura clique em links
document.addEventListener("click",function(e){
  if(!t.checked) return;
  if(d.contains(e.target)) return;
  const a=e.target.closest("a");
  if(a){
    u.value=new URL(a.getAttribute("href")||"", location.href).href;
    p.value="[link-click]";
    if(b.checked) e.preventDefault();
  }
},true);

// Captura submit de formulários
document.addEventListener("submit",function(e){
  if(!t.checked) return;
  const form=e.target;
  if(!form) return;
  const action=new URL(form.getAttribute("action")||location.href, location.href).href;
  const fd=new FormData(form);
  u.value=action;
  p.value=bodyToString(fd);
  if(b.checked) e.preventDefault();
},true);

// Intercept fetch e XHR
(function(){
  const origFetch=window.fetch;
  window.fetch=function(input,init){
    if(t.checked){
      try{
        const url=(typeof input==="string")?input:input.url;
        let body="";
        if(init && init.body) body=bodyToString(init.body);
        u.value=new URL(url, location.href).href;
        p.value=body;
      }catch(e){}
    }
    return origFetch.apply(this,arguments);
  };
  const origXHROpen=XMLHttpRequest.prototype.open;
  const origXHRSend=XMLHttpRequest.prototype.send;
  XMLHttpRequest.prototype.open=function(method,url,...args){
    this.__si5_url=url;
    return origXHROpen.apply(this,[method,url,...args]);
  };
  XMLHttpRequest.prototype.send=function(body){
    if(t.checked){
      u.value=new URL(this.__si5_url||"", location.href).href;
      p.value=bodyToString(body);
    }
    return origXHRSend.apply(this,arguments);
  };
})();

// Enviar POST
d.querySelector("#si5_send").onclick=function(){
  const url=u.value;
  const payload=p.value;
  if(!url) return alert("Informe a URL");
  const form=document.createElement("form");
  form.method="POST"; form.action=url; form.style.display="none";
  if(payload){
    payload.split("&").forEach(pair=>{
      const [k,v]=pair.split("=");
      const input=document.createElement("input");
      input.name=decodeURIComponent(k||"");
      input.value=decodeURIComponent(v||"");
      form.appendChild(input);
    });
  }
  document.body.appendChild(form);
  form.submit();
  form.remove();
};
})();
