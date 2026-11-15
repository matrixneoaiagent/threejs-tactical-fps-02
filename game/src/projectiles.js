// projectiles.js: Tactical grenades (Frag and Smoke) with bounce physics and detonation effects
import * as THREE from 'three';
import { PALETTE } from './palette.js';
import { audio } from './audio.js';

export function createProjectileSystem(scene, colliders) {
  const activeGrenades = [];
  const activeSmokes = [];

  const fragGeo = new THREE.DodecahedronGeometry(0.12);
  const fragMat = new THREE.MeshStandardMaterial({ color: 0x2e382b, roughness: 0.5, metalness: 0.6 });

  const smokeGeo = new THREE.SphereGeometry(3.6, 16, 16);
  const smokeMat = new THREE.MeshBasicMaterial({
    color: PALETTE.smokeGrey,
    transparent: true,
    opacity: 0.75,
    depthWrite: false,
  });

  function throwGrenade(origin, direction, type = 'frag') {
    const mesh = new THREE.Mesh(fragGeo, fragMat);
    mesh.position.copy(origin);
    mesh.castShadow = true;
    scene.add(mesh);

    const speed = 18;
    const grenade = {
      mesh,
      type,
      position: mesh.position,
      velocity: direction.clone().multiplyScalar(speed).add(new THREE.Vector3(0, 3, 0)),
      timer: 1.8,
      bounces: 0,
      radius: 0.15,
    };
    activeGrenades.push(grenade);
  }

  function deploySmoke(pos) {
    const mesh = new THREE.Mesh(smokeGeo, smokeMat);
    mesh.position.copy(pos);
    mesh.position.y = 2.0;
    scene.add(mesh);
    activeSmokes.push({
      mesh,
      position: mesh.position,
      radius: 3.6,
      timer: 14.0, // 14s smoke duration
    });
  }

  function checkCollision(pos, radius) {
    const box = new THREE.Box3(
      new THREE.Vector3(pos.x - radius, pos.y - radius, pos.z - radius),
      new THREE.Vector3(pos.x + radius, pos.y + radius, pos.z + radius)
    );
    for (let i = 0; i < colliders.length; i += 1) {
      if (box.intersectsBox(colliders[i])) return colliders[i];
    }
    return null;
  }

  function step(dt, bots, player, onGrenadeExplode) {
    for (let i = activeGrenades.length - 1; i >= 0; i -= 1) {
      const g = activeGrenades[i];
      g.timer -= dt;

      // Gravity
      g.velocity.y -= 19.6 * dt;

      // Next position
      const nextPos = g.position.clone().addScaledVector(g.velocity, dt);

      // Floor bounce
      if (nextPos.y <= g.radius) {
        nextPos.y = g.radius;
        g.velocity.y = -g.velocity.y * 0.45;
        g.velocity.x *= 0.75;
        g.velocity.z *= 0.75;
      }

      // Wall collision bounce
      const hitBox = checkCollision(nextPos, g.radius);
      if (hitBox) {
        g.velocity.x = -g.velocity.x * 0.5;
        g.velocity.z = -g.velocity.z * 0.5;
      } else {
        g.position.copy(nextPos);
      }

      if (g.timer <= 0) {
        // Detonate
        scene.remove(g.mesh);
        activeGrenades.splice(i, 1);

        if (g.type === 'frag') {
          audio.playExplosion();
          // AOE damage within 7m
          const blastRadius = 7.0;
          // Check player distance
          const pDist = g.position.distanceTo(player.state.position);
          if (pDist < blastRadius) {
            const dmg = Math.round(85 * (1 - pDist / blastRadius));
            player.applyDamage(dmg);
          }
          // Check bots distance
          for (let b = 0; b < bots.length; b += 1) {
            if (!bots[b].alive) continue;
            const bDist = g.position.distanceTo(bots[b].position);
            if (bDist < blastRadius) {
              const dmg = Math.round(95 * (1 - bDist / blastRadius));
              bots[b].applyDamage(dmg, 'torso');
            }
          }
          if (onGrenadeExplode) onGrenadeExplode(g.position);
        } else if (g.type === 'smoke') {
          deploySmoke(g.position);
        }
      }
    }

    // Step active smoke clouds
    for (let s = activeSmokes.length - 1; s >= 0; s -= 1) {
      const smk = activeSmokes[s];
      smk.timer -= dt;
      if (smk.timer <= 0) {
        scene.remove(smk.mesh);
        activeSmokes.splice(s, 1);
      }
    }
  }

  function isLineBlockedBySmoke(from, to) {
    const line = new THREE.Line3(from, to);
    for (let i = 0; i < activeSmokes.length; i += 1) {
      const s = activeSmokes[i];
      const closestPoint = new THREE.Vector3();
      line.closestPointToPoint(s.position, true, closestPoint);
      if (closestPoint.distanceTo(s.position) < s.radius * 0.9) {
        return true;
      }
    }
    return false;
  }

  function reset() {
    for (let i = 0; i < activeGrenades.length; i += 1) scene.remove(activeGrenades[i].mesh);
    activeGrenades.length = 0;
    for (let s = 0; s < activeSmokes.length; s += 1) scene.remove(activeSmokes[s].mesh);
    activeSmokes.length = 0;
  }

  return {
    throwGrenade,
    step,
    reset,
    isLineBlockedBySmoke,
  };
}
