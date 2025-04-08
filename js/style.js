// style.js

(function() {
  const stylesCSS = `
    /* Globalne ustawienia */
    html, body {
      margin: 0;
      padding: 0;
      height: 100%;
      font-family: 'Roboto', sans-serif;
      background-color: #42424255; /* półprzezroczyste tło */
      display: flex;
      flex-direction: column;
    }

    /* Pasek u góry (topbar) */
    #topbar {
      height: 60px;
      background-color: #2b2b2b;
      display: flex;
      align-items: center;
      padding: 0 20px;
      box-shadow: 0 2px 5px rgba(0,0,0,0.4);
      z-index: 9999;
    }
    #topbar h1 {
      color: #fff;
      font-size: 1.3em;
      margin: 0;
      padding: 0;
      flex-shrink: 0;
      margin-right: 20px;
    }

    /* Foldery (Słupy, Podesty itp.) */
    .folder-buttons {
      display: flex;
      gap: 10px;
      margin-right: 30px;
    }
    .folder-button {
      padding: 8px 14px;
      background-color: rgb(87, 126, 42);
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-size: 0.9em;
      color: #fff;
      transition: background-color 0.3s, transform 0.1s;
    }
    .folder-button:hover {
      background-color: #7AB237;
    }
    .folder-button:active {
      transform: scale(0.97);
    }

    /* Narzędzia (Zapisz, Otwórz, Reset, Strefa, PDF) */
    .tools-buttons {
      display: flex;
      gap: 10px;
      margin-left: auto;
    }
    .tool-button {
      padding: 8px 14px;
      background-color: rgb(65, 105, 18);
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-size: 0.9em;
      color: #fff;
      transition: background-color 0.3s, transform 0.1s;
    }
    .tool-button:hover {
      background-color: #4F6C31;
    }
    .tool-button:active {
      transform: scale(0.97);
    }
    .tool-select {
      padding: 6px 8px;
      background-color: #607E3D;
      border: none;
      border-radius: 4px;
      color: #fff;
      font-size: 0.9em;
      cursor: pointer;
      transition: background-color 0.3s;
    }
    .tool-select:hover {
      background-color: #4F6C31;
    }

    /* Główny kontener (scena + panel) */
    #container {
      flex: 1;
      display: flex;
      overflow: hidden;
      position: relative;
    }

    /* Panel modułów (z lewej) */
    #moduleListPanel {
      position: absolute;
      top: 0;
      left: 0;
      width: 250px;
      height: 100%;
      background-color: rgba(46, 45, 45, 0.9);
      box-shadow: 2px 0 5px rgba(0, 0, 0, 0.64);
      color: #fff;
      overflow-y: auto;
      padding: 15px;
      transform: translateX(-270px);
      transition: transform 0.3s ease;
      z-index: 999;
    }
    #moduleListPanel.open {
      transform: translateX(0);
    }
    #moduleListPanel h2 {
      font-size: 1.1em;
      color: rgb(76, 139, 76);
      margin-bottom: 10px;
      border-bottom: 1px solid #444;
      padding-bottom: 5px;
    }

    /* Kafelki modułów */
    .module-item {
      display: flex;
      align-items: center;
      padding: 12px;
      margin-bottom: 8px;
      background-color: rgba(255,255,255,0.1);
      border-radius: 4px;
      cursor: pointer;
      transition: background-color 0.3s;
    }
    .module-item:hover {
      background-color: rgba(29, 29, 29, 0.42);
    }
    .module-thumb-img {
      width: 120px;
      height: 120px;
      object-fit: cover;
      border-radius: 8px;
      margin-bottom: 8px;
      -webkit-user-drag: none;
      user-drag: none;
    }

    /* Scena Three.js */
    #main-content {
      flex: 1;
      position: relative;
      background-color: #222;
    }

    /* Panel info (np. wymiary) */
    #infoPanel {
      position: absolute;
      bottom: 10px;
      left: 10px;
      z-index: 999;
      background-color: rgba(0,0,0,0.5);
      color: #fff;
      padding: 6px;
      border-radius: 3px;
      font-size: 0.85em;
      max-width: 220px;
    }

    /* Panel "wykorzystanych modułów" – opcjonalnie */
    #modulesPanel {
      position: absolute;
      top: 10px;
      right: 10px;
      background-color: rgba(0,0,0,0.3);
      color: #fff;
      padding: 6px;
      border-radius: 3px;
      font-size: 0.85em;
      max-width: 220px;
      z-index: 999;
    }

    /* Logo w prawym dolnym rogu */
    #logoContainer {
      position: absolute;
      bottom: 10px;
      right: 10px;
      z-index: 999;
      width: 180px;
      height: auto;
    }
    #logoContainer img {
      width: 100%;
      height: auto;
      display: block;
    }

    /* Menu kontekstowe */
    #contextMenu {
      display: none;
      position: absolute;
      background-color: #333;
      color: #fff;
      padding: 5px;
      border: 1px solid #444;
      z-index: 9999;
      min-width: 100px;
    }
    #contextMenu div {
      padding: 5px;
      cursor: pointer;
    }
    #contextMenu div:hover {
      background-color: #444;
    }

    /* Okienko pomocy */
    #help {
      position: fixed;
      top: 10px;
      right: 10px;
      background-color: #333;
      padding: 15px;
      border: 1px solid #444;
      border-radius: 3px;
      max-width: 250px;
      font-size: 0.9em;
      color: #ddd;
      z-index: 100;
      display: block;
    }
    #help h4 {
      margin-bottom: 10px;
      color: rgb(101, 143, 54);
    }
    #help button {
      background-color: #8BC34A;
      color: #fff;
      border: none;
      padding: 5px 10px;
      border-radius: 3px;
      cursor: pointer;
      font-size: 0.8em;
      margin-top: 10px;
    }
    #helpToggle {
      position: fixed;
      top: 10px;
      right: 10px;
      background-color: rgb(116, 163, 62);
      color: #fff;
      border: none;
      padding: 5px 10px;
      border-radius: 3px;
      cursor: pointer;
      font-size: 0.8em;
      z-index: 100;
      display: block;
    }
  `;

  try {
    const styleEl = document.createElement('style');
    styleEl.type = 'text/css';
    styleEl.appendChild(document.createTextNode(stylesCSS));
    document.head.appendChild(styleEl);
    console.log("Style zostały załadowane pomyślnie.");
  } catch (error) {
    console.error("Błąd podczas ładowania stylów:", error);
  }
})();
