export function setBackgorundColor(k, hexColorCode) {
    k.add([
        k.rect(k.width(), k.height()) ,
        k.color(k.Color.fromHex(hexColorCode)),
        k.fixed(),
    ]);
}

export function setMapColliders() {
  for (const collider of colliders) {
    if (collider.polygon) {
      const coordinates = [];
      for (const point of collider.polygon) {
        coordinates.push(k.vec2(point.x, point.y));
      }

      Map.add([
        k.pos(collider.x, collider.y),
        k.area({
          shape: new k.Polygon(coordinates),
          collisionIgnore: ["collider"]
        }),
        "collider",
        collider.type,
      ]);
      continue;
    }

    if (collider.name === "boss-barrier") {
      //Para fazer
      continue;
    }

    Map.add([
      k.pos(collider.x, collider.y),
      k.area({
        shape: new k.Rect(k.vec2(0), collider.width, collider.height),
        collisionIgnore: ["collider"],
      }),
      k.body({isStatic: true}), //Faz acontecer a gravidade
      "collider",
      collider.type,
    ]);
  }
}