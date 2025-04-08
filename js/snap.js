// snap.js
// Funkcje snapowania: słup do podestu, zjeżdżalnia do podestu/przejścia, dach do podestu.

PlaygroundApp.prototype.snapSlupToNearestPodestCorner = function(slupObject, threshold = 0.5) {
  try {
    let slupPos = new THREE.Vector2(slupObject.position.x, slupObject.position.z);
    let nearestCorner = null;
    let minDist = Infinity;

    for (let obj of this.draggableObjects) {
      // Podesty często mają anchor 'top' lub folderName 'Podesty'
      if (obj.userData.anchor === 'top' || obj.userData.folderName === 'Podesty') {
        let box = new THREE.Box3().setFromObject(obj);
        let corners = [
          new THREE.Vector2(box.min.x, box.min.z),
          new THREE.Vector2(box.min.x, box.max.z),
          new THREE.Vector2(box.max.x, box.min.z),
          new THREE.Vector2(box.max.x, box.max.z)
        ];
        for (let c of corners) {
          let dist = c.distanceTo(slupPos);
          if (dist < minDist) {
            minDist = dist;
            nearestCorner = c;
          }
        }
      }
    }
    if (nearestCorner && minDist < threshold) {
      slupObject.position.x = nearestCorner.x;
      slupObject.position.z = nearestCorner.y;
      console.log("Snap słup do narożnika podestu, dist =", minDist);
      return true;
    }
    return false;
  } catch (error) {
    console.error("Błąd snapSlupToNearestPodestCorner:", error);
    return false;
  }
};

PlaygroundApp.prototype.snapPodestZjezdzalniaToNearestPodestOrPrzejscie = function(obj) {
  try {
    const THRESHOLD = 1.5;
    let bestDist = Infinity;
    let bestObj = null;

    const validFolders = ["Podesty","Przejścia"];
    this.draggableObjects.forEach(o => {
      if (validFolders.includes(o.userData.folderName)) {
        let dist = o.position.distanceTo(obj.position);
        if (dist < bestDist) {
          bestDist = dist;
          bestObj = o;
        }
      }
    });

    if (!bestObj || bestDist > THRESHOLD) return false;

    let boxObj = new THREE.Box3().setFromObject(obj);
    let sizeObj = new THREE.Vector3();
    boxObj.getSize(sizeObj);

    let shortSide = (sizeObj.x < sizeObj.z) ? "x" : "z";

    let boxTarget = new THREE.Box3().setFromObject(bestObj);
    let centerTarget = new THREE.Vector3();
    boxTarget.getCenter(centerTarget);

    let centerObj = new THREE.Vector3();
    boxObj.getCenter(centerObj);

    let dx = centerObj.x - centerTarget.x;
    let dz = centerObj.z - centerTarget.z;

    if (Math.abs(dx) > Math.abs(dz)) {
      if (shortSide === "x") {
        obj.rotation.y += Math.PI/2;
        obj.updateMatrixWorld(true);
        boxObj = new THREE.Box3().setFromObject(obj);
        boxObj.getSize(sizeObj);
        centerObj = new THREE.Vector3();
        boxObj.getCenter(centerObj);
      }
      if (dx > 0) {
        let shiftX = boxTarget.max.x - boxObj.min.x;
        obj.position.x += shiftX;
      } else {
        let shiftX = boxTarget.min.x - boxObj.max.x;
        obj.position.x += shiftX;
      }
      let centerTargetZ = (boxTarget.min.z + boxTarget.max.z)/2;
      let centerObjZ = (boxObj.min.z + boxObj.max.z)/2;
      obj.position.z += (centerTargetZ - centerObjZ);
    } else {
      if (shortSide === "z") {
        obj.rotation.y += Math.PI/2;
        obj.updateMatrixWorld(true);
        boxObj = new THREE.Box3().setFromObject(obj);
        boxObj.getSize(sizeObj);
        centerObj = new THREE.Vector3();
        boxObj.getCenter(centerObj);
      }
      if (dz > 0) {
        let shiftZ = boxTarget.max.z - boxObj.min.z;
        obj.position.z += shiftZ;
      } else {
        let shiftZ = boxTarget.min.z - boxObj.max.z;
        obj.position.z += shiftZ;
      }
      let centerTargetX = (boxTarget.min.x + boxTarget.max.x)/2;
      let centerObjX = (boxObj.min.x + boxObj.max.x)/2;
      obj.position.x += (centerTargetX - centerObjX);
    }
    console.log("Snap zjeżdżalnia do podestu/przejścia, dist =", bestDist);
    return true;
  } catch (error) {
    console.error("Błąd snapPodestZjezdzalniaToNearestPodestOrPrzejscie:", error);
    return false;
  }
};

PlaygroundApp.prototype.snapDachToNearestPodest = function(dachObject) {
  try {
    const THRESHOLD = 1.5;
    let bestDist = Infinity;
    let bestPodest = null;

    this.draggableObjects.forEach(o => {
      if (o.userData.folderName === "Podesty") {
        let dist = o.position.distanceTo(dachObject.position);
        if (dist < bestDist) {
          bestDist = dist;
          bestPodest = o;
        }
      }
    });

    if (!bestPodest || bestDist > THRESHOLD) return false;

    let boxDach = new THREE.Box3().setFromObject(dachObject);
    let sizeDach = new THREE.Vector3();
    boxDach.getSize(sizeDach);

    let shortSide = (sizeDach.x < sizeDach.z) ? "x" : "z";
    if (shortSide === "z") {
      dachObject.rotation.y += Math.PI/2;
      dachObject.updateMatrixWorld(true);
      boxDach = new THREE.Box3().setFromObject(dachObject);
      boxDach.getSize(sizeDach);
    }

    let boxPodest = new THREE.Box3().setFromObject(bestPodest);
    let topPodestY = boxPodest.max.y;
    let minDachY = boxDach.min.y;
    dachObject.position.y += (topPodestY + 1.5 - minDachY);

    let centerPodest = new THREE.Vector3();
    boxPodest.getCenter(centerPodest);

    let boxDach2 = new THREE.Box3().setFromObject(dachObject);
    let centerDach = new THREE.Vector3();
    boxDach2.getCenter(centerDach);

    dachObject.position.x += (centerPodest.x - centerDach.x);
    dachObject.position.z += (centerPodest.z - centerDach.z);

    console.log("Snap dach do podestu, dist =", bestDist);
    return true;
  } catch (error) {
    console.error("Błąd snapDachToNearestPodest:", error);
    return false;
  }
};
