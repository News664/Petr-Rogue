// ── DeathSlideshow.js ─────────────────────────────────────────────────────────
// Shared slideshow renderer used by CombatScreen, GameOverScreen, and GalleryScreen.
//
// Exports:
//   renderDeathSlideshow(container, opts)
//
// opts shape:
//   { key, charId?, title, body, frames?,
//     stats?: { act, floor, enemies, relics, gold },
//     onExit, exitLabel? }
//
// key: base cause key (underscored, e.g. 'petrify_event') — used to derive art URL.
// charId: 'mint' | 'tharja' | null
// Art lookup: assets/game-over/{key-dashed}-{charId}.png → {key-dashed}.png → hidden
// ─────────────────────────────────────────────────────────────────────────────

export function renderDeathSlideshow(container, {
  key, charId, title, body, frames, stats,
  onExit, exitLabel = 'Return to Menu',
}) {
  const artBase    = key.replace(/_/g, '-');
  const primarySrc = charId ? `assets/game-over/${artBase}-${charId}.png`
                             : `assets/game-over/${artBase}.png`;
  const fallbackSrc = charId ? `assets/game-over/${artBase}.png` : null;

  container.innerHTML = '<div class="game-over game-over-slideshow"></div>';
  const wrapper = container.querySelector('.game-over-slideshow');

  const artDiv = document.createElement('div');
  artDiv.className = 'game-over-art';
  const imgEl = document.createElement('img');
  imgEl.alt = '';
  imgEl.src = primarySrc;
  imgEl.onerror = fallbackSrc
    ? () => { imgEl.src = fallbackSrc; imgEl.onerror = () => { imgEl.style.display = 'none'; }; }
    : () => { imgEl.style.display = 'none'; };
  artDiv.appendChild(imgEl);

  const textDiv = document.createElement('div');
  textDiv.className = 'game-over-text';

  wrapper.appendChild(artDiv);
  wrapper.appendChild(textDiv);

  const preFrames = frames ?? [];
  let frameIndex = 0;

  function _applyFrame() {
    if (frameIndex < preFrames.length) {
      const f = preFrames[frameIndex];
      imgEl.style.transform       = `scale(${f.zoom ?? 1})`;
      imgEl.style.transformOrigin = `${f.originX ?? '50%'} ${f.originY ?? '50%'}`;
      artDiv.classList.add('go-frame-mode');
      textDiv.innerHTML = `
        <p class="go-frame-text">${f.text}</p>
        <p class="go-hint">Click to continue</p>`;
    } else {
      imgEl.style.transform       = 'scale(1)';
      imgEl.style.transformOrigin = '50% 50%';
      artDiv.classList.remove('go-frame-mode');
      const statsHtml = stats ? `
        <div class="game-over-stats">
          <span>Act ${stats.act} · Floor ${stats.floor}</span>
          <span>Enemies defeated: ${stats.enemies}</span>
          <span>Relics: ${stats.relics}</span>
          <span>Gold: ${stats.gold}</span>
        </div>` : '';
      textDiv.innerHTML = `
        <h1>${title}</h1>
        <p class="game-over-epitaph">${body}</p>
        ${statsHtml}
        <button id="go-exit-btn">${exitLabel}</button>`;
      textDiv.querySelector('#go-exit-btn').addEventListener('click', onExit);
    }
  }

  _applyFrame();

  if (preFrames.length > 0) {
    wrapper.style.cursor = 'pointer';
    wrapper.addEventListener('click', e => {
      if (e.target.id === 'go-exit-btn') return;
      if (frameIndex >= preFrames.length) return;
      frameIndex++;
      wrapper.classList.add('go-fade');
      setTimeout(() => { _applyFrame(); wrapper.classList.remove('go-fade'); }, 300);
    });
  }
}
