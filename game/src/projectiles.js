import * as THREE from 'three';
import { audio } from './audio.js';

export function createProjectileSystem(scene, colliders = []) {
  const grenades = [];
  const clouds = [];
  const tempBox = new THREE.Box3();

  function checkCollision(pos) {
    tempBox.min.set(pos.x - 0.12, pos.y - 0.12, pos.z - 0.12);
    tempBox.max.set(pos.x + 0.12, pos.y + 0.12, pos.z + 0.12);
    for (let i = 0; i < colliders.length; i += 1) {
      if (tempBox.intersectsBox(colliders[i])) {
        return true;
      }
    }
    return false;
  }

  function throwGrenade(origin, direction, type = 'frag') {
    const geo = new THREE.SphereGeometry(0.12, 10, 10);
    const mat = new THREE.MeshStandardMaterial({
      color: type === 'frag' ? 0x3d5a35 : 0x64748b,
      roughness: 0.5,
      metalness: 0.4,
    });
    const mesh = new THREE.Mesh(geo, mat);
    const spawnPos = origin.clone().addScaledVector(direction, 0.4);
    mesh.position.copy(spawnPos);
    mesh.castShadow = true;
    scene.add(mesh);

    const velocity = direction.clone().multiplyScalar(17).add(new THREE.Vector3(0, 3.5, 0));

    grenades.push({
      mesh,
      velocity,
      type,
      fuse: 2.5,
    });
  }

  function step(dt, bots = [], player = null, onExplode = null) {
    // Step grenades
    for (let i = grenades.length - 1; i >= 0; i -= 1) {
      const g = grenades[i];
      g.fuse -= dt;
      g.velocity.y -= 18.0 * dt;

      // X motion
      const nextX = g.mesh.position.clone();
      nextX.x += g.velocity.x * dt;
      if (!checkCollision(nextX)) {
        g.mesh.position.x = nextX.x;
      } else {
        g.velocity.x *= -0.55;
      }

      // Z motion
      const nextZ = g.mesh.position.clone();
      nextZ.z += g.velocity.z * dt;
      if (!checkCollision(nextZ)) {
        g.mesh.position.z = nextZ.z;
      } else {
        g.velocity.z *= -0.55;
      }

      // Y motion
      g.mesh.position.y += g.velocity.y * dt;
      if (g.mesh.position.y <= 0.12) {
        g.mesh.position.y = 0.12;
        g.velocity.y *= -0.45;
        g.velocity.x *= 0.75;
        g.velocity.z *= 0.75;
      } else if (checkCollision(g.mesh.position)) {
        g.velocity.y *= -0.45;
      }

      // Detonation
      if (g.fuse <= 0) {
        const explodePos = g.mesh.position.clone();
        scene.remove(g.mesh);
        grenades.splice(i, 1);

        audio.playExplosion();

        if (g.type === 'frag') {
          const RADIUS = 7.0;
          const MAX_DMG = 85;

          if (player && player.state && player.state.alive) {
            const distP = explodePos.distanceTo(player.state.position);
            if (distP < RADIUS) {
              const dmg = Math.round((1 - distP / RADIUS) * MAX_DMG);
              player.applyDamage(dmg);
            }
          }

          for (let b = 0; b < bots.length; b += 1) {
            const bot = bots[b];
            if (bot && bot.alive) {
              const distB = explodePos.distanceTo(bot.position);
              if (distB < RADIUS) {
                const dmg = Math.round((1 - distB / RADIUS) * MAX_DMG);
                bot.applyDamage(dmg, 'torso');
              }
            }
          }
        } else if (g.type === 'smoke') {
          const cloudRadius = 4.4;
          const cloudGeo = new THREE.SphereGeometry(cloudRadius, 14, 14);
          const cloudMat = new THREE.MeshStandardMaterial({
            color: 0x94a3b8,
            transparent: true,
            opacity: 0.85,
            roughness: 0.9,
            depthWrite: false,
          });
          const cloudMesh = new THREE.Mesh(cloudGeo, cloudMat);
          cloudMesh.position.set(explodePos.x, Math.max(1.4, explodePos.y), explodePos.z);
          scene.add(cloudMesh);

          clouds.push({
            mesh: cloudMesh,
            position: cloudMesh.position.clone(),
            radius: cloudRadius,
            life: 14.0,
            maxLife: 14.0,
          });
        }

        if (typeof onExplode === 'function') {
          onExplode(explodePos);
        }
      }
    }

    // Step smoke clouds
    for (let c = clouds.length - 1; c >= 0; c -= 1) {
      const cloud = clouds[c];
      cloud.life -= dt;
      if (cloud.life <= 2.5) {
        cloud.mesh.material.opacity = Math.max(0, (cloud.life / 2.5) * 0.85);
      }
      if (cloud.life <= 0) {
        scene.remove(cloud.mesh);
        clouds.splice(c, 1);
      }
    }
  }

  function isLineBlockedBySmoke(p1, p2) {
    if (clouds.length === 0) return false;
    const seg = new THREE.Vector3().subVectors(p2, p1);
    const segLenSq = seg.lengthSq();

    for (let i = 0; i < clouds.length; i += 1) {
      const cloud = clouds[i];
      if (segLenSq === 0) {
        if (p1.distanceTo(cloud.position) < cloud.radius) return true;
        continue;
      }
      const t = Math.max(0, Math.min(1, new THREE.Vector3().subVectors(cloud.position, p1).dot(seg) / segLenSq));
      const proj = new THREE.Vector3().copy(p1).addScaledVector(seg, t);
      if (proj.distanceTo(cloud.position) < cloud.radius) {
        return true;
      }
    }
    return false;
  }

  function reset() {
    for (let i = 0; i < grenades.length; i += 1) {
      scene.remove(grenades[i].mesh);
    }
    grenades.length = 0;

    for (let i = 0; i < clouds.length; i += 1) {
      scene.remove(clouds[i].mesh);
    }
    clouds.length = 0;
  }

  return {
    throwGrenade,
    step,
    reset,
    isLineBlockedBySmoke,
  };
}
