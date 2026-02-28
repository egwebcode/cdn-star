javascript:(function(){
  if(window.__TTTMENU){document.getElementById('__tttmenu').style.display='flex';return;}
  window.__TTTMENU=true;
  var hackOn=false;
  var manualSym=null;

  function log(msg){
    var el=document.getElementById('__tttLog');
    if(!el)return;
    var d=document.createElement('div');
    d.style.color='#00ff41';
    d.textContent='> '+msg;
    el.appendChild(d);
    el.scrollTop=el.scrollHeight;
  }

  function updateStatus(txt,color){
    var el=document.getElementById('__tttStatus');
    if(el){el.textContent=txt;el.style.color=color;el.style.borderColor=color;}
  }

  function detectNow(){
    var els=document.querySelectorAll('p');
    for(var i=0;i<els.length;i++){
      var m=els[i].textContent.match(/Sua vez\s*\(([XO])\)/i);
      if(m)return m[1];
    }
    var m2=document.body.innerHTML.match(/Sua vez\s*\(([XO])\)/i);
    if(m2)return m2[1];
    return null;
  }

  function updateSymDisplay(){
    var s=manualSym||detectNow();
    var el=document.getElementById('__tttSymDisplay');
    if(!el)return;
    if(s){
      el.textContent='Voce e: '+s+(manualSym?' (manual)':' (HTML)');
      el.style.color='#00ff41';
    }else{
      el.textContent='Nao detectado — use manual';
      el.style.color='#ff003c';
    }
    return s;
  }

  // ── Estilos globais do menu ──────────────────────────────────────────
  var style=document.createElement('style');
  style.textContent=`
    #__tttmenu {
      position: fixed;
      top: 20px;
      right: 20px;
      z-index: 99999;
      background: #0a0a0a;
      border: 2px solid #00ff41;
      border-radius: 6px;
      padding: 18px;
      min-width: 260px;
      font-family: 'Courier New', monospace;
      font-size: 13px;
      color: #00ff41;
      box-shadow: 0 0 40px rgba(0,255,65,0.35), 0 0 80px rgba(0,255,65,0.1);
      display: flex;
      flex-direction: column;
      gap: 10px;
      user-select: none;
    }
    #__tttmenu * { box-sizing: border-box; }

    #__tttmenu .ttt-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 1px solid #1a1a1a;
      padding-bottom: 10px;
    }
    #__tttmenu .ttt-title {
      font-size: 15px;
      font-weight: bold;
      color: #ff003c;
      letter-spacing: 3px;
      text-shadow: 0 0 10px rgba(255,0,60,0.5);
    }
    #__tttmenu .ttt-close {
      cursor: pointer;
      color: #444;
      font-size: 18px;
      line-height: 1;
      transition: color .2s;
    }
    #__tttmenu .ttt-close:hover { color: #ff003c; }

    #__tttmenu .ttt-sym-display {
      text-align: center;
      padding: 10px;
      background: #111;
      border: 1px solid #222;
      border-radius: 4px;
      color: #555;
      font-size: 12px;
      letter-spacing: 1px;
      transition: all .3s;
    }

    #__tttmenu .ttt-label {
      font-size: 10px;
      color: #444;
      text-align: center;
      letter-spacing: 2px;
    }

    #__tttmenu .ttt-sym-row {
      display: flex;
      gap: 6px;
    }
    #__tttmenu .ttt-sym-row button {
      flex: 1;
      padding: 10px;
      background: #111;
      border: 2px solid #222;
      color: #555;
      font-family: 'Courier New', monospace;
      font-weight: bold;
      font-size: 16px;
      cursor: pointer;
      border-radius: 4px;
      transition: all .2s;
    }
    #__tttmenu .ttt-sym-row button:hover { border-color: #444; color: #888; }
    #__tttmenu .ttt-sym-row button.active-x {
      border-color: #ff003c;
      background: rgba(255,0,60,0.15);
      color: #ff003c;
      box-shadow: 0 0 12px rgba(255,0,60,0.3);
    }
    #__tttmenu .ttt-sym-row button.active-o {
      border-color: #00bfff;
      background: rgba(0,191,255,0.15);
      color: #00bfff;
      box-shadow: 0 0 12px rgba(0,191,255,0.3);
    }
    #__tttmenu .ttt-sym-row button.active-auto {
      border-color: #00ff41;
      background: rgba(0,255,65,0.1);
      color: #00ff41;
    }

    #__tttStatus {
      text-align: center;
      padding: 10px;
      background: #111;
      border: 1px solid #1a1a1a;
      border-radius: 4px;
      color: #444;
      font-size: 11px;
      letter-spacing: 1px;
      transition: all .3s;
    }

    #__tttToggle {
      padding: 12px;
      background: rgba(0,255,65,0.08);
      border: 2px solid #00ff41;
      color: #00ff41;
      font-family: 'Courier New', monospace;
      font-weight: bold;
      font-size: 13px;
      letter-spacing: 3px;
      cursor: pointer;
      border-radius: 4px;
      transition: all .2s;
    }
    #__tttToggle:hover { background: rgba(0,255,65,0.18); }
    #__tttToggle.off {
      border-color: #ff003c;
      color: #ff003c;
      background: rgba(255,0,60,0.08);
    }
    #__tttToggle.off:hover { background: rgba(255,0,60,0.18); }

    #__tttLog {
      font-size: 10px;
      color: #555;
      max-height: 100px;
      overflow-y: auto;
      border-top: 1px solid #111;
      padding-top: 8px;
      line-height: 1.9;
    }
    #__tttLog::-webkit-scrollbar { width: 3px; }
    #__tttLog::-webkit-scrollbar-thumb { background: #222; }

    #__tttmenu .ttt-version {
      font-size: 9px;
      color: #222;
      text-align: center;
      letter-spacing: 2px;
    }
  `;
  document.head.appendChild(style);

  // ── HTML do menu ────────────────────────────────────────────────────
  var ui=document.createElement('div');
  ui.id='__tttmenu';
  ui.innerHTML=`
    <div class="ttt-header">
      <span class="ttt-title">☠ TTT HACK</span>
      <span class="ttt-close" onclick="document.getElementById('__tttmenu').style.display='none'">✕</span>
    </div>

    <div id="__tttSymDisplay" class="ttt-sym-display">Detectando simbolo...</div>

    <div class="ttt-label">FORCE MANUAL SE PRECISAR</div>
    <div class="ttt-sym-row">
      <button id="__btnX" onclick="__tttForce('X')">✕ X</button>
      <button id="__btnO" onclick="__tttForce('O')">○ O</button>
      <button id="__btnAuto" class="active-auto" onclick="__tttClearManual()" style="font-size:11px;letter-spacing:1px;">AUTO</button>
    </div>

    <div id="__tttStatus">HACK DESATIVADO</div>

    <button id="__tttToggle" onclick="__tttToggle()">▶ ATIVAR HACK</button>

    <div id="__tttLog"></div>
    <div class="ttt-version">// SEMPRE GANHAR v3 //</div>
  `;
  document.body.appendChild(ui);

  // ── Funções ──────────────────────────────────────────────────────────
  window.__tttForce=function(s){
    manualSym=s;
    document.getElementById('__btnX').className=s==='X'?'active-x':'';
    document.getElementById('__btnO').className=s==='O'?'active-o':'';
    document.getElementById('__btnAuto').className='';
    updateSymDisplay();
    log('Forcado manual: '+s);
  };

  window.__tttClearManual=function(){
    manualSym=null;
    document.getElementById('__btnX').className='';
    document.getElementById('__btnO').className='';
    document.getElementById('__btnAuto').className='active-auto';
    updateSymDisplay();
    log('Modo AUTO ativado');
  };

  window.__tttToggle=function(){
    hackOn=!hackOn;
    var btn=document.getElementById('__tttToggle');
    if(hackOn){
      btn.textContent='■ DESATIVAR HACK';
      btn.classList.add('off');
      updateStatus('✓ ATIVO — SEMPRE GANHAR','#00ff41');
      log('Hack ATIVADO! Faca uma jogada.');
    }else{
      btn.textContent='▶ ATIVAR HACK';
      btn.classList.remove('off');
      updateStatus('HACK DESATIVADO','#444');
      log('Hack desativado.');
    }
  };

  function fill(body){
    try{
      var d=JSON.parse(body);
      var s=manualSym||detectNow();
      if(!s){
        log('ERRO: simbolo nao detectado!');
        updateStatus('ERRO — use X ou O manual','#ff003c');
        return body;
      }
      d.board=[s,s,s,s,s,s,s,s,s];
      d.status='finished';
      d.winner=s;
      d.current_turn=s;
      log('PATCH interceptado! Winner: '+s);
      updateStatus('☠ GANHOU COM '+s+'!','#ff003c');
      updateSymDisplay();
      return JSON.stringify(d);
    }catch(e){
      log('Erro parse: '+e.message);
      return body;
    }
  }

  function isTarget(url){
    return url&&url.indexOf('supabase.co')>-1&&url.indexOf('game_rooms')>-1;
  }

  // ── Hook fetch ───────────────────────────────────────────────────────
  if(!window.__tttFetchHooked){
    var oF=window.fetch;
    window.fetch=function(input,init){
      var url=typeof input==='string'?input:(input&&input.url)||'';
      if(hackOn&&isTarget(url)&&init&&init.method&&init.method.toUpperCase()==='PATCH'){
        var ni=Object.assign({},init);
        ni.body=fill(ni.body||'{}');
        return oF(input,ni);
      }
      return oF(input,init);
    };
    window.__tttFetchHooked=true;
  }

  // ── Hook XHR ─────────────────────────────────────────────────────────
  if(!window.__tttXHRHooked){
    var OX=window.XMLHttpRequest;
    window.XMLHttpRequest=function(){
      var x=new OX();
      var m='',u='';
      var _o=x.open;
      x.open=function(a,b){m=a;u=b;return _o.apply(x,arguments);};
      var _s=x.send;
      x.send=function(body){
        if(hackOn&&m.toUpperCase()==='PATCH'&&isTarget(u)){
          return _s.call(x,fill(body||'{}'));
        }
        return _s.call(x,body);
      };
      return x;
    };
    window.__tttXHRHooked=true;
  }

  // ── Atualiza simbolo a cada 2s ───────────────────────────────────────
  setInterval(function(){
    if(document.getElementById('__tttmenu'))updateSymDisplay();
  },2000);

  updateSymDisplay();
  log('Script carregado. Ative e jogue!');

})();