import { Grid, IPoint, Random } from "@mousepox/math";
import { Room, RoomRole } from "./Room";

/** A function which tests cell coordinates */
type CellFilter = (x: number, y: number) => boolean;

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

  public get emptyCount(): number {
    let count = 0;
    for (const id of this.grid.cells) {
      if (id === 0) { count++; }
    }
    return count;
  }

  constructor(config: IGeneratorConfig) {
    this.config = config;
  }

  public generate() {
    this.reset();

    this.createCriticalPath();

    while (this.emptyCount > 0) {
      const pool = this.getRooms((room) => {
        return room.role !== RoomRole.End &&
          this.getEmptyAdjacentCells(room.x, room.y).length > 0;
      });

      const r = this.rng.choice(pool);
      this.createArea(r.x, r.y);
    }

    // let empty = this.getEmptyCells();
    // while (empty.length > 0) {
    //   const cell = this.rng.choice(empty);
    //   this.createArea(cell.x, cell.y);
    //   empty = this.getEmptyCells();
    // }

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

  public forEachAdjacentRoom(x: number, y: number, handler: (room: Room) => void) {
    this.grid.forEachAdjacent(x, y, (id) => {
      if (id === 0) { return; }
      const room = this.rooms.get(id);
      if (room !== undefined) {
        handler(room);
      }
    });
  }

  public getRooms(filter: (room: Room) => boolean): Room[] {
    const rooms: Room[] = [];
    for (const id of this.grid.cells) {
      if (id === 0) { continue; }
      const room = this.rooms.get(id);
      if (room !== undefined && filter(room)) {
        rooms.push(room);
      }
    }
    return rooms;
  }

  public getAdjacentRooms(x: number, y: number, filter: (room: Room) => boolean): Room[] {
    const rooms: Room[] = [];
    this.forEachAdjacentRoom(x, y, (room) => {
      if (filter(room)) {
        rooms.push(room);
      }
    });
    return rooms;
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
      const r = this.createRandomAdjacentRoom(room, (_x, y) => y <= room.y);
      if (r !== undefined) {
        room = r;
        room.setProperty("critical", true);
        if (room.y === 0) {
          room.role = RoomRole.End;
          done = true;
        }
      } else {
        throw new Error(`Could not create adjacent room on critical path: ${room.x}, ${room.y}`);
      }
    }
  }

  private createArea(x: number, y: number) {
    const id = this.grid.get(x, y);
    let room = this.rooms.get(id);
    while (room !== undefined) {
      room = this.createRandomAdjacentRoom(room);
    }
  }

  private createRandomAdjacentRoom(room: Room, filter?: CellFilter): Room | undefined {
    // Gather a list of possible room coordinates which
    const empty = this.getEmptyAdjacentCells(room.x, room.y, filter);

    // No empty adjacent cells (which also match filter test)
    if (empty.length < 1) { return; }

    // Pick random coorindates from possible list and create a new room
    const cell = this.rng.choice(empty);
    const next = this.createRoom(cell.x, cell.y, room.id);

    // Connect to parent room
    room.connectToRoom(next);

    return next;
  }

  /** Return a list of empty cells on the grid */
  private getEmptyCells(): IPoint[] {
    const cells: IPoint[] = [];
    this.grid.forEach((id, x, y) => {
      if (id === 0) {
        cells.push({ x, y });
      }
    });
    return cells;
  }

  private getEmptyAdjacentCells(x: number, y: number, filter?: CellFilter): IPoint[] {
    const cells: IPoint[] = [];
    this.grid.forEachAdjacent(x, y, (id, x1, y1) => {
      if (id === 0 && (filter === undefined || filter(x1, y1))) {
        cells.push({ x: x1, y: y1 });
      }
    });
    return cells;
  }

}
