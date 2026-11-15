export function createInput(canvas, onLockChange) {
  const state = {
    keys: new Set(),
    firing: false,
    locked: false,
  };

  const lookDelta = { x: 0, y: 0 };

  window.addEventListener('keydown', (e) => {
    state.keys.add(e.code);
  });

  window.addEventListener('keyup', (e) => {
    state.keys.delete(e.code);
  });

  if (canvas) {
    canvas.addEventListener('mousedown', (e) => {
      if (e.button === 0) {
        state.firing = true;
      }
    });

    canvas.addEventListener('mouseup', (e) => {
      if (e.button === 0) {
        state.firing = false;
      }
    });
  }

  window.addEventListener('mouseup', (e) => {
    if (e.button === 0) {
      state.firing = false;
    }
  });

  document.addEventListener('pointerlockchange', () => {
    state.locked = document.pointerLockElement === canvas;
    if (typeof onLockChange === 'function') {
      onLockChange(state.locked);
    }
  });

  window.addEventListener('mousemove', (e) => {
    if (state.locked) {
      lookDelta.x += e.movementX || 0;
      lookDelta.y += e.movementY || 0;
    }
  });

  function requestLock() {
    if (canvas && typeof canvas.requestPointerLock === 'function') {
      canvas.requestPointerLock();
    }
  }

  function takeLook() {
    const x = lookDelta.x;
    const y = lookDelta.y;
    lookDelta.x = 0;
    lookDelta.y = 0;
    return { x, y };
  }

  return {
    state,
    requestLock,
    takeLook,
  };
}
