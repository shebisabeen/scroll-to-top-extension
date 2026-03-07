(function () {
  // Avoid injecting more than once (e.g. in iframes)
  if (document.getElementById('stt-btn-wrapper')) return;

  const STORAGE_KEY = 'sttDisabledHosts';
  const SHOW_AFTER_PX = 300;
  let isEnabled = true;

  // ── Inject isolated styles (!important prevents host-page overrides) ─────
  const styleEl = document.createElement('style');
  styleEl.id = 'stt-styles';
  styleEl.textContent = `
    #stt-btn-wrapper {
      all: initial !important;
      position: fixed !important;
      bottom: 36px !important;
      right: 36px !important;
      z-index: 2147483647 !important;
      width: 50px !important;
      height: 50px !important;
      display: flex !important;
      align-items: center !important;
      justify-content: center !important;
      pointer-events: none !important;
    }
    #stt-btn-wrapper.stt-show {
      pointer-events: auto !important;
    }
    #stt-real-btn {
      all: unset !important;
      box-sizing: border-box !important;
      width: 50px !important;
      height: 50px !important;
      background: #4f46e5 !important;
      color: #ffffff !important;
      border: none !important;
      border-radius: 50% !important;
      box-shadow: 0 4px 14px rgba(79,70,229,0.5) !important;
      cursor: pointer !important;
      display: flex !important;
      align-items: center !important;
      justify-content: center !important;
      padding: 0 !important;
      margin: 0 !important;
      opacity: 0 !important;
      transform: translateY(12px) scale(0.88) !important;
      transition: opacity 0.25s ease, transform 0.25s ease,
                  background 0.2s ease, box-shadow 0.2s ease !important;
      outline: none !important;
    }
    #stt-btn-wrapper.stt-show #stt-real-btn {
      opacity: 1 !important;
      transform: translateY(0) scale(1) !important;
    }
    #stt-real-btn:hover {
      background: #4338ca !important;
      box-shadow: 0 6px 20px rgba(79,70,229,0.65) !important;
      transform: translateY(-2px) scale(1.06) !important;
    }
    #stt-real-btn:active {
      transform: scale(0.94) !important;
    }
    #stt-real-btn:focus-visible {
      outline: 3px solid #a5b4fc !important;
      outline-offset: 3px !important;
    }
    #stt-real-btn svg {
      width: 22px !important;
      height: 22px !important;
      display: block !important;
      pointer-events: none !important;
    }
  `;
  (document.head || document.documentElement).appendChild(styleEl);

  // ── Create the wrapper + button ──────────────────────────────────────────
  const wrapper = document.createElement('div');
  wrapper.id = 'stt-btn-wrapper';

  const btn = document.createElement('button');
  btn.id = 'stt-real-btn';
  btn.title = 'Scroll to top';
  btn.setAttribute('aria-label', 'Scroll to top');
  btn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"
    fill="none" stroke="currentColor" stroke-width="2.5"
    stroke-linecap="round" stroke-linejoin="round">
    <polyline points="18 15 12 9 6 15"></polyline>
  </svg>`;

  wrapper.appendChild(btn);
  document.documentElement.appendChild(wrapper); // append to <html> not <body>

  // ── Visibility logic ─────────────────────────────────────────────────────
  function updateVisibility() {
    const scrolled = window.scrollY || document.documentElement.scrollTop;
    if (isEnabled && scrolled > SHOW_AFTER_PX) {
      wrapper.classList.add('stt-show');
    } else {
      wrapper.classList.remove('stt-show');
    }
  }

  window.addEventListener('scroll', updateVisibility, { passive: true });

  // ── Check stored per-host preference ────────────────────────────────────
  function checkEnabled() {
    const host = location.hostname;
    try {
      chrome.storage.local.get([STORAGE_KEY], (result) => {
        if (chrome.runtime.lastError) return;
        const disabled = (result && result[STORAGE_KEY]) || [];
        isEnabled = !disabled.includes(host);
        updateVisibility();
      });
    } catch (e) {
      // storage API not available (e.g. on some restricted pages)
    }
  }

  checkEnabled();

  // ── Listen for messages from the popup ──────────────────────────────────
  try {
    chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
      if (!msg) return;

      if (msg.type === 'STT_TOGGLE') {
        isEnabled = msg.enabled;
        updateVisibility();
        sendResponse({ ok: true });
      }

      // Diagnostic ping — reports current state back to popup
      if (msg.type === 'STT_PING') {
        const scrolled = window.scrollY || document.documentElement.scrollTop;
        sendResponse({
          ok: true,
          isEnabled,
          scrollY: Math.round(scrolled),
          threshold: SHOW_AFTER_PX,
          isVisible: wrapper.classList.contains('stt-show'),
        });
      }
    });
  } catch (e) { /* extension context not available */ }

  // ── Scroll to top on click ───────────────────────────────────────────────
  btn.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
})();
