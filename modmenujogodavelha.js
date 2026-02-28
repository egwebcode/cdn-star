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

// Le do HTML AGORA, toda vez que chamado
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

var ui=document.createElement('div');
ui.id='__tttmenu';
ui.style.cssText='position:fixed;top:20px;right:20px;z-index:99999;background:#0a0a0a;border:2px solid #00ff41;border-radius:4px;padding:16px;min-width:230px;font-family:monospace;font-size:13px;color:#00ff41;box-shadow:0 0 30px rgba(0,255,65,0.3);display:flex;flex-direction:column;gap:10px;';
ui.innerHTML=''
+'<div style="display:flex;justify-content:space-between;align-items:center;">'
+'<b style="color:#ff003c;letter-spacing:2px;">☠ TTT HACK</b>'
+'<span onclick="document.getElementById(\'__tttmenu\').style.display=\'none\'" style="cursor:pointer;color:#555;font-size:16px;">✕</span>'
+'</div>'
+'<div id="__tttSymDisplay" style="text-align:center;padding:8px;background:#111;border:1px solid #222;color:#555;font-size:12px;">Detectando...</div>'
+'<div style="font-size:10px;color:#444;text-align:center;">Auto le HTML. Force manual se precisar:</div>'
+'<div style="display:flex;gap:6px;">'
+'<button onclick="__tttForce(\'X\')" id="__btnX" style="flex:1;padding:8px;background:#111;border:2px solid #222;color:#555;font-family:monospace;font-weight:bold;font-size:15px;cursor:pointer;">X</button>'
+'<button onclick="__tttForce(\'O\')" id="__btnO" style="flex:1;padding:8px;background:#111;border:2px solid #222;color:#555;font-family:monospace;font-weight:bold;font-size:15px;cursor:pointer;">O</button>'
+'<button onclick="__tttClearManual()" style="flex:1;padding:8px;background:#111;border:1px solid #222;color:#555;font-family:monospace;font-size:10px;cursor:pointer;">AUTO</button>'
+'</div>'
+'<div id="__tttStatus" style="text-align:center;padding:8px;background:#111;border:1px solid #1a1a1a;color:#444;font-size:11px;letter-spacing:1px;">HACK DESATIVADO</div>'
+'<button id="__tttToggle" onclick="__tttToggle()" style="padding:10px;background:rgba(0,255,65,0.1);border:2px solid #00ff41;color:#00ff41;font-family:monospace;font-weight:bold;cursor:pointer;letter-spacing:2px;font-size:12px;">▶ ATIVAR HACK</button>'
+'<div id="__tttLog" style="font-size:10px;color:#555;max-height:90px;overflow-y:auto;border-top:1px solid #111;padding-top:6px;line-height:1.8;"></div>';
document.body.appendChild(ui);

window.__tttForce=function(s){
  manualSym=s;
  document.getElementById('__btnX').style.cssText='flex:1;padding:8px;border:2px solid '+(s==='X'?'#ff003c':'#222')+';background:'+(s==='X'?'rgba(255,0,60,0.15)':'#111')+';color:'+(s==='X'?'#ff003c':'#555')+';font-family:monospace;font-weight:bold;font-size:15px;cursor:pointer;';
  document.getElementById('__btnO').style.cssText='flex:1;padding:8px;border:2px solid '+(s==='O'?'#00bfff':'#222')+';background:'+(s==='O'?'rgba(0,191,255,0.15)':'#111')+';color:'+(s==='O'?'#00bfff':'#555')+';font-family:monospace;font-weight:bold;font-size:15px;cursor:pointer;';
  updateSymDisplay();
  log('Manual: '+s);
};

window.__tttClearManual=function(){
  manualSym=null;
  document.getElementById('__btnX').style.cssText='flex:1;padding:8px;border:2px solid #222;background:#111;color:#555;font-family:monospace;font-weight:bold;font-size:15px;cursor:pointer;';
  document.getElementById('__btnO').style.cssText='flex:1;padding:8px;border:2px solid #222;background:#111;color:#555;font-family:monospace;font-weight:bold;font-size:15px;cursor:pointer;';
  updateSymDisplay();
  log('Voltou para AUTO');
};

window.__tttToggle=function(){
  hackOn=!hackOn;
  var btn=document.getElementById('__tttToggle');
  if(hackOn){
    btn.textContent='■ DESATIVAR';
    btn.style.borderColor='#ff003c';btn.style.color='#ff003c';btn.style.background='rgba(255,0,60,0.1)';
    updateStatus('✓ ATIVO — SEMPRE GANHAR','#00ff41');
    log('Hack ativado!');
  }else{
    btn.textContent='▶ ATIVAR HACK';
    btn.style.borderColor='#00ff41';btn.style.color='#00ff41';btn.style.background='rgba(0,255,65,0.1)';
    updateStatus('HACK DESATIVADO','#444');
    log('Desativado.');
  }
};

function fill(body){
  try{
    var d=JSON.parse(body);
    // SEMPRE le do HTML agora, ignora cache
    var s=manualSym||detectNow();
    if(!s){
      log('ERRO: nao detectou simbolo!');
      updateStatus('ERRO: use manual X ou O','#ff003c');
      return body;
    }
    log('Simbolo AGORA: '+s);
    d.board=[s,s,s,s,s,s,s,s,s];
    d.status='finished';
    d.winner=s;
    d.current_turn=s;
    updateStatus('☠ GANHOU COM '+s+'!','#ff003c');
    updateSymDisplay();
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

// Atualiza display a cada 2s automaticamente
setInterval(function(){
  if(document.getElementById('__tttmenu'))updateSymDisplay();
},2000);

updateSymDisplay();
log('Pronto! Ative e jogue.');
})();