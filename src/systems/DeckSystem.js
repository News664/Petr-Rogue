export const HAND_CAP = 10;

export function createDeckState(cards) {
  return {
    draw: shuffle([...cards]),
    hand: [],
    discard: [],
    exhaust: [],
  };
}

export function drawCards(deckState, count, state = null) {
  for (let i = 0; i < count; i++) {
    if (deckState.hand.length >= HAND_CAP) break;
    if (deckState.draw.length === 0) {
      if (deckState.discard.length === 0) break;
      deckState.draw = shuffle([...deckState.discard]);
      deckState.discard = [];
    }
    const card = deckState.draw.pop();
    deckState.hand.push(card);
    if (card.onDraw && state) card.onDraw(state);
  }
}

// Insert a card at a random position in the draw pile (used for mid-combat status cards).
export function addCardToDraw(deckState, card) {
  const i = Math.floor(Math.random() * (deckState.draw.length + 1));
  deckState.draw.splice(i, 0, card);
}

export function discardCard(deckState, handIndex) {
  const [card] = deckState.hand.splice(handIndex, 1);
  if (card.ethereal) {
    deckState.exhaust.push(card);
  } else {
    deckState.discard.push(card);
  }
  return card;
}

export function discardHand(deckState) {
  for (const card of deckState.hand) {
    if (card.ethereal) {
      deckState.exhaust.push(card);
    } else {
      deckState.discard.push(card);
    }
  }
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
