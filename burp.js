/**
 * ╔══════════════════════════════════════════════════════════════════════════════╗
 * ║                    🛡️ JS BURP SUITE PRO - GOLD EDITION 🛡️                    ║
 * ║                                                                              ║
 * ║  Advanced Network Interceptor & Penetration Testing Tool                     ║
 * ║  Version: 3.0.0 (Raw Mode & Response Interception)                           ║
 * ╚══════════════════════════════════════════════════════════════════════════════╝
 */

(function() {
  'use strict';

  if (window.__JS_BURP_SUITE_LOADED__) {
    if(window.__burpUI__) window.__burpUI__.toggleMinimize();
    return;
  }
  window.__JS_BURP_SUITE_LOADED__ = true;

  // ==========================================
  // 1. HELPERS: RAW HTTP PARSER
  // ==========================================
  const HttpParser = {
    // Object -> Raw Request String
    requestToRaw: (method, url, headers, body) => {
      let path = url;
      let host = '';
      try {
        const u = new URL(url);
        path = u.pathname + u.search;
        host = u.host;
      } catch(e) {}

      // Ensure Host header exists
      const headerMap = {...headers};
      let hostKey = Object.keys(headerMap).find(k => k.toLowerCase() === 'host');
      if (!hostKey && host) {
        headerMap['Host'] = host;
      }

      let raw = `${method} ${path} HTTP/1.1\n`;
      for(let key in headerMap) {
        raw += `${key}: ${headerMap[key]}\n`;
      }
      raw += `\n${body || ''}`;
      return raw;
    },

    // Object -> Raw Response String
    responseToRaw: (status, statusText, headers, body) => {
      let raw = `HTTP/1.1 ${status} ${statusText || 'OK'}\n`;
      for(let key in headers) {
        raw += `${key}: ${headers[key]}\n`;
      }
      raw += `\n${body || ''}`;
      return raw;
    },

    // Raw String -> Object
    parseRaw: (rawString) => {
      // Normalize newlines
      const normalized = rawString.replace(/\r\n/g, '\n');
      const parts = normalized.split('\n\n');
      const headerPart = parts[0];
      const bodyPart = parts.slice(1).join('\n\n');
      
      const lines = headerPart.split('\n');
      const firstLine = lines[0].trim().split(' ');
      
      const headers = {};
      for(let i=1; i<lines.length; i++) {
        const line = lines[i].trim();
        if(!line) continue;
        const separator = line.indexOf(':');
        if(separator > -1) {
          const key = line.substring(0, separator).trim();
          const val = line.substring(separator+1).trim();
          headers[key] = val;
        }
      }

      return {
        firstLine, // Request: [METHOD, PATH, PROTOCOL], Response: [PROTOCOL, STATUS, TEXT]
        headers,
        body: bodyPart
      };
    }
  };

  // ==========================================
  // 2. CONFIGURATION & STATE
  // ==========================================
  const SETTINGS = {
    theme: 'gold', // gold, dark, matrix
    opacity: 0.95,
    fontSize: 13,
    corsBypass: false,
    interceptRequests: false,
    interceptResponses: false,
  };

  const THEMES = {
    gold: {
      primary: '#FFD700',
      bg: '#1a1a1a',
      bgDark: '#0f0f0f',
      text: '#e0e0e0',
      accent: '#B8860B',
      border: '#B8860B'
    },
    dark: {
      primary: '#3b82f6',
      bg: '#1f2937',
      bgDark: '#111827',
      text: '#f3f4f6',
      accent: '#2563eb',
      border: '#374151'
    },
    matrix: {
      primary: '#00ff00',
      bg: '#000000',
      bgDark: '#0a0a0a',
      text: '#00dd00',
      accent: '#008800',
      border: '#004400'
    }
  };

  // ==========================================
  // 3. CORE INTERCEPTOR ENGINE
  // ==========================================
  class InterceptorEngine {
    constructor() {
      // Safely capture original fetch
      this.originalFetch = window.fetch.bind(window);
      this.originalXhrOpen = XMLHttpRequest.prototype.open;
      this.originalXhrSend = XMLHttpRequest.prototype.send;
      this.listeners = {};
      this.logs = [];
      this.init();
    }

    init() {
      this.patchFetch();
      this.patchXhr(); 
    }

    on(event, cb) { 
      if(!this.listeners[event]) this.listeners[event] = [];
      this.listeners[event].push(cb);
    }
    
    emit(event, data) {
      if(this.listeners[event]) this.listeners[event].forEach(cb => cb(data));
    }

    log(data) {
      this.logs.unshift(data);
      if(this.logs.length > 200) this.logs.pop();
      this.emit('log', data);
    }

    // --- FETCH PATCH ---
    patchFetch() {
      const self = this;
      
      const hookedFetch = async function(input, init = {}) {
        const id = Date.now().toString(36) + Math.random().toString(36).substr(2,5);
        let url = typeof input === 'string' ? input : input.url;
        let method = init.method || 'GET';
        let headers = init.headers || {};
        // Normalize headers to object
        if (headers instanceof Headers) {
           const h = {};
           headers.forEach((v, k) => h[k] = v);
           headers = h;
        }
        let body = init.body;

        // 1. REQUEST INTERCEPTION
        if (SETTINGS.interceptRequests) {
          try {
            // Convert body to string if possible for editing
            let bodyStr = body;
            if (body && typeof body !== 'string') bodyStr = '[Binary/Stream Object]';

            const modified = await self.askUserForRequest({ id, url, method, headers, body: bodyStr });
            
            url = modified.url;
            method = modified.method;
            headers = modified.headers;
            body = modified.body;
          } catch (e) {
            self.log({ id, type: 'Blocked', method, url, status: 0, duration: 0, size: 0 });
            throw new Error('Request dropped by Burp Suite');
          }
        }

        // CORS Bypass
        let finalUrl = url;
        if (SETTINGS.corsBypass && url.startsWith('http') && !url.includes('corsproxy.io')) {
          finalUrl = 'https://corsproxy.io/?' + encodeURIComponent(url);
        }

        const start = Date.now();
        let response;
        
        try {
          response = await self.originalFetch(finalUrl, { ...init, method, headers, body });
        } catch(err) {
          self.log({ id, type: 'Error', method, url, status: 0, duration: Date.now() - start, size: 0, error: err.message });
          throw err;
        }

        // 2. RESPONSE INTERCEPTION
        if (SETTINGS.interceptResponses) {
          const clone = response.clone();
          let resBody = '';
          try { resBody = await clone.text(); } catch(e) { resBody = '[Binary]'; }
          
          const resHeaders = {};
          clone.headers.forEach((v, k) => resHeaders[k] = v);

          try {
            const modifiedRes = await self.askUserForResponse({ 
              id, url, status: response.status, statusText: response.statusText, 
              headers: resHeaders, body: resBody 
            });

            // Create new mocked response
            response = new Response(modifiedRes.body, {
              status: parseInt(modifiedRes.status),
              statusText: modifiedRes.statusText,
              headers: modifiedRes.headers
            });
          } catch(e) {
             throw new Error('Response dropped by Burp Suite');
          }
        }

        // Log final result
        const logClone = response.clone();
        logClone.text().then(text => {
             self.log({
                id, type: 'Fetch', method, url, 
                status: response.status, 
                duration: Date.now() - start,
                size: text.length,
                body: text.slice(0, 1000)
             });
        }).catch(() => {
             self.log({
                id, type: 'Fetch', method, url, 
                status: response.status, 
                duration: Date.now() - start,
                size: 0,
                body: '[Binary]'
             });
        });

        return response;
      };

      // Apply patch safely
      try {
        window.fetch = hookedFetch;
      } catch(e) {
        Object.defineProperty(window, 'fetch', { value: hookedFetch, writable: true });
      }
    }

    patchXhr() {
        const self = this;
        XMLHttpRequest.prototype.open = function(method, url) {
            this._burp = { method, url, start: Date.now() };
            return self.originalXhrOpen.apply(this, arguments);
        };
        XMLHttpRequest.prototype.send = function(body) {
            const xhr = this;
            this.addEventListener('loadend', () => {
                if(xhr._burp) {
                    self.log({
                        id: Date.now().toString(), type: 'XHR', 
                        method: xhr._burp.method, url: xhr._burp.url, 
                        status: xhr.status, duration: Date.now() - xhr._burp.start,
                        size: xhr.response?.length || 0,
                        body: (typeof xhr.response === 'string') ? xhr.response.slice(0,1000) : '[Binary]'
                    });
                }
            });
            return self.originalXhrSend.apply(this, arguments);
        };
    }

    // Promise-based UI hooks
    askUserForRequest(reqData) {
      return new Promise((resolve, reject) => {
        this.emit('intercept-req', { data: reqData, resolve, reject });
      });
    }

    askUserForResponse(resData) {
      return new Promise((resolve, reject) => {
        this.emit('intercept-res', { data: resData, resolve, reject });
      });
    }
  }

  // ==========================================
  // 4. UI MANAGER
  // ==========================================
  class BurpUI {
    constructor(engine) {
      this.engine = engine;
      this.container = null;
      this.activeTab = 'network';
      this.isMinimized = false;
      this.interceptQueue = []; // { type: 'req'|'res', data, resolve, reject }
      this.currentIntercept = null;
      
      this.repeaterState = { 
        raw: 'GET / HTTP/1.1\nHost: example.com\nAccept: */*\n\n', 
        response: '' 
      };
      
      this.init();
    }

    init() {
      this.injectStyles();
      this.createDOM();
      this.bindEvents();
      this.setupDraggable();
      
      // Hook into engine
      this.engine.on('log', () => this.refreshNetwork());
      
      this.engine.on('intercept-req', (obj) => {
        this.interceptQueue.push({ type: 'req', ...obj });
        this.processQueue();
      });
      
      this.engine.on('intercept-res', (obj) => {
        this.interceptQueue.push({ type: 'res', ...obj });
        this.processQueue();
      });

      this.render();
      this.updateThemeCSS();
    }

    processQueue() {
      if(this.currentIntercept) return; // UI Busy
      if(this.interceptQueue.length === 0) {
        this.renderInterceptEditor(); // Clear editor
        return;
      }

      this.currentIntercept = this.interceptQueue.shift();
      
      // Auto switch to intercept tab and un-minimize
      this.activeTab = 'intercept';
      this.isMinimized = false;
      this.render();
      this.renderInterceptEditor();
    }

    toggleMinimize() {
      this.isMinimized = !this.isMinimized;
      this.render();
    }

    getTheme() { return THEMES[SETTINGS.theme]; }

    injectStyles() {
      const css = `
        #js-burp-root {
            position: fixed; top: 20px; right: 20px;
            width: 800px; height: 600px;
            background: var(--bg); color: var(--text);
            font-family: 'Consolas', 'Monaco', monospace;
            z-index: 999999;
            box-shadow: 0 20px 50px rgba(0,0,0,0.8);
            border: 2px solid var(--border);
            border-radius: 8px;
            display: flex; flex-direction: column;
            overflow: hidden;
            font-size: var(--fontSize);
            opacity: var(--opacity);
            transition: opacity 0.2s, width 0.2s, height 0.2s;
        }
        #js-burp-root.minimized {
            width: 60px !important; height: 60px !important;
            border-radius: 50%; overflow: hidden; cursor: pointer;
            top: auto !important; bottom: 20px !important; right: 20px !important; left: auto !important;
            border-width: 4px;
        }
        .burp-header {
            background: var(--bgDark); padding: 8px 12px;
            border-bottom: 1px solid var(--border);
            display: flex; justify-content: space-between; align-items: center;
            cursor: move; user-select: none;
        }
        .burp-tabs {
            display: flex; background: var(--bgDark);
            border-bottom: 1px solid var(--border);
            overflow-x: auto; flex-shrink: 0;
        }
        .burp-tab {
            padding: 10px 16px; cursor: pointer; opacity: 0.7;
            border-bottom: 2px solid transparent; white-space: nowrap; font-weight: 600;
        }
        .burp-tab.active { opacity: 1; border-color: var(--primary); color: var(--primary); background: rgba(255,255,255,0.05); }
        
        .burp-content { flex: 1; display: none; overflow: hidden; position: relative; flex-direction: column; }
        .burp-content.active { display: flex; }
        
        .burp-toolbar {
            padding: 8px; border-bottom: 1px solid var(--border);
            display: flex; gap: 8px; align-items: center;
            flex-wrap: wrap; background: rgba(0,0,0,0.2); flex-shrink: 0;
        }
        
        .burp-btn {
            background: #2a2a2a; border: 1px solid #444; color: #fff;
            padding: 6px 12px; border-radius: 4px; cursor: pointer; font-size: 12px; font-weight: 600;
            transition: all 0.2s;
        }
        .burp-btn:hover { background: #444; border-color: #666; }
        .burp-btn.primary { background: var(--primary); color: #000; border: none; }
        .burp-btn.danger { background: #900; border-color: #f00; color: #fff; }
        
        textarea.burp-raw-editor {
            width: 100%; height: 100%; background: var(--bg); color: var(--primary);
            border: none; padding: 12px; resize: none; outline: none;
            font-family: inherit; font-size: inherit; line-height: 1.4;
        }
        
        .burp-table { width: 100%; border-collapse: collapse; font-size: 12px; }
        .burp-table th { text-align: left; padding: 8px; background: var(--bgDark); position: sticky; top: 0; border-bottom: 1px solid var(--border); color: var(--primary); }
        .burp-table td { padding: 6px 8px; border-bottom: 1px solid #333; white-space: nowrap; overflow: hidden; max-width: 200px; text-overflow: ellipsis; }
        .burp-table tr:hover { background: rgba(255,255,255,0.05); cursor: pointer; }
        
        .burp-form-group { margin-bottom: 15px; }
        .burp-form-group label { display: block; margin-bottom: 5px; color: var(--text); opacity: 0.8; }
        .burp-input, .burp-select { 
            width: 100%; padding: 8px; background: var(--bgDark); border: 1px solid var(--border); 
            color: var(--text); border-radius: 4px; outline: none; font-family: inherit;
        }
        
        /* Mobile Overrides */
        @media (max-width: 768px) {
            #js-burp-root {
                top: 0 !important; left: 0 !important; right: 0 !important; bottom: 0 !important;
                width: 100% !important; height: 100% !important;
                border-radius: 0; border: none;
            }
            .burp-header { padding: 15px; }
            .burp-btn { padding: 8px 14px; }
        }
      `;
      const s = document.createElement('style');
      s.innerHTML = css;
      document.head.appendChild(s);
    }

    createDOM() {
      this.container = document.createElement('div');
      this.container.id = 'js-burp-root';
      document.body.appendChild(this.container);
    }

    updateThemeCSS() {
        const t = this.getTheme();
        const style = this.container.style;
        style.setProperty('--bg', t.bg);
        style.setProperty('--bgDark', t.bgDark);
        style.setProperty('--text', t.text);
        style.setProperty('--primary', t.primary);
        style.setProperty('--accent', t.accent);
        style.setProperty('--border', t.border);
        style.setProperty('--fontSize', SETTINGS.fontSize + 'px');
        style.setProperty('--opacity', SETTINGS.opacity);
    }

    render() {
      const pendingCount = this.interceptQueue.length + (this.currentIntercept ? 1 : 0);
      
      // Minimal Mode
      if(this.isMinimized) {
          this.container.className = 'minimized';
          this.container.innerHTML = `<div style="display:flex;align-items:center;justify-content:center;height:100%;font-size:30px;">🛡️</div>`;
          return;
      }
      this.container.className = '';

      // Full Interface
      this.container.innerHTML = `
        <div class="burp-header">
            <div style="font-weight:bold; color:var(--primary); display:flex; gap:10px; align-items:center;">
                🛡️ JS BURP SUITE <span style="font-size:10px; opacity:0.7; border:1px solid var(--primary); padding:1px 4px; border-radius:4px;">GOLD v3.0</span>
            </div>
            <div>
                <button class="burp-btn" id="btn-minimize">_</button>
            </div>
        </div>
        <div class="burp-tabs">
            <div class="burp-tab ${this.activeTab === 'network' ? 'active' : ''}" data-tab="network">Network (${this.engine.logs.length})</div>
            <div class="burp-tab ${this.activeTab === 'intercept' ? 'active' : ''}" data-tab="intercept">Intercept ${pendingCount > 0 ? `(${pendingCount})` : ''}</div>
            <div class="burp-tab ${this.activeTab === 'repeater' ? 'active' : ''}" data-tab="repeater">Repeater</div>
            <div class="burp-tab ${this.activeTab === 'debugger' ? 'active' : ''}" data-tab="debugger">Debugger</div>
            <div class="burp-tab ${this.activeTab === 'settings' ? 'active' : ''}" data-tab="settings">Settings</div>
        </div>

        <!-- NETWORK TAB -->
        <div class="burp-content ${this.activeTab === 'network' ? 'active' : ''}">
            <div class="burp-toolbar">
                <button class="burp-btn" id="btn-clear-net">Clear</button>
                <div style="flex:1"></div>
                <small>Showing last 200 requests</small>
            </div>
            <div style="flex:1; overflow:auto;">
                <table class="burp-table">
                    <thead><tr><th>Method</th><th>URL</th><th>Status</th><th>Size</th><th>Time</th></tr></thead>
                    <tbody id="burp-network-list"></tbody>
                </table>
            </div>
        </div>

        <!-- INTERCEPT TAB -->
        <div class="burp-content ${this.activeTab === 'intercept' ? 'active' : ''}">
            <div class="burp-toolbar">
                <button class="burp-btn ${SETTINGS.interceptRequests?'danger':'primary'}" id="btn-toggle-req">
                    Req: ${SETTINGS.interceptRequests ? 'ON' : 'OFF'}
                </button>
                <button class="burp-btn ${SETTINGS.interceptResponses?'danger':'primary'}" id="btn-toggle-res">
                    Res: ${SETTINGS.interceptResponses ? 'ON' : 'OFF'}
                </button>
                <div style="flex:1"></div>
                ${this.currentIntercept ? 
                  `<button class="burp-btn primary" id="btn-forward">FORWARD</button>
                   <button class="burp-btn danger" id="btn-drop">DROP</button>` : 
                  `<span style="opacity:0.5; font-size:11px;">Queue Empty</span>`
                }
            </div>
            <div style="flex:1; display:flex; flex-direction:column; position:relative;">
                ${this.currentIntercept ? 
                   `<div style="padding:5px; background:var(--accent); color:black; font-weight:bold; font-size:11px;">
                        ${this.currentIntercept.type === 'req' ? 'Request' : 'Response'} Intercepted (ID: ${this.currentIntercept.data.id})
                    </div>
                    <textarea id="burp-intercept-editor" class="burp-raw-editor" spellcheck="false"></textarea>` 
                   : 
                   `<div style="display:flex; flex:1; align-items:center; justify-content:center; opacity:0.3; flex-direction:column;">
                        <div style="font-size:40px; margin-bottom:10px;">🛑</div>
                        <div>Enable interception to catch traffic</div>
                    </div>`
                }
            </div>
        </div>

        <!-- REPEATER TAB -->
        <div class="burp-content ${this.activeTab === 'repeater' ? 'active' : ''}">
             <div class="burp-toolbar">
                <button class="burp-btn primary" id="btn-rep-send">SEND</button>
                <div style="flex:1"></div>
             </div>
             <div style="flex:1; display:flex; flex-direction:column;">
                <div style="flex:1; display:flex; border-bottom:1px solid var(--border);">
                    <textarea id="burp-rep-req" class="burp-raw-editor" placeholder="Raw Request here...">${this.repeaterState.raw}</textarea>
                </div>
                <div style="flex:1; display:flex; background:rgba(0,0,0,0.2);">
                    <textarea id="burp-rep-res" class="burp-raw-editor" readonly placeholder="Response will appear here...">${this.repeaterState.response}</textarea>
                </div>
             </div>
        </div>

        <!-- DEBUGGER TAB -->
        <div class="burp-content ${this.activeTab === 'debugger' ? 'active' : ''}">
            <div class="burp-toolbar">
                <button class="burp-btn primary" id="btn-exec-js">Execute</button>
                <button class="burp-btn danger" id="btn-trigger-dbg">Trigger 'debugger;'</button>
            </div>
            <div style="flex:1; padding:10px;">
                <textarea id="burp-js-input" class="burp-raw-editor" style="border:1px solid var(--border); border-radius:4px;" placeholder="// Enter JavaScript to execute in page context...&#10;alert(document.cookie);"></textarea>
            </div>
        </div>

        <!-- SETTINGS TAB -->
        <div class="burp-content ${this.activeTab === 'settings' ? 'active' : ''}">
            <div style="padding:20px; overflow:auto;">
                <h3 style="color:var(--primary); margin-top:0;">Configuration</h3>
                
                <div class="burp-form-group">
                    <label>Theme</label>
                    <select class="burp-select" id="conf-theme">
                        <option value="gold" ${SETTINGS.theme==='gold'?'selected':''}>Gold Edition</option>
                        <option value="dark" ${SETTINGS.theme==='dark'?'selected':''}>Cyber Dark</option>
                        <option value="matrix" ${SETTINGS.theme==='matrix'?'selected':''}>Matrix Green</option>
                    </select>
                </div>

                <div class="burp-form-group">
                    <label>Transparency (Opacity: <span id="lbl-opacity">${SETTINGS.opacity}</span>)</label>
                    <input type="range" class="burp-input" id="conf-opacity" min="0.5" max="1.0" step="0.05" value="${SETTINGS.opacity}">
                </div>

                <div class="burp-form-group">
                    <label>Font Size (<span id="lbl-fontsize">${SETTINGS.fontSize}px</span>)</label>
                    <input type="range" class="burp-input" id="conf-fontsize" min="10" max="20" step="1" value="${SETTINGS.fontSize}">
                </div>

                <div class="burp-form-group">
                    <label style="display:flex; align-items:center; gap:10px; cursor:pointer;">
                        <input type="checkbox" id="conf-cors" ${SETTINGS.corsBypass?'checked':''}>
                        <span>Enable CORS Bypass (via corsproxy.io)</span>
                    </label>
                </div>
                
                <div style="margin-top:20px; padding:10px; border:1px solid var(--border); border-radius:4px; opacity:0.7;">
                    <strong>Info:</strong> JS Burp Suite runs entirely in your browser memory. Reloading the page clears the session.
                </div>
            </div>
        </div>
      `;
      
      this.refreshNetwork();
      if(this.currentIntercept) this.renderInterceptEditor();
    }

    renderInterceptEditor() {
      const el = document.getElementById('burp-intercept-editor');
      if(!el || !this.currentIntercept) return;
      
      const { type, data } = this.currentIntercept;
      let raw = '';
      if(type === 'req') {
        raw = HttpParser.requestToRaw(data.method, data.url, data.headers, data.body);
      } else {
        raw = HttpParser.responseToRaw(data.status, data.statusText, data.headers, data.body);
      }
      el.value = raw;
    }

    refreshNetwork() {
      const el = document.getElementById('burp-network-list');
      if(!el) return;
      el.innerHTML = this.engine.logs.map(l => `
        <tr onclick="window.__burpUI__.sendToRepeater('${l.id}')">
            <td><b style="color:${l.method==='GET'?'#4fd1c5':'#f6ad55'}">${l.method || '-'}</b></td>
            <td title="${l.url}">${l.url.length > 50 ? l.url.slice(0,50)+'...' : l.url}</td>
            <td style="color:${l.status>=400?'#fc8181':'#68d391'}">${l.status || '...'}</td>
            <td>${l.size || 0}b</td>
            <td>${l.duration || '-'}ms</td>
        </tr>
      `).join('');
    }

    sendToRepeater(logId) {
        const log = this.engine.logs.find(l => l.id === logId);
        if(log) {
            let raw = '';
            // We reconstruct raw from log details mostly, headers might be missing in log unless we store them all
            // For now, let's just make a basic one
            raw = `${log.method} ${log.url} HTTP/1.1\n\n${log.body || ''}`;
            this.repeaterState.raw = raw;
            this.activeTab = 'repeater';
            this.render();
        }
    }

    bindEvents() {
        const self = this;
        this.container.addEventListener('click', e => {
            const id = e.target.id;
            const tab = e.target.dataset.tab;

            // Tabs
            if(tab) {
                this.activeTab = tab;
                this.render();
                return;
            }

            // Min/Max
            if(id === 'btn-minimize' || e.target.closest('.minimized')) {
                this.toggleMinimize();
                return;
            }
            
            // Intercept Controls
            if(id === 'btn-toggle-req') {
                SETTINGS.interceptRequests = !SETTINGS.interceptRequests;
                this.render();
            }
            if(id === 'btn-toggle-res') {
                SETTINGS.interceptResponses = !SETTINGS.interceptResponses;
                this.render();
            }

            // Intercept Actions
            if(id === 'btn-forward') this.handleInterceptAction('resolve');
            if(id === 'btn-drop') this.handleInterceptAction('reject');

            // Network
            if(id === 'btn-clear-net') {
                this.engine.logs = [];
                this.render();
            }

            // Repeater
            if(id === 'btn-rep-send') this.handleRepeaterSend();

            // Debugger
            if(id === 'btn-exec-js') {
                try {
                    const code = document.getElementById('burp-js-input').value;
                    (1,eval)(code); // Global scope eval
                } catch(err) { alert(err); }
            }
            if(id === 'btn-trigger-dbg') {
                // We use a timeout to let the UI update/close if needed before pausing
                setTimeout(() => { debugger; }, 100);
            }
        });

        // Settings Change Events
        this.container.addEventListener('change', e => {
            if(e.target.id === 'conf-theme') {
                SETTINGS.theme = e.target.value;
                this.updateThemeCSS();
                this.render();
            }
            if(e.target.id === 'conf-opacity') {
                SETTINGS.opacity = e.target.value;
                this.updateThemeCSS();
            }
            if(e.target.id === 'conf-fontsize') {
                SETTINGS.fontSize = e.target.value;
                this.updateThemeCSS();
            }
            if(e.target.id === 'conf-cors') {
                SETTINGS.corsBypass = e.target.checked;
            }
        });
        
        // Settings Live Update
        this.container.addEventListener('input', e => {
            if(e.target.id === 'conf-opacity') document.getElementById('lbl-opacity').innerText = e.target.value;
            if(e.target.id === 'conf-fontsize') document.getElementById('lbl-fontsize').innerText = e.target.value;
        });
    }

    async handleInterceptAction(action) {
        if(!this.currentIntercept) return;

        const el = document.getElementById('burp-intercept-editor');
        const raw = el.value;
        const parsed = HttpParser.parseRaw(raw);
        
        const { resolve, reject, type, data } = this.currentIntercept;
        
        if (action === 'reject') {
            reject();
        } else {
            // Reconstruct data based on edits
            if (type === 'req') {
                const parts = parsed.firstLine; // [METHOD, PATH, PROTOCOL]
                // Note: We use original URL object to handle hostname logic if user edited path only
                let newUrl = data.url;
                if (parts[1]) {
                    // Try to stitch path back to domain
                    try {
                        const u = new URL(data.url);
                        if(parts[1].startsWith('http')) newUrl = parts[1];
                        else newUrl = u.origin + parts[1];
                    } catch(e) { newUrl = parts[1]; }
                }

                resolve({
                    id: data.id,
                    method: parts[0] || data.method,
                    url: newUrl,
                    headers: parsed.headers,
                    body: parsed.body
                });
            } else {
                const parts = parsed.firstLine; // [PROTOCOL, STATUS, TEXT]
                resolve({
                    id: data.id,
                    status: parts[1] || 200,
                    statusText: parts.slice(2).join(' ') || 'OK',
                    headers: parsed.headers,
                    body: parsed.body
                });
            }
        }

        this.currentIntercept = null;
        this.processQueue();
    }

    async handleRepeaterSend() {
        const raw = document.getElementById('burp-rep-req').value;
        this.repeaterState.raw = raw;
        const parsed = HttpParser.parseRaw(raw);
        
        // determine URL
        let url = parsed.firstLine[1];
        const headers = parsed.headers;
        
        // Simple heuristic for URL
        if(url && !url.startsWith('http')) {
             const host = headers['Host'] || headers['host'];
             if(host) url = 'https://' + host + url; // Default to https
        }

        const resEl = document.getElementById('burp-rep-res');
        resEl.value = 'Sending...';

        try {
            // Use Original Fetch to avoid intercepting own repeater traffic if desired
            // But usually we want Repeater to bypass interception hooks
            const response = await this.engine.originalFetch(url, {
                method: parsed.firstLine[0],
                headers: headers,
                body: ['GET','HEAD'].includes(parsed.firstLine[0]) ? undefined : parsed.body
            });
            
            const text = await response.text();
            
            // Format Response
            const resHeaders = {};
            response.headers.forEach((v,k) => resHeaders[k]=v);
            
            const rawRes = HttpParser.responseToRaw(response.status, response.statusText, resHeaders, text);
            this.repeaterState.response = rawRes;
            resEl.value = rawRes;
        } catch(e) {
            resEl.value = 'Error: ' + e.message;
        }
    }

    setupDraggable() {
        let isDragging = false, startX, startY, initLeft, initTop;
        
        const onDown = (e) => {
            if(e.target.closest('.burp-header') && !e.target.closest('button')) {
                isDragging = true;
                const touch = e.touches ? e.touches[0] : e;
                startX = touch.clientX;
                startY = touch.clientY;
                const rect = this.container.getBoundingClientRect();
                initLeft = rect.left;
                initTop = rect.top;
            }
        };

        const onMove = (e) => {
            if(!isDragging) return;
            const touch = e.touches ? e.touches[0] : e;
            const dx = touch.clientX - startX;
            const dy = touch.clientY - startY;
            this.container.style.left = initLeft + dx + 'px';
            this.container.style.top = initTop + dy + 'px';
            this.container.style.right = 'auto';
            this.container.style.bottom = 'auto';
            e.preventDefault();
        };

        const onUp = () => isDragging = false;

        this.container.addEventListener('mousedown', onDown);
        window.addEventListener('mousemove', onMove);
        window.addEventListener('mouseup', onUp);
        
        this.container.addEventListener('touchstart', onDown);
        window.addEventListener('touchmove', onMove, {passive: false});
        window.addEventListener('touchend', onUp);
    }
  }

  // ==========================================
  // 5. INITIALIZATION
  // ==========================================
  const engine = new InterceptorEngine();
  window.__burpUI__ = new BurpUI(engine);

  console.log('%c[JS BURP] v3.0 Loaded. Access via window.__burpUI__', 'color:gold; font-size:14px; font-weight:bold;');

})();