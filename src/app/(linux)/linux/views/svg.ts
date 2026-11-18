/** Prefixes SVG ids so a distro mark can appear twice without clashing gradient urls. */
export function scopeSvg(svg: string, suffix: string): string {
    return svg
        .replace(/\bid="([^"]+)"/g, (_, id: string) => `id="${id}-${suffix}"`)
        .replace(/url\(#([^)]+)\)/g, (_, id: string) => `url(#${id}-${suffix})`);
}
