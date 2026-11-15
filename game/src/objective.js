// objective.js: Tactical bomb / EMP spike plant and defusal logic
import * as THREE from 'three';
import { PALETTE } from './palette.js';
import { audio } from './audio.js';

export function createObjectiveSystem(scene, siteAPos, siteBPos) {
  let spikeMesh = null;
  let spikeRing = null;
  let isPlanted = false;
  let plantSite = null;
  let timer = 45.0; // 45s fuse
  let defuseProgress = 0;
  let defuseRequired = 7.0;
  let beepInterval = 1.0;
  let nextBeep = 1.0;

  function plantSpike(position) {
    if (isPlanted) return;
    isPlanted = true;
    timer = 45.0;
    defuseProgress = 0;

    // Detect site
    const distA = position.distanceTo(siteAPos);
    const distB = position.distanceTo(siteBPos);
    plantSite = distA < distB ? 'A' : 'B';

    // 3D Spike model
    spikeMesh = new THREE.Group();
    spikeMesh.position.copy(position);
    spikeMesh.position.y = 0;

    const baseGeo = new THREE.CylinderGeometry(0.24, 0.32, 0.6, 8);
    const baseMat = new THREE.MeshStandardMaterial({ color: 0x1f232b, metalness: 0.8, roughness: 0.3 });
    const base = new THREE.Mesh(baseGeo, baseMat);
    base.position.y = 0.3;
    spikeMesh.add(base);

    // Glowing core
    const coreGeo = new THREE.SphereGeometry(0.14, 12, 12);
    const coreMat = new THREE.MeshBasicMaterial({ color: PALETTE.spikeCore });
    const core = new THREE.Mesh(coreGeo, coreMat);
    core.position.y = 0.65;
    spikeMesh.add(core);

    // Rotating holographic ring
    const ringGeo = new THREE.RingGeometry(0.4, 0.48, 16);
    const ringMat = new THREE.MeshBasicMaterial({
      color: PALETTE.spikeCore,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.8,
    });
    spikeRing = new THREE.Mesh(ringGeo, ringMat);
    spikeRing.rotation.x = -Math.PI / 2;
    spikeRing.position.y = 0.65;
    spikeMesh.add(spikeRing);

    scene.add(spikeMesh);
    audio.playBombBeep(1.0);
  }

  function step(dt, playerPos, isHoldingDefuse, hasDefuseKit, onDetonate, onDefused) {
    if (!isPlanted) return;

    timer -= dt;

    // Accelerating beeps
    beepInterval = Math.max(0.12, (timer / 45.0) * 1.0);
    nextBeep -= dt;
    if (nextBeep <= 0) {
      nextBeep = beepInterval;
      audio.playBombBeep(1.0 + (1 - timer / 45.0) * 0.8);
    }

    // Spin hologram
    if (spikeRing) {
      spikeRing.rotation.z += dt * 3.0;
    }

    // Defusal logic
    defuseRequired = hasDefuseKit ? 3.5 : 7.0;
    const distToPlayer = spikeMesh ? spikeMesh.position.distanceTo(playerPos) : 999;

    if (distToPlayer < 2.4 && isHoldingDefuse) {
      defuseProgress += dt;
      audio.playDefuseHum();
      if (defuseProgress >= defuseRequired) {
        // Successfully defused!
        removeSpike();
        if (onDefused) onDefused();
        return;
      }
    } else {
      defuseProgress = Math.max(0, defuseProgress - dt * 2.0);
    }

    if (timer <= 0) {
      // Detonate
      audio.playExplosion();
      removeSpike();
      if (onDetonate) onDetonate();
    }
  }

  function removeSpike() {
    if (spikeMesh) {
      scene.remove(spikeMesh);
      spikeMesh = null;
      spikeRing = null;
    }
    isPlanted = false;
    plantSite = null;
    defuseProgress = 0;
  }

  function reset() {
    removeSpike();
  }

  return {
    plantSpike,
    step,
    reset,
    isPlanted: () => isPlanted,
    getSite: () => plantSite,
    getTimer: () => Math.max(0, Math.ceil(timer)),
    getDefuseRatio: () => defuseProgress / defuseRequired,
    getSpikePosition: () => (spikeMesh ? spikeMesh.position : null),
  };
}
