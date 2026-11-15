export function createEconomySystem() {
  const state = {
    cash: 3400,
    fragGrenades: 1,
    smokeGrenades: 1,
    hasDefuseKit: false,
  };

  function buy(item, cost) {
    if (typeof cost !== 'number' || state.cash < cost) {
      return false;
    }
    state.cash -= cost;

    if (item === 'frag') {
      state.fragGrenades += 1;
    } else if (item === 'smoke') {
      state.smokeGrenades += 1;
    } else if (item === 'defuse') {
      state.hasDefuseKit = true;
    }
    // armor and weapons are applied by the caller
    return true;
  }

  function rewardRound(vanguardWon, kills = 0, survived = false) {
    const baseReward = vanguardWon ? 3250 : 1900;
    const killBonus = (typeof kills === 'number' ? kills : 0) * 300;
    state.cash = Math.min(16000, state.cash + baseReward + killBonus);
  }

  return {
    state,
    buy,
    rewardRound,
  };
}
