// Tactical HUD controller and DOM state updates
export function createHud() {
  let bannerTimeout = null;
  let hitmarkerTimeout = null;
  let lastToggleTime = 0;

  function updateStatus(hp, armor, cash, hasKit) {
    const hpEl = document.getElementById('hud-hp');
    if (hpEl) hpEl.textContent = String(Math.max(0, Math.round(hp ?? 0)));

    const hpBar = document.getElementById('hud-hp-bar');
    if (hpBar) hpBar.style.width = `${Math.max(0, Math.min(100, hp ?? 0))}%`;

    const armorEl = document.getElementById('hud-armor');
    if (armorEl) armorEl.textContent = String(Math.max(0, Math.round(armor ?? 0)));

    const armorBar = document.getElementById('hud-armor-bar');
    if (armorBar) armorBar.style.width = `${Math.max(0, Math.min(100, armor ?? 0))}%`;

    const cashEl = document.getElementById('hud-cash');
    if (cashEl) cashEl.textContent = `$${(cash ?? 0).toLocaleString()}`;

    const kitEl = document.getElementById('hud-defuse-kit');
    if (kitEl) kitEl.style.display = hasKit ? 'block' : 'none';
  }

  function updateWeapon(name, mag, reserve, frags, smokes) {
    const nameEl = document.getElementById('hud-weapon-name');
    if (nameEl) nameEl.textContent = (name || '').toUpperCase();

    const magEl = document.getElementById('ammo-mag');
    if (magEl) magEl.textContent = String(mag ?? 0);

    const reserveEl = document.getElementById('ammo-reserve');
    if (reserveEl) reserveEl.textContent = `/ ${reserve ?? 0}`;

    const nadesEl = document.getElementById('hud-grenades');
    if (nadesEl) nadesEl.textContent = `HE: ${frags ?? 0} | SMK: ${smokes ?? 0}`;
  }

  function updateTimeAndScore(seconds, vScore, sScore, planted, site) {
    const vEl = document.getElementById('score-vanguard');
    if (vEl) vEl.textContent = String(vScore ?? 0);

    const sEl = document.getElementById('score-syndicate');
    if (sEl) sEl.textContent = String(sScore ?? 0);

    const timerEl = document.getElementById('hud-timer');
    if (timerEl) {
      if (planted) {
        timerEl.textContent = `⚠️ 0:${String(Math.ceil(seconds ?? 0)).padStart(2, '0')} [${site || 'A'}]`;
        timerEl.style.color = 'var(--red)';
      } else {
        const sec = Math.max(0, Math.floor(seconds ?? 0));
        const m = Math.floor(sec / 60);
        const s = sec % 60;
        timerEl.textContent = `${m}:${String(s).padStart(2, '0')}`;
        timerEl.style.color = 'var(--ink)';
      }
    }
  }

  function setCrosshairSpread(px) {
    const crosshair = document.getElementById('crosshair');
    if (crosshair) {
      const gap = px > 0.5 ? Math.round(px) : Math.max(2, Math.round((px || 0) * 1200));
      crosshair.style.setProperty('--gap', `${gap}px`);
    }
  }

  function setDefuseProgress(ratio) {
    const prompt = document.getElementById('defuse-prompt');
    const bar = document.getElementById('defuse-progress');
    const clamped = Math.min(1.0, Math.max(0, ratio ?? 0));

    if (clamped > 0) {
      if (prompt) prompt.style.display = 'block';
      if (bar) bar.style.width = `${clamped * 100}%`;
    } else {
      if (prompt) prompt.style.display = 'none';
      if (bar) bar.style.width = '0%';
    }
  }

  function showBanner(title, subtitle, ms) {
    const banner = document.getElementById('round-banner');
    const titleEl = document.getElementById('banner-title');
    const subEl = document.getElementById('banner-sub');

    if (bannerTimeout) {
      clearTimeout(bannerTimeout);
      bannerTimeout = null;
    }

    if (titleEl) titleEl.textContent = title || '';
    if (subEl) subEl.textContent = subtitle || '';
    if (banner) banner.removeAttribute('hidden');

    if (ms && ms > 0) {
      bannerTimeout = setTimeout(() => {
        if (banner) banner.setAttribute('hidden', '');
      }, ms);
    }
  }

  function showHitmarker(headshot) {
    const hm = document.getElementById('hitmarker');
    if (!hm) return;

    if (hitmarkerTimeout) {
      clearTimeout(hitmarkerTimeout);
      hitmarkerTimeout = null;
    }

    hm.classList.add('on');
    if (headshot) {
      hm.classList.add('headshot');
    } else {
      hm.classList.remove('headshot');
    }

    hitmarkerTimeout = setTimeout(() => {
      hm.classList.remove('on');
      hm.classList.remove('headshot');
    }, 110);
  }

  function addKillEvent(killer, victim, weaponName, headshot) {
    const feed = document.getElementById('kill-feed');
    if (!feed) return;

    const item = document.createElement('div');
    item.className = 'kill-item';
    const hs = headshot ? '<span class="hs">💀</span>' : '';
    item.innerHTML = `<span>${killer}</span> <span class="weapon">[${weaponName}]</span> ${hs}<span>${victim}</span>`;
    feed.appendChild(item);

    setTimeout(() => {
      if (item.parentNode) item.remove();
    }, 4500);

    while (feed.children.length > 5) {
      feed.removeChild(feed.firstChild);
    }
  }

  function toggleBuyMenu() {
    const now = performance.now();
    if (now - lastToggleTime < 50) return;
    lastToggleTime = now;

    const menu = document.getElementById('buy-menu');
    if (!menu) return;
    if (menu.hasAttribute('hidden')) {
      menu.removeAttribute('hidden');
    } else {
      menu.setAttribute('hidden', '');
    }
  }

  function isBuyOpen() {
    const menu = document.getElementById('buy-menu');
    if (!menu) return false;
    return !menu.hasAttribute('hidden');
  }

  window.addEventListener('keydown', (e) => {
    if (e.code === 'KeyB') {
      toggleBuyMenu();
    }
  });

  return {
    updateStatus,
    updateWeapon,
    updateTimeAndScore,
    setCrosshairSpread,
    setDefuseProgress,
    showBanner,
    showHitmarker,
    addKillEvent,
    toggleBuyMenu,
    isBuyOpen,
  };
}
