import * as THREE from 'three';
import { audio } from './audio.js';

export function createObjectiveSystem(scene, siteAPos, siteBPos) {
  let spikeMesh = null;
  let spikePos = new THREE.Vector3();
  let planted = false;
  let detonated = false;
  let defused = false;
  let timer = 45.0;
  let defuseProgress = 0.0;
  let site = 'A';
  let usingKit = false;
  let beepTimer = 0.0;

  function plantSpike(position) {
    if (spikeMesh) {
      scene.remove(spikeMesh);
    }

    spikePos.copy(position);
    planted = true;
    detonated = false;
    defused = false;
    timer = 45.0;
    defuseProgress = 0.0;
    beepTimer = 1.0;

    // Determine nearest site
    const distA = siteAPos ? position.distanceTo(siteAPos) : Infinity;
    const distB = siteBPos ? position.distanceTo(siteBPos) : Infinity;
    site = distA <= distB ? 'A' : 'B';

    // Visual spike mesh
    const group = new THREE.Group();

    // Base plate
    const baseGeo = new THREE.CylinderGeometry(0.35, 0.45, 0.15, 8);
    const baseMat = new THREE.MeshStandardMaterial({
      color: 0x1a1e24,
      metalness: 0.8,
      roughness: 0.2,
    });
    const baseMesh = new THREE.Mesh(baseGeo, baseMat);
    baseMesh.position.y = 0.075;
    group.add(baseMesh);

    // Glowing core
    const coreGeo = new THREE.ConeGeometry(0.2, 0.8, 6);
    const coreMat = new THREE.MeshStandardMaterial({
      color: 0xf87171,
      emissive: 0xf87171,
      emissiveIntensity: 0.9,
      metalness: 0.1,
      roughness: 0.3,
    });
    const coreMesh = new THREE.Mesh(coreGeo, coreMat);
    coreMesh.rotation.x = Math.PI;
    coreMesh.position.y = 0.55;
    group.add(coreMesh);

    // Hazard ring
    const ringGeo = new THREE.RingGeometry(0.5, 0.65, 16);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0xf87171,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.8,
    });
    const ringMesh = new THREE.Mesh(ringGeo, ringMat);
    ringMesh.rotation.x = -Math.PI / 2;
    ringMesh.position.y = 0.02;
    group.add(ringMesh);

    // Pulsing point light
    const light = new THREE.PointLight(0xf87171, 2.5, 10);
    light.position.y = 0.8;
    group.add(light);

    group.position.copy(position);
    scene.add(group);
    spikeMesh = group;

    audio.playBombBeep();
  }

  function step(dt, playerPos, holdingDefuse, hasKit, onDetonate, onDefuse) {
    if (!planted || detonated || defused) {
      return;
    }

    // Fuse countdown
    timer -= dt;
    beepTimer -= dt;
    if (beepTimer <= 0) {
      audio.playBombBeep();
      const factor = Math.max(0.12, (timer / 45.0) * 1.0);
      beepTimer = factor;
    }

    if (timer <= 0) {
      timer = 0;
      detonated = true;
      audio.playDefuseHum(false);
      if (typeof onDetonate === 'function') {
        onDetonate();
      }
      return;
    }

    // Defusal handling
    usingKit = !!hasKit;
    const requiredTime = usingKit ? 3.5 : 7.0;
    const distToSpike = playerPos.distanceTo(spikePos);

    if (distToSpike <= 3.0 && holdingDefuse) {
      audio.playDefuseHum(true);
      defuseProgress += dt;
      if (defuseProgress >= requiredTime) {
        defuseProgress = requiredTime;
        defused = true;
        audio.playDefuseHum(false);
        if (typeof onDefuse === 'function') {
          onDefuse();
        }
      }
    } else {
      audio.playDefuseHum(false);
      defuseProgress = 0.0;
    }
  }

  function reset() {
    if (spikeMesh) {
      scene.remove(spikeMesh);
      spikeMesh = null;
    }
    planted = false;
    detonated = false;
    defused = false;
    timer = 45.0;
    defuseProgress = 0.0;
    site = 'A';
    audio.playDefuseHum(false);
  }

  function isPlanted() {
    return planted;
  }

  function getTimer() {
    return Math.max(0, Math.ceil(timer));
  }

  function getSite() {
    return site;
  }

  function getDefuseRatio() {
    if (!planted) return 0;
    const req = usingKit ? 3.5 : 7.0;
    return Math.min(1.0, Math.max(0, defuseProgress / req));
  }

  return {
    plantSpike,
    step,
    reset,
    isPlanted,
    getTimer,
    getSite,
    getDefuseRatio,
  };
}
