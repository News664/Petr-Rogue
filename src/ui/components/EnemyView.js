import { formatStatuses } from '../../systems/StatusSystem.js';

export function renderEnemy(enemy, index) {
  const pct    = Math.max(0, (enemy.hp / enemy.maxHp) * 100);
  const intent = enemy.intents[enemy.intentIndex];
  const dead   = enemy.hp <= 0;
  const statuses = formatStatuses(enemy.statusEffects);

  return `
    <div class="enemy${dead ? ' dead' : ''}" data-index="${index}">
      <div class="enemy-name">${enemy.name}</div>
      ${statuses ? `<div class="enemy-statuses">${statuses}</div>` : ''}
      <div class="enemy-intent">${intent.icon} ${intent.label}</div>
      <div class="enemy-hp-bar">
        <div class="enemy-hp-fill" style="width:${pct}%"></div>
      </div>
      <div class="enemy-hp-text">${Math.max(0, enemy.hp)} / ${enemy.maxHp}</div>
      ${enemy.block > 0 ? `<div class="enemy-block">🛡️ ${enemy.block}</div>` : ''}
    </div>
  `;
}
