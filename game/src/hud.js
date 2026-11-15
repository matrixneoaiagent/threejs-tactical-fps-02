// hud.js: Tactical HUD management, dynamic crosshair bloom, hitmarker, killfeed, and buy menu
import { PALETTE } from './palette.js';

export function createHud() {
  const elHp = document.getElementById('hud-hp');
  const elHpBar = document.getElementById('hud-hp-bar');
  const elArmor = document.getElementById('hud-armor');
  const elArmorBar = document.getElementById('hud-armor-bar');
  const elMag = document.getElementById('ammo-mag');
  const elReserve = document.getElementById('ammo-reserve');
  const elWeaponName = document.getElementById('hud-weapon-name');
  const elTimer = document.getElementById('hud-timer');
  const elScoreVan = document.getElementById('score-vanguard');
  const elScoreSyn = document.getElementById('score-syndicate');
  const elCash = document.getElementById('hud-cash');
  const elCrosshair = document.getElementById('crosshair');
  const elHitmarker = document.getElementById('hitmarker');
  const elDefuseBar = document.getElementById('defuse-progress');
  const elDefusePrompt = document.getElementById('defuse-prompt');
  const elKillFeed = document.getElementById('kill-feed');
  const elBuyMenu = document.getElementById('buy-menu');
  const elBanner = document.getElementById('round-banner');
  const elBannerTitle = document.getElementById('banner-title');
  const elBannerSub = document.getElementById('banner-sub');
  const elGrenades = document.getElementById('hud-grenades');

  let hitTimer = 0;
  let buyOpen = false;

  function updateStatus(hp, armor, cash, hasDefuseKit) {
    if (elHp) elHp.textContent = Math.max(0, Math.ceil(hp));
    if (elHpBar) elHpBar.style.width = `${Math.max(0, Math.min(100, hp))}%`;
    if (elArmor) elArmor.textContent = Math.max(0, Math.ceil(armor));
    if (elArmorBar) elArmorBar.style.width = `${Math.max(0, Math.min(100, armor))}%`;
    if (elCash) elCash.textContent = `$${cash}`;
    const defuseIcon = document.getElementById('hud-defuse-kit');
    if (defuseIcon) defuseIcon.style.display = hasDefuseKit ? 'inline-block' : 'none';
  }

  function updateWeapon(weaponName, mag, reserve, frags, smokes) {
    if (elMag) elMag.textContent = mag;
    if (elReserve) elReserve.textContent = `/ ${reserve}`;
    if (elWeaponName) elWeaponName.textContent = weaponName.toUpperCase();
    if (elGrenades) elGrenades.textContent = `HE: ${frags} | SMK: ${smokes}`;
  }

  function updateTimeAndScore(secondsRemaining, scoreVan, scoreSyn, spikePlanted = false, spikeSite = '') {
    if (elTimer) {
      if (spikePlanted) {
        elTimer.textContent = `SPIKE [${spikeSite}]: ${secondsRemaining}s`;
        elTimer.style.color = '#ef4444';
      } else {
        const m = Math.floor(secondsRemaining / 60);
        const s = Math.floor(secondsRemaining % 60);
        elTimer.textContent = `${m}:${s < 10 ? '0' : ''}${s}`;
        elTimer.style.color = 'var(--ink)';
      }
    }
    if (elScoreVan) elScoreVan.textContent = scoreVan;
    if (elScoreSyn) elScoreSyn.textContent = scoreSyn;
  }

  function setCrosshairSpread(spread) {
    if (!elCrosshair) return;
    const gap = Math.round(Math.min(32, spread * 650));
    elCrosshair.style.setProperty('--gap', `${gap}px`);
  }

  function showHitmarker(isHeadshot = false) {
    if (!elHitmarker) return;
    elHitmarker.className = isHeadshot ? 'headshot on' : 'on';
    clearTimeout(hitTimer);
    hitTimer = setTimeout(() => {
      elHitmarker.className = '';
    }, 120);
  }

  function addKillEvent(killer, victim, weapon, isHeadshot) {
    if (!elKillFeed) return;
    const item = document.createElement('div');
    item.className = 'kill-item';
    item.innerHTML = `<b>${killer}</b> <span class="weapon">${weapon}</span> ${isHeadshot ? '<span class="hs">⚡</span>' : ''} <b>${victim}</b>`;
    elKillFeed.appendChild(item);
    setTimeout(() => {
      if (item.parentNode) item.parentNode.removeChild(item);
    }, 4500);
  }

  function setDefuseProgress(ratio) {
    if (ratio > 0) {
      if (elDefusePrompt) elDefusePrompt.style.display = 'block';
      if (elDefuseBar) elDefuseBar.style.width = `${Math.min(100, ratio * 100)}%`;
    } else {
      if (elDefusePrompt) elDefusePrompt.style.display = 'none';
    }
  }

  function showBanner(title, subtitle, duration = 3000) {
    if (!elBanner) return;
    if (elBannerTitle) elBannerTitle.textContent = title;
    if (elBannerSub) elBannerSub.textContent = subtitle;
    elBanner.removeAttribute('hidden');
    setTimeout(() => {
      elBanner.setAttribute('hidden', '');
    }, duration);
  }

  function toggleBuyMenu(onBuyCallback) {
    buyOpen = !buyOpen;
    if (elBuyMenu) {
      if (buyOpen) elBuyMenu.removeAttribute('hidden');
      else elBuyMenu.setAttribute('hidden', '');
    }
    return buyOpen;
  }

  function isBuyOpen() {
    return buyOpen;
  }

  return {
    updateStatus,
    updateWeapon,
    updateTimeAndScore,
    setCrosshairSpread,
    showHitmarker,
    addKillEvent,
    setDefuseProgress,
    showBanner,
    toggleBuyMenu,
    isBuyOpen,
  };
}
