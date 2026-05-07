import { GameState } from '../../state/GameState.js';
import { navigate } from '../../router.js';

export const EventScreen = {
  init(el, { event }) {
    el.innerHTML = `
      <div class="event-screen">
        <h2>❓ ${event.title}</h2>
        <p class="event-text">${event.text}</p>
        <div class="event-choices">
          ${event.choices.map((c, i) => `
            <button class="event-choice" data-index="${i}">
              <strong>${c.label}</strong>
              <span>${c.description}</span>
            </button>
          `).join('')}
        </div>
      </div>
    `;

    el.querySelectorAll('.event-choice').forEach(btn => {
      btn.addEventListener('click', () => {
        const choice = event.choices[Number(btn.dataset.index)];
        choice.effect(GameState);
        navigate('MapScreen');
      });
    });
  },
  teardown() {},
};
