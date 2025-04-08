// strefy.js

/**
 * Rysuje strefę bezpieczeństwa (global) na podstawie obiektów w this.draggableObjects.
 * Wykorzystuje ClipperLib do union polygon i shoelace do obliczenia pola.
 */

const CLIPPER_SCALE = 1000; // Skala dla ClipperLib

PlaygroundApp.prototype.drawGlobalSafeZone = function() {
  try {
    if (this.draggableObjects.length === 0) {
      console.log("Brak modułów na scenie.");
      return;
    }

    let polygons = [];
    this.draggableObjects.forEach(obj => {
      let margin = 1.5;
      if (obj.userData.anchor === 'top' && obj.userData.height && obj.userData.height > 1.5) {
        margin = (obj.userData.height * 2 / 3) + 0.5;
      }
      let shapePoints = this.getModuleSafeZonePoints(obj, margin);
      if (shapePoints.length > 0) {
        polygons.push(shapePoints);
      }
    });

    if (polygons.length === 0) {
      console.log("Brak polygonów do rysowania strefy.");
      return;
    }

    let clipPaths = polygons.map(pp => pp.map(p => ({
      X: Math.round(p.x * CLIPPER_SCALE),
      Y: Math.round(p.y * CLIPPER_SCALE)
    })));

    let clipper = new ClipperLib.Clipper();
    clipper.AddPaths(clipPaths, ClipperLib.PolyType.ptSubject, true);

    let solution = new ClipperLib.Paths();
    let succeeded = clipper.Execute(
      ClipperLib.ClipType.ctUnion,
      solution,
      ClipperLib.PolyFillType.pftNonZero,
      ClipperLib.PolyFillType.pftNonZero
    );

    if (!succeeded || solution.length === 0) {
      console.log("Nie udało się obliczyć unii polygonów.");
      return;
    }

    let unionPoly = solution[0].map(pt => new THREE.Vector2(pt.X / CLIPPER_SCALE, pt.Y / CLIPPER_SCALE));

    // Algorytm shoelace
    let area = 0;
    for (let i = 0; i < unionPoly.length; i++) {
      let j = (i + 1) % unionPoly.length;
      area += unionPoly[i].x * unionPoly[j].y - unionPoly[j].x * unionPoly[i].y;
    }
    area = Math.abs(area) / 2;

    // Rysowanie obrysu strefy
    let shape = new THREE.Shape(unionPoly);
    let pts2D = shape.getPoints(128);
    let pts3D = pts2D.map(p => new THREE.Vector3(p.x, 0, p.y));
    let geometry = new THREE.BufferGeometry().setFromPoints(pts3D);

    let mat = new THREE.LineBasicMaterial({ color: 0x006400, linewidth: 1 });
    let line = new THREE.LineLoop(geometry, mat);

    if (this.safeZoneObject) {
      this.scene.remove(this.safeZoneObject);
    }
    this.safeZoneObject = line;
    this.scene.add(line);

    this.safeZoneArea = area;
    this.updateInfoPanel();
    console.log(`Strefa bezpieczeństwa: area = ${area.toFixed(2)} m²`);
  } catch (error) {
    console.error("Błąd drawGlobalSafeZone:", error);
  }
};

PlaygroundApp.prototype.getModuleSafeZonePoints = function(moduleObj, margin) {
  try {
    let box = new THREE.Box3().setFromObject(moduleObj);
    let left = box.min.x - margin;
    let right = box.max.x + margin;
    let bottom = box.min.z - margin;
    let top = box.max.z + margin;

    let shape = new THREE.Shape();
    shape.moveTo(left + margin, top);
    shape.lineTo(right - margin, top);
    shape.absarc(right - margin, top - margin, margin, -Math.PI / 2, 0, true);
    shape.lineTo(right, bottom + margin);
    shape.absarc(right - margin, bottom + margin, margin, 0, Math.PI / 2, true);
    shape.lineTo(left + margin, bottom);
    shape.absarc(left + margin, bottom + margin, margin, Math.PI / 2, Math.PI, true);
    shape.lineTo(left, top - margin);
    shape.absarc(left + margin, top - margin, margin, Math.PI, 3 * Math.PI / 2, true);
    shape.closePath();

    return shape.getPoints(64).map(p => new THREE.Vector2(p.x, p.y));
  } catch (error) {
    console.error("Błąd getModuleSafeZonePoints:", error);
    return [];
  }
};
