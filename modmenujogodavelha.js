javascript:(function(){
if(window.__TTTMENU){document.getElementById('__tttmenu').style.display='flex';return;}
window.__TTTMENU=true;
var hackOn=false;
var mySym=null;

function detectMySymbol(){
  var html=document.body.innerHTML;
  // tenta achar qual simbolo e do jogador logado no HTML
  var patterns=[
    /you are[:\s]*["']?([XO])["']?/i,
    /minha pe[ç c]a[:\s]*["']?([XO])["']?/i,
    /playing as[:\s]*["']?([XO])["']?/i,
    /player[:\s]*["']?([XO])["']?/i,
    /your (symbol|piece|side)[:\s]*["']?([XO])["']?/i,
    /"symbol"\s*:\s*"([XO])"/i,
    /"piece"\s*:\s*"([XO])"/i,
    /"player_symbol"\s*:\s*"([XO])"/i,
    /"my_symbol"\s*:\s*"([XO])"/i,
  ];
  for(var i=0;i<patterns.length;i++){
    var m=html.match(patterns[i]);
    if(m){return m[m.length-1];}
  }
  // tenta window/localStorage/sessionStorage
  try{
    var keys=['symbol','mySymbol','playerSymbol','piece','mySide','player'];
    for(var k=0;k<keys.length;k++){
      if(window[keys[k]]&&/^[XO]$/.test(window[keys[k]]))return window[keys[k]];
      var ls=localStorage.getItem(keys[k]);
      if(ls&&/^[XO]$/.test(ls))return ls;
    }
  }catch(e){}
  return null;
}

function updateStatus(txt,color){
  var el=document.getElementById('__tttStatus');
  if(el){el.textContent=txt;el.style.color=color||'#00ff41';el.style.borderColor=color||'#00ff41';}
}

function log(msg){
  var el=document.getElementById('__tttLog');
  if(!el)return;
  var d=document.createElement('div');
  d.style.color='#00ff41';
  d.textContent='> '+msg;
  el.appendChild(d);
  el.scrollTop=el.scrollHeight;
}

var ui=document.createElement('div');
ui.id='__tttmenu';
ui.style.cssText='position:fixed;top:20px;right:20px;z-index:99999;background:#0a0a0a;border:2px solid #00ff41;border-radius:4px;padding:16px;min-width:230px;font-family:monospace;font-size:13px;color:#00ff41;box-shadow:0 0 30px rgba(0,255,65,0.3);display:flex;flex-direction:column;gap:10px;';
ui.innerHTML='<div style="display:flex;justify-content:space-between;align-items:center;"><b style="color:#ff003c;letter-spacing:2px;">☠ TTT HACK</b><span onclick="document.getElementById(\'__tttmenu\').style.display=\'none\'" style="cursor:pointer;color:#555;font-size:16px;">✕</span></div>'
+'<div id="__tttSymDisplay" style="text-align:center;padding:6px;background:#111;border:1px solid #222;color:#555;font-size:11px;">Simbolo: detectando...</div>'
+'<div style="display:flex;gap:6px;">'
+'<button onclick="__tttForce(\'X\')" style="flex:1;padding:7px;background:#111;border:2px solid #222;color:#555;font-family:monospace;font-weight:bold;cursor:pointer;">X</button>'
+'<button onclick="__tttForce(\'O\')" style="flex:1;padding:7px;background:#111;border:2px solid #222;color:#555;font-family:monospace;font-weight:bold;cursor:pointer;">O</button>'
+'<button onclick="__tttDetect()" style="flex:1;padding:7px;background:#111;border:1px solid #333;color:#555;font-family:monospace;cursor:pointer;font-size:10px;">AUTO</button>'
+'</div>'
+'<div id="__tttStatus" style="text-align:center;padding:8px;background:#111;border:1px solid #1a1a1a;color:#444;font-size:11px;letter-spacing:1px;">HACK DESATIVADO</div>'
+'<button id="__tttToggle" onclick="__tttToggle()" style="padding:10px;background:rgba(0,255,65,0.1);border:2px solid #00ff41;color:#00ff41;font-family:monospace;font-weight:bold;cursor:pointer;letter-spacing:2px;font-size:12px;">▶ ATIVAR HACK</button>'
+'<div id="__tttLog" style="font-size:10px;color:#555;max-height:90px;overflow-y:auto;border-top:1px solid #111;padding-top:6px;line-height:1.8;"></div>';
document.body.appendChild(ui);

window.__tttForce=function(s){
  mySym=s;
  document.getElementById('__tttSymDisplay').textContent='Simbolo: '+s+' (manual)';
  document.getElementById('__tttSymDisplay').style.color='#00ff41';
  log('Forcado manualmente: '+s);
};

window.__tttDetect=function(){
  var s=detectMySymbol();
  if(s){
    mySym=s;
    document.getElementById('__tttSymDisplay').textContent='Simbolo: '+s+' (auto)';
    document.getElementById('__tttSymDisplay').style.color='#00ff41';
    log('Auto detectado: '+s);
  }else{
    log('Nao detectou — use X ou O manual');
    document.getElementById('__tttSymDisplay').style.color='#ff003c';
    document.getElementById('__tttSymDisplay').textContent='Nao detectado — escolha manual';
  }
};

window.__tttToggle=function(){
  hackOn=!hackOn;
  var btn=document.getElementById('__tttToggle');
  if(hackOn){
    btn.textContent='■ DESATIVAR';
    btn.style.borderColor='#ff003c';btn.style.color='#ff003c';btn.style.background='rgba(255,0,60,0.1)';
    updateStatus('✓ ATIVO'+( mySym?' — MEU SYM: '+mySym:' — AGUARDANDO PAYLOAD'),'#00ff41');
    log('Hack ativado! Faca uma jogada.');
  }else{
    btn.textContent='▶ ATIVAR HACK';
    btn.style.borderColor='#00ff41';btn.style.color='#00ff41';btn.style.background='rgba(0,255,65,0.1)';
    updateStatus('HACK DESATIVADO','#444');
    log('Hack desativado.');
  }
};

function fill(body){
  try{
    var d=JSON.parse(body);
    var board=d.board||[];

    // descobre meu simbolo pela payload se ainda nao souber:
    // conta quantos X e O tem no board atual
    // o simbolo que aparece na jogada que EU fiz e o current_turn
    var sym=mySym;

    if(!sym){
      // pega o current_turn — esse e quem acabou de jogar (quem enviou o PATCH)
      sym=d.current_turn||null;
      if(sym){
        mySym=sym;
        document.getElementById('__tttSymDisplay').textContent='Simbolo: '+sym+' (payload)';
        log('Simbolo detectado do payload: '+sym);
      }
    }

    if(!sym){log('Sem simbolo! Use botao X ou O');return body;}

    d.board=[sym,sym,sym,sym,sym,sym,sym,sym,sym];
    d.status='finished';
    d.winner=sym;
    d.current_turn=sym;
    log('Board preenchido: '+sym+' x9');
    updateStatus('☠ GANHOU COM '+sym+'!','#ff003c');
    return JSON.stringify(d);
  }catch(e){log('Erro parse: '+e.message);return body;}
}

function isTarget(url){
  return url&&url.indexOf('supabase.co')>-1&&url.indexOf('game_rooms')>-1;
}

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

if(!window.__tttXHRHooked){
  var OX=window.XMLHttpRequest;
  window.XMLHttpRequest=function(){
    var x=new OX();var m='',u='';
    var _o=x.open;x.open=function(a,b){m=a;u=b;return _o.apply(x,arguments);};
    var _s=x.send;x.send=function(body){
      if(hackOn&&m.toUpperCase()==='PATCH'&&isTarget(u)){
        return _s.call(x,fill(body||'{}'));
      }
      return _s.call(x,body);
    };
    return x;
  };
  window.__tttXHRHooked=true;
}

// tenta detectar automatico ja ao carregar
__tttDetect();
log('Pronto. Ative e faca uma jogada!');
})();