window.TobiasFamily = {
  width: 2048, height: 1536,
  background: 'living-kitchen.webp', mask: 'living_walkable.png',
  mother: { x: .57, y: .40 },
  pot: { x: 1007/1448, y: 132/1086, approachX: 1007/1448, approachY: .25 },
  // Source rectangles include the furniture above its footprint for foreground depth.
  occluders: [[112,90,186,168],[49,648,278,157],[122,797,184,104],
    [1090,684,154,238],[1304,608,100,215],[959,99,346,139],[1315,56,80,182],
    [873,350,248,168],[433,380,141,166],[399,490,65,66],[546,485,69,89]]
};
