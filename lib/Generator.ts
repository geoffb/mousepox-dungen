import { Grid, IPoint, Random } from "@mousepox/math";
import { Room, RoomRole } from "./Room";

interface IGeneratorConfig {
  width: number;
  height: number;
}

export class Generator {

  /** Map grid, contains ID of room at each cell */
  public readonly grid = new Grid();

  /** Collection of rooms, keyed by room ID */
  public readonly rooms: Map<number, Room> = new Map();

  private readonly config: IGeneratorConfig;

  private nextRoomId = 1;

  private readonly rng = new Random();

  constructor(config: IGeneratorConfig) {
    this.config = config;
  }

  public generate() {
    this.reset();

    this.createCriticalPath();

    // Update the room shape and rotation for each room
    this.rooms.forEach((room) => room.updateShape(this.rng));
  }

  public forEachRoom(handler: (room: Room) => void) {
    this.grid.forEach((id) => {
      if (id === 0) { return; }
      const room = this.rooms.get(id);
      if (room !== undefined) {
        handler(room);
      }
    });
  }

  private reset() {
    this.grid.resize(this.config.width, this.config.height);
    this.rooms.clear();
    this.nextRoomId = 1;
    this.rng.reset();
  }

  private createRoom(x: number, y: number, parentId = 0) {
    const room = new Room(this.nextRoomId++, x, y, parentId);
    this.grid.set(x, y, room.id);
    this.rooms.set(room.id, room);
    return room;
  }

  private createCriticalPath() {
    // Pick a random cell on the bottom row for a start room
    const sx = this.rng.integer(0, this.grid.width - 1);
    const sy = this.grid.height - 1;
    let room = this.createRoom(sx, sy);
    room.role = RoomRole.Start;

    let done = false;
    while (!done) {
      room = this.createAdjacentRoom(room);

      // Exit when we reach the top row
      if (room.y === 0) {
        room.role = RoomRole.Boss;
        done = true;
      }
    }

    // Create end room off the boss room
    room = this.createAdjacentRoom(room);
    room.role = RoomRole.End;
  }

  private createAdjacentRoom(room: Room): Room {
    // Gather a list of possible room coordinates which:
    const possible: IPoint[] = [];
    this.grid.forEachAdjacent(room.x, room.y, (id, x, y) => {
      if (id === 0 && y <= room.y) {
        possible.push({ x, y });
      }
    });

    // Pick random coorindates from possible list
    const i = this.rng.integer(0, possible.length - 1);
    const p = possible[i];

    // Create a new room at chosen coordinates
    const next = this.createRoom(p.x, p.y, room.id);

    // Connect to parent room
    room.connectToRoom(next);

    return next;
  }

}
