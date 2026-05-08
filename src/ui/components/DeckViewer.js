const TYPE_COLOR = {
  attack: 'var(--card-attack)',
  skill:  'var(--card-skill)',
  power:  'var(--card-power)',
};

function _cardArtHtml(card, charId) {
  const id = card.id;
  const ch = charId ?? 'shared';
  return `
    <div class="dv-card-art">
      <img src="assets/cards/${ch}/${id}.png" alt="" draggable="false"
           onerror="this.src='assets/cards/${id}.png';this.onerror=()=>this.style.visibility='hidden'">
    </div>
  `;
}

function _renderGroup(label, cards, charId) {
  if (!cards?.length) return '';
  return `
    <div class="dv-group">
      <div class="dv-group-label">${label} (${cards.length})</div>
      <div class="dv-cards">
        ${cards.map(card => `
          <div class="dv-card" style="--card-color:${TYPE_COLOR[card.type] ?? 'var(--border)'}">
            ${_cardArtHtml(card, charId)}
            <div class="dv-card-cost">${card.cost}</div>
            <div class="dv-card-name">${card.name}${card.isUpgraded ? ' <span class="upgraded-mark">✦</span>' : ''}</div>
            <div class="dv-card-desc">${card.description}</div>
          </div>
        `).join('')}
      </div>
    </div>
  `;
}

export function openDeckViewer(overlayEl, player, { title, cards } = {}) {
  const charId = player?.characterId;
  const list   = cards ?? player?.deck ?? [];
  const header = title ?? `Deck — ${list.length} cards`;

  const groups = { attack: [], skill: [], power: [] };
  for (const card of list) {
    (groups[card.type] ?? (groups.other ??= [])).push(card);
  }

  overlayEl.innerHTML = `
    <div class="dv-backdrop"></div>
    <div class="dv-panel">
      <div class="dv-header">
        <h2>${header}</h2>
        <button class="dv-close" id="dv-close">✕ Close</button>
      </div>
      <div class="dv-body">
        ${_renderGroup('Attacks', groups.attack, charId)}
        ${_renderGroup('Skills',  groups.skill,  charId)}
        ${_renderGroup('Powers',  groups.power,  charId)}
        ${_renderGroup('Other',   groups.other,  charId)}
        ${list.length === 0 ? '<div class="dv-empty">Empty</div>' : ''}
      </div>
    </div>
  `;

  overlayEl.classList.remove('hidden');

  const close = () => overlayEl.classList.add('hidden');
  overlayEl.querySelector('#dv-close').addEventListener('click', close);
  overlayEl.querySelector('.dv-backdrop').addEventListener('click', close);
}
