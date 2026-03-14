/**
 * FileView Content Script — v2.0
 * dist/ace-bundle.js runs first and exposes: globalThis.ace, globalThis.marked, globalThis.hljs
 */
(function () {
  "use strict";

  // Detect if chrome.runtime is available, else fallback to postMessage bridge
  function isExtensionContext() {
    return (
      typeof chrome !== "undefined" &&
      chrome.runtime &&
      typeof chrome.runtime.sendMessage === "function"
    );
  }

  // ─── Z-INDEX DOMINATION ──────────────────────────────────────────────────
  // Injected lazily inside init() — only when the extension actually activates.
  function injectZStyle() {
    const zStyle = document.createElement("style");
    zStyle.textContent =
      "#fv-container{position:fixed!important;top:0!important;left:0!important;width:100vw!important;height:100vh!important;z-index:2147483646!important;}#fv-fullscreen-overlay{z-index:2147483646!important;}#fv-chatbot-widget{position:fixed!important;bottom:24px!important;right:24px!important;z-index:2147483647!important;}";
    (document.head || document.documentElement).appendChild(zStyle);
  }

  const EXTENSION_MAP = {
    js: "javascript",
    mjs: "javascript",
    cjs: "javascript",
    ts: "typescript",
    tsx: "tsx",
    jsx: "jsx",
    html: "html",
    htm: "html",
    xhtml: "html",
    css: "css",
    scss: "scss",
    sass: "sass",
    less: "less",
    vue: "vue",
    json: "json",
    jsonc: "json",
    json5: "json5",
    hjson: "hjson",
    yaml: "yaml",
    yml: "yaml",
    toml: "toml",
    xml: "xml",
    rss: "xml",
    atom: "xml",
    xsl: "xml",
    svg: "svg",
    csv: "csv",
    tsv: "tsv",
    graphql: "graphqlschema",
    gql: "graphqlschema",
    c: "c_cpp",
    cpp: "c_cpp",
    cc: "c_cpp",
    h: "c_cpp",
    hpp: "c_cpp",
    cs: "csharp",
    java: "java",
    kt: "kotlin",
    kts: "kotlin",
    swift: "swift",
    rs: "rust",
    go: "golang",
    py: "python",
    pyw: "python",
    pyi: "python",
    rb: "ruby",
    php: "php",
    lua: "lua",
    dart: "dart",
    r: "r",
    jl: "julia",
    ex: "elixir",
    exs: "elixir",
    erl: "erlang",
    hs: "haskell",
    clj: "clojure",
    scala: "scala",
    ml: "ocaml",
    fs: "fsharp",
    groovy: "groovy",
    nim: "nim",
    zig: "zig",
    d: "d",
    pas: "pascal",
    coffee: "coffee",
    elm: "elm",
    cr: "crystal",
    sh: "sh",
    bash: "sh",
    zsh: "sh",
    ps1: "powershell",
    bat: "batchfile",
    cmd: "batchfile",
    sql: "sql",
    mysql: "mysql",
    pgsql: "pgsql",
    md: "markdown",
    mdx: "markdown",
    markdown: "markdown",
    rst: "rst",
    tex: "tex",
    ini: "ini",
    cfg: "ini",
    conf: "ini",
    env: "sh",
    tf: "terraform",
    tfvars: "terraform",
    hcl: "terraform",
    proto: "protobuf",
    prisma: "prisma",
    nginx: "nginx",
    properties: "properties",
    diff: "diff",
    patch: "diff",
    ejs: "ejs",
    njk: "nunjucks",
    hbs: "handlebars",
    liquid: "liquid",
    twig: "twig",
    haml: "haml",
    slim: "slim",
    v: "verilog",
    sv: "verilog",
    vhd: "vhdl",
    glsl: "glsl",
    vert: "glsl",
    frag: "glsl",
    tcl: "tcl",
    pl: "perl",
    lisp: "lisp",
    txt: "text",
    log: "text",
  };

  // All file types get the prettify button — we have formatters for many and
  // a universal whitespace-normaliser for the rest.
  const PRETTIFY_TYPES = new Set(Object.keys(EXTENSION_MAP));

  const DARK_THEMES = new Set([
    "ambiance",
    "chaos",
    "clouds_midnight",
    "cobalt",
    "dracula",
    "github_dark",
    "gruvbox",
    "gruvbox_dark_hard",
    "idle_fingers",
    "kr_theme",
    "merbivore",
    "merbivore_soft",
    "mono_industrial",
    "monokai",
    "nord_dark",
    "one_dark",
    "pastel_on_dark",
    "solarized_dark",
    "terminal",
    "tomorrow_night",
    "tomorrow_night_blue",
    "tomorrow_night_bright",
    "tomorrow_night_eighties",
    "twilight",
    "vibrant_ink",
    "cloud_editor_dark",
    "cloud9_night",
    "cloud9_night_low_color",
  ]);

  const THEMES = [
    { id: "monokai", label: "Monokai", dark: true },
    { id: "dracula", label: "Dracula", dark: true },
    { id: "one_dark", label: "One Dark", dark: true },
    { id: "nord_dark", label: "Nord Dark", dark: true },
    { id: "tomorrow_night", label: "Tomorrow Night", dark: true },
    { id: "tomorrow_night_blue", label: "Tomorrow Night Blue", dark: true },
    { id: "tomorrow_night_bright", label: "Tomorrow Night Bright", dark: true },
    { id: "tomorrow_night_eighties", label: "Tomorrow Night 80s", dark: true },
    { id: "gruvbox", label: "Gruvbox", dark: true },
    { id: "gruvbox_dark_hard", label: "Gruvbox Dark Hard", dark: true },
    { id: "github_dark", label: "GitHub Dark", dark: true },
    { id: "solarized_dark", label: "Solarized Dark", dark: true },
    { id: "twilight", label: "Twilight", dark: true },
    { id: "cobalt", label: "Cobalt", dark: true },
    { id: "ambiance", label: "Ambiance", dark: true },
    { id: "chaos", label: "Chaos", dark: true },
    { id: "clouds_midnight", label: "Clouds Midnight", dark: true },
    { id: "idle_fingers", label: "Idle Fingers", dark: true },
    { id: "kr_theme", label: "KR Theme", dark: true },
    { id: "merbivore", label: "Merbivore", dark: true },
    { id: "merbivore_soft", label: "Merbivore Soft", dark: true },
    { id: "mono_industrial", label: "Mono Industrial", dark: true },
    { id: "pastel_on_dark", label: "Pastel on Dark", dark: true },
    { id: "terminal", label: "Terminal", dark: true },
    { id: "vibrant_ink", label: "Vibrant Ink", dark: true },
    { id: "cloud_editor_dark", label: "Cloud Editor Dark", dark: true },
    { id: "cloud9_night", label: "Cloud9 Night", dark: true },
    { id: "cloud9_night_low_color", label: "Cloud9 Night (low)", dark: true },
    { id: "github", label: "GitHub", dark: false },
    { id: "github_light_default", label: "GitHub Light", dark: false },
    { id: "chrome", label: "Chrome", dark: false },
    { id: "tomorrow", label: "Tomorrow", dark: false },
    { id: "solarized_light", label: "Solarized Light", dark: false },
    { id: "gruvbox_light_hard", label: "Gruvbox Light", dark: false },
    { id: "textmate", label: "TextMate", dark: false },
    { id: "eclipse", label: "Eclipse", dark: false },
    { id: "xcode", label: "Xcode", dark: false },
    { id: "dawn", label: "Dawn", dark: false },
    { id: "dreamweaver", label: "Dreamweaver", dark: false },
    { id: "crimson_editor", label: "Crimson Editor", dark: false },
    { id: "clouds", label: "Clouds", dark: false },
    { id: "iplastic", label: "iPlastic", dark: false },
    { id: "katzenmilch", label: "Katzenmilch", dark: false },
    { id: "kuroir", label: "Kuroir", dark: false },
    { id: "sqlserver", label: "SQL Server", dark: false },
    { id: "cloud_editor", label: "Cloud Editor", dark: false },
    { id: "cloud9_day", label: "Cloud9 Day", dark: false },
    { id: "gob", label: "Gob", dark: false },
  ];

  let editor = null,
    curTheme = "monokai",
    curFontSize = 14,
    curWrap = false;
  let isMarkdown = false,
    previewMode = false,
    fullscreenMode = false;
  let isPrettified = false,
    rawContent = "",
    originalContent = "",
    detectedExt = "text";
  let isApiResponse = false;

  // ─── Utilities ───────────────────────────────────────────────────────────
  function getFilename() {
    return (
      decodeURIComponent(window.location.pathname).split("/").pop() || "file"
    );
  }

  function getExtension() {
    const name = getFilename();
    if (/^dockerfile$/i.test(name)) return "dockerfile";
    if (/^makefile$/i.test(name)) return "makefile";
    if (/^\\.?env/.test(name)) return "env";
    if (/^\\.?gitignore$/.test(name)) return "gitignore";
    return name.includes(".") ? name.split(".").pop().toLowerCase() : "text";
  }

  function getMode(ext) {
    const mode = EXTENSION_MAP[ext];
    if (mode) return `ace/mode/${mode}`;
    try {
      const ml = ace.require("ace/ext/modelist");
      const m = ml.getModeForPath(window.location.pathname);
      if (m && m.mode !== "ace/mode/text") return m.mode;
    } catch (e) {}
    return "ace/mode/text";
  }

  function formatSize(b) {
    if (b < 1024) return b + " B";
    if (b < 1048576) return (b / 1024).toFixed(1) + " KB";
    return (b / 1048576).toFixed(1) + " MB";
  }

  function isTextContent(text) {
    const s = text.slice(0, 4000);
    let bad = 0;
    for (let i = 0; i < s.length; i++) {
      const c = s.charCodeAt(i);
      if (c === 0 || c < 8 || (c > 13 && c < 32 && c !== 27)) bad++;
    }
    return bad / Math.max(s.length, 1) < 0.1;
  }

  function detectApiResponse(text, ext) {
    if (ext !== "json" && ext !== "text" && ext !== "file") return false;
    try {
      const t = text.trim();
      if (!t.startsWith("{") && !t.startsWith("[")) return false;
      const parsed = JSON.parse(t);
      if (typeof parsed !== "object" || parsed === null) return false;
      const apiKeys = [
        "data",
        "status",
        "message",
        "error",
        "result",
        "response",
        "success",
        "code",
        "meta",
        "pagination",
        "items",
        "records",
        "total",
        "errors",
        "payload",
      ];
      const keys = Object.keys(parsed).map((k) => k.toLowerCase());
      return keys.filter((k) => apiKeys.includes(k)).length >= 1;
    } catch (e) {
      return false;
    }
  }

  function sniffContentType(text) {
    const t = text.trim();
    if (t.startsWith("{") || t.startsWith("[")) {
      try {
        JSON.parse(t);
        return "json";
      } catch (e) {}
    }
    if (t.startsWith("<?xml") || (t.startsWith("<") && t.includes(">")))
      return "xml";
    return null;
  }

  // Domains that are definitively web apps, never raw file servers
  function isBlockedOnlineDomain() {
    const h = window.location.hostname;
    const blocked = [
      "google.com",
      "google.co.uk",
      "google.com.au",
      "google.ca",
      "google.de",
      "google.fr",
      "google.co.jp",
      "google.co.in",
      "google.es",
      "google.it",
      "googleapis.com",
      "googlesyndication.com",
      "googletagmanager.com",
      "bing.com",
      "yahoo.com",
      "duckduckgo.com",
      "youtube.com",
      "twitter.com",
      "x.com",
      "facebook.com",
      "instagram.com",
      "linkedin.com",
      "reddit.com",
      "stackoverflow.com",
    ];
    return blocked.some((d) => h === d || h.endsWith("." + d));
  }

  // Returns true if the URL path ends with a known text file extension,
  // even if the page looks like a web app (e.g. some servers wrap raw files
  // in a minimal HTML shell).
  function urlHasTextExtension() {
    const ext = getExtension();
    return ext !== "text" && EXTENSION_MAP.hasOwnProperty(ext);
  }

  // Extract raw text from the page — handles both browser <pre> wrapping
  // and sites that serve raw files differently (e.g. raw.githubusercontent.com,
  // pastebin, gist, gitlab raw, etc.)
  function extractRawContent() {
    // 1. Standard browser raw-file rendering: single <pre> wrapping entire body
    const pre = document.querySelector("pre");
    if (pre) {
      // Make sure the <pre> is essentially the whole page content
      const bodyChildren = Array.from(document.body.children).filter(
        (el) => !["SCRIPT", "STYLE", "LINK", "META"].includes(el.tagName),
      );
      if (bodyChildren.length <= 3) return pre.textContent;
      // Also accept if the <pre> contains nearly all the text
      const preLen = pre.textContent.length;
      const bodyLen = document.body.innerText.length;
      if (preLen > 0 && preLen / Math.max(bodyLen, 1) > 0.85)
        return pre.textContent;
    }

    // 2. Some CDNs / raw hosts serve the file wrapped in a <body> with no <pre>
    //    Detect: body has very few element children, no semantic web-app elements
    const webAppSelectors =
      'nav,header,footer,main,article,section,.content,#app,#root,[role="main"],form,iframe,canvas,video,audio';
    if (!document.querySelector(webAppSelectors)) {
      const bodyChildren = Array.from(document.body.children).filter(
        (el) => !["SCRIPT", "STYLE", "LINK", "META"].includes(el.tagName),
      );
      if (bodyChildren.length <= 2) {
        const text = document.body.innerText || document.body.textContent;
        if (text && text.trim().length > 0) return text;
      }
    }

    // 3. URL has a known text file extension (e.g. sitemap.xml, robots.txt,
    //    *.json, *.csv …) — trust the URL and grab whatever text the browser
    //    rendered, even if the page has a few extra elements (scripts, styles).
    //    This catches servers that inject a <script> or <style> alongside the
    //    raw content, which would otherwise defeat check #2.
    if (urlHasTextExtension()) {
      // Prefer a <pre> even if the body is complex
      if (pre && pre.textContent.trim().length > 0) return pre.textContent;
      // Fall back to full body text — it's a known file type so it's safe
      const text = document.body.innerText || document.body.textContent;
      if (text && text.trim().length > 0) return text;
    }

    return null;
  }

  // ─── Settings ────────────────────────────────────────────────────────────
  function loadSettings() {
    return new Promise((resolve) => {
      try {
        chrome.storage.local.get(["theme", "fontSize", "wordWrap"], (r) => {
          curTheme = r.theme || "monokai";
          curFontSize = r.fontSize || 14;
          curWrap = r.wordWrap || false;
          resolve();
        });
      } catch (e) {
        resolve();
      }
    });
  }
  function saveSettings() {
    try {
      chrome.storage.local.set({
        theme: curTheme,
        fontSize: curFontSize,
        wordWrap: curWrap,
      });
    } catch (e) {}
  }

  // ─── Prettify ─────────────────────────────────────────────────────────────
  function prettifyJSON(text) {
    return JSON.stringify(JSON.parse(text.trim()), null, 2);
  }

  function prettifyXML(text) {
    const IND = "  ";
    let r = "",
      d = 0;
    const norm = text.trim().replace(/>\s+</g, "><");
    for (let tok of norm.split(/(<[^>]+>)/)) {
      if (!tok.trim()) continue;
      if (tok.startsWith("</")) {
        d = Math.max(0, d - 1);
        r += IND.repeat(d) + tok + "\n";
      } else if (
        tok.startsWith("<") &&
        !tok.startsWith("<?") &&
        !tok.startsWith("<!") &&
        !tok.endsWith("/>")
      ) {
        r += IND.repeat(d) + tok + "\n";
        d++;
      } else if (tok.startsWith("<")) {
        r += IND.repeat(d) + tok + "\n";
      } else {
        const t = tok.trim();
        if (t) {
          const lines = r.trimEnd().split("\n");
          const last = lines.pop();
          r = lines.join("\n") + "\n" + last + t;
        }
      }
    }
    return r.trim();
  }

  function prettifyCSS(text) {
    return text
      .replace(/\s*{\s*/g, " {\n  ")
      .replace(/;\s*/g, ";\n  ")
      .replace(/\s*}\s*/g, "\n}\n")
      .replace(/,\s*(?=[^}]*{)/g, ",\n")
      .replace(/  \n}/g, "\n}")
      .trim();
  }

  function prettifySQL(text) {
    const kws = [
      "SELECT",
      "FROM",
      "WHERE",
      "JOIN",
      "LEFT JOIN",
      "RIGHT JOIN",
      "INNER JOIN",
      "ON",
      "GROUP BY",
      "ORDER BY",
      "HAVING",
      "LIMIT",
      "OFFSET",
      "INSERT INTO",
      "VALUES",
      "UPDATE",
      "SET",
      "DELETE FROM",
      "UNION ALL",
      "UNION",
      "AND",
      "OR",
    ];
    let r = text.trim();
    kws.forEach((k) => {
      r = r.replace(new RegExp("\\b" + k + "\\b", "gi"), "\n" + k);
    });
    return r
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean)
      .join("\n");
  }

  // ─── Language-specific prettifiers ────────────────────────────────────────

  function prettifyGeneric(text) {
    // Normalise mixed line endings, collapse 3+ blank lines to 2, trim trailing spaces
    return text
      .replace(/\r\n/g, "\n")
      .replace(/\r/g, "\n")
      .replace(/[ \t]+$/gm, "") // trailing whitespace per line
      .replace(/\n{3,}/g, "\n\n") // max 2 consecutive blank lines
      .trim();
  }

  function prettifyJS(text) {
    // Light normalisation: consistent spacing around operators, semicolons, brackets
    // We don't do full AST formatting (no external lib), but we clean up common issues
    return prettifyGeneric(text)
      .replace(/([^\s])\{/g, "$1 {") // space before {
      .replace(/\}([^\s\n;,)])/g, "} $1") // space after }
      .replace(/,([^\s\n])/g, ", $1") // space after comma
      .replace(/([^\s]):/g, (m, p) => {
        // space after : but not in URLs
        return p === "http" || p === "https" ? m : p + ": ";
      })
      .replace(/\n{3,}/g, "\n\n");
  }

  function prettifyYAML(text) {
    // YAML is already indent-sensitive — just normalise whitespace
    return prettifyGeneric(text);
  }

  function prettifyMarkdown(text) {
    return prettifyGeneric(text).replace(/\n{3,}/g, "\n\n"); // max one blank line between blocks
  }

  function doPrettify(text, ext) {
    if (["json", "jsonc", "json5", "hjson"].includes(ext))
      return prettifyJSON(text);
    if (["xml", "rss", "atom", "xsl", "svg"].includes(ext))
      return prettifyXML(text);
    if (["html", "htm", "xhtml"].includes(ext)) return prettifyXML(text);
    if (["css", "scss", "sass", "less"].includes(ext)) return prettifyCSS(text);
    if (["sql", "mysql", "pgsql"].includes(ext)) return prettifySQL(text);
    if (["js", "mjs", "cjs", "ts", "jsx", "tsx"].includes(ext))
      return prettifyJS(text);
    if (["yaml", "yml", "toml"].includes(ext)) return prettifyYAML(text);
    if (["md", "mdx", "markdown"].includes(ext)) return prettifyMarkdown(text);
    // Universal fallback: clean up whitespace for any other language
    // Also attempt JSON sniff (API responses served without extension)
    try {
      return prettifyJSON(text);
    } catch (e) {}
    if (text.trim().startsWith("<")) {
      try {
        return prettifyXML(text);
      } catch (e) {}
    }
    return prettifyGeneric(text);
  }

  function updateLineInfo() {
    if (editor) {
      const el = document.getElementById("fv-line-info");
      if (el)
        el.textContent = editor.session.getLength().toLocaleString() + " lines";
    }
  }

  function showToast(msg, type = "info") {
    const ex = document.getElementById("fv-toast");
    if (ex) ex.remove();
    const t = document.createElement("div");
    t.id = "fv-toast";
    t.className = "fv-toast fv-toast-" + type;
    t.textContent = msg;
    const c = document.getElementById("fv-container");
    if (c) c.appendChild(t);
    setTimeout(() => t.classList.add("fv-toast-show"), 10);
    setTimeout(() => {
      t.classList.remove("fv-toast-show");
      setTimeout(() => t.remove(), 300);
    }, 2800);
  }

  function togglePrettify() {
    const btn = document.getElementById("fv-prettify-btn");
    if (!editor) return;
    if (!isPrettified) {
      try {
        const pretty = doPrettify(editor.getValue(), detectedExt);
        originalContent = editor.getValue();
        editor.setValue(pretty, -1);
        editor.clearSelection();
        isPrettified = true;
        if (btn) {
          btn.classList.add("fv-btn-active");
          btn.textContent = "✦ Minify";
        }
        updateLineInfo();
      } catch (e) {
        showToast("⚠ Cannot prettify: " + e.message, "error");
      }
    } else {
      editor.setValue(originalContent, -1);
      editor.clearSelection();
      isPrettified = false;
      if (btn) {
        btn.classList.remove("fv-btn-active");
        btn.textContent = "✦ Prettify";
      }
      updateLineInfo();
    }
  }

  // ─── Actions ──────────────────────────────────────────────────────────────
  function openSearch() {
    if (!editor) return;
    try {
      ace.require("ace/ext/searchbox").Search(editor);
    } catch (e) {}
  }

  function copyCode() {
    const text = editor ? editor.getValue() : rawContent;
    const btn = document.getElementById("fv-copy-btn");
    navigator.clipboard
      .writeText(text)
      .then(() => {
        if (!btn) return;
        const orig = btn.textContent;
        btn.textContent = "✓ Copied!";
        btn.classList.add("fv-btn-success");
        setTimeout(() => {
          btn.textContent = orig;
          btn.classList.remove("fv-btn-success");
        }, 2000);
      })
      .catch(() => {
        const ta = document.createElement("textarea");
        ta.value = text;
        ta.style.cssText = "position:fixed;opacity:0";
        document.body.appendChild(ta);
        ta.select();
        document.execCommand("copy");
        document.body.removeChild(ta);
      });
  }

  function jumpToLine() {
    if (!editor) return;
    const total = editor.session.getLength();
    const raw = prompt("Jump to line (1\u2013" + total + "):");
    if (!raw) return;
    const n = parseInt(raw, 10);
    if (!isNaN(n) && n >= 1 && n <= total) {
      editor.gotoLine(n, 0, true);
      editor.focus();
    }
  }

  // ─── Markdown rendering ───────────────────────────────────────────────────
  function renderMarkdownToEl(container, isDark) {
    const src = editor ? editor.getValue() : rawContent;

    marked.setOptions({
      highlight: (code, lang) => {
        if (lang && hljs.getLanguage(lang)) {
          try {
            return hljs.highlight(code, {
              language: lang,
              ignoreIllegals: true,
            }).value;
          } catch (e) {}
        }
        return hljs.highlightAuto(code).value;
      },
      gfm: true,
      breaks: true,
      pedantic: false,
      smartLists: true,
    });

    let html = marked.parse(src);

    // GFM task list checkboxes
    html = html.replace(
      /<li>\[ \]\s*/g,
      '<li class="fv-task"><input type="checkbox" disabled> ',
    );
    html = html.replace(
      /<li>\[x\]\s*/gi,
      '<li class="fv-task fv-task-done"><input type="checkbox" checked disabled> ',
    );

    // Mermaid code blocks
    html = html.replace(
      /<pre><code class="language-mermaid">([\s\S]*?)<\/code><\/pre>/g,
      (_, inner) => {
        const d = inner
          .replace(/&amp;/g, "&")
          .replace(/&lt;/g, "<")
          .replace(/&gt;/g, ">")
          .replace(/&quot;/g, '"')
          .replace(/&#39;/g, "'");
        return '<div class="mermaid fv-mermaid-block">' + d + "</div>";
      },
    );

    // KaTeX math blocks $$...$$ and inline $...$
    html = html.replace(
      /\$\$([\s\S]+?)\$\$/g,
      (_, m) =>
        '<div class="fv-math-block" data-math="' +
        encodeURIComponent(m) +
        '"></div>',
    );
    html = html.replace(
      /\$([^\n$]+?)\$/g,
      (_, m) =>
        '<span class="fv-math-inline" data-math="' +
        encodeURIComponent(m) +
        '"></span>',
    );

    container.innerHTML =
      '<div class="fv-md-body ' +
      (isDark ? "fv-md-dark" : "fv-md-light") +
      '">' +
      html +
      "</div>";

    // Mermaid
    if (html.includes('class="mermaid')) {
      const initMmd = () => {
        window.mermaid.initialize({
          startOnLoad: false,
          theme: isDark ? "dark" : "default",
          securityLevel: "loose",
        });
        window.mermaid.run({ nodes: container.querySelectorAll(".mermaid") });
      };
      if (!window.mermaid) {
        const s = document.createElement("script");
        s.src = "https://cdn.jsdelivr.net/npm/mermaid@10/dist/mermaid.min.js";
        s.onload = initMmd;
        document.head.appendChild(s);
      } else {
        initMmd();
      }
    }

    // KaTeX
    if (html.includes("fv-math")) {
      const renderKatex = () => {
        container
          .querySelectorAll(".fv-math-block[data-math]")
          .forEach((el) => {
            try {
              katex.render(decodeURIComponent(el.dataset.math), el, {
                displayMode: true,
                throwOnError: false,
              });
            } catch (e) {}
          });
        container
          .querySelectorAll(".fv-math-inline[data-math]")
          .forEach((el) => {
            try {
              katex.render(decodeURIComponent(el.dataset.math), el, {
                displayMode: false,
                throwOnError: false,
              });
            } catch (e) {}
          });
      };
      if (!window.katex) {
        if (!document.querySelector('link[href*="katex"]')) {
          const l = document.createElement("link");
          l.rel = "stylesheet";
          l.href = "https://cdn.jsdelivr.net/npm/katex@0.16/dist/katex.min.css";
          document.head.appendChild(l);
        }
        const s = document.createElement("script");
        s.src = "https://cdn.jsdelivr.net/npm/katex@0.16/dist/katex.min.js";
        s.onload = renderKatex;
        document.head.appendChild(s);
      } else {
        renderKatex();
      }
    }
  }

  function renderMarkdown() {
    const p = document.getElementById("fv-md-preview");
    if (p) renderMarkdownToEl(p, DARK_THEMES.has(curTheme));
  }

  function togglePreview() {
    previewMode = !previewMode;
    const panel = document.getElementById("fv-md-preview");
    const edDiv = document.getElementById("fv-editor");
    const btn = document.getElementById("fv-preview-btn");
    if (previewMode) {
      renderMarkdown();
      edDiv.style.width = "50%";
      panel.style.display = "block";
      btn.textContent = "⬡ Split";
      btn.classList.add("fv-btn-active");
    } else {
      edDiv.style.width = "100%";
      panel.style.display = "none";
      btn.textContent = "⬡ Preview";
      btn.classList.remove("fv-btn-active");
    }
    editor && editor.resize();
  }

  function openFullscreenPreview() {
    const isDark = DARK_THEMES.has(curTheme);
    const overlay = document.createElement("div");
    overlay.id = "fv-fullscreen-overlay";
    overlay.className =
      "fv-fs-overlay " + (isDark ? "fv-fs-dark" : "fv-fs-light");
    overlay.innerHTML = `
      <div class="fv-fs-toolbar">
        <span class="fv-fs-title">
          <svg width="14" height="14" viewBox="0 0 16 16"><rect width="16" height="16" rx="4" fill="#6366f1"/><path d="M3 5h6M3 8h10M3 11h8" stroke="white" stroke-width="1.5" stroke-linecap="round"/></svg>
          ${getFilename()} — Markdown Preview
        </span>
        <div class="fv-fs-actions">
          <button class="fv-fs-btn" id="fv-fs-refresh">↻ Refresh</button>
          <button class="fv-fs-btn fv-fs-close-btn" id="fv-fs-close">✕ Close &nbsp;<kbd>Esc</kbd></button>
        </div>
      </div>
      <div id="fv-fs-content" class="fv-fs-content"></div>
    `;
    document.body.appendChild(overlay);
    fullscreenMode = true;
    const content = document.getElementById("fv-fs-content");
    renderMarkdownToEl(content, isDark);
    document
      .getElementById("fv-fs-close")
      .addEventListener("click", closeFullscreen);
    document
      .getElementById("fv-fs-refresh")
      .addEventListener("click", () => renderMarkdownToEl(content, isDark));
  }

  function closeFullscreen() {
    const o = document.getElementById("fv-fullscreen-overlay");
    if (o) o.remove();
    fullscreenMode = false;
  }

  // ─── DOM helpers ──────────────────────────────────────────────────────────
  function makeBtn(label, onClick, id) {
    const b = document.createElement("button");
    b.className = "fv-btn";
    b.textContent = label;
    if (id) b.id = id;
    b.addEventListener("click", onClick);
    return b;
  }
  function makeSep() {
    const s = document.createElement("span");
    s.className = "fv-sep";
    return s;
  }

  // ─── Toolbar ─────────────────────────────────────────────────────────────
  function buildToolbar(ext, fileSize) {
    const filename = getFilename();
    const toolbar = document.createElement("div");
    toolbar.id = "fv-toolbar";
    toolbar.className = DARK_THEMES.has(curTheme) ? "fv-dark" : "fv-light";

    const info = document.createElement("div");
    info.className = "fv-file-info";
    info.innerHTML =
      '<span class="fv-filename" title="' +
      filename +
      '">' +
      filename +
      "</span>" +
      '<span class="fv-badge fv-lang">' +
      (isApiResponse ? "API" : ext.toUpperCase()) +
      "</span>" +
      (isApiResponse
        ? '<span class="fv-badge fv-api-badge">JSON Response</span>'
        : "") +
      '<span class="fv-badge fv-size">' +
      formatSize(fileSize) +
      "</span>";

    const actions = document.createElement("div");
    actions.className = "fv-actions";

    actions.appendChild(makeBtn("⎘ Copy", copyCode, "fv-copy-btn"));
    actions.appendChild(makeBtn("⌕ Search", openSearch, "fv-search-btn"));
    actions.appendChild(makeBtn("↗ Line", jumpToLine, "fv-jump-btn"));
    actions.appendChild(makeSep());
    actions.appendChild(
      makeBtn("⊟ Fold", () => editor && editor.getSession().foldAll()),
    );
    actions.appendChild(
      makeBtn("⊞ Unfold", () => editor && editor.getSession().unfold()),
    );
    actions.appendChild(makeSep());

    // Always show Prettify button — works for all languages
    actions.appendChild(
      makeBtn("✦ Prettify", togglePrettify, "fv-prettify-btn"),
    );
    actions.appendChild(makeSep());

    const wrapBtn = makeBtn("⇌ Wrap", () => {
      curWrap = !curWrap;
      wrapBtn.classList.toggle("fv-btn-active", curWrap);
      editor && editor.getSession().setUseWrapMode(curWrap);
      saveSettings();
    });
    if (curWrap) wrapBtn.classList.add("fv-btn-active");
    actions.appendChild(wrapBtn);

    if (isMarkdown) {
      actions.appendChild(makeSep());
      actions.appendChild(
        makeBtn("⬡ Preview", togglePreview, "fv-preview-btn"),
      );
      actions.appendChild(
        makeBtn("⛶ Fullscreen", openFullscreenPreview, "fv-fs-btn-toolbar"),
      );
    }

    actions.appendChild(makeSep());

    const fg = document.createElement("div");
    fg.className = "fv-font-group";
    const flabel = document.createElement("span");
    flabel.id = "fv-font-label";
    flabel.className = "fv-font-label";
    flabel.textContent = curFontSize + "px";
    const fdec = makeBtn("\u2212", () => {
      if (curFontSize > 8) {
        curFontSize--;
        flabel.textContent = curFontSize + "px";
        editor && editor.setFontSize(curFontSize);
        saveSettings();
      }
    });
    fdec.classList.add("fv-btn-icon");
    const finc = makeBtn("+", () => {
      if (curFontSize < 32) {
        curFontSize++;
        flabel.textContent = curFontSize + "px";
        editor && editor.setFontSize(curFontSize);
        saveSettings();
      }
    });
    finc.classList.add("fv-btn-icon");
    fg.appendChild(fdec);
    fg.appendChild(flabel);
    fg.appendChild(finc);
    actions.appendChild(fg);

    const right = document.createElement("div");
    right.className = "fv-right";
    const sel = document.createElement("select");
    sel.id = "fv-theme-select";
    sel.className = "fv-select";
    const dg = document.createElement("optgroup");
    dg.label = "\uD83C\uDF19 Dark";
    const lg = document.createElement("optgroup");
    lg.label = "\u2600 Light";
    THEMES.forEach((t) => {
      const o = document.createElement("option");
      o.value = t.id;
      o.textContent = t.label;
      if (t.id === curTheme) o.selected = true;
      t.dark ? dg.appendChild(o) : lg.appendChild(o);
    });
    sel.appendChild(dg);
    sel.appendChild(lg);
    sel.addEventListener("change", (e) => {
      curTheme = e.target.value;
      editor && editor.setTheme("ace/theme/" + curTheme);
      toolbar.className =
        "fv-toolbar " + (DARK_THEMES.has(curTheme) ? "fv-dark" : "fv-light");
      if (previewMode) renderMarkdown();
      saveSettings();
    });

    const logo = document.createElement("div");
    logo.className = "fv-logo";
    logo.innerHTML =
      '<svg width="14" height="14" viewBox="0 0 16 16"><rect width="16" height="16" rx="4" fill="#6366f1"/><path d="M3 5h6M3 8h10M3 11h8" stroke="white" stroke-width="1.5" stroke-linecap="round"/></svg> FileView';

    right.appendChild(sel);
    right.appendChild(logo);

    // ── Chatbot navbar button (injected by chatbot module after init) ──
    const chatNavBtn = document.createElement("button");
    chatNavBtn.id = "fv-chatbot-nav-btn";
    chatNavBtn.innerHTML = "<span>🤖 AI Chat</span>";
    chatNavBtn.title = "Toggle AI Chatbot";
    chatNavBtn.addEventListener("click", () => {
      if (window.__fvChatbot) {
        window.__fvChatbot.toggle();
      } else {
        // Chatbot not ready yet — show a temporary tooltip
        chatNavBtn.textContent = "⏳ Loading…";
        setTimeout(() => {
          chatNavBtn.innerHTML = "<span>🤖 AI Chat</span>";
        }, 1500);
      }
    });
    right.insertBefore(chatNavBtn, sel);

    toolbar.appendChild(info);
    toolbar.appendChild(actions);
    toolbar.appendChild(right);
    return toolbar;
  }

  function buildStatusBar() {
    const bar = document.createElement("div");
    bar.id = "fv-statusbar";
    bar.innerHTML =
      '<span id="fv-line-info">\u2014</span><span id="fv-mode-info">\u2014</span>' +
      '<span id="fv-online-badge" class="fv-badge fv-online" style="display:none">\u25CF Online</span>' +
      '<span id="fv-api-status" style="display:none;font-size:11px;"></span>' +
      '<span style="margin-left:auto" id="fv-cursor-info">Ln 1, Col 1</span>' +
      '<span class="fv-hint">Ctrl+F search \u00B7 Ctrl+G line \u00B7 Ctrl+P prettify \u00B7 Ctrl+Shift+C copy</span>';
    return bar;
  }

  function showApiStatus(text) {
    try {
      const p = JSON.parse(text.trim());
      const el = document.getElementById("fv-api-status");
      if (!el) return;
      const status = p.status || p.statusCode || p.code || p.http_status;
      const message = p.message || p.msg || p.error || p.description || "";
      let html = "";
      if (status !== undefined) {
        const s = parseInt(status);
        if (!isNaN(s)) {
          const cls =
            s >= 200 && s < 300
              ? "fv-s-ok"
              : s >= 400
                ? "fv-s-err"
                : "fv-s-warn";
          html += '<span class="fv-status-badge ' + cls + '">' + s + "</span> ";
        }
      }
      if (message) html += String(message).slice(0, 80);
      if (html) {
        el.innerHTML = html;
        el.style.display = "inline";
      }
    } catch (e) {}
  }

  // ─── Main ─────────────────────────────────────────────────────────────────
  async function init() {
    const proto = window.location.protocol;

    if (proto === "file:") {
      const pre = document.querySelector("pre");
      if (!pre) return;
      rawContent = pre.textContent;
    } else if (proto === "http:" || proto === "https:") {
      if (isBlockedOnlineDomain()) return;
      const extracted = extractRawContent();
      if (!extracted) return;
      rawContent = extracted;
    } else {
      return;
    }

    if (!rawContent.trim() || !isTextContent(rawContent)) return;

    // All guards passed — safe to inject our styles and take over the page
    injectZStyle();

    let ext = getExtension();
    // For generic extensions (.txt, .log, no extension) try to sniff actual content type
    if (ext === "text" || ext === "file" || ext === "txt" || ext === "log") {
      const s = sniffContentType(rawContent);
      if (s) ext = s;
    }
    detectedExt = ext;
    isApiResponse = detectApiResponse(rawContent, ext);

    const mode = getMode(ext);
    const size = new Blob([rawContent]).size;
    isMarkdown = ["md", "mdx", "markdown"].includes(ext);

    await loadSettings();

    // Auto-prettify compact API JSON
    if (isApiResponse && !rawContent.includes("\n") && size < 500000) {
      try {
        const minified = rawContent.trim();
        rawContent = prettifyJSON(minified);
        originalContent = minified;
        isPrettified = true;
      } catch (e) {}
    }

    document.documentElement.style.cssText = "margin:0;padding:0";
    document.body.style.cssText = "margin:0;padding:0;overflow:hidden";
    // Hide any existing pre/body content so our editor takes full control
    const preEl = document.querySelector("pre");
    if (preEl) preEl.style.display = "none";

    const wrap = document.createElement("div");
    wrap.id = "fv-container";
    const toolbar = buildToolbar(ext, size);
    const editorPane = document.createElement("div");
    editorPane.id = "fv-editor-pane";
    const editorDiv = document.createElement("div");
    editorDiv.id = "fv-editor";
    const preview = document.createElement("div");
    preview.id = "fv-md-preview";
    preview.style.display = "none";
    const statusBar = buildStatusBar();

    editorPane.appendChild(editorDiv);
    editorPane.appendChild(preview);
    wrap.appendChild(toolbar);
    wrap.appendChild(editorPane);
    wrap.appendChild(statusBar);
    document.body.appendChild(wrap);

    if (size > 2 * 1024 * 1024) {
      const warn = document.createElement("div");
      warn.id = "fv-large-file-warning";
      warn.innerHTML =
        '<div class="fv-warning-box"><strong>\u26A0 Large file (' +
        formatSize(size) +
        ')</strong> \u2014 showing first 5\u202F000 lines. <button id="fv-load-full">Load full file</button></div>';
      wrap.insertBefore(warn, editorPane);
    }

    editor = ace.edit("fv-editor");
    editor.setOptions({
      theme: "ace/theme/" + curTheme,
      mode,
      fontSize: curFontSize,
      readOnly: true,
      showPrintMargin: false,
      highlightActiveLine: true,
      useSoftTabs: true,
      tabSize: 2,
      wrap: curWrap,
      useWorker: false,
      scrollPastEnd: 0.5,
    });

    const display =
      size > 2 * 1024 * 1024
        ? rawContent.split("\n").slice(0, 5000).join("\n") +
          "\n\n// \u2026 file truncated"
        : rawContent;
    editor.setValue(display, -1);
    editor.clearSelection();

    if (isPrettified) {
      const pb = document.getElementById("fv-prettify-btn");
      if (pb) {
        pb.classList.add("fv-btn-active");
        pb.textContent = "✦ Minify";
      }
    }

    const session = editor.getSession();
    document.getElementById("fv-line-info").textContent =
      session.getLength().toLocaleString() + " lines";
    document.getElementById("fv-mode-info").textContent = ext.toUpperCase();
    if (proto === "http:" || proto === "https:")
      document.getElementById("fv-online-badge").style.display = "inline";
    if (isApiResponse) showApiStatus(rawContent);

    editor.selection.on("changeCursor", () => {
      const p = editor.getCursorPosition();
      document.getElementById("fv-cursor-info").textContent =
        "Ln " + (p.row + 1) + ", Col " + (p.column + 1);
    });

    window.addEventListener(
      "keydown",
      (e) => {
        const ctrl = e.ctrlKey || e.metaKey;
        if (ctrl && e.key === "f") {
          e.preventDefault();
          e.stopImmediatePropagation();
          openSearch();
        }
        if (ctrl && e.key === "g") {
          e.preventDefault();
          e.stopImmediatePropagation();
          jumpToLine();
        }
        if (ctrl && e.shiftKey && e.key === "C") {
          e.preventDefault();
          copyCode();
        }
        if (ctrl && e.key === "p") {
          e.preventDefault();
          e.stopImmediatePropagation();
          const pb = document.getElementById("fv-prettify-btn");
          if (pb) togglePrettify();
        }
        if (e.key === "Escape" && fullscreenMode) closeFullscreen();
      },
      true,
    );

    const loadBtn = document.getElementById("fv-load-full");
    if (loadBtn) {
      loadBtn.addEventListener("click", () => {
        editor.setValue(rawContent, -1);
        editor.clearSelection();
        document.getElementById("fv-large-file-warning").remove();
        updateLineInfo();
      });
    }
  }

  function safeInit() {
    // Run init() and — when it finishes — fire an event the chatbot module
    // listens for, so it never has to poll for the toolbar.
    Promise.resolve()
      .then(() => init())
      .catch(() => {
        /* page DOM not suitable for FileView */
      })
      .finally(() => {
        document.dispatchEvent(new CustomEvent("fv:ready"));
      });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", safeInit);
  } else {
    safeInit();
  }

  // ══════════════════════════════════════════════════════════════════════════
  // FileView AI Chatbot Module
  // ══════════════════════════════════════════════════════════════════════════
  (function initChatbot() {
    // ── Constants ────────────────────────────────────────────────────────
    const CHUNK_SIZE = 6000; // chars per chunk sent to model
    const MAX_HISTORY = 20; // max messages kept in memory per file
    const MAX_CONVERSATIONS = 20; // max saved conversations per file

    // Multi-conversation storage key (per file URL)
    const FILE_HASH = () =>
      btoa(encodeURIComponent(window.location.href)).slice(0, 60);
    const CONVS_KEY = () => "fv_convs_" + FILE_HASH();
    // Legacy single-conv key — used for migration only
    const LEGACY_KEY = () =>
      "fv_chat_" + FILE_HASH();

    // ── Storage helpers (proxied via background — chrome.storage unavailable in MAIN world) ──
    function storageGet(keys, cb) {
      if (isExtensionContext()) {
        try {
          console.log("[FileView][Chatbot] STORAGE_GET request:", keys);
          chrome.runtime.sendMessage({ type: "STORAGE_GET", keys }, (res) => {
            if (chrome.runtime) void chrome.runtime.lastError;
            console.log("[FileView][Chatbot] STORAGE_GET response:", res);
            cb(res && res.result ? res.result : {});
          });
        } catch (e) {
          console.error("[FileView][Chatbot] STORAGE_GET error:", e);
          cb({});
        }
      } else {
        // Not in extension context, cannot access chrome.runtime
        console.error(
          "[FileView][Chatbot] STORAGE_GET: chrome.runtime not available in this context.",
        );
        cb({});
      }
    }
    function storageSet(data, cb) {
      if (isExtensionContext()) {
        try {
          console.log("[FileView][Chatbot] STORAGE_SET request:", data);
          chrome.runtime.sendMessage({ type: "STORAGE_SET", data }, (res) => {
            if (chrome.runtime) void chrome.runtime.lastError;
            console.log("[FileView][Chatbot] STORAGE_SET response:", res);
            if (cb) cb();
          });
        } catch (e) {
          console.error("[FileView][Chatbot] STORAGE_SET error:", e);
          if (cb) cb();
        }
      } else {
        // Not in extension context, cannot access chrome.runtime
        console.error(
          "[FileView][Chatbot] STORAGE_SET: chrome.runtime not available in this context.",
        );
        if (cb) cb();
      }
    }

    // ── State ────────────────────────────────────────────────────────────
    let chatOpen = false;
    let isLoading = false;
    let chatHistory = []; // { role, content } — active conversation
    let aiSettings = { baseUrl: "", apiKey: "", model: "gpt-4o-mini" };
    let chatEnabled = false;
    let welcomeShown = false;     // FIX: prevent duplicate welcome messages
    let currentConvId = null;     // FIX: active conversation ID
    let allConversations = [];    // FIX: [{id, label, history, ts}]
    let historyDrawerOpen = false;

    // ── Helpers ──────────────────────────────────────────────────────────
    function getFileContent() {
      return typeof rawContent === "string" ? rawContent : "";
    }

    function getFileName() {
      return (
        decodeURIComponent(window.location.pathname).split("/").pop() || "file"
      );
    }

    // Split large file into relevant chunks using simple proximity search
    function getRelevantChunk(question) {
      const content = getFileContent();
      if (content.length <= CHUNK_SIZE) return content;

      // Try to find chunk most relevant to question keywords
      const words = question
        .toLowerCase()
        .split(/\s+/)
        .filter((w) => w.length > 3);
      const chunks = [];
      for (let i = 0; i < content.length; i += CHUNK_SIZE) {
        chunks.push(content.slice(i, i + CHUNK_SIZE));
      }

      if (!words.length) return chunks[0];

      let best = 0,
        bestScore = -1;
      chunks.forEach((chunk, idx) => {
        const lower = chunk.toLowerCase();
        const score = words.reduce(
          (s, w) => s + (lower.includes(w) ? 1 : 0),
          0,
        );
        if (score > bestScore) {
          bestScore = score;
          best = idx;
        }
      });

      // Return best chunk + a bit of context from next chunk
      const result =
        chunks[best] +
        (chunks[best + 1]
          ? "\n...(continued)...\n" + chunks[best + 1].slice(0, 800)
          : "");
      return result;
    }

    // ── Conversation ID generator ─────────────────────────────────────────
    function genId() {
      return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
    }

    // ── Storage: multi-conversation ───────────────────────────────────────
    // Format: { convs: [{id, label, history, ts}] }
    // Legacy (fv_chat_*): migrated on first load, then deleted.

    function saveConversations() {
      try {
        // Update the current conversation in allConversations
        const idx = allConversations.findIndex((c) => c.id === currentConvId);
        const label =
          chatHistory.find((m) => m.role === "user")?.content?.slice(0, 60) ||
          "New conversation";
        if (idx >= 0) {
          allConversations[idx] = {
            ...allConversations[idx],
            label,
            history: chatHistory.slice(-MAX_HISTORY),
            ts: Date.now(),
          };
        } else if (chatHistory.length > 0) {
          allConversations.unshift({
            id: currentConvId,
            label,
            history: chatHistory.slice(-MAX_HISTORY),
            ts: Date.now(),
          });
        }
        // Keep only the most recent MAX_CONVERSATIONS
        allConversations = allConversations.slice(0, MAX_CONVERSATIONS);
        storageSet({ [CONVS_KEY()]: JSON.stringify({ convs: allConversations }) });
      } catch (e) {}
    }

    // saveHistory is kept as an alias so existing call-sites still work
    function saveHistory() {
      saveConversations();
    }

    function loadConversations(cb) {
      try {
        storageGet([CONVS_KEY(), LEGACY_KEY()], (res) => {
          // Try new format first
          if (res[CONVS_KEY()]) {
            try {
              const parsed = JSON.parse(res[CONVS_KEY()]);
              allConversations = parsed.convs || [];
            } catch (e) {
              allConversations = [];
            }
          } else if (res[LEGACY_KEY()]) {
            // Migrate legacy single-conversation to new format
            try {
              const parsed = JSON.parse(res[LEGACY_KEY()]);
              const legacyHistory = parsed.history || [];
              if (legacyHistory.length > 0) {
                const label =
                  legacyHistory.find((m) => m.role === "user")?.content?.slice(0, 60) ||
                  "Previous conversation";
                allConversations = [
                  {
                    id: genId(),
                    label,
                    history: legacyHistory,
                    ts: parsed.ts || Date.now(),
                  },
                ];
                // Save migrated data and remove legacy key
                storageSet({
                  [CONVS_KEY()]: JSON.stringify({ convs: allConversations }),
                  [LEGACY_KEY()]: undefined,
                });
              } else {
                allConversations = [];
              }
            } catch (e) {
              allConversations = [];
            }
          } else {
            allConversations = [];
          }
          cb();
        });
      } catch (e) {
        allConversations = [];
        cb();
      }
    }

    function loadHistory(cb) {
      loadConversations(() => {
        // Load the most recent conversation (if any) as the active one
        if (allConversations.length > 0) {
          const latest = allConversations[0];
          currentConvId = latest.id;
          chatHistory = latest.history || [];
        } else {
          currentConvId = genId();
          chatHistory = [];
        }
        cb();
      });
    }

    // ── Load AI settings (proxied through background) ────────────────────
    function loadSettings(cb) {
      try {
        storageGet(
          ["chatbotEnabled", "aiBaseUrl", "aiApiKey", "aiModel"],
          (s) => {
            chatEnabled = !!s.chatbotEnabled;
            aiSettings = {
              baseUrl: s.aiBaseUrl || "",
              apiKey: s.aiApiKey || "",
              model: s.aiModel || "",
            };
            cb();
          },
        );
      } catch (e) {
        cb();
      }
    }

    // ── Build Widget DOM ─────────────────────────────────────────────────
    function buildWidget() {
      const widget = document.createElement("div");
      widget.id = "fv-chatbot-widget";
      widget.innerHTML = `
        <div id="fv-chatbot-panel">
          <div id="fv-chatbot-header">
            <div class="fv-chatbot-avatar">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M12 2a2 2 0 0 1 2 2c0 .74-.4 1.39-1 1.73V7h1a7 7 0 0 1 7 7H3a7 7 0 0 1 7-7h1V5.73c-.6-.34-1-.99-1-1.73a2 2 0 0 1 2-2z"/>
                <path d="M3 14v4a1 1 0 0 0 1 1h16a1 1 0 0 0 1-1v-4"/>
                <circle cx="9" cy="17" r="1" fill="white" stroke="none"/>
                <circle cx="15" cy="17" r="1" fill="white" stroke="none"/>
              </svg>
            </div>
            <div>
              <div class="fv-chatbot-title">File AI Assistant</div>
              <div class="fv-chatbot-subtitle" id="fv-chatbot-model-label">Analyzing your file…</div>
            </div>
            <button id="fv-chatbot-close-btn" title="Minimize">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M18 6L6 18M6 6l12 12"/></svg>
            </button>
          </div>

          <div id="fv-chatbot-file-chip">
            📄 <span id="fv-chatbot-filename"></span>
          </div>

          <!-- Shared body: messages + history drawer stack absolutely inside here -->
          <div id="fv-chatbot-body">

            <div id="fv-chatbot-messages">
              <div id="fv-chatbot-no-config">
                <strong>⚙️ Setup Required</strong>
                Click the extension icon in your toolbar to configure your API key and model.
                <div class="fv-chatbot-setup-hint">
                  Open the FileView popup → AI Chatbot section → enter your Base URL, API Key, and Model name.
                </div>
              </div>
            </div>

            <!-- History drawer lives in the same layer — overlays messages when open -->
            <div id="fv-conv-drawer" style="display:none;">
              <div id="fv-conv-drawer-header">
                <span>📂 Conversation History</span>
                <button id="fv-conv-drawer-close">✕ Close</button>
              </div>
              <div id="fv-conv-list"></div>
            </div>

          </div>

          <div id="fv-chatbot-action-bar">
            <button id="fv-chatbot-new-btn" title="Start a new conversation">＋ New</button>
            <button id="fv-chatbot-history-btn" title="Load a past conversation">📂 History</button>
          </div>

          <div id="fv-chatbot-input-area">
            <textarea id="fv-chatbot-input" placeholder="Ask about this file…" rows="1"></textarea>
            <button id="fv-chatbot-send-btn" title="Send (Enter)">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
              </svg>
            </button>
          </div>
        </div>

        <button id="fv-chatbot-fab" title="AI Chat Assistant">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
          </svg>
        </button>
      `;
      // Mount on <html> (documentElement), NOT <body>.
      document.documentElement.appendChild(widget);
      return widget;
    }

    // ── Render message ───────────────────────────────────────────────────
    function renderMessage(role, content) {
      const msgs = document.getElementById("fv-chatbot-messages");
      if (!msgs) return;
      const noConfig = document.getElementById("fv-chatbot-no-config");
      if (noConfig) noConfig.style.display = "none";

      const wrap = document.createElement("div");
      wrap.className =
        "fv-chat-msg fv-chat-" + (role === "user" ? "user" : "ai");

      const bubble = document.createElement("div");
      bubble.className = "fv-chat-bubble";

      // Basic markdown-ish rendering
      bubble.innerHTML = content
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/```([\s\S]*?)```/g, "<pre><code>$1</code></pre>")
        .replace(/`([^`]+)`/g, "<code>$1</code>")
        .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
        .replace(/\n/g, "<br>");

      const time = document.createElement("div");
      time.className = "fv-chat-time";
      time.textContent = new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });

      wrap.appendChild(bubble);
      wrap.appendChild(time);
      msgs.appendChild(wrap);
      msgs.scrollTop = msgs.scrollHeight;
    }

    function showTyping() {
      const msgs = document.getElementById("fv-chatbot-messages");
      if (!msgs) return;
      const el = document.createElement("div");
      el.className = "fv-chat-msg fv-chat-ai";
      el.id = "fv-chatbot-typing";
      el.innerHTML =
        '<div class="fv-chat-typing"><span></span><span></span><span></span></div>';
      msgs.appendChild(el);
      msgs.scrollTop = msgs.scrollHeight;
    }

    function hideTyping() {
      const el = document.getElementById("fv-chatbot-typing");
      if (el) el.remove();
    }

    function setSendDisabled(disabled) {
      const btn = document.getElementById("fv-chatbot-send-btn");
      const input = document.getElementById("fv-chatbot-input");
      if (btn) btn.disabled = disabled;
      if (input) input.disabled = disabled;
    }

    // ── Send message to AI ───────────────────────────────────────────────
    // ── Streaming AI bubble ───────────────────────────────────────────────
    // Creates an empty AI bubble and returns a handle to stream tokens into it
    function createStreamingBubble() {
      const msgs = document.getElementById("fv-chatbot-messages");
      if (!msgs) return null;

      const noConfig = document.getElementById("fv-chatbot-no-config");
      if (noConfig) noConfig.style.display = "none";

      const wrap = document.createElement("div");
      wrap.className = "fv-chat-msg fv-chat-ai";
      const bubble = document.createElement("div");
      bubble.className = "fv-chat-bubble";
      const cursor = document.createElement("span");
      cursor.className = "fv-stream-cursor";
      cursor.textContent = "▋";
      const time = document.createElement("div");
      time.className = "fv-chat-time";
      time.textContent = new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });

      wrap.appendChild(bubble);
      wrap.appendChild(time);
      msgs.appendChild(wrap);
      msgs.scrollTop = msgs.scrollHeight;

      let rawText = "";

      function rerender() {
        bubble.innerHTML = rawText
          .replace(/&/g, "&amp;")
          .replace(/</g, "&lt;")
          .replace(/>/g, "&gt;")
          .replace(/```([\s\S]*?)```/g, "<pre><code>$1</code></pre>")
          .replace(/`([^`]+)`/g, "<code>$1</code>")
          .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
          .replace(/\n/g, "<br>");
        bubble.appendChild(cursor);
        msgs.scrollTop = msgs.scrollHeight;
      }

      return {
        append(token) {
          rawText += token;
          rerender();
        },
        finish() {
          cursor.remove();
          return rawText;
        },
      };
    }

    // ── Send user message (streaming) ─────────────────────────────────────
    function sendMessage(userText) {
      if (!userText.trim() || isLoading) return;

      // Always re-read from storage (proxied via background) before sending
      storageGet(["aiBaseUrl", "aiApiKey", "aiModel"], (s) => {
        if (s.aiBaseUrl) aiSettings.baseUrl = s.aiBaseUrl;
        if (s.aiApiKey) aiSettings.apiKey = s.aiApiKey;
        if (s.aiModel) aiSettings.model = s.aiModel;
        _doSendMessage(userText);
      });
    }

    function _doSendMessage(userText) {
      if (!aiSettings.apiKey) {
        renderMessage(
          "ai",
          "\u26a0\ufe0f No API key set. Open the FileView popup \u2192 AI Chatbot \u2192 enter your API Key.",
        );
        return;
      }
      if (!aiSettings.baseUrl) {
        renderMessage(
          "ai",
          "\u26a0\ufe0f No Base URL set. Open the FileView popup and enter the full base URL (e.g. https://openrouter.ai/api/v1).",
        );
        return;
      }
      if (!aiSettings.model) {
        renderMessage(
          "ai",
          "\u26a0\ufe0f No model name set. Open the FileView popup and enter the model name.",
        );
        return;
      }

      isLoading = true;
      setSendDisabled(true);

      renderMessage("user", userText);
      chatHistory.push({ role: "user", content: userText });

      // Build system prompt with relevant file chunk
      const fileChunk = getRelevantChunk(userText);
      const fileName = getFileName();
      const systemMsg =
        "You are an expert code/file analyst assistant embedded in a file viewer.\n" +
        'The user has opened: "' +
        fileName +
        '"\n\n' +
        "Relevant file content:\n```\n" +
        fileChunk +
        "\n```\n\n" +
        "Be concise, precise, and developer-friendly. " +
        "Explain code logic, patterns, bugs, or improvements as relevant.";

      const apiMessages = [
        { role: "system", content: systemMsg },
        ...chatHistory
          .slice(-10)
          .map((m) => ({ role: m.role, content: m.content })),
      ];

      // Create streaming bubble — tokens will appear here in real-time
      const streamBubble = createStreamingBubble();

      function cleanup() {
        try {
          if (chrome && chrome.runtime && chrome.runtime.onMessage) {
            chrome.runtime.onMessage.removeListener(onChunk);
          }
        } catch (_) {}
      }

      function onChunk(msg) {
        if (!msg) return;

        if (msg.type === "CHATBOT_STREAM_CHUNK") {
          if (streamBubble) streamBubble.append(msg.content);
          return;
        }

        if (msg.type === "CHATBOT_STREAM_DONE") {
          cleanup();
          const fullText = streamBubble ? streamBubble.finish() : "";
          if (fullText) {
            chatHistory.push({ role: "assistant", content: fullText });
            saveHistory();
          }
          isLoading = false;
          setSendDisabled(false);
          const inp = document.getElementById("fv-chatbot-input");
          if (inp) inp.focus();
          return;
        }

        if (msg.type === "CHATBOT_STREAM_ERROR") {
          cleanup();
          if (streamBubble) streamBubble.finish();
          renderMessage(
            "ai",
            "\u26a0\ufe0f Error: " + (msg.error || "Unknown error"),
          );
          isLoading = false;
          setSendDisabled(false);
          return;
        }
      }

      // Register listener before dispatching request
      try {
        if (typeof chrome === "undefined" || !chrome.runtime) {
          isLoading = false;
          setSendDisabled(false);
          renderMessage(
            "ai",
            "\u26a0\ufe0f Extension context unavailable. Reload the page.",
          );
          return;
        }
        chrome.runtime.onMessage.addListener(onChunk);
      } catch (e) {
        isLoading = false;
        setSendDisabled(false);
        renderMessage("ai", "\u26a0\ufe0f Runtime error: " + e.message);
        return;
      }

      // Send to background — background will push CHATBOT_STREAM_CHUNK messages
      // back to this tab using the sender.tab.id it receives
      try {
        chrome.runtime.sendMessage(
          {
            type: "CHATBOT_API_REQUEST",
            baseUrl: aiSettings.baseUrl,
            apiKey: aiSettings.apiKey,
            model: aiSettings.model,
            messages: apiMessages,
          },
          () => {
            if (chrome.runtime) void chrome.runtime.lastError;
          },
        );
      } catch (e) {
        cleanup();
        isLoading = false;
        setSendDisabled(false);
        if (streamBubble) streamBubble.finish();
        renderMessage("ai", "\u26a0\ufe0f Send failed: " + e.message);
      }
    }

    // ── Open / Close ─────────────────────────────────────────────────────
    function openPanel() {
      chatOpen = true;
      const panel = document.getElementById("fv-chatbot-panel");
      const fab = document.getElementById("fv-chatbot-fab");
      const navBtn = document.getElementById("fv-chatbot-nav-btn");
      if (panel) panel.classList.add("fv-chatbot-panel-open");
      if (fab) fab.classList.add("fv-chatbot-open");
      if (navBtn) navBtn.classList.add("fv-chatbot-nav-active");

      // Check config
      checkConfigDisplay();

      // Focus input
      setTimeout(() => {
        const input = document.getElementById("fv-chatbot-input");
        if (input) input.focus();
      }, 250);
    }

    function closePanel() {
      chatOpen = false;
      const panel = document.getElementById("fv-chatbot-panel");
      const fab = document.getElementById("fv-chatbot-fab");
      const navBtn = document.getElementById("fv-chatbot-nav-btn");
      if (panel) panel.classList.remove("fv-chatbot-panel-open");
      if (fab) fab.classList.remove("fv-chatbot-open");
      if (navBtn) navBtn.classList.remove("fv-chatbot-nav-active");
    }

    function togglePanel() {
      chatOpen ? closePanel() : openPanel();
    }

    function checkConfigDisplay() {
      const noConfig = document.getElementById("fv-chatbot-no-config");
      if (!noConfig) return;

      // Always re-read from storage (proxied via background)
      try {
        storageGet(["aiApiKey", "aiBaseUrl", "aiModel"], (s) => {
          if (s.aiBaseUrl) aiSettings.baseUrl = s.aiBaseUrl;
          if (s.aiApiKey) aiSettings.apiKey = s.aiApiKey;
          if (s.aiModel) aiSettings.model = s.aiModel;

          const hasConfig = !!(
            aiSettings.apiKey &&
            aiSettings.baseUrl &&
            aiSettings.model
          );
          noConfig.style.display = hasConfig ? "none" : "block";

          const mlEl = document.getElementById("fv-chatbot-model-label");
          if (mlEl) mlEl.textContent = aiSettings.model || "Configure in popup";

          // FIX: Only show welcome message once per session (not on every open).
          // welcomeShown is reset only in newConversation() so reloading a
          // file always gets exactly one fresh greeting.
          if (hasConfig && chatHistory.length === 0 && !welcomeShown) {
            welcomeShown = true;
            renderMessage(
              "ai",
              "\ud83d\udc4b Hi! I\u2019ve loaded \u201c" +
                getFileName() +
                "\u201d. Ask me anything \u2014 I can explain code, find bugs, or summarize content.",
            );
          }
        });
      } catch (_) {}
    }

    // ── Restore history ──────────────────────────────────────────────────
    function restoreHistory() {
      if (!chatHistory.length) return;
      const noConfig = document.getElementById("fv-chatbot-no-config");
      if (noConfig) noConfig.style.display = "none";
      chatHistory.forEach((m) => {
        if (m.role === "user" || m.role === "assistant") {
          renderMessage(m.role, m.content);
        }
      });
    }

    // ── History drawer ────────────────────────────────────────────────────
    function renderConvList() {
      const list = document.getElementById("fv-conv-list");
      if (!list) return;
      list.innerHTML = "";

      if (allConversations.length === 0) {
        list.innerHTML =
          '<div class="fv-conv-empty">No saved conversations yet.</div>';
        return;
      }

      allConversations.forEach((conv) => {
        const item = document.createElement("div");
        item.className =
          "fv-conv-item" + (conv.id === currentConvId ? " fv-conv-active" : "");

        const date = new Date(conv.ts);
        const dateStr = date.toLocaleDateString([], {
          month: "short",
          day: "numeric",
        });
        const timeStr = date.toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        });
        const msgCount = conv.history.filter(
          (m) => m.role === "user",
        ).length;

        item.innerHTML =
          '<div class="fv-conv-label" title="' +
          (conv.label || "Conversation").replace(/"/g, "&quot;") +
          '">' +
          (conv.label || "Conversation").slice(0, 55) +
          (conv.label && conv.label.length > 55 ? "…" : "") +
          "</div>" +
          '<div class="fv-conv-meta">' +
          dateStr +
          " " +
          timeStr +
          " · " +
          msgCount +
          " message" +
          (msgCount !== 1 ? "s" : "") +
          "</div>";

        item.addEventListener("click", () => loadConversation(conv.id));
        list.appendChild(item);
      });
    }

    function toggleHistoryDrawer() {
      const drawer = document.getElementById("fv-conv-drawer");
      if (!drawer) return;
      historyDrawerOpen = !historyDrawerOpen;
      const hBtn = document.getElementById("fv-chatbot-history-btn");
      if (historyDrawerOpen) {
        renderConvList();
        drawer.style.display = "flex";
        // Force reflow so the transition fires
        void drawer.offsetHeight;
        drawer.classList.add("fv-drawer-open");
        if (hBtn) hBtn.classList.add("fv-btn-active-conv");
      } else {
        drawer.classList.remove("fv-drawer-open");
        // Hide after transition ends
        drawer.addEventListener("transitionend", () => {
          if (!historyDrawerOpen) drawer.style.display = "none";
        }, { once: true });
        if (hBtn) hBtn.classList.remove("fv-btn-active-conv");
      }
    }

    function loadConversation(convId) {
      const conv = allConversations.find((c) => c.id === convId);
      if (!conv) return;

      // Save current session before switching
      saveConversations();

      // Switch to selected conversation
      currentConvId = conv.id;
      chatHistory = conv.history ? [...conv.history] : [];
      welcomeShown = chatHistory.length > 0; // don't re-show welcome if history exists

      // Clear and repopulate messages panel
      const msgs = document.getElementById("fv-chatbot-messages");
      if (msgs) {
        msgs.innerHTML =
          '<div id="fv-chatbot-no-config" style="display:none"></div>';
      }

      if (chatHistory.length > 0) {
        restoreHistory();
      } else {
        checkConfigDisplay();
      }

      // Close drawer
      historyDrawerOpen = true; // force toggle to close
      toggleHistoryDrawer();
    }

    // ── New conversation ──────────────────────────────────────────────────
    function newConversation() {
      // FIX: Save current conversation before clearing
      if (chatHistory.length > 0) {
        saveConversations();
      }

      // Start a brand-new conversation with a fresh ID
      currentConvId = genId();
      chatHistory = [];
      welcomeShown = false; // FIX: reset so welcome message fires exactly once

      const msgs = document.getElementById("fv-chatbot-messages");
      if (msgs) {
        msgs.innerHTML =
          '<div id="fv-chatbot-no-config" style="display:none"></div>';
      }

      // Close history drawer if open
      if (historyDrawerOpen) {
        historyDrawerOpen = true;
        toggleHistoryDrawer();
      }

      checkConfigDisplay();
    }

    // ── Init ─────────────────────────────────────────────────────────────
    function initChatbotWidget() {
      buildWidget();

      // Set file name chip
      const fnEl = document.getElementById("fv-chatbot-filename");
      if (fnEl) fnEl.textContent = getFileName();

      // Set model label
      const mlEl = document.getElementById("fv-chatbot-model-label");
      if (mlEl) mlEl.textContent = aiSettings.model || "gpt-4o-mini";

      // Restore chat history for this file
      loadHistory(() => {
        restoreHistory();
      });

      // Wire up FAB
      const fab = document.getElementById("fv-chatbot-fab");
      if (fab) fab.addEventListener("click", togglePanel);

      // Wire up close button
      const closeBtn = document.getElementById("fv-chatbot-close-btn");
      if (closeBtn) closeBtn.addEventListener("click", closePanel);

      // Wire up send button
      const sendBtn = document.getElementById("fv-chatbot-send-btn");
      if (sendBtn)
        sendBtn.addEventListener("click", () => {
          const input = document.getElementById("fv-chatbot-input");
          if (input) {
            sendMessage(input.value);
            input.value = "";
            input.style.height = "auto";
          }
        });

      // Wire up textarea — Enter to send, Shift+Enter for newline, auto-resize
      const input = document.getElementById("fv-chatbot-input");
      if (input) {
        input.addEventListener("keydown", (e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            sendMessage(input.value);
            input.value = "";
            input.style.height = "auto";
          }
        });
        input.addEventListener("input", () => {
          input.style.height = "auto";
          input.style.height = Math.min(input.scrollHeight, 100) + "px";
        });
      }

      // Wire up new conversation
      const newBtn = document.getElementById("fv-chatbot-new-btn");
      if (newBtn) newBtn.addEventListener("click", newConversation);

      // FIX: Wire up history/load conversation button
      const historyBtn = document.getElementById("fv-chatbot-history-btn");
      if (historyBtn) historyBtn.addEventListener("click", toggleHistoryDrawer);

      // FIX: Wire up history drawer close button
      const drawerClose = document.getElementById("fv-conv-drawer-close");
      if (drawerClose) drawerClose.addEventListener("click", () => {
        if (historyDrawerOpen) toggleHistoryDrawer();
      });

      // Update navbar button visibility
      updateNavBtn();
    }

    function updateNavBtn() {
      const navBtn = document.getElementById("fv-chatbot-nav-btn");
      if (!navBtn) return;
      if (chatEnabled) {
        navBtn.style.display = "";
        navBtn.innerHTML =
          '<span class="fv-chatbot-dot"></span><span>AI Chat</span>';
      } else {
        navBtn.style.display = "";
        navBtn.innerHTML = "<span>🤖 AI Chat</span>";
      }
    }

    // ── Listen for settings changes from popup ───────────────────────────
    // Guard: chrome.runtime can be undefined if extension context is invalidated
    // (e.g. after extension reload) or if the script runs outside extension context.
    function safeAddRuntimeListener() {
      try {
        if (
          typeof chrome === "undefined" ||
          !chrome.runtime ||
          !chrome.runtime.onMessage
        )
          return;
        chrome.runtime.onMessage.addListener((msg) => {
          if (!msg) return;
          if (msg.type === "CHATBOT_TOGGLE") {
            chatEnabled = msg.enabled;
            updateNavBtn();
          }
          if (msg.type === "CHATBOT_SETTINGS_UPDATED") {
            aiSettings = {
              baseUrl: msg.settings.aiBaseUrl || "",
              apiKey: msg.settings.aiApiKey || "",
              model: msg.settings.aiModel || "gpt-4o-mini",
            };
            const mlEl = document.getElementById("fv-chatbot-model-label");
            if (mlEl) mlEl.textContent = aiSettings.model;
            if (chatOpen) checkConfigDisplay();
          }
        });
      } catch (e) {
        // Extension context invalidated — listener not registered, settings
        // will still be read from chrome.storage.local on next page load.
      }
    }
    safeAddRuntimeListener();

    // ── Expose public API for navbar button ──────────────────────────────
    window.__fvChatbot = {
      toggle: togglePanel,
      open: openPanel,
      close: closePanel,
    };

    // ── Bootstrap ────────────────────────────────────────────────────────
    loadSettings(() => {
      // Listen for fv:ready event fired by safeInit() after init() completes.
      // This avoids polling and races — the chatbot always runs AFTER the
      // toolbar and editor are fully built.
      function onFvReady() {
        // fv-container is the root built by init(). If it's absent, init()
        // decided this page isn't a file view — don't mount the chatbot.
        if (!document.getElementById("fv-container")) return;
        initChatbotWidget();
      }

      if (document.getElementById("fv-container")) {
        // init() already finished before the chatbot module loaded (fast page)
        initChatbotWidget();
      } else {
        document.addEventListener("fv:ready", onFvReady, { once: true });
      }
    });
  })(); // end chatbot module
})();
