import { GameState } from '../../state/GameState.js';
import { navigate } from '../../router.js';

function _checkEventDeath(player) {
  if (player.petrify > 0 && player.petrify >= player.hp)
    return { type: 'petrify', source: player.lastPetrifySource ?? { type: 'event', id: null } };
  if (player.hp <= 0) return { type: 'hp' };
  return null;
}

export const EventScreen = {
  init(el, { event }) {
    _render(el, event);
  },
  teardown() {},
};

function _render(el, event) {
  el.innerHTML = `
    <div class="event-screen">
      <h2>❓ ${event.title}</h2>
      <p class="event-text">${event.text}</p>
      <div class="event-choices">
        ${event.choices.map((c, i) => {
          const hasPickReq = !!c.needsCardPick;
          const cardType   = c.needsCardPick?.type;
          const hasCards   = hasPickReq
            ? GameState.player.deck.some(d => d.type === cardType)
            : true;
          const disabled   = hasPickReq && !hasCards ? ' disabled' : '';
          const note       = hasPickReq && !hasCards
            ? ` <span class="event-choice-note">(no ${cardType} cards in deck)</span>` : '';
          return `
            <button class="event-choice${disabled}" data-index="${i}"${disabled ? ' disabled' : ''}>
              <strong>${c.label}${note}</strong>
              <span>${c.description}</span>
            </button>`;
        }).join('')}
      </div>
    </div>
  `;

  el.querySelectorAll('.event-choice:not([disabled])').forEach(btn => {
    btn.addEventListener('click', () => {
      const choice = event.choices[Number(btn.dataset.index)];
      if (choice.needsCardPick) {
        _showCardPicker(el, event, choice);
      } else {
        choice.effect(GameState);
        const cause = _checkEventDeath(GameState.player);
        if (cause) { navigate('GameOverScreen', { cause }); return; }
        navigate('MapScreen');
      }
    });
  });
}

function _showCardPicker(el, event, choice) {
  const { type, label } = choice.needsCardPick;
  const candidates = GameState.player.deck
    .map((card, idx) => ({ card, idx }))
    .filter(({ card }) => card.type === type);

  el.innerHTML = `
    <div class="event-screen">
      <h2>❓ ${event.title}</h2>
      <p class="event-text">${label}</p>
      <div class="event-card-pick">
        ${candidates.map(({ card, idx }) => `
          <button class="event-pick-card" data-deck-index="${idx}">
            <strong>${card.name}</strong>
            <span class="event-pick-card-type">${card.type} · ${card.rarity}</span>
            <span>${card.shortDescription ?? card.description}</span>
          </button>
        `).join('')}
      </div>
      <button class="event-choice" id="event-pick-cancel">Cancel — go back</button>
    </div>
  `;

  el.querySelectorAll('.event-pick-card').forEach(btn => {
    btn.addEventListener('click', () => {
      const deckIndex = Number(btn.dataset.deckIndex);
      choice.onPick(GameState, deckIndex);
      const cause = _checkEventDeath(GameState.player);
      if (cause) { navigate('GameOverScreen', { cause }); return; }
      navigate('MapScreen');
    });
  });

  el.querySelector('#event-pick-cancel').addEventListener('click', () => {
    _render(el, event);
  });
}
