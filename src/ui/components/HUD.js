// Renders the player status bar — the three-segment petrify/HP visualization
export function renderHUD(player) {
  const { hp, maxHp, petrify, block, gold } = player;

  const pctPetrify = Math.min(100, (petrify / maxHp) * 100);
  const pctSafe    = Math.max(0, ((hp - petrify) / maxHp) * 100);
  const pctMissing = Math.max(0, 100 - pctPetrify - pctSafe);

  const danger = petrify > 0 && (hp - petrify) <= 10;

  return `
    <div class="hud${danger ? ' hud-danger' : ''}">
      <div class="hud-bar-wrap">
        <div class="hud-bar">
          <div class="bar-petrify" style="width:${pctPetrify}%"></div>
          <div class="bar-safe"    style="width:${pctSafe}%"></div>
          <div class="bar-missing" style="width:${pctMissing}%"></div>
        </div>
        <div class="hud-bar-labels">
          <span class="label-petrify">🪨 Petrify ${petrify}</span>
          <span class="label-hp">❤️ ${hp} / ${maxHp}</span>
        </div>
      </div>
      <div class="hud-stats">
        ${block > 0 ? `<span class="stat-block">🛡️ ${block}</span>` : ''}
        <span class="stat-gold">💰 ${gold}</span>
      </div>
    </div>
  `;
}
