// fileManager.js

(function() {
  PlaygroundApp.prototype.saveProjectAsJson = function() {
    try {
      let projectData = this.exportCurrentProject();
      const jsonData = JSON.stringify(projectData, null, 2);

      // Zapis do pliku
      const blob = new Blob([jsonData], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "playground_project.json";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      console.log("Projekt zapisany do JSON.");
    } catch (error) {
      console.error("Błąd saveProjectAsJson:", error);
    }
  };

  PlaygroundApp.prototype.loadProjectFromFile = function() {
    try {
      const input = document.createElement("input");
      input.type = "file";
      input.accept = ".json";
      input.onchange = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (ev) => {
          try {
            let projectData = JSON.parse(ev.target.result);
            this.importProjectData(projectData);
            console.log("Projekt wczytany z pliku.");
          } catch (parseErr) {
            console.error("Błąd parsowania pliku JSON:", parseErr);
          }
        };
        reader.readAsText(file);
      };
      input.click();
    } catch (error) {
      console.error("Błąd loadProjectFromFile:", error);
    }
  };

  // Eksport aktualnego stanu sceny
  PlaygroundApp.prototype.exportCurrentProject = function() {
    // Minimalny przykład: zapisujemy pozycje i userData obiektów
    let objects = this.draggableObjects.map(obj => {
      return {
        position: { x: obj.position.x, y: obj.position.y, z: obj.position.z },
        rotation: { x: obj.rotation.x, y: obj.rotation.y, z: obj.rotation.z },
        userData: obj.userData
      };
    });
    return { objects };
  };

  // Import danych projektu
  PlaygroundApp.prototype.importProjectData = function(projectData) {
    // Na razie czyścimy scenę i dodajemy obiekty
    this.resetScene();
    if (!projectData.objects) {
      console.warn("Brak obiektów w pliku projektu.");
      return;
    }
    projectData.objects.forEach(objData => {
      // W oparciu o userData.folderName i model, można ponownie wczytać model
      // i ustawić pozycję/rotację. Dla uproszczenia – wczytujemy modelName i folderName:
      if (objData.userData && objData.userData.moduleName) {
        // Załadujmy model tak jak w modules.js
        this.loadModuleModel({
          name: objData.userData.moduleName,
          folder: objData.userData.folderName,
          model: objData.userData.model || "",
          thumb: objData.userData.thumb || ""
        }, (model) => {
          // Po załadowaniu ustawiamy transform
          model.position.set(objData.position.x, objData.position.y, objData.position.z);
          model.rotation.set(objData.rotation.x, objData.rotation.y, objData.rotation.z);
        });
      }
    });
  };
})();
