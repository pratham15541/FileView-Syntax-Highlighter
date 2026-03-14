// FileView Popup — external JS (CSP compliant)

const THEMES = [
  // Dark
  { id: 'monokai',                  label: 'Monokai',                dark: true },
  { id: 'dracula',                  label: 'Dracula',                dark: true },
  { id: 'tomorrow_night',           label: 'Tomorrow Night',         dark: true },
  { id: 'tomorrow_night_blue',      label: 'Tomorrow Night Blue',    dark: true },
  { id: 'tomorrow_night_bright',    label: 'Tomorrow Night Bright',  dark: true },
  { id: 'tomorrow_night_eighties',  label: 'Tomorrow Night 80s',     dark: true },
  { id: 'nord_dark',                label: 'Nord Dark',              dark: true },
  { id: 'one_dark',                 label: 'One Dark',               dark: true },
  { id: 'gruvbox',                  label: 'Gruvbox',                dark: true },
  { id: 'gruvbox_dark_hard',        label: 'Gruvbox Dark Hard',      dark: true },
  { id: 'github_dark',              label: 'GitHub Dark',            dark: true },
  { id: 'solarized_dark',           label: 'Solarized Dark',         dark: true },
  { id: 'twilight',                 label: 'Twilight',               dark: true },
  { id: 'ambiance',                 label: 'Ambiance',               dark: true },
  { id: 'chaos',                    label: 'Chaos',                  dark: true },
  { id: 'clouds_midnight',          label: 'Clouds Midnight',        dark: true },
  { id: 'cobalt',                   label: 'Cobalt',                 dark: true },
  { id: 'idle_fingers',             label: 'Idle Fingers',           dark: true },
  { id: 'kr_theme',                 label: 'KR Theme',               dark: true },
  { id: 'merbivore',                label: 'Merbivore',              dark: true },
  { id: 'merbivore_soft',           label: 'Merbivore Soft',         dark: true },
  { id: 'mono_industrial',          label: 'Mono Industrial',        dark: true },
  { id: 'pastel_on_dark',           label: 'Pastel on Dark',         dark: true },
  { id: 'terminal',                 label: 'Terminal',               dark: true },
  { id: 'vibrant_ink',              label: 'Vibrant Ink',            dark: true },
  { id: 'cloud_editor_dark',        label: 'Cloud Editor Dark',      dark: true },
  { id: 'cloud9_night',             label: 'Cloud9 Night',           dark: true },
  { id: 'cloud9_night_low_color',   label: 'Cloud9 Night Low Color', dark: true },
  // Light
  { id: 'github',                   label: 'GitHub',                 dark: false },
  { id: 'github_light_default',     label: 'GitHub Light',           dark: false },
  { id: 'chrome',                   label: 'Chrome',                 dark: false },
  { id: 'tomorrow',                 label: 'Tomorrow',               dark: false },
  { id: 'solarized_light',          label: 'Solarized Light',        dark: false },
  { id: 'gruvbox_light_hard',       label: 'Gruvbox Light',          dark: false },
  { id: 'textmate',                 label: 'TextMate',               dark: false },
  { id: 'eclipse',                  label: 'Eclipse',                dark: false },
  { id: 'xcode',                    label: 'Xcode',                  dark: false },
  { id: 'dawn',                     label: 'Dawn',                   dark: false },
  { id: 'dreamweaver',              label: 'Dreamweaver',            dark: false },
  { id: 'crimson_editor',           label: 'Crimson Editor',         dark: false },
  { id: 'clouds',                   label: 'Clouds',                 dark: false },
  { id: 'iplastic',                 label: 'iPlastic',               dark: false },
  { id: 'katzenmilch',              label: 'Katzenmilch',            dark: false },
  { id: 'kuroir',                   label: 'Kuroir',                 dark: false },
  { id: 'sqlserver',                label: 'SQL Server',             dark: false },
  { id: 'cloud_editor',             label: 'Cloud Editor',           dark: false },
  { id: 'cloud9_day',               label: 'Cloud9 Day',             dark: false },
  { id: 'gob',                      label: 'Gob',                    dark: false },
];

function buildThemeSelect(selectEl, currentTheme) {
  const darkGroup = document.createElement('optgroup');
  darkGroup.label = '🌙 Dark';
  const lightGroup = document.createElement('optgroup');
  lightGroup.label = '☀ Light';

  THEMES.forEach(t => {
    const opt = document.createElement('option');
    opt.value = t.id;
    opt.textContent = t.label;
    if (t.id === currentTheme) opt.selected = true;
    t.dark ? darkGroup.appendChild(opt) : lightGroup.appendChild(opt);
  });

  selectEl.appendChild(darkGroup);
  selectEl.appendChild(lightGroup);
}

document.addEventListener('DOMContentLoaded', () => {
  const fileInfoSection = document.getElementById('file-info-section');
  const settingsSection = document.getElementById('settings-section');
  const themeSelect     = document.getElementById('popup-theme');
  const fontSelect      = document.getElementById('popup-fontsize');
  const wrapCheck       = document.getElementById('popup-wordwrap');

  // Load current settings first, then build UI
  chrome.storage.local.get(['theme', 'fontSize', 'wordWrap'], (s) => {
    const currentTheme = s.theme || 'monokai';
    buildThemeSelect(themeSelect, currentTheme);
    if (s.fontSize) fontSelect.value = s.fontSize;
    if (s.wordWrap)  wrapCheck.checked = s.wordWrap;
  });

  // Check active tab
  chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
    if (tab && tab.url && tab.url.startsWith('file://')) {
      const filename = decodeURIComponent(tab.url).split('/').pop() || 'Unknown';
      const ext = filename.includes('.') ? filename.split('.').pop().toUpperCase() : 'FILE';
      fileInfoSection.innerHTML = `
        <div class="file-status">
          <div class="file-status-label">Active file</div>
          <div class="file-status-name" title="${filename}">${filename}</div>
          <span class="file-status-lang">${ext}</span>
        </div>
      `;
      settingsSection.style.display = 'block';
    } else {
      fileInfoSection.innerHTML = `
        <div class="not-active">
          Open a local file (Ctrl+O) to activate FileView.<br>
          Drag any code file onto the browser window.
        </div>
      `;
    }
  });

  // Save on change
  themeSelect.addEventListener('change', (e) => {
    chrome.storage.local.set({ theme: e.target.value });
  });
  fontSelect.addEventListener('change', (e) => {
    chrome.storage.local.set({ fontSize: parseInt(e.target.value) });
  });
  wrapCheck.addEventListener('change', (e) => {
    chrome.storage.local.set({ wordWrap: e.target.checked });
  });

  // Buttons
  document.getElementById('setup-btn').addEventListener('click', () => {
    chrome.tabs.create({ url: chrome.runtime.getURL('src/onboarding/onboarding.html') });
  });

  document.getElementById('reload-btn').addEventListener('click', () => {
    chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
      chrome.tabs.reload(tab.id);
      window.close();
    });
  });
});

// ── Chatbot Settings ──────────────────────────────────────────────────────
(function initChatbotSettings() {
  const toggle    = document.getElementById('chatbot-toggle');
  const aiSection = document.getElementById('ai-settings');
  const baseurlEl = document.getElementById('ai-baseurl');
  const apikeyEl  = document.getElementById('ai-apikey');
  const modelEl   = document.getElementById('ai-model');
  const saveBtn   = document.getElementById('ai-save-btn');
  const savedMsg  = document.getElementById('ai-saved-msg');

  // Load saved AI settings
  chrome.storage.local.get(['chatbotEnabled', 'aiBaseUrl', 'aiApiKey', 'aiModel'], (s) => {
    toggle.checked = !!s.chatbotEnabled;
    aiSection.classList.toggle('visible', !!s.chatbotEnabled);
    if (s.aiBaseUrl) baseurlEl.value = s.aiBaseUrl;
    if (s.aiApiKey)  apikeyEl.value  = s.aiApiKey;
    if (s.aiModel)   modelEl.value   = s.aiModel;
  });

  // Safe tab messaging — silently ignores "Receiving end does not exist" which
  // fires whenever the content script isn't running on the active tab (e.g. the
  // tab is a browser page, the script hasn't loaded yet, or the context was
  // invalidated after an extension reload). Settings are always persisted to
  // chrome.storage first, so the content script will pick them up on next load.
  // safeTabMessage: sends a fire-and-forget message to the content script.
  //
  // Why this is needed:
  //   chrome.tabs.sendMessage rejects with "Receiving end does not exist" when:
  //   - The active tab is chrome://, new tab, or extension page (no content script)
  //   - The content script hasn't loaded yet on that page
  //   - The extension was reloaded and the old content script context is gone
  //
  // Fix: always supply a response callback AND read chrome.runtime.lastError
  //   inside it. This converts the uncaught Promise rejection into a handled
  //   no-op. Settings are persisted to storage first, so the content script
  //   always picks up the latest values on its next load even if it missed
  //   this live message.
  function safeTabMessage(msg) {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (!tabs || !tabs.length) return;
      const tab = tabs[0];
      if (!tab || !tab.id) return;

      // Skip pages where content scripts can never run
      const url = tab.url || '';
      if (!url ||
          url.startsWith('chrome://') ||
          url.startsWith('chrome-extension://') ||
          url.startsWith('about:') ||
          url.startsWith('devtools:')) return;

      try {
        chrome.tabs.sendMessage(tab.id, msg, (_response) => {
          // MUST read lastError here to prevent "Uncaught (in promise)" in MV3.
          // Intentionally discarded — only silencing the error matters.
          if (chrome.runtime) { void chrome.runtime.lastError; }
        });
      } catch (_e) {
        // Synchronous throw can happen if context is being torn down.
      }
    });
  }

  toggle.addEventListener('change', () => {
    const enabled = toggle.checked;
    chrome.storage.local.set({ chatbotEnabled: enabled });
    aiSection.classList.toggle('visible', enabled);
    safeTabMessage({ type: 'CHATBOT_TOGGLE', enabled });
  });

  saveBtn.addEventListener('click', () => {
    const settings = {
      aiBaseUrl: baseurlEl.value.trim(),
      aiApiKey:  apikeyEl.value.trim(),
      aiModel:   modelEl.value.trim() || 'gpt-4o-mini',
    };
    chrome.storage.local.set(settings, () => {
      savedMsg.style.display = 'block';
      setTimeout(() => { savedMsg.style.display = 'none'; }, 2000);
      safeTabMessage({ type: 'CHATBOT_SETTINGS_UPDATED', settings });
    });
  });
})();
