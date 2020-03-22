import { Random } from "@mousepox/math";
import { Floor } from "./Floor";

export abstract class Generator {

  protected readonly random = new Random();

  protected readonly floor = new Floor();

  public generate(): Floor {
    this.random.reset();
    this.floor.reset();
    this.gen();
    return this.floor;
  }

  protected abstract gen(): void;

}
