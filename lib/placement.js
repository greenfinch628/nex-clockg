// Offsets are padding inward from the selected work-area corner.
export function clockPosition(area, size, corner, horizontal, vertical) {
    const maxX = Math.max(0, area.width - size);
    const maxY = Math.max(0, area.height - size);
    const x = Math.min(horizontal, maxX);
    const y = Math.min(vertical, maxY);
    return [area.x + (corner.endsWith('left') ? x : maxX - x),
        area.y + (corner.startsWith('top') ? y : maxY - y)];
}
