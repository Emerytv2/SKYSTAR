// contextMenu.js
// Tworzy i obsługuje menu kontekstowe (prawy przycisk).

PlaygroundApp.prototype.initContextMenu = function() {
  try {
    this.contextMenu = document.getElementById("contextMenu");
    if (!this.contextMenu) {
      console.warn("Brak elementu #contextMenu w HTML.");
      return;
    }

    // Klik w obrębie menu – wywołanie akcji
    this.contextMenu.addEventListener("click", (e) => {
      let action = e.target.getAttribute("data-action");
      if (action) {
        this.handleContextMenuAction(action, this.currentContextObject);
        this.hideContextMenu();
      }
    });

    // Klik poza menu – ukrywa menu
    document.addEventListener("click", (e) => {
      if (this.contextMenu.style.display === "block") {
        this.hideContextMenu();
      }
    });

    console.log("Menu kontekstowe zainicjalizowane.");
  } catch (error) {
    console.error("Błąd initContextMenu:", error);
  }
};

PlaygroundApp.prototype.showContextMenu = function(event, targetObject) {
  try {
    if (!this.contextMenu) return;
    this.currentContextObject = targetObject;
    this.contextMenu.style.left = event.clientX + "px";
    this.contextMenu.style.top = event.clientY + "px";
    this.contextMenu.innerHTML = "";

    let actions = [
      { label: "Usuń", action: "remove" },
      { label: "Edytuj", action: "edit" },
      { label: "Właściwości", action: "properties" }
    ];
    actions.forEach(item => {
      let div = document.createElement("div");
      div.textContent = item.label;
      div.setAttribute("data-action", item.action);
      this.contextMenu.appendChild(div);
    });

    this.contextMenu.style.display = "block";
    event.preventDefault();
  } catch (error) {
    console.error("Błąd showContextMenu:", error);
  }
};

PlaygroundApp.prototype.hideContextMenu = function() {
  try {
    if (this.contextMenu) {
      this.contextMenu.style.display = "none";
    }
  } catch (error) {
    console.error("Błąd hideContextMenu:", error);
  }
};

PlaygroundApp.prototype.handleContextMenuAction = function(action, targetObject) {
  try {
    console.log(`Menu kontekstowe: akcja "${action}" dla obiektu:`, targetObject);
    switch (action) {
      case "remove":
        this.deleteRootObject(targetObject);
        break;
      case "edit":
        alert("Funkcja edycji niezaimplementowana.");
        break;
      case "properties":
        alert("Właściwości obiektu:\n" + JSON.stringify(targetObject.userData, null, 2));
        break;
      default:
        console.warn("Nieznana akcja menu kontekstowego:", action);
    }
  } catch (error) {
    console.error("Błąd handleContextMenuAction:", error);
  }
};
