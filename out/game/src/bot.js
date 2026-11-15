// bot.js: Tactical AI bots, FSM decision making, route navigation, and hitbox detection
import * as THREE from 'three';
import { PALETTE } from './palette.js';
import { audio } from './audio.js';

export function createBotManager(scene, colliders) {
  const bots = [];
  const hitMeshes = [];

  // Team materials
  const synMat = new THREE.MeshStandardMaterial({ color: 0x272c35, roughness: 0.6, metalness: 0.3 });
  const synAccent = new THREE.MeshStandardMaterial({ color: PALETTE.syndicateRed, roughness: 0.4, metalness: 0.2 });
  const vanAccent = new THREE.MeshStandardMaterial({ color: PALETTE.vanguardBlue, roughness: 0.4, metalness: 0.2 });
  const skinMat = new THREE.MeshStandardMaterial({ color: 0xc89d7c, roughness: 0.7 });
  const gunMat = new THREE.MeshStandardMaterial({ color: 0x111317, roughness: 0.3, metalness: 0.8 });

  function spawnBot(id, team, spawnPos, waypoints, routeName = 'routeALong') {
    const group = new THREE.Group();
    group.position.copy(spawnPos);
    scene.add(group);

    const isAttacker = team === 'attacker';
    const accentMat = isAttacker ? synAccent : vanAccent;

    // Torso (Hitbox: 'torso')
    const torsoGeo = new THREE.BoxGeometry(0.55, 0.7, 0.32);
    const torsoMesh = new THREE.Mesh(torsoGeo, accentMat);
    torsoMesh.position.set(0, 1.05, 0);
    torsoMesh.castShadow = true;
    group.add(torsoMesh);

    // Head (Hitbox: 'head')
    const headGeo = new THREE.SphereGeometry(0.18, 12, 12);
    const headMesh = new THREE.Mesh(headGeo, skinMat);
    headMesh.position.set(0, 1.62, 0);
    headMesh.castShadow = true;
    group.add(headMesh);

    // Helmet
    const helmGeo = new THREE.CylinderGeometry(0.2, 0.22, 0.16, 12);
    const helmMesh = new THREE.Mesh(helmGeo, synMat);
    helmMesh.position.set(0, 1.68, 0);
    helmMesh.castShadow = true;
    group.add(helmMesh);

    // Legs (Hitbox: 'legs')
    const legLGeo = new THREE.BoxGeometry(0.2, 0.7, 0.2);
    const legLMesh = new THREE.Mesh(legLGeo, synMat);
    legLMesh.position.set(-0.16, 0.35, 0);
    legLMesh.castShadow = true;
    group.add(legLMesh);

    const legRMesh = new THREE.Mesh(legLGeo, synMat);
    legRMesh.position.set(0.16, 0.35, 0);
    legRMesh.castShadow = true;
    group.add(legRMesh);

    // Weapon in hand
    const gunGeo = new THREE.BoxGeometry(0.06, 0.08, 0.45);
    const botGun = new THREE.Mesh(gunGeo, gunMat);
    botGun.position.set(0.26, 1.05, 0.28);
    group.add(botGun);

    const botObj = {
      id,
      team,
      isAttacker,
      group,
      position: group.position,
      rotation: group.rotation,
      hp: 100,
      alive: true,
      state: 'ADVANCE', // ADVANCE, HOLD_COVER, ENGAGE, PLANTING
      route: waypoints[routeName] ? [...waypoints[routeName]] : [],
      waypointIdx: 0,
      targetEntity: null,
      aimDirection: new THREE.Vector3(0, 0, -1),
      reactionTimer: 0.3,
      burstTimer: 0,
      shotsFired: 0,
      burstDelay: 0.12,
      hasSpike: isAttacker && id === 'bot_attacker_1',
      plantingTimer: 0,
      headMesh,
      torsoMesh,
      legLMesh,
      legRMesh,
      applyDamage: null,
    };

    // Attach metadata for raycaster hit registration
    const botMeshes = [headMesh, torsoMesh, legLMesh, legRMesh];
    headMesh.userData = { bot: botObj, part: 'head' };
    torsoMesh.userData = { bot: botObj, part: 'torso' };
    legLMesh.userData = { bot: botObj, part: 'legs' };
    legRMesh.userData = { bot: botObj, part: 'legs' };
    hitMeshes.push(...botMeshes);

    botObj.applyDamage = function (dmg, part) {
      if (!botObj.alive) return false;
      const mult = part === 'head' ? 3.5 : (part === 'legs' ? 0.75 : 1.0);
      const total = Math.round(dmg * mult);
      botObj.hp -= total;
      audio.playHitSound(part === 'head');

      if (botObj.hp <= 0) {
        botObj.alive = false;
        botObj.group.rotation.x = -Math.PI / 2;
        botObj.group.position.y = 0.2;
        return true; // Killed
      }
      return false;
    };

    bots.push(botObj);
    return botObj;
  }

  function step(dt, player, random, projectileSystem, onBotShot, onSpikePlanted) {
    for (let i = 0; i < bots.length; i += 1) {
      const bot = bots[i];
      if (!bot.alive) continue;

      // Line of sight check to player
      const canSeePlayer = player.state.alive && !projectileSystem.isLineBlockedBySmoke(bot.position, player.state.position);
      const distToPlayer = bot.position.distanceTo(player.state.position);

      if (canSeePlayer && distToPlayer < 38) {
        // Face player
        const dx = player.state.position.x - bot.position.x;
        const dz = player.state.position.z - bot.position.z;
        const targetYaw = Math.atan2(dx, dz);
        bot.group.rotation.y = targetYaw;

        bot.state = 'ENGAGE';
        bot.burstTimer -= dt;
        if (bot.burstTimer <= 0) {
          bot.burstTimer = 0.15 + random() * 0.1;
          audio.playGunshot(1.2);
          if (onBotShot) onBotShot(bot, player);

          // Aim error
          const hitChance = distToPlayer < 12 ? 0.65 : 0.35;
          if (random() < hitChance) {
            player.applyDamage(18 + Math.round(random() * 8));
          }
        }
      } else {
        // Traversal along route
        if (bot.route.length > 0 && bot.waypointIdx < bot.route.length) {
          const wp = bot.route[bot.waypointIdx];
          const dist = bot.position.distanceTo(wp);

          if (dist < 1.2) {
            bot.waypointIdx += 1;
            if (bot.waypointIdx >= bot.route.length) {
              if (bot.hasSpike && bot.isAttacker) {
                bot.state = 'PLANTING';
              } else {
                bot.state = 'HOLD_COVER';
              }
            }
          } else {
            const dir = wp.clone().sub(bot.position).normalize();
            const moveSpeed = 3.6;
            bot.position.addScaledVector(dir, moveSpeed * dt);
            bot.group.rotation.y = Math.atan2(dir.x, dir.z);
          }
        }

        // Bomb planting logic
        if (bot.state === 'PLANTING' && bot.hasSpike) {
          bot.plantingTimer += dt;
          if (bot.plantingTimer >= 3.5) {
            bot.hasSpike = false;
            bot.state = 'HOLD_COVER';
            if (onSpikePlanted) onSpikePlanted(bot.position.clone());
          }
        }
      }
    }
  }

  function resetAll() {
    for (let i = 0; i < bots.length; i += 1) {
      scene.remove(bots[i].group);
    }
    bots.length = 0;
    hitMeshes.length = 0;
  }

  return {
    bots,
    hitMeshes,
    spawnBot,
    step,
    resetAll,
  };
}
