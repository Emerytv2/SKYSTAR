// controls.js

(function() {
  PlaygroundApp.prototype.initControls = function(camera, rendererElement) {
    try {
      if (!camera || !rendererElement) {
        throw new Error("Kamera i rendererElement są wymagane do initControls.");
      }
      this.controls = new THREE.OrbitControls(camera, rendererElement);
      this.controls.enableDamping = true;
      this.controls.dampingFactor = 0.25;
      this.controls.enableZoom = true;
      console.log("initControls: OrbitControls zainicjalizowane.");
    } catch (error) {
      console.error("Błąd initControls:", error);
    }
  };
})();
