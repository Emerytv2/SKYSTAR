// modules.js
// Obsługa panelu modułów (wysuwany z lewej), dynamiczne ładowanie i filtry.

PlaygroundApp.prototype.loadAvailableModules = function() {
  // Przykład: dynamiczne ładowanie z pliku modules.json lub fallback
  // Dla uproszczenia zwracamy Promise z modułami "na sztywno"
  return new Promise((resolve, reject) => {
    // Fallback – stała lista modułów
    const fallbackModules = [
      {
        name: "Podest M1101",
        folder: "Podesty",
        model: "assets/Podesty/M1101.glb",
        thumb: "assets/Podesty/thumbM1101.jpg"
      },
      {
        name: "Słup SP-170-01",
        folder: "Słupy",
        model: "assets/Słupy/SP-170-01.glb",
        thumb: "assets/Słupy/thumbSP-170-01.jpg"
      },
      {
        name: "Słup SP-210-01",
        folder: "Słupy",
        model: "assets/Słupy/SP-210-01.glb",
        thumb: "assets/Słupy/thumbSP-210-01.jpg"
      },
      {
        name: "Zjeżdżalnia Standardowa",
        folder: "Zjeżdżalnie",
        model: "assets/Zjeżdżalnie/zjezdzalniaStandardowa.glb",
        thumb: "assets/Zjeżdżalnie/thumb_zjezdzalniaStandardowa.jpg"
      }
      // Dodaj kolejne moduły według potrzeb
    ];

    // Można tu użyć fetch('modules.json')...
    // Tymczasem zwracamy fallback
    resolve(fallbackModules);
  });
};

PlaygroundApp.prototype.initModulesPanel = function() {
  // Metoda wywoływana po załadowaniu modułów w main.js
  console.log("initModulesPanel - panel boczny gotowy do wypełnienia.");
};

/**
 * selectFolder(folder) – wywoływana przy kliknięciu w przycisk Słupy/Podesty/etc.
 */
PlaygroundApp.prototype.selectFolder = function(folder) {
  const panel = document.getElementById('moduleListPanel');
  if (!panel) {
    console.warn("Brak #moduleListPanel w HTML.");
    return;
  }
  panel.classList.add('open'); // wysuwamy panel
  this.selectedFolder = folder;

  const moduleListEl = document.getElementById('module-list');
  if (!moduleListEl) return;

  // Pokaż/ukryj heightSelector
  const heightSel = document.getElementById('heightSelector');
  if (folder === "Podesty") {
    heightSel.style.display = "block";
  } else {
    heightSel.style.display = "none";
  }

  // Czyścimy listę
  moduleListEl.innerHTML = "";

  // Filtrowanie modułów wg folderu
  const filteredModules = (this.availableModules || []).filter(m => m.folder === folder);
  if (filteredModules.length === 0) {
    moduleListEl.innerHTML = "<div>Brak modułów w tym folderze.</div>";
    return;
  }

  // Tworzenie kafelków
  filteredModules.forEach(mod => {
    let moduleItem = document.createElement("div");
    moduleItem.className = "module-item";
    moduleItem.innerHTML = `
      <img class="module-thumb-img" src="${mod.thumb}" alt="${mod.name}">
      <div style="margin-left:10px;">${mod.name}</div>
    `;
    // Klik w kafelek -> wstawianie modułu
    moduleItem.addEventListener("click", () => {
      this.selectModuleForPlacement(mod);
    });
    moduleListEl.appendChild(moduleItem);
  });
};

PlaygroundApp.prototype.selectModuleForPlacement = function(mod) {
  try {
    console.log("Wybrano moduł:", mod);
    this.selectedModuleForPlacement = mod;
    this.loadModuleModel(mod);
  } catch (error) {
    console.error("Błąd selectModuleForPlacement:", error);
  }
};

PlaygroundApp.prototype.loadModuleModel = function(mod, onLoadedCallback) {
  try {
    const loader = new THREE.GLTFLoader();
    loader.load(
      mod.model,
      (gltf) => {
        const model = gltf.scene;
        // Ustaw userData
        model.userData = {
          moduleName: mod.name,
          folderName: mod.folder,
          model: mod.model,
          thumb: mod.thumb
        };
        // Domyślnie ustawmy przezroczystość (preview)
        model.traverse(child => {
          if (child.material) {
            child.material.opacity = 0.6;
            child.material.transparent = true;
          }
        });

        // Ustaw wstępnie Y, jeśli to Podest
        if (mod.folder === "Podesty") {
          const box = new THREE.Box3().setFromObject(model);
          const newY = this.podestHeight - box.max.y;
          model.userData.fixedY = newY;
          model.position.y = newY;
        }

        // Ustawiamy obiekt jako preview
        this.previewObject = model;
        this.scene.add(model);

        if (typeof onLoadedCallback === "function") {
          onLoadedCallback(model);
        }
        console.log("Załadowano model modułu:", mod.name);
      },
      undefined,
      (error) => {
        console.error("Błąd ładowania modelu:", error);
      }
    );
  } catch (error) {
    console.error("Błąd loadModuleModel:", error);
  }
};
