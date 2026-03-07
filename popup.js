// ── Element refs ─────────────────────────────────────────────────────────
const GITHUB_URL  = 'https://github.com/shebisabeen/scroll-to-top-extension';
const toggle      = document.getElementById('toggle');
const toggleRow   = document.getElementById('toggle-row');
const diagCard    = document.getElementById('diag-card');
const diagIcon    = document.getElementById('diag-icon');
const diagTitle   = document.getElementById('diag-title');
const diagDetail  = document.getElementById('diag-detail');
const scrollRow   = document.getElementById('scroll-row');
const scrollValue = document.getElementById('scroll-value');
const scrollFill  = document.getElementById('scroll-bar-fill');

const STORAGE_KEY = 'sttDisabledHosts';
const THRESHOLD   = 300; // must match content.js

// ── Diagnosis states ─────────────────────────────────────────────────────
const STATES = {
  checking: {
    cls: '',
    icon: '⏳',
    title: 'Checking this page…',
    detail: 'Contacting the content script',
  },
  working: {
    cls: 'state-ok',
    icon: '✅',
    title: 'Button is visible!',
    detail: 'The scroll-to-top button is showing on this page.',
  },
  needsScroll: {
    cls: 'state-info',
    icon: '☝️',
    title: 'Almost there — scroll down a bit',
    detail: `The button appears after scrolling ${THRESHOLD} px. Scroll the page and it will pop up.`,
  },
  disabled: {
    cls: 'state-muted',
    icon: '⛔',
    title: 'Disabled on this site',
    detail: 'Toggle the switch above to re-enable the button on this site.',
  },
  blocked: {
    cls: 'state-error',
    icon: '🔒',
    title: 'Script not detected — try reloading',
    detail:
      'The content script isn\'t responding. This can happen due to a strict ' +
      'Content Security Policy (CSP) or if the extension was just installed. ' +
      '👉 Try reloading the page — it often fixes this.',
  },
  restricted: {
    cls: 'state-warn',
    icon: '⚠️',
    title: 'Chrome restricted page',
    detail:
      'Extensions cannot run on chrome://, about:, or Chrome Web Store pages. ' +
      'Navigate to a normal website to use Scroll to Top.',
  },
  fileUrl: {
    cls: 'state-warn',
    icon: '📄',
    title: 'Local file detected',
    detail:
      'To enable the button on file:// pages, go to chrome://extensions → ' +
      '"Scroll to Top" → turn on "Allow access to file URLs".',
  },
  noContent: {
    cls: 'state-warn',
    icon: '🔄',
    title: 'Script not yet loaded',
    detail:
      'The content script hasn\'t loaded on this tab yet. Try refreshing the ' +
      'page after installing or updating the extension.',
  },
};

function applyState(key, extra) {
  const s = { ...STATES[key], ...extra };
  // reset classes
  diagCard.className = 'diag-card ' + (s.cls || '');
  diagIcon.textContent  = s.icon;
  diagTitle.textContent = s.title;
  diagDetail.textContent = s.detail;
}

function setScrollProgress(scrollY, threshold) {
  const clamped = Math.min(scrollY, threshold);
  const pct     = Math.round((clamped / threshold) * 100);
  scrollValue.textContent = `${scrollY} / ${threshold} px`;
  scrollFill.style.width  = pct + '%';
  scrollFill.classList.toggle('full', scrollY >= threshold);
  scrollRow.style.display = 'flex';
}

// ── Helpers ──────────────────────────────────────────────────────────────
function getDisabledHosts(cb) {
  chrome.storage.local.get([STORAGE_KEY], (r) => cb((r && r[STORAGE_KEY]) || []));
}
function setDisabledHosts(hosts) {
  chrome.storage.local.set({ [STORAGE_KEY]: hosts });
}

function getActiveTab(cb) {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (!tabs || !tabs[0]) { cb(null, null); return; }
    const tab = tabs[0];
    let host = null;
    try { host = new URL(tab.url).hostname; } catch (_) {}
    cb(tab, host);
  });
}

// Ping the content script with a timeout
function pingContentScript(tabId, cb) {
  let done = false;
  const timer = setTimeout(() => {
    if (done) return;
    done = true;
    cb(null); // timed out → script probably not running
  }, 900);

  try {
    chrome.tabs.sendMessage(tabId, { type: 'STT_PING' }, (response) => {
      if (done) return;
      done = true;
      clearTimeout(timer);
      // Swallow "no receiver" errors
      if (chrome.runtime.lastError) { cb(null); return; }
      cb(response);
    });
  } catch (_) {
    clearTimeout(timer);
    if (!done) { done = true; cb(null); }
  }
}

// ── Classify URL ─────────────────────────────────────────────────────────
function classifyUrl(url) {
  if (!url) return 'restricted';
  if (/^(chrome|edge|about|devtools|brave):/.test(url)) return 'restricted';
  if (url.startsWith('https://chrome.google.com/webstore')) return 'restricted';
  if (url.startsWith('file://')) return 'fileUrl';
  return 'normal';
}

// ── Main flow ─────────────────────────────────────────────────────────────
applyState('checking');

getActiveTab((tab, host) => {
  // ── Restricted / non-injectable pages ───────────────────────────────────
  const urlClass = classifyUrl(tab && tab.url);
  if (urlClass === 'restricted') {
    toggleRow.style.opacity = '0.4';
    toggle.disabled = true;
    applyState('restricted');
    return;
  }
  if (urlClass === 'fileUrl') {
    toggleRow.style.opacity = '0.4';
    toggle.disabled = true;
    applyState('fileUrl');
    return;
  }

  if (!host) {
    applyState('restricted');
    return;
  }

  // ── Initialise toggle from storage ──────────────────────────────────────
  getDisabledHosts((disabled) => {
    const siteDisabled = disabled.includes(host);
    toggle.checked = !siteDisabled;

    // ── Ping the content script to get live state ──────────────────────
    pingContentScript(tab.id, (resp) => {
      if (!resp) {
        // No response → script not injected (CSP or new install)
        if (siteDisabled) {
          applyState('disabled');
        } else {
          applyState('blocked');
        }
        return;
      }

      // Script is alive — show detailed status
      if (!resp.isEnabled) {
        applyState('disabled');
        return;
      }

      setScrollProgress(resp.scrollY, resp.threshold || THRESHOLD);

      if (resp.isVisible) {
        applyState('working');
      } else {
        applyState('needsScroll', {
          detail: `The button appears after scrolling ${resp.threshold || THRESHOLD} px. ` +
                  `You're currently at ${resp.scrollY} px — keep scrolling!`,
        });
      }
    });
  });
});

// ── Handle toggle change ─────────────────────────────────────────────────
toggle.addEventListener('change', () => {
  getActiveTab((tab, host) => {
    if (!host) return;

    getDisabledHosts((disabled) => {
      let updated;
      if (toggle.checked) {
        updated = disabled.filter((h) => h !== host);
      } else {
        updated = disabled.includes(host) ? disabled : [...disabled, host];
      }
      setDisabledHosts(updated);

      // Notify content script
      if (tab) {
        chrome.tabs.sendMessage(
          tab.id,
          { type: 'STT_TOGGLE', enabled: toggle.checked },
          () => { void chrome.runtime.lastError; }
        );
      }

      // Re-run diagnosis so the card updates instantly
      if (!toggle.checked) {
        applyState('disabled');
        scrollRow.style.display = 'none';
      } else {
        // Re-ping after a short delay so the content script can react
        setTimeout(() => {
          pingContentScript(tab && tab.id, (resp) => {
            if (!resp) { applyState('blocked'); return; }
            setScrollProgress(resp.scrollY, resp.threshold || THRESHOLD);
            if (resp.isVisible) {
              applyState('working');
            } else {
              applyState('needsScroll', {
                detail: `The button appears after scrolling ${resp.threshold || THRESHOLD} px. ` +
                        `You're currently at ${resp.scrollY} px — keep scrolling!`,
              });
            }
          });
        }, 200);
      }
    });
  });
});

// ── GitHub link — open in new tab (links don't work directly in popups) ───
document.getElementById('github-link').addEventListener('click', (e) => {
  e.preventDefault();
  chrome.tabs.create({ url: GITHUB_URL });
});
