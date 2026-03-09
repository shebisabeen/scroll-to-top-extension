# Scroll to Top — Chrome Extension

A lightweight Chrome extension that adds a sleek, floating **Scroll to Top** button to every webpage. Click once to smoothly return to the top of any page.

---

## ✨ Features

- 🔼 **Floating button** — appears automatically after scrolling 300 px down any page
- 🎨 **Clean design** — smooth fade-in/out animation with hover & active states
- ⚙️ **Per-site toggle** — enable or disable the button on specific websites via the popup
- 📊 **Scroll progress indicator** — live scroll depth shown in the popup when active
- 🔍 **Diagnostics panel** — the popup reports whether the button is active on the current tab
- 🛡️ **Style-isolated** — uses `all: initial` / `!important` rules to prevent host-page CSS from affecting the button
- 🚫 **Zero data collection** — see [Privacy Policy](PRIVACY_POLICY.md)

---

## 📸 Screenshots

> *(Add screenshots of the floating button and the popup UI here)*

---

## 🗂️ Project Structure

```
scroll-to-top-extension/
├── manifest.json       # Extension manifest (MV3)
├── content.js          # Injects & controls the floating button on every page
├── content.css         # (Reserved) additional page-level styles
├── popup.html          # Popup UI markup
├── popup.css           # Popup styles
├── popup.js            # Popup logic (toggle, diagnostics, scroll progress)
├── icons/
│   ├── icon16.png
│   ├── icon48.png
│   └── icon128.png
├── PRIVACY_POLICY.md   # Privacy policy
└── README.md           # This file
```

---

## 🚀 Installation

### From the Chrome Web Store
> *(Link to be added once published)*

### Manual / Developer Install

1. **Clone or download** this repository:
   ```bash
   git clone https://github.com/shebisabeen/scroll-to-top-extension.git
   ```
2. Open **Chrome** and navigate to `chrome://extensions/`
3. Enable **Developer mode** (toggle in the top-right corner)
4. Click **Load unpacked** and select the `scroll-to-top-extension` folder
5. The extension icon will appear in your toolbar — you're all set!

---

## 🔧 How It Works

| Component | Responsibility |
|-----------|---------------|
| `content.js` | Injects the floating button into every page, listens for scroll events, and responds to messages from the popup |
| `popup.js` | Reads/writes per-host preferences in `chrome.storage.local`, pings the content script for live diagnostics, and shows a scroll progress bar |
| `manifest.json` | Declares MV3 permissions (`storage`, `tabs`) and registers the content script to run on `<all_urls>` |

The button appears when the user scrolls **more than 300 px** and is hidden otherwise. Clicking it calls `window.scrollTo({ top: 0, behavior: 'smooth' })`.

---

## 🔒 Permissions

| Permission | Why it's needed |
|------------|----------------|
| `storage` | Save per-site enabled/disabled preferences locally in the browser |
| `tabs` | Query the active tab so the popup can communicate with the correct content script |

---

## 🛡️ Privacy

This extension **collects no user data** of any kind. Everything runs locally in your browser. Read the full [Privacy Policy](PRIVACY_POLICY.md).

---

## 🤝 Contributing

Contributions, bug reports, and feature requests are welcome!

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/my-feature`
3. Commit your changes: `git commit -m "Add my feature"`
4. Push to the branch: `git push origin feature/my-feature`
5. Open a Pull Request

---

## 📄 License

This project is open source. Feel free to use and modify it.

---

## 👤 Author

**Shebi Sabeen** — [@shebisabeen](https://github.com/shebisabeen)
