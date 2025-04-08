// color.js

class ColorBubbleManager {
  constructor(app) {
    this.app = app;
    this.bubbleContainer = null;
    this.availableColors = [ "#FF5733", "#33FF57", "#3357FF", "#F1C40F", "#8E44AD", "#1ABC9C" ];
  }

  init() {
    if (this.bubbleContainer) return;
    this.bubbleContainer = document.createElement("div");
    this.bubbleContainer.id = "colorBubbleContainer";
    this.bubbleContainer.style.position = "absolute";
    this.bubbleContainer.style.zIndex = "1000";
    this.bubbleContainer.style.display = "none";
    this.bubbleContainer.style.flexWrap = "wrap";
    this.bubbleContainer.style.backgroundColor = "rgba(255,255,255,0.9)";
    this.bubbleContainer.style.padding = "10px";
    this.bubbleContainer.style.borderRadius = "8px";
    this.bubbleContainer.style.boxShadow = "0 2px 6px rgba(0,0,0,0.3)";
    document.body.appendChild(this.bubbleContainer);

    this.availableColors.forEach(color => {
      let bubble = document.createElement("div");
      bubble.className = "colorBubble";
      bubble.style.width = "30px";
      bubble.style.height = "30px";
      bubble.style.borderRadius = "50%";
      bubble.style.backgroundColor = color;
      bubble.style.margin = "5px";
      bubble.style.cursor = "pointer";
      bubble.addEventListener("click", () => {
        this.applyColorToSelectedObject(color);
      });
      this.bubbleContainer.appendChild(bubble);
    });
  }

  showColorBubbles(targetObject) {
    try {
      this.init();
      this.app.currentColorTarget = targetObject;
      // Ustawiamy na środku ekranu
      this.bubbleContainer.style.left = "50%";
      this.bubbleContainer.style.top = "50%";
      this.bubbleContainer.style.transform = "translate(-50%, -50%)";
      this.bubbleContainer.style.display = "flex";
    } catch (error) {
      console.error("Błąd showColorBubbles:", error);
    }
  }

  hideColorBubbles() {
    try {
      if (this.bubbleContainer) {
        this.bubbleContainer.style.display = "none";
      }
      this.app.currentColorTarget = null;
    } catch (error) {
      console.error("Błąd hideColorBubbles:", error);
    }
  }

  applyColorToSelectedObject(color) {
    try {
      const target = this.app.currentColorTarget;
      if (!target) {
        console.warn("Brak wybranego obiektu do zmiany koloru.");
        return;
      }
      if (target.material && target.material.color) {
        target.material.color.set(color);
        console.log("Zmieniono kolor obiektu na:", color);
      } else {
        console.warn("Wybrany obiekt nie posiada material.color.");
      }
      this.hideColorBubbles();
    } catch (error) {
      console.error("Błąd applyColorToSelectedObject:", error);
    }
  }
}

// Metody w PlaygroundApp
PlaygroundApp.prototype.initColorBubbles = function() {
  if (!this.colorBubbleManager) {
    this.colorBubbleManager = new ColorBubbleManager(this);
  }
};
