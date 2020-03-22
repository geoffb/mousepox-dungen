import { Grid, IPoint } from "@mousepox/math";
import { Room } from "./Room";

/** A function which tests cell coordinates */
export type FloorCellFilter = (x: number, y: number) => boolean;

/** A function which tests a room */
export type FloorRoomFilter = (room: Room) => boolean;

/** A floor of rooms */
export class Floor {

  /** Room grid, contains ID of room at each cell */
  public readonly grid = new Grid();

  /** Room data, keyed by room ID */
  public readonly rooms: Map<number, Room> = new Map();

  /** ID to use for the next generated room */
  private nextRoomId = 1;

  /** Get the total number of empty cells within this floor */
  public get emptyCells(): number {
    let count = 0;
    for (const id of this.grid.cells) {
      if (id === 0) { count++; }
    }
    return count;
  }

  /** Reset this floor */
  public reset() {
    this.grid.resize(0, 0);
    this.rooms.clear();
    this.nextRoomId = 1;
  }

  /** Create a new room at a given location */
  public createRoom(x: number, y: number, parentId = 0) {
    const room = new Room(this.nextRoomId++, x, y, parentId);
    this.grid.set(x, y, room.id);
    this.rooms.set(room.id, room);
    return room;
  }

  /** Execute a handler for each valid room */
  public forEachRoom(handler: (room: Room) => void) {
    this.grid.forEach((id) => {
      if (id === 0) { return; }
      const room = this.rooms.get(id);
      if (room !== undefined) {
        handler(room);
      }
    });
  }

  /** Execute a handler for each valid room adjacent to a given room */
  public forEachAdjacentRoom(x: number, y: number, handler: (room: Room) => void) {
    this.grid.forEachAdjacent(x, y, (id) => {
      if (id === 0) { return; }
      const room = this.rooms.get(id);
      if (room !== undefined) {
        handler(room);
      }
    });
  }

  /** Get a list of rooms matching a given filter */
  public getRooms(filter?: FloorRoomFilter): Room[] {
    const rooms: Room[] = [];
    for (const id of this.grid.cells) {
      if (id === 0) { continue; }
      const room = this.rooms.get(id);
      if (room !== undefined && (filter === undefined || filter(room))) {
        rooms.push(room);
      }
    }
    return rooms;
  }

  /** Get the first room which matches a given filter */
  public getFirstRoom(filter: FloorRoomFilter): Room | undefined {
    for (const id of this.grid.cells) {
      if (id === 0) { continue; }
      const room = this.rooms.get(id);
      if (room !== undefined && filter(room)) {
        return room;
      }
    }
  }

  /** Get a list of rooms adjacent to a given room */
  public getAdjacentRooms(x: number, y: number, filter?: FloorRoomFilter): Room[] {
    const rooms: Room[] = [];
    this.forEachAdjacentRoom(x, y, (room) => {
      if (filter === undefined || filter(room)) {
        rooms.push(room);
      }
    });
    return rooms;
  }

  /** Get a list of empty cell coordinates */
  public getEmptyCells(): IPoint[] {
    const cells: IPoint[] = [];
    this.grid.forEach((id, x, y) => {
      if (id === 0) {
        cells.push({ x, y });
      }
    });
    return cells;
  }

  /** Get a list of empty cell coordinates adjacent to a given cell */
  public getEmptyAdjacentCells(x: number, y: number, filter?: FloorCellFilter): IPoint[] {
    const cells: IPoint[] = [];
    this.grid.forEachAdjacent(x, y, (id, x1, y1) => {
      if (id === 0 && (filter === undefined || filter(x1, y1))) {
        cells.push({ x: x1, y: y1 });
      }
    });
    return cells;
  }

}
