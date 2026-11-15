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
    name: 'Ghost Pistol',
    category: 'secondary',
    cost: 300,
    magSize: 15,
    reserveMax: 45,
    fireDelay: 0.15,
    damage: 30,
    recoilPitch: 0.018,
    recoilYaw: 0.005,
    baseSpread: 0.007,
    moveSpreadMult: 3.0,
    reloadTime: 1.5,
    automatic: false,
  },
};

// Aliases for convenience
WEAPON_TYPES.GHOST = WEAPON_TYPES.PISTOL;

export function createWeaponSystem(camera, scene) {
  // Viewmodel root attached directly to camera
  const viewModel = new THREE.Group();
  viewModel.position.set(0.24, -0.22, -0.45);
  camera.add(viewModel);

  // Tactical Materials
  const accentColor = PALETTE?.accent || '#e5a93c';
  const blueColor = PALETTE?.blue || '#38bdf8';

  const gunMat = new THREE.MeshStandardMaterial({ color: 0x181a20, roughness: 0.35, metalness: 0.75 });
  const trimMat = new THREE.MeshStandardMaterial({ color: accentColor, roughness: 0.45, metalness: 0.25 });
  const metalMat = new THREE.MeshStandardMaterial({ color: 0x333842, roughness: 0.3, metalness: 0.8 });
  const darkPolyMat = new THREE.MeshStandardMaterial({ color: 0x121418, roughness: 0.75, metalness: 0.15 });
  const blueTrimMat = new THREE.MeshStandardMaterial({ color: blueColor, roughness: 0.4, metalness: 0.3 });
  const silencerMat = new THREE.MeshStandardMaterial({ color: 0x1f232b, roughness: 0.5, metalness: 0.65 });
  const lensMat = new THREE.MeshStandardMaterial({
    color: 0x38bdf8,
    roughness: 0.1,
    metalness: 0.9,
    transparent: true,
    opacity: 0.75,
  });

  // Weapon Container Groups
  const models = {};

  // ==========================================
  // 1. PHANTOM AR-4 (Assault Rifle) Viewmodel
  // ==========================================
  const ar4Group = new THREE.Group();
  {
    // Receiver Body
    const body = new THREE.Mesh(new THREE.BoxGeometry(0.055, 0.085, 0.40), gunMat);
    ar4Group.add(body);

    // Handguard
    const handguard = new THREE.Mesh(new THREE.BoxGeometry(0.058, 0.07, 0.22), darkPolyMat);
    handguard.position.set(0, 0.005, -0.25);
    ar4Group.add(handguard);

    // Barrel
    const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.32, 12), metalMat);
    barrel.rotation.x = -Math.PI / 2;
    barrel.position.set(0, 0.018, -0.42);
    ar4Group.add(barrel);

    // Muzzle Brake
    const muzzle = new THREE.Mesh(new THREE.CylinderGeometry(0.019, 0.019, 0.06, 12), metalMat);
    muzzle.rotation.x = -Math.PI / 2;
    muzzle.position.set(0, 0.018, -0.58);
    ar4Group.add(muzzle);

    // Curved Magazine
    const mag = new THREE.Mesh(new THREE.BoxGeometry(0.045, 0.17, 0.08), trimMat);
    mag.position.set(0, -0.10, -0.05);
    mag.rotation.x = 0.22;
    ar4Group.add(mag);

    // Tactical Stock
    const stock = new THREE.Mesh(new THREE.BoxGeometry(0.048, 0.095, 0.20), darkPolyMat);
    stock.position.set(0, 0.02, 0.23);
    ar4Group.add(stock);

    // Pistol Grip
    const grip = new THREE.Mesh(new THREE.BoxGeometry(0.042, 0.12, 0.055), darkPolyMat);
    grip.position.set(0, -0.09, 0.10);
    grip.rotation.x = -0.32;
    ar4Group.add(grip);

    // Top Picatinny Rail
    const rail = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.015, 0.28), metalMat);
    rail.position.set(0, 0.05, -0.07);
    ar4Group.add(rail);

    // Holographic Sight Base & Hood
    const sightBase = new THREE.Mesh(new THREE.BoxGeometry(0.036, 0.02, 0.08), metalMat);
    sightBase.position.set(0, 0.065, -0.07);
    ar4Group.add(sightBase);

    const sightHood = new THREE.Mesh(new THREE.BoxGeometry(0.038, 0.04, 0.05), gunMat);
    sightHood.position.set(0, 0.09, -0.07);
    ar4Group.add(sightHood);

    const sightLens = new THREE.Mesh(new THREE.PlaneGeometry(0.026, 0.026), lensMat);
    sightLens.position.set(0, 0.09, -0.06);
    ar4Group.add(sightLens);
  }
  viewModel.add(ar4Group);
  models.AR4 = { group: ar4Group, muzzlePos: new THREE.Vector3(0, 0.018, -0.61) };

  // ==========================================
  // 2. SPECTRE SMG Viewmodel
  // ==========================================
  const smgGroup = new THREE.Group();
  {
    // Receiver Body
    const body = new THREE.Mesh(new THREE.BoxGeometry(0.048, 0.075, 0.28), darkPolyMat);
    smgGroup.add(body);

    // Integrated Silencer / Barrel Shroud
    const silencer = new THREE.Mesh(new THREE.CylinderGeometry(0.024, 0.024, 0.28, 12), silencerMat);
    silencer.rotation.x = -Math.PI / 2;
    silencer.position.set(0, 0.014, -0.26);
    smgGroup.add(silencer);

    // Muzzle tip
    const tip = new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.014, 0.03, 12), metalMat);
    tip.rotation.x = -Math.PI / 2;
    tip.position.set(0, 0.014, -0.41);
    smgGroup.add(tip);

    // Vertical Magazine
    const mag = new THREE.Mesh(new THREE.BoxGeometry(0.036, 0.18, 0.046), blueTrimMat);
    mag.position.set(0, -0.11, 0.02);
    mag.rotation.x = 0.12;
    smgGroup.add(mag);

    // Tactical Grip
    const grip = new THREE.Mesh(new THREE.BoxGeometry(0.038, 0.11, 0.05), gunMat);
    grip.position.set(0, -0.08, 0.08);
    grip.rotation.x = -0.30;
    smgGroup.add(grip);

    // Wire Stock
    const wireStock = new THREE.Mesh(new THREE.BoxGeometry(0.035, 0.065, 0.14), metalMat);
    wireStock.position.set(0, 0.01, 0.18);
    smgGroup.add(wireStock);

    // Compact Reflex Optic
    const opticBase = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.015, 0.07), metalMat);
    opticBase.position.set(0, 0.045, -0.04);
    smgGroup.add(opticBase);

    const opticHood = new THREE.Mesh(new THREE.BoxGeometry(0.032, 0.032, 0.04), gunMat);
    opticHood.position.set(0, 0.065, -0.04);
    smgGroup.add(opticHood);

    const opticLens = new THREE.Mesh(new THREE.PlaneGeometry(0.022, 0.022), lensMat);
    opticLens.position.set(0, 0.065, -0.03);
    smgGroup.add(opticLens);
  }
  viewModel.add(smgGroup);
  models.SMG = { group: smgGroup, muzzlePos: new THREE.Vector3(0, 0.014, -0.43) };

  // ==========================================
  // 3. OPERATOR SNIPER Viewmodel
  // ==========================================
  const sniperGroup = new THREE.Group();
  let sniperBoltMesh = null;
  {
    // Heavy Chassis
    const chassis = new THREE.Mesh(new THREE.BoxGeometry(0.065, 0.09, 0.50), darkPolyMat);
    sniperGroup.add(chassis);

    // Precision Heavy Barrel
    const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.016, 0.019, 0.54, 12), metalMat);
    barrel.rotation.x = -Math.PI / 2;
    barrel.position.set(0, 0.02, -0.48);
    sniperGroup.add(barrel);

    // Muzzle Brake
    const brake = new THREE.Mesh(new THREE.BoxGeometry(0.042, 0.038, 0.08), gunMat);
    brake.position.set(0, 0.02, -0.77);
    sniperGroup.add(brake);

    // Massive Sniper Scope
    const scopeTube = new THREE.Mesh(new THREE.CylinderGeometry(0.024, 0.024, 0.32, 12), gunMat);
    scopeTube.rotation.x = -Math.PI / 2;
    scopeTube.position.set(0, 0.095, -0.08);
    sniperGroup.add(scopeTube);

    const scopeObjective = new THREE.Mesh(new THREE.CylinderGeometry(0.033, 0.024, 0.08, 12), trimMat);
    scopeObjective.rotation.x = -Math.PI / 2;
    scopeObjective.position.set(0, 0.095, -0.26);
    sniperGroup.add(scopeObjective);

    const scopeEyepiece = new THREE.Mesh(new THREE.CylinderGeometry(0.024, 0.029, 0.06, 12), metalMat);
    scopeEyepiece.rotation.x = -Math.PI / 2;
    scopeEyepiece.position.set(0, 0.095, 0.09);
    sniperGroup.add(scopeEyepiece);

    const scopeRings1 = new THREE.Mesh(new THREE.BoxGeometry(0.034, 0.032, 0.03), metalMat);
    scopeRings1.position.set(0, 0.06, -0.16);
    sniperGroup.add(scopeRings1);

    const scopeRings2 = new THREE.Mesh(new THREE.BoxGeometry(0.034, 0.032, 0.03), metalMat);
    scopeRings2.position.set(0, 0.06, 0.0);
    sniperGroup.add(scopeRings2);

    const lens = new THREE.Mesh(new THREE.CircleGeometry(0.024, 16), lensMat);
    lens.position.set(0, 0.095, 0.121);
    sniperGroup.add(lens);

    // Side Bolt Handle
    sniperBoltMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.08, 8), metalMat);
    sniperBoltMesh.position.set(0.048, 0.045, 0.04);
    sniperBoltMesh.rotation.z = Math.PI / 4;
    sniperGroup.add(sniperBoltMesh);

    // Box Magazine
    const mag = new THREE.Mesh(new THREE.BoxGeometry(0.046, 0.10, 0.08), metalMat);
    mag.position.set(0, -0.08, -0.05);
    sniperGroup.add(mag);

    // Sniper Stock with Cheek Riser
    const stock = new THREE.Mesh(new THREE.BoxGeometry(0.055, 0.11, 0.28), darkPolyMat);
    stock.position.set(0, 0.015, 0.35);
    sniperGroup.add(stock);

    const grip = new THREE.Mesh(new THREE.BoxGeometry(0.046, 0.12, 0.052), darkPolyMat);
    grip.position.set(0, -0.09, 0.13);
    grip.rotation.x = -0.32;
    sniperGroup.add(grip);
  }
  viewModel.add(sniperGroup);
  models.SNIPER = { group: sniperGroup, muzzlePos: new THREE.Vector3(0, 0.02, -0.82) };

  // ==========================================
  // 4. GHOST PISTOL Viewmodel
  // ==========================================
  const pistolGroup = new THREE.Group();
  let pistolSlideMesh = null;
  {
    // Lower Frame
    const frame = new THREE.Mesh(new THREE.BoxGeometry(0.038, 0.04, 0.18), darkPolyMat);
    frame.position.set(0, 0.0, -0.03);
    pistolGroup.add(frame);

    // Ergonomic Grip
    const grip = new THREE.Mesh(new THREE.BoxGeometry(0.036, 0.12, 0.055), darkPolyMat);
    grip.position.set(0, -0.07, 0.03);
    grip.rotation.x = -0.28;
    pistolGroup.add(grip);

    // Trigger Guard
    const triggerGuard = new THREE.Mesh(new THREE.BoxGeometry(0.028, 0.035, 0.05), metalMat);
    triggerGuard.position.set(0, -0.03, -0.02);
    pistolGroup.add(triggerGuard);

    // Recoil Blowback Slide
    pistolSlideMesh = new THREE.Group();
    const slideUpper = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.048, 0.22), gunMat);
    slideUpper.position.set(0, 0.036, -0.05);
    pistolSlideMesh.add(slideUpper);

    // Iron Sights (Rear Notch & Front Post)
    const rearSight = new THREE.Mesh(new THREE.BoxGeometry(0.022, 0.014, 0.01), metalMat);
    rearSight.position.set(0, 0.065, 0.05);
    pistolSlideMesh.add(rearSight);

    const frontSight = new THREE.Mesh(new THREE.BoxGeometry(0.01, 0.014, 0.01), trimMat);
    frontSight.position.set(0, 0.065, -0.15);
    pistolSlideMesh.add(frontSight);

    pistolGroup.add(pistolSlideMesh);

    // Silencer Barrel Extension
    const suppressor = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.022, 0.22, 12), silencerMat);
    suppressor.rotation.x = -Math.PI / 2;
    suppressor.position.set(0, 0.036, -0.27);
    pistolGroup.add(suppressor);

    // Silencer Tip Ring
    const supTip = new THREE.Mesh(new THREE.CylinderGeometry(0.023, 0.023, 0.02, 12), metalMat);
    supTip.rotation.x = -Math.PI / 2;
    supTip.position.set(0, 0.036, -0.38);
    pistolGroup.add(supTip);
  }
  viewModel.add(pistolGroup);
  models.PISTOL = { group: pistolGroup, muzzlePos: new THREE.Vector3(0, 0.036, -0.40) };

  // Muzzle flash billboard and point light
  const flashGeo = new THREE.PlaneGeometry(0.18, 0.18);
  const flashMat = new THREE.MeshBasicMaterial({
    color: 0xffe066,
    side: THREE.DoubleSide,
    transparent: true,
    opacity: 0,
  });
  const flashMesh = new THREE.Mesh(flashGeo, flashMat);
  viewModel.add(flashMesh);

  const flashLight = new THREE.PointLight(0xffb703, 0, 8);
  viewModel.add(flashLight);

  let currentKey = 'AR4';
  let currentType = WEAPON_TYPES.AR4;
  let equipTimer = 0.25;

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

  // Activate model visibility based on current weapon
  function updateModelVisibility() {
    for (const key of Object.keys(models)) {
      models[key].group.visible = (key === currentKey);
    }
    const currentModel = models[currentKey];
    if (currentModel) {
      flashMesh.position.copy(currentModel.muzzlePos);
      flashLight.position.copy(currentModel.muzzlePos);
    }
  }
  updateModelVisibility();

  function switchWeapon(typeKey) {
    let resolvedKey = typeKey;
    if (typeKey === 'ghost' || typeKey === 'GHOST') resolvedKey = 'PISTOL';
    if (typeKey === 'ar4') resolvedKey = 'AR4';
    if (typeKey === 'smg') resolvedKey = 'SMG';
    if (typeKey === 'sniper') resolvedKey = 'SNIPER';
    if (typeKey === 'pistol') resolvedKey = 'PISTOL';

    if (!WEAPON_TYPES[resolvedKey] || !models[resolvedKey]) return;

    currentKey = resolvedKey;
    currentType = WEAPON_TYPES[resolvedKey];
    state.currentWeapon = currentType;
    state.mag = currentType.magSize;
    state.reserve = currentType.reserveMax;
    state.reloadTimer = 0;
    state.fireTimer = 0;
    equipTimer = 0.22;

    updateModelVisibility();
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
    if (state.reloadTimer > 0 || state.fireTimer > 0 || state.mag <= 0 || equipTimer > 0) {
      return false;
    }

    state.mag -= 1;
    state.fireTimer = currentType.fireDelay;

    // Weapon-specific kickback
    if (currentType === WEAPON_TYPES.SNIPER) {
      state.kickback = 0.14;
    } else if (currentType === WEAPON_TYPES.AR4) {
      state.kickback = 0.08;
    } else if (currentType === WEAPON_TYPES.SMG) {
      state.kickback = 0.055;
    } else {
      state.kickback = 0.065;
    }

    // Audio
    const pitch = currentType === WEAPON_TYPES.SNIPER ? 0.7 : (currentType === WEAPON_TYPES.SMG ? 1.2 : 1.0);
    audio?.playGunshot?.(pitch);

    // Muzzle flash visibility
    flashMat.opacity = 1.0;
    flashLight.intensity = currentType === WEAPON_TYPES.SNIPER ? 3.5 : 2.5;

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
    if (state.reloadTimer > 0 || state.mag >= currentType.magSize || state.reserve <= 0 || equipTimer > 0) {
      return;
    }
    state.reloadTimer = currentType.reloadTime;
    audio?.playReload?.();
  }

  function step(dt, lookDelta, playerSpeed) {
    if (state.fireTimer > 0) state.fireTimer -= dt;
    if (equipTimer > 0) equipTimer -= dt;

    // Flash fade
    if (flashMat.opacity > 0) {
      flashMat.opacity = Math.max(0, flashMat.opacity - dt * 26);
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

    // Viewmodel sway & kickback recovery
    state.swayX += (-lookDelta.x * 0.02 - state.swayX) * Math.min(1, dt * 10);
    state.swayY += (lookDelta.y * 0.02 - state.swayY) * Math.min(1, dt * 10);
    state.kickback = Math.max(0, state.kickback - dt * 0.65);

    // Natural walk bobbing
    const bobTime = performance.now() * 0.008;
    const speedRatio = playerSpeed / 5.8;
    const bobX = Math.cos(bobTime) * 0.005 * speedRatio;
    const bobY = Math.sin(bobTime * 2) * 0.006 * speedRatio;

    // Reload animation dip & tilt
    let reloadDip = 0;
    let reloadRoll = 0;
    if (state.reloadTimer > 0) {
      const reloadRatio = state.reloadTimer / currentType.reloadTime;
      reloadDip = -0.15 * Math.sin(reloadRatio * Math.PI);
      reloadRoll = 0.25 * Math.sin(reloadRatio * Math.PI);
    }

    // Equip raise animation
    const equipDip = equipTimer > 0 ? -0.18 * (equipTimer / 0.22) : 0;

    // Animate Slide Blowback for Pistol
    if (pistolSlideMesh) {
      const slideRecoil = (currentKey === 'PISTOL') ? state.kickback * 0.5 : 0;
      pistolSlideMesh.position.z = slideRecoil;
    }

    // Animate Bolt for Sniper Rifle
    if (sniperBoltMesh) {
      if (currentKey === 'SNIPER' && state.fireTimer > currentType.fireDelay * 0.4) {
        sniperBoltMesh.rotation.z = Math.PI / 2;
      } else {
        sniperBoltMesh.rotation.z = Math.PI / 4;
      }
    }

    // Base resting position per weapon category
    const isPistol = (currentKey === 'PISTOL');
    const baseX = isPistol ? 0.20 : 0.24;
    const baseY = isPistol ? -0.20 : -0.22;
    const baseZ = isPistol ? -0.40 : -0.45;

    viewModel.position.set(
      baseX + state.swayX + bobX,
      baseY + state.swayY + bobY + reloadDip + equipDip,
      baseZ + state.kickback
    );

    viewModel.rotation.set(
      state.swayY * 1.5 + state.kickback * 2.0,
      -state.swayX * 1.5,
      reloadRoll
    );
  }

  function refill() {
    state.mag = currentType.magSize;
    state.reserve = currentType.reserveMax;
    state.reloadTimer = 0;
    state.fireTimer = 0;
    equipTimer = 0;
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
