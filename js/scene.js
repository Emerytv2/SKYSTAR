// scene.js

class PlaygroundApp {
  constructor() {
    try {
      // Scena i renderer
      this.scene = new THREE.Scene();
      this.scene.background = new THREE.Color(0xffffff);

      this.renderer = new THREE.WebGLRenderer({ antialias: true });
      this.renderer.setClearColor(0xffffff);

      this.mainContent = document.getElementById('main-content');
      if (this.mainContent) {
        this.renderer.setSize(this.mainContent.clientWidth, this.mainContent.clientHeight);
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.mainContent.appendChild(this.renderer.domElement);
      } else {
        // Fallback, jeśli nie ma main-content
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        document.body.appendChild(this.renderer.domElement);
      }

      // Kamera, kontrolki
      this.camera = null;
      this.controls = null;

      // Obiekty sceny
      this.draggableObjects = [];
      this.selectedSubMesh = null;
      this.selectedOutline = null;

      // Preview (klik)
      this.previewObject = null;
      // Drag preview
      this.dragPreviewObject = null;
      // Wybrany moduł z listy
      this.selectedModuleForPlacement = null;

      // Raycaster i mysz
      this.raycaster = new THREE.Raycaster();
      this.mouse = new THREE.Vector2();

      // Różne ustawienia
      this.folderModules = {};
      this.selectedFolder = null; // do toggleFolder
      this.podestHeight = 0.9;

      // Historia (undo/redo)
      this.history = [];
      this.historyIndex = -1;

      // Inicjalizacja sceny, UI, klawiatury
      this.initScene();
      this.initUI();
      this.initKeyboard();

      console.log("PlaygroundApp zainicjalizowany.");
    } catch (error) {
      console.error("Błąd w konstruktorze PlaygroundApp:", error);
    }
  }

  initScene() {
    try {
      // Kamera ortograficzna
      const aspect = this.mainContent
        ? this.mainContent.clientWidth / this.mainContent.clientHeight
        : window.innerWidth / window.innerHeight;
      const viewSize = 10;
      this.camera = new THREE.OrthographicCamera(
        -viewSize * aspect / 2, viewSize * aspect / 2,
        viewSize / 2, -viewSize / 2,
        0.1, 1000
      );
      this.camera.position.set(0, 10, 0);
      this.camera.lookAt(0, 0, 0);

      // Kontrolki (OrbitControls) zainicjalizujemy w main.js -> app.initControls()

      // Światła
      const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
      this.scene.add(ambientLight);
      const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
      directionalLight.position.set(50, 100, 50);
      this.scene.add(directionalLight);

      // Płaszczyzna
      const planeGeom = new THREE.PlaneGeometry(50, 50);
      const planeMat = new THREE.MeshLambertMaterial({ color: 0xdddddd });
      const plane = new THREE.Mesh(planeGeom, planeMat);
      plane.rotation.x = -Math.PI / 2;
      this.scene.add(plane);

      // GridHelper
      this.gridHelper = new THREE.GridHelper(50, 50, 0x000000, 0x000000);
      this.gridHelper.material.opacity = 0.3;
      this.gridHelper.material.transparent = true;
      this.gridHelper.position.y = 0.01;
      this.scene.add(this.gridHelper);

      // Eventy myszki do preview
      this.renderer.domElement.addEventListener('mousemove', (e) => this.onCanvasMouseMove(e), false);
      this.renderer.domElement.addEventListener('click', (e) => this.onCanvasClick(e), false);

      // Eventy drag & drop
      this.renderer.domElement.addEventListener('dragover', (event) => {
        event.preventDefault();
        if (this.dragPreviewObject) {
          const pt = this.getRaycastPoint(event);
          if (pt) {
            if (this.dragPreviewObject.userData.folderName === "Podesty" &&
                this.dragPreviewObject.userData.fixedY !== undefined) {
              this.dragPreviewObject.position.x = pt.x;
              this.dragPreviewObject.position.z = pt.z;
              this.dragPreviewObject.position.y = this.dragPreviewObject.userData.fixedY;
            } else {
              this.dragPreviewObject.position.copy(pt);
            }
          }
        }
      });
      this.renderer.domElement.addEventListener('drop', (event) => {
        event.preventDefault();
        if (this.dragPreviewObject) {
          this.finalizeDragPreview();
        }
      });
      document.addEventListener('dragend', (event) => {
        if (this.dragPreviewObject) {
          this.scene.remove(this.dragPreviewObject);
          this.dragPreviewObject = null;
        }
      });

      // Resize
      window.addEventListener('resize', () => this.onWindowResize(), false);

      // Start pętli animacji
      this.animate();
      console.log("Scena zainicjalizowana.");
    } catch (error) {
      console.error("Błąd podczas initScene:", error);
    }
  }

  initUI() {
    try {
      const resetBtn = document.getElementById('resetSceneBtn');
      if (resetBtn) {
        resetBtn.addEventListener('click', () => this.resetScene());
      }
      const drawSafeBtn = document.getElementById('drawSafeZoneBtn');
      if (drawSafeBtn) {
        drawSafeBtn.addEventListener('click', () => {
          this.drawGlobalSafeZone();
          this.updateInfoPanel();
        });
      }
      const podestSelect = document.getElementById('podestHeightSelect');
      if (podestSelect) {
        podestSelect.addEventListener('change', (e) => {
          this.podestHeight = parseFloat(e.target.value);
          if (this.previewObject &&
              this.previewObject.userData.folderName === "Podesty") {
            const box = new THREE.Box3().setFromObject(this.previewObject);
            const newY = this.podestHeight - box.max.y;
            this.previewObject.userData.fixedY = newY;
            this.previewObject.position.y = newY;
          }
        });
      }
      console.log("UI zainicjalizowane.");
    } catch (error) {
      console.error("Błąd w initUI:", error);
    }
  }

  initKeyboard() {
    try {
      // Tu można dodać obsługę klawiatury (undo/redo itp.)
      console.log("initKeyboard uruchomione.");
    } catch (error) {
      console.error("Błąd w initKeyboard:", error);
    }
  }

  animate() {
    try {
      requestAnimationFrame(() => this.animate());
      if (this.controls) {
        this.controls.update();
      }
      this.renderer.render(this.scene, this.camera);
    } catch (error) {
      console.error("Błąd w pętli animacji:", error);
    }
  }

  onWindowResize() {
    try {
      if (this.mainContent) {
        const w = this.mainContent.clientWidth;
        const h = this.mainContent.clientHeight;
        this.renderer.setSize(w, h);
      } else {
        this.renderer.setSize(window.innerWidth, window.innerHeight);
      }
      this.camera.updateProjectionMatrix();
    } catch (error) {
      console.error("Błąd onWindowResize:", error);
    }
  }

  onCanvasMouseMove(event) {
    try {
      if (!this.previewObject) return;
      const pt = this.getRaycastPoint(event);
      if (pt) {
        if (this.previewObject.userData.folderName === "Podesty" &&
            this.previewObject.userData.fixedY !== undefined) {
          this.previewObject.position.x = pt.x;
          this.previewObject.position.z = pt.z;
          this.previewObject.position.y = this.previewObject.userData.fixedY;
        } else {
          this.previewObject.position.copy(pt);
        }
      }
    } catch (error) {
      console.error("Błąd onCanvasMouseMove:", error);
    }
  }

  onCanvasClick(event) {
    try {
      const rect = this.renderer.domElement.getBoundingClientRect();
      this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
      this.raycaster.setFromCamera(this.mouse, this.camera);

      if (this.previewObject) {
        const pt = this.getRaycastPoint(event);
        if (pt) {
          if (this.previewObject.userData.folderName === "Podesty" &&
              this.previewObject.userData.fixedY !== undefined) {
            this.previewObject.position.x = pt.x;
            this.previewObject.position.z = pt.z;
            this.previewObject.position.y = this.previewObject.userData.fixedY;
          } else {
            this.previewObject.position.copy(pt);
          }
        }
        // Finalizacja obiektu
        this.previewObject.traverse(child => {
          if (child.material) {
            child.material.opacity = 1.0;
            child.material.transparent = false;
          }
        });
        this.maybeSnap(this.previewObject);
        this.draggableObjects.push(this.previewObject);
        this.addAction({ type: "add", object: this.previewObject });
        console.log("Finalizacja obiektu (klik).");
        this.previewObject = null;
        this.selectedModuleForPlacement = null;
        this.updateInfoPanel();
        this.updateModulesPanel();
        return;
      }

      // Standardowe zaznaczenie obiektu
      const intersects = this.raycaster.intersectObjects(this.draggableObjects, true);
      if (intersects.length > 0) {
        this.selectedSubMesh = intersects[0].object;
        if (this.selectedOutline) {
          this.scene.remove(this.selectedOutline);
        }
        this.selectedOutline = new THREE.BoxHelper(this.selectedSubMesh, 0xffff00);
        this.scene.add(this.selectedOutline);
      } else {
        this.selectedSubMesh = null;
        if (this.selectedOutline) {
          this.scene.remove(this.selectedOutline);
          this.selectedOutline = null;
        }
        this.hideColorBubbles();
      }
    } catch (error) {
      console.error("Błąd onCanvasClick:", error);
    }
  }

  getRaycastPoint(event) {
    try {
      const rect = this.renderer.domElement.getBoundingClientRect();
      this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
      this.raycaster.setFromCamera(this.mouse, this.camera);
      const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
      const pt = new THREE.Vector3();
      this.raycaster.ray.intersectPlane(plane, pt);
      return pt;
    } catch (error) {
      console.error("Błąd getRaycastPoint:", error);
      return null;
    }
  }

  finalizeDragPreview() {
    try {
      if (!this.dragPreviewObject) return;
      this.dragPreviewObject.traverse(child => {
        if (child.material) {
          child.material.opacity = 1.0;
          child.material.transparent = false;
        }
      });
      if (this.dragPreviewObject.userData.folderName === "Podesty" &&
          this.dragPreviewObject.userData.fixedY !== undefined) {
        this.dragPreviewObject.position.y = this.dragPreviewObject.userData.fixedY;
      }
      this.maybeSnap(this.dragPreviewObject);
      this.draggableObjects.push(this.dragPreviewObject);
      this.addAction({ type: "add", object: this.dragPreviewObject });
      console.log("Finalizacja obiektu (drag).");
      this.dragPreviewObject = null;
      this.updateInfoPanel();
      this.updateModulesPanel();
    } catch (error) {
      console.error("Błąd finalizeDragPreview:", error);
    }
  }

  maybeSnap(object3D) {
    try {
      if (!object3D.userData.folderName) return;
      if (object3D.userData.folderName === "Słupy") {
        this.snapSlupToNearestPodestCorner(object3D, 0.5);
      } else if (object3D.userData.folderName === "Zjeżdżalnie") {
        this.snapPodestZjezdzalniaToNearestPodestOrPrzejscie(object3D);
      } else if (object3D.userData.folderName === "Dachy") {
        this.snapDachToNearestPodest(object3D);
      }
    } catch (error) {
      console.error("Błąd maybeSnap:", error);
    }
  }

  resetScene() {
    try {
      this.draggableObjects.forEach(obj => this.scene.remove(obj));
      this.draggableObjects = [];
      this.selectedSubMesh = null;
      if (this.selectedOutline) {
        this.scene.remove(this.selectedOutline);
        this.selectedOutline = null;
      }
      if (this.safeZoneObject) {
        this.scene.remove(this.safeZoneObject);
        this.safeZoneObject = null;
      }
      this.safeZoneArea = 0;
      this.previewObject = null;
      this.dragPreviewObject = null;
      this.selectedModuleForPlacement = null;
      this.history = [];
      this.historyIndex = -1;
      console.log("Scena zresetowana.");
      this.updateInfoPanel();
      this.updateModulesPanel();
      this.podestHeight = 0.9;
    } catch (error) {
      console.error("Błąd resetScene:", error);
    }
  }

  addAction(action) {
    try {
      if (this.historyIndex < this.history.length - 1) {
        this.history.splice(this.historyIndex + 1);
      }
      this.history.push(action);
      this.historyIndex = this.history.length - 1;
    } catch (error) {
      console.error("Błąd addAction:", error);
    }
  }

  updateInfoPanel() {
    try {
      let setBox = new THREE.Box3();
      this.draggableObjects.forEach(obj => {
        let b = new THREE.Box3().setFromObject(obj);
        setBox.union(b);
      });
      let setW = 0, setL = 0;
      if (!setBox.isEmpty()) {
        setW = (setBox.max.x - setBox.min.x).toFixed(2);
        setL = (setBox.max.z - setBox.min.z).toFixed(2);
      }
      const infoPanel = document.getElementById("infoPanel");
      if (infoPanel) {
        infoPanel.innerHTML = `<div><strong>Wymiary zestawu:</strong> ${setW && setL ? (setW + " x " + setL + " m") : "brak"}</div>`;
      }
    } catch (error) {
      console.error("Błąd updateInfoPanel:", error);
    }
  }

  updateModulesPanel() {
    try {
      const panel = document.getElementById("modulesPanel");
      if (!panel) return;
      panel.innerHTML = "<strong>Wykorzystane moduły:</strong><br>";
      if (this.draggableObjects.length === 0) {
        panel.innerHTML += "Brak obiektów";
        return;
      }
      let counts = {};
      this.draggableObjects.forEach(obj => {
        let nm = obj.userData.moduleName || "Nieznany moduł";
        counts[nm] = (counts[nm] || 0) + 1;
      });
      Object.keys(counts).forEach(nm => {
        panel.innerHTML += `${counts[nm]}x ${nm}<br>`;
      });
    } catch (error) {
      console.error("Błąd updateModulesPanel:", error);
    }
  }

  getRootGroup(object) {
    try {
      while (object.parent && !object.userData.moduleName) {
        object = object.parent;
      }
      return object;
    } catch (error) {
      console.error("Błąd getRootGroup:", error);
      return object;
    }
  }

  // Usuwanie obiektu (przycisk Delete)
  deleteRootObject(root) {
    try {
      this.scene.remove(root);
      const idx = this.draggableObjects.indexOf(root);
      if (idx > -1) {
        this.draggableObjects.splice(idx, 1);
      }
      this.addAction({ type: "remove", object: root });
      this.updateInfoPanel();
      this.updateModulesPanel();
      console.log("Usunięto obiekt:", root);
    } catch (error) {
      console.error("Błąd deleteRootObject:", error);
    }
  }

  // showColorBubbles / hideColorBubbles – implementacja w color.js
  showColorBubbles(rootObj) {
    if (typeof this.initColorBubbles === "function") {
      this.initColorBubbles();
      this.colorBubbleManager.showColorBubbles(rootObj);
    }
  }
  hideColorBubbles() {
    if (this.colorBubbleManager) {
      this.colorBubbleManager.hideColorBubbles();
    }
  }

  // Prosta metoda do przełączania pomocy
  toggleHelp() {
    const helpEl = document.getElementById("help");
    const toggleBtn = document.getElementById("helpToggle");
    if (!helpEl || !toggleBtn) return;
    if (helpEl.style.display === "none") {
      helpEl.style.display = "block";
      toggleBtn.style.display = "none";
    } else {
      helpEl.style.display = "none";
      toggleBtn.style.display = "block";
    }
  }
}
