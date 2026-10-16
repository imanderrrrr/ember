export function chairPositionsRound(
  cx: number,
  cy: number,
  diameter: number,
  seats: number,
): { x: number; y: number }[] {
  const chairSize = 14;
  const offset = 6;
  const dist = diameter / 2 + offset + chairSize / 2;
  const positions: { x: number; y: number }[] = [];
  for (let i = 0; i < seats; i++) {
    const angle = -Math.PI / 2 + (2 * Math.PI * i) / seats;
    positions.push({
      x: cx + dist * Math.cos(angle) - chairSize / 2,
      y: cy + dist * Math.sin(angle) - chairSize / 2,
    });
  }
  return positions;
}

export function chairPositionsRect(
  mesaX: number,
  mesaY: number,
  w: number,
  h: number,
  seats: number,
): { x: number; y: number }[] {
  const chairSize = 12;
  const offset = 6;
  const top = Math.ceil(seats / 2);
  const bottom = Math.floor(seats / 2);
  const positions: { x: number; y: number }[] = [];
  for (let i = 0; i < top; i++) {
    const cx = mesaX + ((i + 1) * w) / (top + 1);
    positions.push({ x: cx - chairSize / 2, y: mesaY - offset - chairSize });
  }
  for (let i = 0; i < bottom; i++) {
    const cx = mesaX + ((i + 1) * w) / (bottom + 1);
    positions.push({ x: cx - chairSize / 2, y: mesaY + h + offset });
  }
  return positions;
}
