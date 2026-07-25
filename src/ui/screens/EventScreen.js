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
    // Fresh per-visit context (e.g. which predecessor statue this is); dynamic
    // text() resolves and caches into it, so re-renders stay consistent.
    GameState.eventCtx = null;
    _render(el, event);
  },
  teardown() {},
};

// `text` may be a string or a function(state) for events with dynamic bodies.
// `choice.requires(state)` gates a choice (e.g. petrify-only branches); choices
// whose predicate is false are not offered at all.
function _eventText(event) {
  return typeof event.text === 'function' ? event.text(GameState) : event.text;
}
function _visibleChoices(event) {
  return event.choices.filter(c => typeof c.requires !== 'function' || c.requires(GameState));
}

function _render(el, event) {
  const choices = _visibleChoices(event);
  el.innerHTML = `
    <div class="event-screen">
      <h2>❓ ${event.title}</h2>
      <p class="event-text">${_eventText(event)}</p>
      <div class="event-choices">
        ${choices.map((c, i) => {
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
      // data-index refers to the filtered (visible) list, not event.choices.
      const choice = choices[Number(btn.dataset.index)];
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
