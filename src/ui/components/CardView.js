const TYPE_COLOR = {
  attack: 'var(--card-attack)',
  skill:  'var(--card-skill)',
  power:  'var(--card-power)',
};

export function renderCard(card, index, disabled = false) {
  const color = TYPE_COLOR[card.type] ?? 'var(--border)';
  const cls = ['card', disabled ? 'card-disabled' : ''].filter(Boolean).join(' ');
  return `
    <div class="${cls}" data-index="${index}" style="--card-color:${color}">
      <div class="card-cost">${card.cost}</div>
      <div class="card-name">${card.name}</div>
      <div class="card-type">${card.type}</div>
      <div class="card-desc">${card.description}</div>
    </div>
  `;
}
