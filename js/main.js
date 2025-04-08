// main.js

document.addEventListener("DOMContentLoaded", () => {
  try {
    // Tworzymy główny obiekt PlaygroundApp
    window.app = new PlaygroundApp();

    // Dynamicznie ładujemy listę modułów (fallback w modules.js)
    app.loadAvailableModules().then((modules) => {
      app.availableModules = modules;
      // Inicjujemy panel modułów
      app.initModulesPanel();
    });

    // Inicjalizujemy OrbitControls
    app.initControls(app.camera, app.renderer.domElement);

    // Inicjalizujemy menu kontekstowe
    app.initContextMenu();

    console.log("Aplikacja PlaygroundApp zainicjalizowana.");
  } catch (error) {
    console.error("Błąd podczas inicjalizacji aplikacji:", error);
  }
});
