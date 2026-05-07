const TYPE_COLOR = {
  attack: 'var(--card-attack)',
  skill:  'var(--card-skill)',
  power:  'var(--card-power)',
};

export function openDeckViewer(overlayEl, player) {
  const { deck } = player;

  // Group by type
  const groups = { attack: [], skill: [], power: [] };
  for (const card of deck) {
    (groups[card.type] ?? (groups.other ??= [])).push(card);
  }

  const renderGroup = (label, cards) => {
    if (!cards?.length) return '';
    return `
      <div class="dv-group">
        <div class="dv-group-label">${label} (${cards.length})</div>
        <div class="dv-cards">
          ${cards.map(card => `
            <div class="dv-card" style="--card-color:${TYPE_COLOR[card.type] ?? 'var(--border)'}">
              <div class="dv-card-cost">${card.cost}</div>
              <div class="dv-card-name">${card.name}${card.isUpgraded ? ' <span class="upgraded-mark">✦</span>' : ''}</div>
              <div class="dv-card-desc">${card.description}</div>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  };

  overlayEl.innerHTML = `
    <div class="dv-backdrop"></div>
    <div class="dv-panel">
      <div class="dv-header">
        <h2>Deck — ${deck.length} cards</h2>
        <button class="dv-close" id="dv-close">✕ Close</button>
      </div>
      <div class="dv-body">
        ${renderGroup('Attacks', groups.attack)}
        ${renderGroup('Skills', groups.skill)}
        ${renderGroup('Powers', groups.power)}
        ${renderGroup('Other', groups.other)}
      </div>
    </div>
  `;

  overlayEl.classList.remove('hidden');

  const close = () => overlayEl.classList.add('hidden');
  overlayEl.querySelector('#dv-close').addEventListener('click', close);
  overlayEl.querySelector('.dv-backdrop').addEventListener('click', close);
}
