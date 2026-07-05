import { formatStatuses } from '../../systems/StatusSystem.js';

export function renderHUD(player) {
  const { hp, maxHp, petrify, block, gold, statusEffects, geodes, poise } = player;

  const pctPetrify = Math.min(100, (petrify / maxHp) * 100);
  const pctSafe    = Math.max(0,   ((hp - petrify) / maxHp) * 100);
  const pctMissing = Math.max(0,   100 - pctPetrify - pctSafe);
  const danger     = petrify > 0 && (hp - petrify) <= 10;

  const statuses = formatStatuses(statusEffects);

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
        ${geodes > 0 ? `<span class="stat-geode" data-tooltip="Geodes: crystallized Petrify. Spent or scaled by Opal's cards.">💎 ${geodes}</span>` : ''}
        ${poise > 0 ? `<span class="stat-poise" data-tooltip="Poise: Galatea's gathered focus. Spent by her attacks for scaling damage.">◈ ${poise}</span>` : ''}
        <span class="stat-gold">💰 ${gold}</span>
        ${statuses ? `<span class="hud-statuses">${statuses}</span>` : ''}
      </div>
    </div>
  `;
}
