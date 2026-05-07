import { formatStatuses } from '../../systems/StatusSystem.js';

export function renderEnemy(enemy, index, player = null) {
  const pct     = Math.max(0, (enemy.hp / enemy.maxHp) * 100);
  const intent  = enemy.intents[enemy.intentIndex];
  const dead    = enemy.hp <= 0;
  const statuses = formatStatuses(enemy.statusEffects);

  let intentDisplay = `${intent.icon} ${intent.label}`;
  if (intent.damage !== undefined && player) {
    let adj = intent.damage;
    if ((enemy.statusEffects?.weak ?? 0) > 0)         adj = Math.floor(adj * 0.75);
    if ((player.statusEffects?.vulnerable ?? 0) > 0)  adj = Math.floor(adj * 1.5);
    if (adj !== intent.damage) intentDisplay += ` <span class="intent-adj">(→${adj})</span>`;
  }

  return `
    <div class="enemy${dead ? ' dead' : ''}" data-index="${index}">
      <div class="enemy-name">${enemy.name}</div>
      ${statuses ? `<div class="enemy-statuses">${statuses}</div>` : ''}
      <div class="enemy-intent">${intentDisplay}</div>
      <div class="enemy-hp-bar">
        <div class="enemy-hp-fill" style="width:${pct}%"></div>
      </div>
      <div class="enemy-hp-text">${Math.max(0, enemy.hp)} / ${enemy.maxHp}</div>
      ${enemy.block > 0 ? `<div class="enemy-block">🛡️ ${enemy.block}</div>` : ''}
    </div>
  `;
}
