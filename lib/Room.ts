import { Random } from "@mousepox/math";
import { Direction, flipDirection } from "./core";

export const RoomShapeSymbols = ["O", "U", "I", "L", "T", "X"];

/** Room roles */
export enum RoomRole {
  Generic,
  Start,
  Boss,
  End,
}

/** Room shapes */
export enum RoomShape {
  /** No exits */
  O,
  /** 1 exit */
  U,
  /** 2 exits, in an "I" shape (opposite each other) */
  I,
  /** 2 exits, in an "L" shape (cater-corner each other) */
  L,
  /** 3 exits, in a "T" shape */
  T,
  /** 4 exits */
  X,
}

export class Room {

  public readonly id: number;

  public readonly x: number;

  public readonly y: number;

  public readonly parentId: number;

  public role = RoomRole.Generic;

  public rotation = 0;

  public shape = RoomShape.O;

  public exits = 0;

  /** Custom properties of this room */
  private readonly properties: Map<string, any> = new Map();

  private exitMask = 0;

  public get shapeSymbol(): string {
    return RoomShapeSymbols[this.shape];
  }

  constructor(id: number, x: number, y: number, parentId = 0) {
    this.id = id;
    this.x = x;
    this.y = y;
    this.parentId = parentId;
  }

  public getProperty<T>(name: string): T | undefined {
    return this.properties.get(name) as T;
  }

  public setProperty<T>(name: string, value: T) {
    this.properties.set(name, value);
  }

  public addExit(direction: Direction) {
    this.exitMask |= direction;
    this.exits++;
  }

  public hasExit(...directions: Direction[]): boolean {
    for (const direction of directions) {
      if ((this.exitMask & direction) === 0) {
        return false;
      }
    }
    return true;
  }

  public getDirectionToRoom(room: Room): Direction {
    const dx = room.x - this.x;
    const dy = room.y - this.y;
    if (dy < 0) { return Direction.North; }
    if (dx > 0) { return Direction.East; }
    if (dy > 0) { return Direction.South; }
    if (dx < 0) { return Direction.West; }
    throw new Error(`Failed to get direction between rooms at ${this.x}, ${this.y} and ${room.x}, ${room.y}`);
  }

  public connectToRoom(room: Room) {
    const dir = this.getDirectionToRoom(room);
    this.addExit(dir);
    room.addExit(flipDirection(dir));
  }

  public updateShape(rng: Random) {
    switch (this.exits) {
      case 4: // X
        this.shape = RoomShape.X;
        this.rotation = rng.integer(0, 3);
        break;

      case 3: // T
        this.shape = RoomShape.T;
        if (!this.hasExit(Direction.North)) {
          this.rotation = 0;
        } else if (!this.hasExit(Direction.East)) {
          this.rotation = 1;
        } else if (!this.hasExit(Direction.South)) {
          this.rotation = 2;
        } else {
          this.rotation = 3;
        }
        break;

      case 2: // I or L
        if (this.hasExit(Direction.North, Direction.South)) {
          // Vertical I
          this.shape = RoomShape.I;
          this.rotation = rng.chance(0.5) ? 2 : 0;
        } else if (this.hasExit(Direction.East, Direction.West)) {
          // Horizontal I
          this.shape = RoomShape.I;
          this.rotation = rng.chance(0.5) ? 1 : 3;
        } else if (this.hasExit(Direction.North, Direction.East)) {
          // L (no rotation)
          this.shape = RoomShape.L;
          this.rotation = 0;
        } else if (this.hasExit(Direction.East, Direction.South)) {
          // L (one rotation to the right)
          this.shape = RoomShape.L;
          this.rotation = 1;
        } else if (this.hasExit(Direction.South, Direction.West)) {
          // L (two rotations to the right)
          this.shape = RoomShape.L;
          this.rotation = 2;
        } else {
          // L (three rotations to the right)
          this.shape = RoomShape.L;
          this.rotation = 3;
        }
        break;

      case 1: // U
        this.shape = RoomShape.U;
        if (this.hasExit(Direction.North)) {
          this.rotation = 0;
        } else if (this.hasExit(Direction.East)) {
          this.rotation = 1;
        } else if (this.hasExit(Direction.South)) {
          this.rotation = 2;
        } else {
          this.rotation = 3;
        }
        break;

      default: // No exits
        this.shape = RoomShape.O;
        this.rotation = 0;
        break;
    }

  }

}
