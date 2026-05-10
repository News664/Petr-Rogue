export const HAND_CAP = 10;

export function createDeckState(cards) {
  const innate = cards.filter(c => c.innate);
  const rest   = cards.filter(c => !c.innate);
  // Innate cards go to the top of the draw pile (end of array, since pop() draws from end)
  // so they are guaranteed to be drawn on turn 1.
  return {
    draw: [...shuffle([...rest]), ...innate],
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

// Add a card directly to hand and fire its onDraw hook immediately (for instant-threat status cards).
export function addCardToHand(deckState, card, state = null) {
  if (deckState.hand.length >= HAND_CAP) return;
  deckState.hand.push(card);
  if (card.onDraw && state) card.onDraw(state);
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

export function discardHand(deckState, state = null) {
  for (let i = deckState.hand.length - 1; i >= 0; i--) {
    const card = deckState.hand[i];
    if (card.retained) {
      const exhaust = card.onRetain ? card.onRetain(state) : false;
      if (exhaust) {
        deckState.hand.splice(i, 1);
        deckState.exhaust.push(card);
      }
      // else stays in hand for next turn
    } else if (card.ethereal) {
      deckState.hand.splice(i, 1);
      deckState.exhaust.push(card);
    } else {
      deckState.hand.splice(i, 1);
      deckState.discard.push(card);
    }
  }
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
