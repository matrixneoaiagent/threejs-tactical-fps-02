// main.js: Tactical FPS orchestrator, fixed 60 Hz simulation, rendering and shot capture
import * as THREE from 'three';
import { PALETTE } from './palette.js';
import { audio } from './audio.js';
import { createMap } from './map.js';
import { createPlayer } from './player.js';
import { createWeaponSystem, WEAPON_TYPES } from './weapons.js';
import { createProjectileSystem } from './projectiles.js';
import { createBotManager } from './bot.js';
import { createObjectiveSystem } from './objective.js';
import { createEconomySystem } from './economy.js';
import { createHud } from './hud.js';
import { createInput } from './input.js';

const FIXED_STEP = 1 / 60;
const params = new URLSearchParams(window.location.search);
const shot = params.get('shot');
const seed = Number.parseInt(params.get('seed') ?? '1', 10) || 1;

function mulberry32(initial) {
  let a = initial;
  return function random() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const random = mulberry32(seed);

// Three.js Renderer setup
const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFShadowMap;
renderer.toneMapping = THREE.NoToneMapping;
renderer.toneMappingExposure = 1.0;
const gameContainer = document.getElementById('game');
if (gameContainer) gameContainer.appendChild(renderer.domElement);

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x101a28);
scene.fog = new THREE.Fog(new THREE.Color(0x101a28), 40, 110);

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.05, 120);
scene.add(camera);

// Subsystems
const map = createMap(scene);
const player = createPlayer(map.colliders);
const weapon = createWeaponSystem(camera, scene);
const projectiles = createProjectileSystem(scene, map.colliders);
const botManager = createBotManager(scene, map.colliders);
const objective = createObjectiveSystem(scene, map.siteAPosition, map.siteBPosition);
const economy = createEconomySystem();
const hud = createHud();
const input = createInput(renderer.domElement, onLockChange);

// Game Round State
let roundNumber = 1;
let scoreVanguard = 3;
let scoreSyndicate = 2;
let roundTimer = 105.0; // 1:45 round
let roundState = 'ACTIVE'; // BUY_PHASE, ACTIVE, ROUND_OVER
let roundResult = null;
let killsThisRound = 0;
let frozen = false;
let started = false;
let accumulator = 0;
let lastTime = performance.now();

// Initial bot spawns
function initBots() {
  botManager.resetAll();
  // 3 Attackers on Syndicate team pushing different routes
  botManager.spawnBot('bot_attacker_1', 'attacker', new THREE.Vector3(-4, 0, 26), map.waypoints, 'routeALong');
  botManager.spawnBot('bot_attacker_2', 'attacker', new THREE.Vector3(0, 0, 26), map.waypoints, 'routeMidToA');
  botManager.spawnBot('bot_attacker_3', 'attacker', new THREE.Vector3(4, 0, 26), map.waypoints, 'routeBAlley');
}
initBots();

function onLockChange(locked) {
  if (shot) return;
  const overlay = document.getElementById('overlay');
  if (locked) {
    started = true;
    audio.init();
    if (overlay) overlay.setAttribute('hidden', '');
  } else if (roundState === 'ACTIVE' && overlay) {
    overlay.removeAttribute('hidden');
  }
}

const playBtn = document.getElementById('play');
if (playBtn) {
  playBtn.addEventListener('click', () => {
    input.requestLock();
  });
}

// Buy Menu interaction
window.addEventListener('keydown', (e) => {
  if (shot) return;
  if (e.code === 'KeyB') {
    hud.toggleBuyMenu();
  }
  if (e.code === 'Digit1') weapon.switchWeapon('AR4');
  if (e.code === 'Digit2') weapon.switchWeapon('SMG');
  if (e.code === 'Digit3') weapon.switchWeapon('SNIPER');
  if (e.code === 'Digit4') weapon.switchWeapon('PISTOL');
  if (e.code === 'KeyG') {
    // Throw Frag Grenade
    if (economy.state.fragGrenades > 0) {
      economy.state.fragGrenades -= 1;
      const throwDir = new THREE.Vector3();
      camera.getWorldDirection(throwDir);
      projectiles.throwGrenade(camera.position, throwDir, 'frag');
    }
  }
  if (e.code === 'KeyX') {
    // Throw Smoke Grenade
    if (economy.state.smokeGrenades > 0) {
      economy.state.smokeGrenades -= 1;
      const throwDir = new THREE.Vector3();
      camera.getWorldDirection(throwDir);
      projectiles.throwGrenade(camera.position, throwDir, 'smoke');
    }
  }
});

// Setup Buy buttons in DOM
document.querySelectorAll('.buy-btn').forEach((btn) => {
  btn.addEventListener('click', () => {
    const item = btn.dataset.item;
    const cost = Number(btn.dataset.cost);
    if (economy.buy(item, cost)) {
      if (item === 'ar4') weapon.switchWeapon('AR4');
      if (item === 'smg') weapon.switchWeapon('SMG');
      if (item === 'sniper') weapon.switchWeapon('SNIPER');
      if (item === 'armor') player.state.armor = 100;
      hud.updateStatus(player.state.hp, player.state.armor, economy.state.cash, economy.state.hasDefuseKit);
    }
  });
});

function syncCamera() {
  const p = player.state;
  camera.position.set(p.position.x, p.position.y + p.eyeHeight, p.position.z);
  camera.rotation.set(p.pitch + p.recoilPitch, p.yaw + p.recoilYaw, 0, 'YXZ');
}

function handlePlayerHit(hit, weaponType) {
  const mesh = hit.object;
  if (mesh.userData && mesh.userData.bot) {
    const bot = mesh.userData.bot;
    const part = mesh.userData.part;
    const killed = bot.applyDamage(weaponType.damage, part);
    hud.showHitmarker(part === 'head');

    if (killed) {
      killsThisRound += 1;
      hud.addKillEvent('Vanguard Player', `Syndicate Bot (${bot.id})`, weaponType.name, part === 'head');
    }
  }
}

function stepSimulation(dt) {
  if (roundState !== 'ACTIVE') return;

  roundTimer -= dt;

  // Bot logic
  botManager.step(
    dt,
    player,
    random,
    projectiles,
    (bot, p) => {
      // Bot shot feedback
    },
    (plantPos) => {
      // Spike planted by bot!
      objective.plantSpike(plantPos);
      hud.showBanner('ALERT: EMP SPIKE PLANTED', 'DEFENDERS: DEFUSE AT SITE ' + objective.getSite(), 4000);
    }
  );

  // Player physics
  player.step(dt, input.state.keys);

  // Weapon viewmodel and reload timers
  const lookDelta = input.takeLook();
  player.look(lookDelta.x, lookDelta.y);
  weapon.step(dt, lookDelta, player.groundSpeed());

  // Firing
  if (input.state.firing && !hud.isBuyOpen()) {
    const shotFired = weapon.shoot(
      random,
      player.groundSpeed(),
      player.state.isCrouching,
      map.shootables.concat(botManager.hitMeshes),
      handlePlayerHit
    );
    if (shotFired) {
      player.addRecoil(weapon.state.currentWeapon.recoilPitch, (random() * 2 - 1) * weapon.state.currentWeapon.recoilYaw);
    }
  }
  if (input.state.keys.has('KeyR')) {
    weapon.reload();
  }

  // Projectiles (grenades)
  projectiles.step(dt, botManager.bots, player, (pos) => {
    // Grenade explosion feedback
  });

  // Objective step
  const isHoldingDefuse = input.state.keys.has('KeyE');
  objective.step(
    dt,
    player.state.position,
    isHoldingDefuse,
    economy.state.hasDefuseKit,
    () => {
      // Detonated -> Attackers Win Round
      endRound(false, 'Spike Detonated');
    },
    () => {
      // Defused -> Defenders Win Round
      endRound(true, 'Spike Defused');
    }
  );

  // Check team elimination
  let attackersAlive = 0;
  for (let i = 0; i < botManager.bots.length; i += 1) {
    if (botManager.bots[i].alive && botManager.bots[i].isAttacker) attackersAlive += 1;
  }

  if (attackersAlive === 0 && !objective.isPlanted()) {
    endRound(true, 'All Attackers Eliminated');
  } else if (!player.state.alive && !objective.isPlanted()) {
    endRound(false, 'Defender Eliminated');
  } else if (roundTimer <= 0 && !objective.isPlanted()) {
    endRound(true, 'Time Expired - Site Secured');
  }

  // Update HUD
  hud.updateStatus(player.state.hp, player.state.armor, economy.state.cash, economy.state.hasDefuseKit);
  hud.updateWeapon(
    weapon.state.currentWeapon.name,
    weapon.state.mag,
    weapon.state.reserve,
    economy.state.fragGrenades,
    economy.state.smokeGrenades
  );
  hud.updateTimeAndScore(
    objective.isPlanted() ? objective.getTimer() : Math.ceil(roundTimer),
    scoreVanguard,
    scoreSyndicate,
    objective.isPlanted(),
    objective.getSite()
  );
  hud.setCrosshairSpread(weapon.getSpread(player.groundSpeed(), player.state.isCrouching));
  hud.setDefuseProgress(objective.getDefuseRatio());
}

function endRound(vanguardWon, reason) {
  roundState = 'ROUND_OVER';
  if (vanguardWon) scoreVanguard += 1;
  else scoreSyndicate += 1;

  economy.rewardRound(vanguardWon, killsThisRound, vanguardWon);
  hud.showBanner(
    vanguardWon ? 'ROUND WON' : 'ROUND LOST',
    `${reason} | Vanguard ${scoreVanguard} - ${scoreSyndicate} Syndicate`,
    4500
  );

  setTimeout(() => {
    startNewRound();
  }, 4500);
}

function startNewRound() {
  roundNumber += 1;
  roundTimer = 105.0;
  roundState = 'ACTIVE';
  killsThisRound = 0;
  player.reset(new THREE.Vector3(0, 0, -26));
  weapon.refill();
  projectiles.reset();
  objective.reset();
  initBots();
  hud.showBanner(`ROUND ${roundNumber}`, 'DEFEND BOMB SITES A AND B', 2500);
}

// Render frame
function renderFrame(now) {
  requestAnimationFrame(renderFrame);
  const dt = Math.min((now - lastTime) / 1000, 0.1);
  lastTime = now;

  if (!frozen) {
    accumulator += dt;
    let steps = 0;
    while (accumulator >= FIXED_STEP && steps < 5) {
      stepSimulation(FIXED_STEP);
      accumulator -= FIXED_STEP;
      steps += 1;
    }
    if (accumulator > FIXED_STEP * 5) accumulator = 0;
    syncCamera();
  }
  renderer.render(scene, camera);
}

// Deterministic shot controller for taking promotional screenshots
function runShot(shotName) {
  const overlay = document.getElementById('overlay');
  if (overlay) overlay.setAttribute('hidden', '');

  if (shotName === 'start') {
    // Shot 1: Spawn overview with weapon drawn, full HUD
    player.reset(new THREE.Vector3(0, 0, -24));
    player.state.pitch = 0.05;
    player.state.yaw = Math.PI + 0.1;
    hud.updateStatus(100, 100, 3400, true);
    hud.updateWeapon('Phantom AR-4', 30, 90, 2, 1);
    hud.updateTimeAndScore(105, 3, 2, false);
    hud.showBanner('ROUND 6: DEFEND SECTOR 9', 'PURCHASE UTILITIES & HOLD SITES A & B', 10000);
  } else if (shotName === 'tactical') {
    // Shot 2: Tactical engagement at A-Long with bot shootout & hitmarker
    player.reset(new THREE.Vector3(-20, 0, 4));
    player.state.pitch = -0.02;
    player.state.yaw = -0.3;
    player.state.hp = 78;
    player.state.armor = 65;

    // Position bot in sightline
    if (botManager.bots[0]) {
      botManager.bots[0].position.set(-24, 0, 14);
      botManager.bots[0].group.rotation.y = Math.PI - 0.2;
    }
    weapon.state.mag = 24;
    weapon.state.reserve = 90;
    hud.showHitmarker(true);
    hud.addKillEvent('Vanguard Player', 'Syndicate Scout', 'Phantom AR-4', true);
    hud.updateStatus(78, 65, 3700, true);
    hud.updateWeapon('Phantom AR-4', 24, 90, 1, 1);
    hud.updateTimeAndScore(82, 3, 2, false);
  } else if (shotName === 'objective') {
    // Shot 3: Bomb Site A with glowing EMP spike planted and defuse prompt
    player.reset(new THREE.Vector3(-22.5, 0, -16.5));
    player.state.pitch = -0.25;
    player.state.yaw = -2.6;
    objective.plantSpike(new THREE.Vector3(-24, 0, -18));
    hud.setDefuseProgress(0.65);
    hud.updateStatus(54, 40, 4100, true);
    hud.updateWeapon('Phantom AR-4', 18, 90, 0, 1);
    hud.updateTimeAndScore(24, 3, 2, true, 'A');
  } else if (shotName === 'victory') {
    // Shot 4: Round won celebration banner over Site B
    player.reset(new THREE.Vector3(20, 0, -12));
    player.state.pitch = 0.05;
    player.state.yaw = 2.4;
    hud.showBanner('ROUND WON - SITE SECURED', 'VANGUARD 4 : 2 SYNDICATE | +$3,250', 10000);
    hud.updateStatus(100, 85, 6850, true);
    hud.updateWeapon('Operator Sniper', 5, 15, 2, 1);
    hud.updateTimeAndScore(0, 4, 2, false);
  }

  syncCamera();
  paintTwiceThenReady();
}

function paintTwiceThenReady() {
  let count = 0;
  function paint() {
    requestAnimationFrame(paint);
    syncCamera();
    renderer.render(scene, camera);
    count += 1;
    if (count === 2) {
      window.__shotReady = true;
      frozen = true;
    }
  }
  requestAnimationFrame(paint);
}

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

syncCamera();
if (shot) {
  runShot(shot);
} else {
  requestAnimationFrame(renderFrame);
}
