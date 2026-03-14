// FileView Onboarding — external JS (CSP compliant, no inline handlers)

function detectBrowser() {
  const ua = navigator.userAgent;
  if (ua.includes('Edg/')) return 'edge';
  if (ua.includes('Firefox/')) return 'firefox';
  if (ua.includes('Safari/') && !ua.includes('Chrome')) return 'safari';
  return 'chrome';
}

function showBrowser(browser) {
  document.querySelectorAll('.browser-panel').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  const panel = document.getElementById('panel-' + browser);
  if (panel) panel.classList.add('active');
  const btn = document.querySelector('[data-browser="' + browser + '"]');
  if (btn) btn.classList.add('active');
}

function copyUrl(url, chipEl) {
  navigator.clipboard.writeText(url).catch(() => {});
  const orig = chipEl.style.color;
  chipEl.style.color = '#22c55e';
  chipEl.style.borderColor = '#22c55e';
  setTimeout(() => {
    chipEl.style.color = orig;
    chipEl.style.borderColor = '';
  }, 900);
}

function testFile() {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = [
    '.js','.ts','.tsx','.jsx','.mjs','.cjs',
    '.py','.rb','.php','.java','.rs','.go','.swift','.kt','.lua',
    '.c','.cpp','.h','.hpp','.cs',
    '.json','.yaml','.yml','.toml','.xml','.svg','.csv',
    '.html','.htm','.css','.scss','.sass','.less',
    '.md','.markdown','.mdx',
    '.sql','.sh','.bash','.zsh','.ps1','.bat',
    '.dockerfile','.makefile','.gitignore','.env',
    '.diff','.patch','.ini','.cfg','.conf','.txt'
  ].join(',');
  input.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
      const url = URL.createObjectURL(file);
      window.open(url, '_blank');
    }
  });
  input.click();
}

document.addEventListener('DOMContentLoaded', () => {
  // Auto-detect and show correct browser panel
  const detected = detectBrowser();
  const bannerNames = {
    chrome: 'Chrome', edge: 'Microsoft Edge', firefox: 'Firefox', safari: 'Safari'
  };
  const detectedEl = document.getElementById('detected-text');
  if (detectedEl) {
    detectedEl.textContent =
      `Detected: ${bannerNames[detected]} — showing instructions for your browser`;
  }
  showBrowser(detected);

  // Browser tab buttons
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const browser = btn.getAttribute('data-browser');
      if (browser) showBrowser(browser);
    });
  });

  // URL chips — copy on click
  document.querySelectorAll('.url-chip').forEach(chip => {
    const url = chip.getAttribute('data-url');
    if (url) {
      chip.addEventListener('click', () => copyUrl(url, chip));
    }
  });

  // Test file button
  const testBtn = document.getElementById('test-file-btn');
  if (testBtn) {
    testBtn.addEventListener('click', testFile);
  }
});
