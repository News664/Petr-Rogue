export function createDeckState(cards) {
  return {
    draw: shuffle([...cards]),
    hand: [],
    discard: [],
    exhaust: [],
  };
}

export function drawCards(deckState, count) {
  for (let i = 0; i < count; i++) {
    if (deckState.draw.length === 0) {
      if (deckState.discard.length === 0) break;
      deckState.draw = shuffle([...deckState.discard]);
      deckState.discard = [];
    }
    deckState.hand.push(deckState.draw.pop());
  }
}

export function discardCard(deckState, handIndex) {
  const [card] = deckState.hand.splice(handIndex, 1);
  deckState.discard.push(card);
  return card;
}

export function discardHand(deckState) {
  deckState.discard.push(...deckState.hand);
  deckState.hand = [];
}

export function exhaustCard(deckState, handIndex) {
  const [card] = deckState.hand.splice(handIndex, 1);
  deckState.exhaust.push(card);
  return card;
}

function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}
