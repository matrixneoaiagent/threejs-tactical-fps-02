// weapons.js: Weapon definitions, recoil patterns, 3D procedural viewmodels, and ballistic raycasting
import * as THREE from 'three';
import { PALETTE } from './palette.js';
import { audio } from './audio.js';

export const WEAPON_TYPES = {
  AR4: {
    name: 'Phantom AR-4',
    category: 'primary',
    cost: 2700,
    magSize: 30,
    reserveMax: 90,
    fireDelay: 0.10, // 600 RPM
    damage: 34,
    recoilPitch: 0.024,
    recoilYaw: 0.008,
    baseSpread: 0.003,
    moveSpreadMult: 6.0,
    reloadTime: 2.2,
    automatic: true,
  },
  SMG: {
    name: 'Spectre SMG',
    category: 'primary',
    cost: 1500,
    magSize: 30,
    reserveMax: 120,
    fireDelay: 0.075, // 800 RPM
    damage: 22,
    recoilPitch: 0.014,
    recoilYaw: 0.006,
    baseSpread: 0.006,
    moveSpreadMult: 2.5,
    reloadTime: 1.8,
    automatic: true,
  },
  SNIPER: {
    name: 'Operator Sniper',
    category: 'primary',
    cost: 3800,
    magSize: 5,
    reserveMax: 15,
    fireDelay: 1.15, // Bolt action
    damage: 115,
    recoilPitch: 0.08,
    recoilYaw: 0.015,
    baseSpread: 0.0005,
    moveSpreadMult: 25.0,
    reloadTime: 2.8,
    automatic: false,
  },
  PISTOL: {
    name: 'P250 Sidearm',
    category: 'secondary',
    cost: 300,
    magSize: 13,
    reserveMax: 52,
    fireDelay: 0.16,
    damage: 28,
    recoilPitch: 0.018,
    recoilYaw: 0.005,
    baseSpread: 0.007,
    moveSpreadMult: 3.0,
    reloadTime: 1.6,
    automatic: false,
  },
};

export function createWeaponSystem(camera, scene) {
  // Viewmodel root attached to camera
  const viewModel = new THREE.Group();
  viewModel.position.set(0.24, -0.22, -0.45);
  camera.add(viewModel);

  // Weapon parts
  const gunMat = new THREE.MeshStandardMaterial({ color: 0x181a1f, roughness: 0.4, metalness: 0.7 });
  const trimMat = new THREE.MeshStandardMaterial({ color: PALETTE.hazardYellow, roughness: 0.5, metalness: 0.2 });
  const metalMat = new THREE.MeshStandardMaterial({ color: 0x333842, roughness: 0.3, metalness: 0.8 });

  // Procedural Rifle Geometry
  const bodyGeo = new THREE.BoxGeometry(0.06, 0.09, 0.42);
  const bodyMesh = new THREE.Mesh(bodyGeo, gunMat);
  viewModel.add(bodyMesh);

  const barrelGeo = new THREE.CylinderGeometry(0.018, 0.018, 0.35, 12);
  const barrelMesh = new THREE.Mesh(barrelGeo, metalMat);
  barrelMesh.rotation.x = -Math.PI / 2;
  barrelMesh.position.set(0, 0.02, -0.32);
  viewModel.add(barrelMesh);

  const magGeo = new THREE.BoxGeometry(0.045, 0.16, 0.075);
  const magMesh = new THREE.Mesh(magGeo, trimMat);
  magMesh.position.set(0, -0.1, -0.04);
  magMesh.rotation.x = 0.2;
  viewModel.add(magMesh);

  const sightGeo = new THREE.BoxGeometry(0.02, 0.04, 0.08);
  const sightMesh = new THREE.Mesh(sightGeo, metalMat);
  sightMesh.position.set(0, 0.065, -0.1);
  viewModel.add(sightMesh);

  // Muzzle flash billboard and point light
  const flashGeo = new THREE.PlaneGeometry(0.18, 0.18);
  const flashMat = new THREE.MeshBasicMaterial({
    color: 0xffe066,
    side: THREE.DoubleSide,
    transparent: true,
    opacity: 0,
  });
  const flashMesh = new THREE.Mesh(flashGeo, flashMat);
  flashMesh.position.set(0, 0.02, -0.52);
  viewModel.add(flashMesh);

  const flashLight = new THREE.PointLight(0xffb703, 0, 8);
  flashLight.position.set(0, 0.02, -0.52);
  viewModel.add(flashLight);

  let currentType = WEAPON_TYPES.AR4;
  const state = {
    mag: currentType.magSize,
    reserve: currentType.reserveMax,
    reloadTimer: 0,
    fireTimer: 0,
    kickback: 0,
    swayX: 0,
    swayY: 0,
    currentWeapon: currentType,
  };

  const raycaster = new THREE.Raycaster();
  raycaster.far = 100;
  const shootDir = new THREE.Vector3();

  function switchWeapon(typeKey) {
    if (!WEAPON_TYPES[typeKey]) return;
    currentType = WEAPON_TYPES[typeKey];
    state.currentWeapon = currentType;
    state.mag = currentType.magSize;
    state.reserve = currentType.reserveMax;
    state.reloadTimer = 0;
    state.fireTimer = 0;
  }

  function getSpread(playerSpeed, isCrouching) {
    let spread = currentType.baseSpread;
    if (playerSpeed > 0.5) {
      spread += currentType.baseSpread * currentType.moveSpreadMult * (playerSpeed / 5.8);
    }
    if (isCrouching) {
      spread *= 0.55;
    }
    return spread;
  }

  function shoot(random, playerSpeed, isCrouching, shootableTargets, onHit) {
    if (state.reloadTimer > 0 || state.fireTimer > 0 || state.mag <= 0) {
      return false;
    }

    state.mag -= 1;
    state.fireTimer = currentType.fireDelay;
    state.kickback = 0.08;

    // Audio
    audio.playGunshot(currentType === WEAPON_TYPES.SNIPER ? 0.7 : 1.0);

    // Muzzle flash visibility
    flashMat.opacity = 1.0;
    flashLight.intensity = 2.5;

    // Bullet raycast
    const spread = getSpread(playerSpeed, isCrouching);
    camera.getWorldDirection(shootDir);
    shootDir.x += (random() * 2 - 1) * spread;
    shootDir.y += (random() * 2 - 1) * spread;
    shootDir.z += (random() * 2 - 1) * spread;
    shootDir.normalize();

    raycaster.set(camera.position, shootDir);
    scene.updateMatrixWorld(true);
    const intersects = raycaster.intersectObjects(shootableTargets, true);

    if (intersects.length > 0) {
      const hit = intersects[0];
      if (onHit) onHit(hit, currentType);
    }

    return true;
  }

  function reload() {
    if (state.reloadTimer > 0 || state.mag >= currentType.magSize || state.reserve <= 0) {
      return;
    }
    state.reloadTimer = currentType.reloadTime;
    audio.playReload();
  }

  function step(dt, lookDelta, playerSpeed) {
    if (state.fireTimer > 0) state.fireTimer -= dt;

    // Flash fade
    if (flashMat.opacity > 0) {
      flashMat.opacity = Math.max(0, flashMat.opacity - dt * 25);
      flashLight.intensity = flashMat.opacity * 2.5;
    }

    // Reload completion
    if (state.reloadTimer > 0) {
      state.reloadTimer -= dt;
      if (state.reloadTimer <= 0) {
        const needed = currentType.magSize - state.mag;
        const take = Math.min(needed, state.reserve);
        state.mag += take;
        state.reserve -= take;
      }
    }

    // Viewmodel sway & bobbing
    state.swayX += (-lookDelta.x * 0.02 - state.swayX) * Math.min(1, dt * 10);
    state.swayY += (lookDelta.y * 0.02 - state.swayY) * Math.min(1, dt * 10);
    state.kickback = Math.max(0, state.kickback - dt * 0.6);

    const bobTime = performance.now() * 0.008;
    const bobX = Math.cos(bobTime) * 0.005 * (playerSpeed / 5.8);
    const bobY = Math.sin(bobTime * 2) * 0.006 * (playerSpeed / 5.8);

    const reloadDip = state.reloadTimer > 0 ? -0.15 * Math.sin((state.reloadTimer / currentType.reloadTime) * Math.PI) : 0;

    viewModel.position.set(
      0.24 + state.swayX + bobX,
      -0.22 + state.swayY + bobY + reloadDip,
      -0.45 + state.kickback
    );
    viewModel.rotation.set(
      state.swayY * 1.5 + state.kickback * 2.0,
      -state.swayX * 1.5,
      0
    );
  }

  function refill() {
    state.mag = currentType.magSize;
    state.reserve = currentType.reserveMax;
    state.reloadTimer = 0;
    state.fireTimer = 0;
  }

  return {
    state,
    shoot,
    reload,
    step,
    refill,
    switchWeapon,
    getSpread,
  };
}
