// economy.js: Tactical economy, round earnings, and buy phase transactions

export function createEconomySystem() {
  const state = {
    cash: 800,
    hasArmor: false,
    hasDefuseKit: false,
    fragGrenades: 1,
    smokeGrenades: 1,
    lossStreak: 0,
  };

  function canAfford(cost) {
    return state.cash >= cost;
  }

  function buy(itemKey, cost) {
    if (!canAfford(cost)) return false;
    state.cash -= cost;

    if (itemKey === 'armor') {
      state.hasArmor = true;
    } else if (itemKey === 'defuse') {
      state.hasDefuseKit = true;
    } else if (itemKey === 'frag') {
      state.fragGrenades = Math.min(2, state.fragGrenades + 1);
    } else if (itemKey === 'smoke') {
      state.smokeGrenades = Math.min(1, state.smokeGrenades + 1);
    }
    return true;
  }

  function rewardRound(won, killsThisRound = 0, defusedOrPlanted = false) {
    state.cash += killsThisRound * 300;
    if (defusedOrPlanted) state.cash += 300;

    if (won) {
      state.cash += 3250;
      state.lossStreak = 0;
    } else {
      const lossBonus = Math.min(3400, 1400 + state.lossStreak * 500);
      state.cash += lossBonus;
      state.lossStreak += 1;
    }
    state.cash = Math.min(16000, state.cash);
  }

  function reset() {
    state.cash = 800;
    state.hasArmor = false;
    state.hasDefuseKit = false;
    state.fragGrenades = 1;
    state.smokeGrenades = 1;
    state.lossStreak = 0;
  }

  return {
    state,
    canAfford,
    buy,
    rewardRound,
    reset,
  };
}
