const { Grid } = require("@mousepox/math");
const { StandardGenerator } = require("../dist");

const MapWidth = 3;
const MapHeight = 3;

const RoomWidth = 3;
const RoomHeight = 3;

const RoomTemplates = new Map([
  [0, [ // O
    1, 1, 1,
    1, 0, 1,
    1, 1, 1,
  ]],

  [1, [ // U
    1, 0, 1,
    1, 0, 1,
    1, 1, 1,
  ]],

  [2, [ // I
    1, 0, 1,
    1, 0, 1,
    1, 0, 1,
  ]],

  [3, [ // L
    1, 0, 1,
    1, 0, 0,
    1, 1, 1,
  ]],

  [4, [ // T
    1, 1, 1,
    0, 0, 0,
    1, 0, 1,
  ]],

  [5, [ // X
    1, 0, 1,
    0, 0, 0,
    1, 0, 1,
  ]],
]);

const Tiles = " #SE";

const generator = new StandardGenerator(MapWidth, MapHeight);
const floor = generator.generate();

function getRoomGrid(shape) {
  const grid = new Grid(RoomWidth, RoomHeight);
  const room = RoomTemplates.get(shape);
  for (let i = 0; i < room.length; ++i) {
    grid.setIndex(i, room[i]);
  }
  return grid;
}

const grid = new Grid(MapWidth * RoomWidth, MapHeight * RoomHeight);

floor.grid.forEach((id, rx, ry) => {
  if (id === 0) { return; }
  const room = floor.rooms.get(id);
  const m = getRoomGrid(room.shape);
  m.rotate(room.rotation);
  if (room.role === 1) {
    m.set(1, 1, 2);
  } else if (room.role === 3) {
    m.set(1, 1, 3);
  }
  grid.paste(m, rx * RoomWidth, ry * RoomHeight);
});

floor.forEachRoom((room) => console.log(room));

// Render
for (let y = 0; y < grid.height; ++y) {
  let row = "";
  for (let x = 0; x < grid.width; ++x) {
    row += Tiles[grid.get(x, y)];
  }
  console.log(row);
}
console.log("--------------------")
for (const room of floor.rooms) {
  console.log(JSON.stringify(room));
}
