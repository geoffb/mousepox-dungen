/** Cardinal directions */
export const enum Direction {
  North = 1,
  East = 2,
  South = 4,
  West = 8,
}

export function flipDirection(direction: Direction): Direction {
  switch (direction) {
    case Direction.North: return Direction.South;
    case Direction.East: return Direction.West;
    case Direction.South: return Direction.North;
    case Direction.West: return Direction.East;
  }
}
