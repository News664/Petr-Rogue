export const FLOORS_PER_ACT = 10;
export const NUM_ACTS       = 3;
export const FLOORS         = FLOORS_PER_ACT * NUM_ACTS; // 30

/** 0-based act number for a given floor index */
export function getAct(floor) { return Math.floor(floor / FLOORS_PER_ACT); }
