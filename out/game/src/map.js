// map.js: Sector 9 tactical arena, geometry, lighting, colliders, and bot nav waypoints
import * as THREE from 'three';
import { PALETTE } from './palette.js';

export function createMap(scene) {
  const colliders = [];
  const shootables = [];

  // Lighting
  const ambient = new THREE.HemisphereLight(0xe8f0fb, 0x1a2230, 1.55);
  scene.add(ambient);

  const sun = new THREE.DirectionalLight(0xfff7e6, 2.2);
  sun.position.set(24, 45, 18);
  sun.castShadow = true;
  sun.shadow.mapSize.width = 2048;
  sun.shadow.mapSize.height = 2048;
  sun.shadow.camera.near = 0.5;
  sun.shadow.camera.far = 120;
  const d = 42;
  sun.shadow.camera.left = -d;
  sun.shadow.camera.right = d;
  sun.shadow.camera.top = d;
  sun.shadow.camera.bottom = -d;
  sun.shadow.bias = -0.0005;
  scene.add(sun);

  const fill = new THREE.DirectionalLight(0x93b4d8, 0.45);
  fill.position.set(-30, 22, -26);
  scene.add(fill);

  const warm = new THREE.PointLight(0xffb86b, 28, 55, 1.6);
  warm.position.set(0, 7.5, 0);
  scene.add(warm);

  // Reusable materials
  const floorMat = new THREE.MeshStandardMaterial({
    color: PALETTE.concrete,
    roughness: 0.85,
    metalness: 0.1,
  });
  const wallMat = new THREE.MeshStandardMaterial({
    color: PALETTE.metalPanel,
    roughness: 0.7,
    metalness: 0.25,
  });
  const crateMat = new THREE.MeshStandardMaterial({
    color: PALETTE.crateWood,
    roughness: 0.6,
    metalness: 0.15,
  });
  const trimMat = new THREE.MeshStandardMaterial({
    color: PALETTE.crateTrim,
    roughness: 0.5,
    metalness: 0.3,
  });
  const pillarMat = new THREE.MeshStandardMaterial({
    color: PALETTE.concreteLight,
    roughness: 0.8,
    metalness: 0.15,
  });

  // Main ground floor
  const floorGeo = new THREE.PlaneGeometry(80, 80);
  const floor = new THREE.Mesh(floorGeo, floorMat);
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  scene.add(floor);
  shootables.push(floor);

  // Helper function to build solid boxes with colliders
  function addBox(x, y, z, w, h, l, mat = wallMat, isShootable = true) {
    const geo = new THREE.BoxGeometry(w, h, l);
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(x, y + h / 2, z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    scene.add(mesh);
    if (isShootable) shootables.push(mesh);

    colliders.push(new THREE.Box3(
      new THREE.Vector3(x - w / 2, y, z - l / 2),
      new THREE.Vector3(x + w / 2, y + h, z + l / 2)
    ));
    return mesh;
  }

  // Outer boundary walls (Map bounds: [-35, 35] X, [-35, 35] Z)
  const WALL_H = 6;
  addBox(0, 0, -35, 70, WALL_H, 2); // North wall
  addBox(0, 0, 35, 70, WALL_H, 2);  // South wall
  addBox(-35, 0, 0, 2, WALL_H, 70); // West wall
  addBox(35, 0, 0, 2, WALL_H, 70);  // East wall

  // Internal tactical dividers creating CS-style 3-lane structure:
  // Lane 1: West corridor (A-Long / Site A)
  // Lane 2: Center Courtyard (Mid)
  // Lane 3: East Warehouse (B-Site / B-Short)

  // West Wall Divider with doorway
  addBox(-14, 0, -20, 2, WALL_H, 26);
  addBox(-14, 0, 16, 2, WALL_H, 34);
  // East Wall Divider with doorway
  addBox(14, 0, -18, 2, WALL_H, 30);
  addBox(14, 0, 18, 2, WALL_H, 30);

  // Central Arch Structure in Mid
  addBox(-6, 0, 0, 3, WALL_H, 14, pillarMat);
  addBox(6, 0, 0, 3, WALL_H, 14, pillarMat);
  addBox(0, WALL_H - 1.2, 0, 12, 1.2, 8, pillarMat, false); // Overhead beam

  // Bomb Site A (West Sector: centered around X: -24, Z: -18)
  const siteAPlatform = new THREE.Mesh(
    new THREE.CylinderGeometry(6, 6.2, 0.2, 16),
    new THREE.MeshStandardMaterial({
      color: 0x1f2937,
      emissive: PALETTE.siteA,
      emissiveIntensity: 0.15,
      roughness: 0.5,
    })
  );
  siteAPlatform.position.set(-24, 0.1, -18);
  siteAPlatform.receiveShadow = true;
  scene.add(siteAPlatform);
  shootables.push(siteAPlatform);

  // Site A Hologram ring beacon
  const ringAGeo = new THREE.RingGeometry(5.2, 5.6, 32);
  const ringAMat = new THREE.MeshBasicMaterial({
    color: PALETTE.siteA,
    side: THREE.DoubleSide,
    transparent: true,
    opacity: 0.8,
  });
  const ringA = new THREE.Mesh(ringAGeo, ringAMat);
  ringA.rotation.x = -Math.PI / 2;
  ringA.position.set(-24, 0.25, -18);
  scene.add(ringA);

  // Tactical cover crates at Site A
  addBox(-26, 0, -14, 2.4, 2.2, 2.4, crateMat);
  addBox(-26, 2.2, -14, 2.2, 1.8, 2.2, trimMat);
  addBox(-20, 0, -22, 2.8, 1.6, 1.8, crateMat);
  addBox(-30, 0, -20, 1.8, 2.4, 3.2, wallMat);

  // Bomb Site B (East Sector: centered around X: 24, Z: -18)
  const siteBPlatform = new THREE.Mesh(
    new THREE.BoxGeometry(11, 0.2, 11),
    new THREE.MeshStandardMaterial({
      color: 0x1f2937,
      emissive: PALETTE.siteB,
      emissiveIntensity: 0.15,
      roughness: 0.5,
    })
  );
  siteBPlatform.position.set(24, 0.1, -18);
  siteBPlatform.receiveShadow = true;
  scene.add(siteBPlatform);
  shootables.push(siteBPlatform);

  // Site B Hazard border
  const ringBGeo = new THREE.RingGeometry(5.0, 5.4, 4);
  const ringBMat = new THREE.MeshBasicMaterial({
    color: PALETTE.siteB,
    side: THREE.DoubleSide,
    transparent: true,
    opacity: 0.8,
  });
  const ringB = new THREE.Mesh(ringBGeo, ringBMat);
  ringB.rotation.x = -Math.PI / 2;
  ringB.rotation.z = Math.PI / 4;
  ringB.position.set(24, 0.25, -18);
  scene.add(ringB);

  // Tactical containers and crates at Site B
  addBox(22, 0, -23, 3.2, 2.8, 5.0, wallMat);
  addBox(28, 0, -13, 2.2, 2.0, 2.2, crateMat);
  addBox(18, 0, -14, 2.0, 1.8, 2.0, trimMat);

  // Mid cover crates
  addBox(-2, 0, -10, 2.2, 1.8, 2.2, crateMat);
  addBox(2, 0, 8, 2.2, 1.8, 2.2, crateMat);

  // Navigation Waypoints for AI Bot pathfinding
  const waypoints = {
    // Attackers spawn at South (Z: +26)
    attackerSpawn: [
      new THREE.Vector3(-4, 0, 26),
      new THREE.Vector3(0, 0, 26),
      new THREE.Vector3(4, 0, 26),
    ],
    // Defenders spawn at North (Z: -28)
    defenderSpawn: [
      new THREE.Vector3(-2, 0, -28),
      new THREE.Vector3(2, 0, -28),
    ],
    // Route to Site A through A-Long lane
    routeALong: [
      new THREE.Vector3(-6, 0, 24),
      new THREE.Vector3(-24, 0, 22),
      new THREE.Vector3(-24, 0, 4),
      new THREE.Vector3(-24, 0, -10),
      new THREE.Vector3(-24, 0, -18), // Site A
    ],
    // Route to Site A through Mid
    routeMidToA: [
      new THREE.Vector3(0, 0, 18),
      new THREE.Vector3(0, 0, 2),
      new THREE.Vector3(-10, 0, -4),
      new THREE.Vector3(-20, 0, -8),
      new THREE.Vector3(-24, 0, -18), // Site A
    ],
    // Route to Site B through B-Alley
    routeBAlley: [
      new THREE.Vector3(6, 0, 24),
      new THREE.Vector3(24, 0, 22),
      new THREE.Vector3(24, 0, 4),
      new THREE.Vector3(24, 0, -10),
      new THREE.Vector3(24, 0, -18), // Site B
    ],
    // Route to Site B through Mid
    routeMidToB: [
      new THREE.Vector3(0, 0, 18),
      new THREE.Vector3(0, 0, -2),
      new THREE.Vector3(8, 0, -6),
      new THREE.Vector3(18, 0, -10),
      new THREE.Vector3(24, 0, -18), // Site B
    ],
  };

  return {
    colliders,
    shootables,
    waypoints,
    siteAPosition: new THREE.Vector3(-24, 0, -18),
    siteBPosition: new THREE.Vector3(24, 0, -18),
  };
}
