export function triggerRelics(hookName, state, payload = {}) {
  for (const relic of (state.player?.relics ?? [])) {
    if (relic.hooks?.[hookName]) {
      relic.hooks[hookName](state, payload);
    }
  }
}
