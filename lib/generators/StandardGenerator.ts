import { FloorCellFilter } from "../Floor";
import { Generator } from "../Generator";
import { Room, RoomRole } from "../Room";

export class StandardGenerator extends Generator {

  public width: number;

  public height: number;

  constructor(width: number, height: number) {
    super();
    this.width = width;
    this.height = height;
  }

  protected gen() {
    this.floor.grid.resize(this.width, this.height);

    this.createCriticalPath();

    while (this.floor.emptyCells > 0) {
      const pool = this.floor.getRooms((room) => {
        return room.role !== RoomRole.End &&
          this.floor.getEmptyAdjacentCells(room.x, room.y).length > 0;
      });

      const r = this.random.choice(pool);
      this.createArea(r.x, r.y);
    }

    // let empty = this.getEmptyCells();
    // while (empty.length > 0) {
    //   const cell = this.rng.choice(empty);
    //   this.createArea(cell.x, cell.y);
    //   empty = this.getEmptyCells();
    // }

    // Update the room shape and rotation for each room
    this.floor.rooms.forEach((room) => room.updateShape(this.random));
  }

  private createCriticalPath() {
    const floor = this.floor;

    // Pick a random cell on the bottom row for a start room
    const sx = this.random.integer(0, floor.grid.width - 1);
    const sy = floor.grid.height - 1;
    let room = floor.createRoom(sx, sy);
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

  private createRandomAdjacentRoom(room: Room, filter?: FloorCellFilter): Room | undefined {
    // Gather a list of possible room coordinates which
    const empty = this.floor.getEmptyAdjacentCells(room.x, room.y, filter);

    // No empty adjacent cells (which also match filter test)
    if (empty.length < 1) { return; }

    // Pick random coorindates from possible list and create a new room
    const cell = this.random.choice(empty);
    const next = this.floor.createRoom(cell.x, cell.y, room.id);

    // Connect to parent room
    room.connectToRoom(next);

    return next;
  }

  private createArea(x: number, y: number) {
    const id = this.floor.grid.get(x, y);
    let room = this.floor.rooms.get(id);
    while (room !== undefined) {
      room = this.createRandomAdjacentRoom(room);
    }
  }

}
