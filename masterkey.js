(function() {
  if (document.getElementById('mscFullPanel')) return;

  // Estilos responsivos e modernos
  var style = document.createElement('style');
  style.textContent = `
    #mscFullPanel {
      position:fixed;top:0;left:0;width:100vw;height:100vh;
      background:rgba(0,0,0,0.7);z-index:999999;
      display:flex;align-items:center;justify-content:center;
    }
    #mscCard {
      background:#181c22;color:#0f0;font-family:monospace;
      width:90vw;max-width:400px;box-shadow:0 8px 32px #000a;
      border-radius:16px;padding:24px 16px 16px 16px;display:flex;
      flex-direction:column;gap:12px;position:relative;
      animation: mscFadeIn 0.25s;
    }
    @keyframes mscFadeIn { from{transform:scale(0.9);opacity:0} to{transform:scale(1);opacity:1}}
    #mscClose {
      position:absolute;top:12px;right:12px;background:#f32;color:#fff;
      border:none;width:32px;height:32px;border-radius:50%;
      font-size:20px;font-weight:bold;cursor:pointer;transition:background 0.2s;
    }
    #mscClose:hover { background:#c00; }
    #mscCard label {font-size:15px;margin-bottom:2px;color:#7fffd4;}
    #mscCard input {
      width:100%;padding:10px 8px;margin-bottom:2px;font-size:16px;
      background:#222;color:#0f0;border:1px solid #0f0;border-radius:6px;
      outline:none;transition:border-color 0.2s;
    }
    #mscCard input:focus { border-color: #7fffd4; }
    #mscSend {
      padding:12px;width:100%;background:#0f0;color:#000;
      border:none;border-radius:6px;font-weight:bold;cursor:pointer;
      font-size:17px;transition:background 0.2s;
    }
    #mscSend:hover { background:#7fffd4; }
    #mscLog {
      min-height:60px;max-height:22vh;overflow-y:auto;
      background:#000;color:#0f0;padding:10px 8px;margin-top:2px;
      border-radius:6px;border:1px solid #0f0;font-size:13px;
      font-family:monospace;word-break:break-all;
    }
    @media (max-width:500px) {
      #mscCard {padding:16px 4vw 8px 4vw;max-width:98vw;}
      #mscLog {font-size:12px;}
    }
  `;
  document.head.appendChild(style);

  // Estrutura do painel
  var p = document.createElement('div');
  p.id = 'mscFullPanel';
  p.innerHTML = `
    <div id="mscCard">
      <button id="mscClose" title="Fechar painel">&times;</button>
      <div style="text-align:center;margin-bottom:12px">
        <b style="font-size:20px;color:#7fffd4;">MSClique</b><br>
        <span style="font-size:13px;color:#99ffc2;">Validação Rápida</span>
      </div>
      <label for="mscKey">SUA_KEY:</label>
      <input id="mscKey" autocomplete="off" placeholder="Digite sua chave">
      <label for="mscMaster">masterkey:</label>
      <input id="mscMaster" autocomplete="off" placeholder="Digite a masterkey">
      <button id="mscSend">Enviar POST</button>
      <div id="mscLog"></div>
    </div>
  `;
  document.body.appendChild(p);

  // Funções de interação
  document.getElementById('mscClose').onclick = function () {
    document.getElementById('mscFullPanel').remove();
    style.remove();
  };

  var log = document.getElementById('mscLog');
  function addLog(m, c) {
    var span = document.createElement('span');
    span.style.color = c || '#0f0';
    span.innerText = m;
    log.appendChild(span);
    log.appendChild(document.createElement('br'));
    log.scrollTop = log.scrollHeight;
  }
  document.getElementById('mscSend').onclick = function () {
    var t = document.getElementById('mscKey').value.trim();
    var c = document.getElementById('mscMaster').value.trim();
    if (!t || !c) {
      addLog('Erro: key ou masterkey vazios', 'red');
      return;
    }
    var url = 'https://msclique.com.br/index.php?view=surfer';
    var body = 'action=validate&t=' + encodeURIComponent(t) + '&masterkey=' + encodeURIComponent(c);
    addLog('Enviando POST...');
    fetch(url, {
      method: 'POST',
      headers: {
        'Accept': '*/*',
        'X-Requested-With': 'XMLHttpRequest',
        'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
        'Cache-Control': 'no-store, no-cache'
      },
      body: body,
      cache: 'no-store'
    }).then(r => r.text())
      .then(txt => addLog('Resposta: ' + txt))
      .catch(e => addLog('Erro: ' + e, 'red'));
  };

  // Foco na primeira input
  setTimeout(() => document.getElementById('mscKey').focus(), 300);
})();