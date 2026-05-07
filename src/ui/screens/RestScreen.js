import { GameState } from '../../state/GameState.js';
import { healPlayer, reducePetrify } from '../../systems/Effects.js';
import { navigate } from '../../router.js';

export const RestScreen = {
  init(el) {
    const { player } = GameState;
    const healAmt    = Math.floor(player.maxHp * 0.3);
    const purifyAmt  = 15;

    el.innerHTML = `
      <div class="rest-screen">
        <h2>🔥 Rest Site</h2>
        <p style="color:var(--text-muted)">
          ❤️ ${player.hp} / ${player.maxHp} &nbsp;|&nbsp; 🪨 Petrify ${player.petrify}
        </p>
        <div class="rest-options">
          <button class="rest-option-btn" id="rest-heal">
            <strong>Rest</strong>
            <span>Heal ${healAmt} HP</span>
          </button>
          <button class="rest-option-btn" id="rest-purify">
            <strong>Purify</strong>
            <span>Reduce Petrify by ${purifyAmt}</span>
          </button>
        </div>
      </div>
    `;

    el.querySelector('#rest-heal').addEventListener('click', () => {
      healPlayer(GameState.player, healAmt);
      navigate('MapScreen');
    });

    el.querySelector('#rest-purify').addEventListener('click', () => {
      reducePetrify(GameState.player, purifyAmt);
      navigate('MapScreen');
    });
  },
  teardown() {},
};
