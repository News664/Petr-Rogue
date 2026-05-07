import { initRouter, navigate } from './router.js';
import { CharacterSelectScreen } from './ui/screens/CharacterSelectScreen.js';
import { MapScreen }             from './ui/screens/MapScreen.js';
import { CombatScreen }          from './ui/screens/CombatScreen.js';
import { RewardScreen }          from './ui/screens/RewardScreen.js';
import { RestScreen }            from './ui/screens/RestScreen.js';
import { ShopScreen }            from './ui/screens/ShopScreen.js';
import { EventScreen }           from './ui/screens/EventScreen.js';

const container = document.getElementById('screen-container');

initRouter(container, {
  CharacterSelectScreen,
  MapScreen,
  CombatScreen,
  RewardScreen,
  RestScreen,
  ShopScreen,
  EventScreen,
});

function showMenu() {
  container.innerHTML = `
    <div class="menu-screen">
      <h1>Petr-Rogue</h1>
      <p class="subtitle">A petrification-themed roguelike deckbuilder</p>
      <p class="menu-hint">Build your deck. Manage the stone. Survive.</p>
      <button id="new-run" class="btn-primary">New Run</button>
    </div>
  `;
  document.getElementById('new-run').addEventListener('click', () => {
    navigate('CharacterSelectScreen');
  });
}

showMenu();
