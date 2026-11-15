// player.js: First-person player physics, crouching, mouse look, collision and recoil
import * as THREE from 'three';

export function createPlayer(colliders) {
  const EYE_STAND = 1.7;
  const EYE_CROUCH = 1.05;
  const PLAYER_RADIUS = 0.45;
  const PLAYER_HEIGHT = 1.8;
  const CROUCH_HEIGHT = 1.2;
  const MOUSE_SENS = 0.0022;
  const PITCH_CLAMP = 1.45;
  const MAX_STAND_SPEED = 5.8;
  const MAX_CROUCH_SPEED = 2.8;
  const ACCEL_GROUND = 45;
  const ACCEL_CROUCH = 25;
  const ACCEL_AIR = 8;
  const FRICTION = 12;
  const JUMP_VELOCITY = 5.2;
  const GRAVITY = 18.0;

  const state = {
    position: new THREE.Vector3(0, 0, -26), // Defender spawn
    velocity: new THREE.Vector3(0, 0, 0),
    eyeHeight: EYE_STAND,
    targetEyeHeight: EYE_STAND,
    yaw: Math.PI, // Facing south towards Mid
    pitch: 0,
    recoilPitch: 0,
    recoilYaw: 0,
    targetRecoilPitch: 0,
    targetRecoilYaw: 0,
    isGrounded: true,
    isCrouching: false,
    hp: 100,
    armor: 100,
    alive: true,
  };

  const tempBox = new THREE.Box3();
  const moveVec = new THREE.Vector3();

  function look(dx, dy) {
    if (!state.alive) return;
    state.yaw -= dx * MOUSE_SENS;
    state.pitch -= dy * MOUSE_SENS;
    state.pitch = Math.max(-PITCH_CLAMP, Math.min(PITCH_CLAMP, state.pitch));
  }

  function addRecoil(pitchKick, yawKick) {
    state.targetRecoilPitch += pitchKick;
    state.targetRecoilYaw += yawKick;
  }

  function applyDamage(amount) {
    if (!state.alive) return;
    let actualDamage = amount;
    if (state.armor > 0) {
      const absorbed = amount * 0.5;
      state.armor = Math.max(0, state.armor - absorbed);
      actualDamage = amount - absorbed;
    }
    state.hp = Math.max(0, state.hp - actualDamage);
    if (state.hp <= 0) {
      state.alive = false;
      state.targetEyeHeight = 0.3; // Fall down on death
    }
  }

  function groundSpeed() {
    return Math.hypot(state.velocity.x, state.velocity.z);
  }

  function checkCollision(pos) {
    const minH = state.isCrouching ? CROUCH_HEIGHT : PLAYER_HEIGHT;
    tempBox.min.set(pos.x - PLAYER_RADIUS, pos.y, pos.z - PLAYER_RADIUS);
    tempBox.max.set(pos.x + PLAYER_RADIUS, pos.y + minH, pos.z + PLAYER_RADIUS);

    if (colliders && colliders.length > 0) {
      for (let i = 0; i < colliders.length; i += 1) {
        if (tempBox.intersectsBox(colliders[i])) return true;
      }
    }
    return false;
  }

  function step(dt, keys) {
    // Crouch input & smooth eye height interpolation
    state.isCrouching = keys.has('ControlLeft') || keys.has('ControlRight') || keys.has('KeyC');
    state.targetEyeHeight = state.alive ? (state.isCrouching ? EYE_CROUCH : EYE_STAND) : 0.3;
    state.eyeHeight += (state.targetEyeHeight - state.eyeHeight) * Math.min(1, dt * 14);

    // Dynamic recoil spring recovery
    state.recoilPitch += (state.targetRecoilPitch - state.recoilPitch) * Math.min(1, dt * 25);
    state.recoilYaw += (state.targetRecoilYaw - state.recoilYaw) * Math.min(1, dt * 25);
    state.targetRecoilPitch *= Math.max(0, 1 - dt * 10);
    state.targetRecoilYaw *= Math.max(0, 1 - dt * 10);

    if (!state.alive) {
      return;
    }

    // Input direction in camera space
    moveVec.set(0, 0, 0);
    if (keys.has('KeyW')) moveVec.z -= 1;
    if (keys.has('KeyS')) moveVec.z += 1;
    if (keys.has('KeyA')) moveVec.x -= 1;
    if (keys.has('KeyD')) moveVec.x += 1;

    const maxSpeed = state.isCrouching ? MAX_CROUCH_SPEED : MAX_STAND_SPEED;
    const accel = state.isGrounded ? (state.isCrouching ? ACCEL_CROUCH : ACCEL_GROUND) : ACCEL_AIR;

    if (moveVec.lengthSq() > 0) {
      moveVec.normalize();
      // Rotate by yaw
      const cosY = Math.cos(state.yaw);
      const sinY = Math.sin(state.yaw);
      const worldX = moveVec.x * cosY + moveVec.z * sinY;
      const worldZ = -moveVec.x * sinY + moveVec.z * cosY;

      state.velocity.x += worldX * accel * dt;
      state.velocity.z += worldZ * accel * dt;

      const currentHorizontalSpeed = groundSpeed();
      if (currentHorizontalSpeed > maxSpeed) {
        const scale = maxSpeed / currentHorizontalSpeed;
        state.velocity.x *= scale;
        state.velocity.z *= scale;
      }
    } else if (state.isGrounded) {
      // Ground friction damping
      const drop = FRICTION * dt;
      state.velocity.x *= Math.max(0, 1 - drop);
      state.velocity.z *= Math.max(0, 1 - drop);
    }

    // Jump & Gravity
    if (keys.has('Space') && state.isGrounded && !state.isCrouching) {
      state.velocity.y = JUMP_VELOCITY;
      state.isGrounded = false;
    }
    state.velocity.y -= GRAVITY * dt;

    // Resolve X motion with wall sliding
    const nextX = state.position.clone();
    nextX.x += state.velocity.x * dt;
    if (!checkCollision(nextX)) {
      state.position.x = nextX.x;
    } else {
      state.velocity.x = 0;
    }

    // Resolve Z motion with wall sliding
    const nextZ = state.position.clone();
    nextZ.z += state.velocity.z * dt;
    if (!checkCollision(nextZ)) {
      state.position.z = nextZ.z;
    } else {
      state.velocity.z = 0;
    }

    // Resolve Y motion & ground clamping
    state.position.y += state.velocity.y * dt;
    if (state.position.y <= 0) {
      state.position.y = 0;
      state.velocity.y = 0;
      state.isGrounded = true;
    }
  }

  function reset(spawnPos = new THREE.Vector3(0, 0, -26)) {
    state.position.copy(spawnPos);
    state.velocity.set(0, 0, 0);
    state.yaw = Math.PI;
    state.pitch = 0;
    state.recoilPitch = 0;
    state.recoilYaw = 0;
    state.targetRecoilPitch = 0;
    state.targetRecoilYaw = 0;
    state.eyeHeight = EYE_STAND;
    state.targetEyeHeight = EYE_STAND;
    state.isGrounded = true;
    state.isCrouching = false;
    state.hp = 100;
    state.armor = 100;
    state.alive = true;
  }

  return {
    state,
    look,
    step,
    reset,
    addRecoil,
    applyDamage,
    groundSpeed,
  };
}
