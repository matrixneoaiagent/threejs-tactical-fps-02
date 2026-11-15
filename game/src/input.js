// input.js: PointerLock, mouse look, and keyboard input tracking

export function createInput(canvas, onLockChange) {
  const keys = new Set();
  let firing = false;
  let lookDeltaX = 0;
  let lookDeltaY = 0;

  function onKeyDown(e) {
    keys.add(e.code);
  }

  function onKeyUp(e) {
    keys.delete(e.code);
  }

  function onMouseDown(e) {
    if (e.button === 0) firing = true;
  }

  function onMouseUp(e) {
    if (e.button === 0) firing = false;
  }

  function onMouseMove(e) {
    if (document.pointerLockElement === canvas) {
      lookDeltaX += e.movementX;
      lookDeltaY += e.movementY;
    }
  }

  function onPointerLockChange() {
    const locked = document.pointerLockElement === canvas;
    if (onLockChange) onLockChange(locked);
  }

  window.addEventListener('keydown', onKeyDown);
  window.addEventListener('keyup', onKeyUp);
  window.addEventListener('mousedown', onMouseDown);
  window.addEventListener('mouseup', onMouseUp);
  window.addEventListener('mousemove', onMouseMove);
  document.addEventListener('pointerlockchange', onPointerLockChange);

  function requestLock() {
    canvas.requestPointerLock();
  }

  function takeLook() {
    const dx = lookDeltaX;
    const dy = lookDeltaY;
    lookDeltaX = 0;
    lookDeltaY = 0;
    return { x: dx, y: dy };
  }

  return {
    state: {
      keys,
      get firing() { return firing; },
      set firing(val) { firing = val; },
    },
    takeLook,
    requestLock,
  };
}
