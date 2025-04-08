// report.js

(function(){

  // ------------------ FUNKCJA ZAMIANY ZNAKÓW ------------------
  // Zamienia polskie litery na łacińskie, ALE zostawia "ó" i "Ó" bez zmian.
  function asciiReplaceExceptO(str) {
    return str
      // małe litery
      .replace(/ą/g, 'a').replace(/ć/g, 'c').replace(/ę/g, 'e')
      .replace(/ł/g, 'l').replace(/ń/g, 'n')
      // pomijamy "ó"
      .replace(/ś/g, 's').replace(/ż/g, 'z').replace(/ź/g, 'z')

      // wielkie litery
      .replace(/Ą/g, 'A').replace(/Ć/g, 'C').replace(/Ę/g, 'E')
      .replace(/Ł/g, 'L').replace(/Ń/g, 'N')
      // pomijamy "Ó"
      .replace(/Ś/g, 'S').replace(/Ż/g, 'Z').replace(/Ź/g, 'Z');
  }

  // ------------------ FUNKCJE POMOCNICZE DO PDF ------------------

  // Sprawdza, czy mamy dość miejsca na stronie
  function checkPageSpace(doc, yPos, neededSpace) {
    const pageHeight = doc.internal.pageSize.getHeight();
    const bottomMargin = 15;
    const topMargin = 20;
    if (yPos + neededSpace > pageHeight - bottomMargin) {
      doc.addPage();
      return topMargin;
    }
    return yPos;
  }

  // Dodaje wieloliniowy tekst (zamiana polskich znaków, oprócz ó)
  function addMultilineText(doc, text, xPos, yPos, lineHeight=6) {
    const lines = text.split("\n").map(asciiReplaceExceptO);
    lines.forEach(line => {
      yPos = checkPageSpace(doc, yPos, lineHeight);
      doc.text(line, xPos, yPos);
      yPos += lineHeight;
    });
    return yPos;
  }

  // Dodaj obraz i ewentualnie przerzucamy stronę, używając doc.addImage
  function addImageWithAutoPage(doc, dataUrl, xPos, yPos, imgWidth, imgHeight) {
    yPos = checkPageSpace(doc, yPos, imgHeight);
    doc.addImage(dataUrl, "PNG", xPos, yPos, imgWidth, imgHeight);
    yPos += imgHeight + 10;
    return yPos;
  }

  // Tymczasowe renderowanie w 2x rozdzielczości (nie zmieniamy docelowo app.camera)
  function renderHighResShot(app, ephemeralCameraOrScale, scaleFactor=2) {
    // Jeżeli ephemeralCameraOrScale jest kamerą, użyjemy jej do renderu
    // Jeśli jest liczbą, to stary styl (przypis do app.camera)
    let ephemeralCamera = null;

    if (typeof ephemeralCameraOrScale === "object") {
      // ephemeralCamera
      ephemeralCamera = ephemeralCameraOrScale;
    } else {
      // stary styl, ephemeralCameraOrScale = scaleFactor
      ephemeralCamera = app.camera; 
      scaleFactor = ephemeralCameraOrScale;
    }

    let oldWidth = app.renderer.domElement.width;
    let oldHeight = app.renderer.domElement.height;
    let newWidth = oldWidth * scaleFactor;
    let newHeight = oldHeight * scaleFactor;
    app.renderer.setSize(newWidth, newHeight, false);

    // Render z ephemeralCamera
    app.renderer.render(app.scene, ephemeralCamera);

    let dataUrl = app.renderer.domElement.toDataURL("image/png");

    // Przywracamy
    app.renderer.setSize(oldWidth, oldHeight, false);
    return dataUrl;
  }

  // Rysowanie poziomych kresek (podesty) w widokach bocznych
  function drawHorizontalPodestLines(app, boundingBox, side="left") {
    let group = new THREE.Group();

    let heights = [];
    let minY = boundingBox.min.y;
    if (minY>0) minY=0;
    heights.push(minY);

    app.draggableObjects.forEach(obj => {
      if (obj.userData.folderName === "Podesty") {
        let box = new THREE.Box3().setFromObject(obj);
        let topY = box.max.y;
        if (!heights.includes(topY)) {
          heights.push(topY);
        }
      }
    });
    heights.sort((a,b)=>a-b);

    if (side==="left") {
      let centerZ = (boundingBox.min.z + boundingBox.max.z)/2;
      let offsetX = boundingBox.min.x - 0.5;
      if (offsetX>0) offsetX=0;

      heights.forEach(h => {
        let geom = new THREE.BufferGeometry().setFromPoints([
          new THREE.Vector3(offsetX-1, h, centerZ),
          new THREE.Vector3(offsetX+1, h, centerZ)
        ]);
        let mat = new THREE.LineBasicMaterial({ color: 0x333333 });
        let lineH = new THREE.Line(geom, mat);
        group.add(lineH);

        let label = (h===0) ? "0 cm" : ( (h*100).toFixed(0)+" cm");
        label = asciiReplaceExceptO(label);
        let spr = createHeightLabelSprite(label);
        spr.position.set(offsetX-2, h, centerZ);
        group.add(spr);
      });

    } else if (side==="right") {
      let centerZ = (boundingBox.min.z + boundingBox.max.z)/2;
      let offsetX = boundingBox.max.x + 0.5;

      heights.forEach(h => {
        let geom = new THREE.BufferGeometry().setFromPoints([
          new THREE.Vector3(offsetX-1, h, centerZ),
          new THREE.Vector3(offsetX+1, h, centerZ)
        ]);
        let mat = new THREE.LineBasicMaterial({ color: 0x333333 });
        let lineH = new THREE.Line(geom, mat);
        group.add(lineH);

        let label = (h===0) ? "0 cm" : ( (h*100).toFixed(0)+" cm");
        label = asciiReplaceExceptO(label);
        let spr = createHeightLabelSprite(label);
        spr.position.set(offsetX+2, h, centerZ);
        group.add(spr);
      });
    }

    app.scene.add(group);
    return group;
  }

  // Tworzenie sprite'a z opisem wysokości
  function createHeightLabelSprite(text) {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = 512;
    canvas.height = 256;

    ctx.font = "24px Arial";
    ctx.textAlign = "right";
    ctx.textBaseline = "middle";

    let centerY = canvas.height / 2;
    ctx.fillStyle = "#ffffff";
    ctx.strokeStyle = "#000000";
    ctx.lineWidth = 3;

    ctx.strokeText(text, 400, centerY);
    ctx.fillText(text, 400, centerY);

    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;
    const spriteMat = new THREE.SpriteMaterial({ map: texture, depthTest: false });
    const sprite = new THREE.Sprite(spriteMat);
    let aspect = canvas.width / canvas.height;
    sprite.scale.set(2*aspect, 2, 1);

    return sprite;
  }

  // ------------------ GENERATE PDF ------------------

  window.generatePdfReport = function(app) {
    // ----------------- Zbieranie danych -----------------
    let modulesCountText = "";
    if (app.draggableObjects.length === 0) {
      modulesCountText = "Brak obiektów na scenie";
    } else {
      let counts = {};
      app.draggableObjects.forEach(obj => {
        let nm = obj.userData.moduleName || "Nieznany moduł";
        nm = asciiReplaceExceptO(nm);
        if (!counts[nm]) counts[nm] = 0;
        counts[nm]++;
      });
      Object.keys(counts).forEach(nm => {
        modulesCountText += `${counts[nm]}x ${nm}\n`;
      });
    }

    // Cena detaliczna
    let totalModules = app.draggableObjects.length;
    let totalCost = totalModules * 250;

    // Strefa
    let safeZoneText = document.getElementById("areaDisplay")?.innerText || "Brak strefy bezpieczeństwa";
    safeZoneText = asciiReplaceExceptO(safeZoneText);

    let safeZoneWidth = 0, safeZoneLength = 0;
    if (app.safeZoneObject) {
      let boxS = new THREE.Box3().setFromObject(app.safeZoneObject);
      safeZoneWidth = boxS.max.x - boxS.min.x;
      safeZoneLength = boxS.max.z - boxS.min.z;
    }

    // Bounding box
    let globalBox = new THREE.Box3();
    let anyObject = false;
    app.draggableObjects.forEach(obj => {
      let box = new THREE.Box3().setFromObject(obj);
      globalBox.union(box);
      anyObject = true;
    });
    if (app.safeZoneObject && anyObject) {
      globalBox.union(new THREE.Box3().setFromObject(app.safeZoneObject));
    }

    let deviceHeight = 0;
    if (anyObject) {
      deviceHeight = globalBox.max.y;
    }

    // ----------------- Przygotowanie widoków (3 strony) -----------------
    // Wersja "ephemeral cameras" => nie modyfikujemy docelowo app.camera

    let oldCamPos = app.camera.position.clone();
    let oldCamRot = app.camera.rotation.clone();
    let oldZoom = app.camera.zoom;

    let center = new THREE.Vector3();
    globalBox.getCenter(center);

    let size = new THREE.Vector3();
    globalBox.getSize(size);

    let marginFactor = 1.05;
    let biggerDimension = Math.max(size.x, size.z) * marginFactor;
    let baseViewSize = 10;
    let newZoom = baseViewSize / biggerDimension;
    if (newZoom < 0.02) newZoom = 0.02;

    let oldGrid = app.gridHelper.visible;
    let strefaOldVisible = app.safeZoneObject ? app.safeZoneObject.visible : false;

    // 1) Rzut z góry (strefa ON)
    app.gridHelper.visible = false;
    if (app.safeZoneObject) app.safeZoneObject.visible = true;

    let topDownUrl = "";
    if (anyObject) {
      // Tymczasowo przestawiamy app.camera
      app.camera.position.set(center.x, 100, center.z);
      app.camera.lookAt(center.x, 0, center.z);
      app.camera.zoom = newZoom;
      app.camera.updateProjectionMatrix();

      topDownUrl = renderHighResShot(app, 2); // stary styl
    }

    // 2) Wizualizacje izometryczne (strefa OFF)
    if (app.safeZoneObject) app.safeZoneObject.visible = false;
    let isoAUrl="", isoBUrl="";
    if (anyObject) {
      // iso A
      app.camera.position.set(center.x + biggerDimension, center.y + biggerDimension, center.z + biggerDimension);
      app.camera.lookAt(center);
      app.camera.zoom = newZoom;
      app.camera.updateProjectionMatrix();
      isoAUrl = renderHighResShot(app, 2);

      // iso B
      app.camera.position.set(center.x - biggerDimension, center.y + biggerDimension, center.z - biggerDimension);
      app.camera.lookAt(center);
      app.camera.zoom = newZoom;
      app.camera.updateProjectionMatrix();
      isoBUrl = renderHighResShot(app, 2);
    }

    // 3) Rzuty boczne (lewy i prawy)
    let sideLeftUrl="", sideRightUrl="";
    let groupLeft=null, groupRight=null;
    if (anyObject) {
      // lewy
      app.camera.position.set(center.x - biggerDimension, center.y, center.z);
      app.camera.lookAt(center);
      app.camera.zoom = newZoom;
      app.camera.updateProjectionMatrix();

      groupLeft = drawHorizontalPodestLines(app, globalBox, "left");
      sideLeftUrl = renderHighResShot(app, 2);
      if (groupLeft) app.scene.remove(groupLeft);

      // prawy
      app.camera.position.set(center.x + biggerDimension, center.y, center.z);
      app.camera.lookAt(center);
      app.camera.zoom = newZoom;
      app.camera.updateProjectionMatrix();

      groupRight = drawHorizontalPodestLines(app, globalBox, "right");
      sideRightUrl = renderHighResShot(app, 2);
      if (groupRight) app.scene.remove(groupRight);
    }

    // Przywracamy
    app.gridHelper.visible = oldGrid;
    if (app.safeZoneObject) app.safeZoneObject.visible = strefaOldVisible;
    app.camera.position.copy(oldCamPos);
    app.camera.rotation.copy(oldCamRot);
    app.camera.zoom = oldZoom;
    app.camera.updateProjectionMatrix();

    // ----------------- Tworzenie PDF (3 strony) -----------------

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4"
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    doc.setFillColor(204, 255, 0);
    doc.rect(0, 0, pageWidth, 15, 'F');
    doc.setFontSize(16);
    doc.setTextColor(0, 0, 0);
    doc.text(asciiReplaceExceptO("Karta techniczna stworzonego zestawu zabawowego STARMAX"), 10, 10);

    doc.setTextColor(0, 0, 0);

    let yPos = 25;
    doc.setFontSize(12);

    // 1) Lista modułów
    doc.setFont("helvetica", "bold");
    doc.text(asciiReplaceExceptO("Lista modułów:"), 10, yPos);
    yPos += 6;
    doc.setFont("helvetica", "normal");
    yPos = addMultilineText(doc, modulesCountText, 10, yPos);

    // 2) Cena detaliczna
    yPos += 4;
    doc.setFont("helvetica", "bold");
    doc.text(asciiReplaceExceptO("Cena detaliczna:"), 10, yPos);
    yPos += 6;
    doc.setFont("helvetica", "normal");
    // TYLKO główna kwota
    let costLine = asciiReplaceExceptO(`${totalCost} zł`);
    doc.text(costLine, 10, yPos);
    yPos += 10;

    // 3) Wysokość urządzenia
    yPos = checkPageSpace(doc, yPos, 6);
    doc.setFont("helvetica", "bold");
    doc.text(asciiReplaceExceptO("Wysokość urządzenia:"), 10, yPos);
    yPos += 6;
    doc.setFont("helvetica", "normal");
    doc.text(asciiReplaceExceptO(deviceHeight.toFixed(2)+" m"), 10, yPos);
    yPos += 10;

    // 4) Strefa bezpieczeństwa
    yPos = checkPageSpace(doc, yPos, 6);
    doc.setFont("helvetica", "bold");
    doc.text(asciiReplaceExceptO("Strefa bezpieczeństwa:"), 10, yPos);
    yPos += 6;
    doc.setFont("helvetica", "normal");
    yPos = addMultilineText(doc, safeZoneText, 10, yPos);
    if (safeZoneWidth>0 && safeZoneLength>0) {
      yPos += 2;
      doc.text(asciiReplaceExceptO(`Szerokość: ${safeZoneWidth.toFixed(2)} m, Długość: ${safeZoneLength.toFixed(2)} m`), 10, yPos);
      yPos += 6;
    }
    yPos += 10;

    // 5) Obrazy
    let realWidth = app.renderer.domElement.width;
    let realHeight = app.renderer.domElement.height;
    let canvasRatio = realHeight / realWidth;
    let imgWidth = pageWidth - 20;
    let imgHeight = imgWidth * canvasRatio;

    // Strona 1: Rzut z góry
    if (topDownUrl) {
      doc.setFont("helvetica", "bold");
      doc.text(asciiReplaceExceptO("Rzut z góry:"), 10, yPos);
      yPos += 6;
      doc.setFont("helvetica", "normal");
      yPos = addImageWithAutoPage(doc, topDownUrl, 10, yPos, imgWidth, imgHeight);
    }

    // Strona 2: Wizualizacje izometryczne
    doc.addPage();
    yPos = 20;
    if (isoAUrl) {
      doc.setFont("helvetica", "bold");
      doc.text(asciiReplaceExceptO("Wizualizacja nr 1:"), 10, yPos);
      yPos += 6;
      doc.setFont("helvetica", "normal");
      yPos = addImageWithAutoPage(doc, isoAUrl, 10, yPos, imgWidth, imgHeight);
    }
    if (isoBUrl) {
      yPos = checkPageSpace(doc, yPos, 6);
      doc.setFont("helvetica", "bold");
      doc.text(asciiReplaceExceptO("Wizualizacja nr 2:"), 10, yPos);
      yPos += 6;
      doc.setFont("helvetica", "normal");
      yPos = addImageWithAutoPage(doc, isoBUrl, 10, yPos, imgWidth, imgHeight);
    }

    // Strona 3: Rzuty boczne (lewy, prawy)
    doc.addPage();
    yPos = 20;
    if (sideLeftUrl) {
      doc.setFont("helvetica", "bold");
      doc.text(asciiReplaceExceptO("Rzut z boku lewy:"), 10, yPos);
      yPos += 6;
      doc.setFont("helvetica", "normal");
      yPos = addImageWithAutoPage(doc, sideLeftUrl, 10, yPos, imgWidth, imgHeight);
    }
    if (sideRightUrl) {
      yPos = checkPageSpace(doc, yPos, 6);
      doc.setFont("helvetica", "bold");
      doc.text(asciiReplaceExceptO("Rzut z boku prawy:"), 10, yPos);
      yPos += 6;
      doc.setFont("helvetica", "normal");
      yPos = addImageWithAutoPage(doc, sideRightUrl, 10, yPos, imgWidth, imgHeight);
    }

    doc.save("Karta_zestawu_Starmax.pdf");
  };

})();
