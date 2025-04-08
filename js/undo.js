// undo.js

PlaygroundApp.prototype.undo = function() {
  try {
    if (this.historyIndex < 0) {
      console.log("Brak akcji do cofnięcia.");
      return;
    }
    const action = this.history[this.historyIndex];
    this.applyAction(action, "undo");
    this.historyIndex--;
  } catch (error) {
    console.error("Błąd undo:", error);
  }
};

PlaygroundApp.prototype.redo = function() {
  try {
    if (this.historyIndex >= this.history.length - 1) {
      console.log("Brak akcji do ponowienia.");
      return;
    }
    this.historyIndex++;
    const action = this.history[this.historyIndex];
    this.applyAction(action, "redo");
  } catch (error) {
    console.error("Błąd redo:", error);
  }
};

PlaygroundApp.prototype.applyAction = function(action, mode) {
  try {
    switch (action.type) {
      case "add":
        if (mode === "undo") {
          this.scene.remove(action.object);
          const idx = this.draggableObjects.indexOf(action.object);
          if (idx > -1) this.draggableObjects.splice(idx, 1);
        } else {
          this.scene.add(action.object);
          this.draggableObjects.push(action.object);
        }
        break;
      case "remove":
        if (mode === "undo") {
          this.scene.add(action.object);
          this.draggableObjects.push(action.object);
        } else {
          this.scene.remove(action.object);
          const idx = this.draggableObjects.indexOf(action.object);
          if (idx > -1) this.draggableObjects.splice(idx, 1);
        }
        break;
      // Można dodać kolejne typy akcji (np. update)
      default:
        console.warn("Nieznany typ akcji:", action.type);
    }
    this.updateInfoPanel();
    this.updateModulesPanel();
  } catch (error) {
    console.error("Błąd applyAction:", error);
  }
};
