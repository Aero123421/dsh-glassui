/**
 * Displacement map for refraction along the edge of a rounded rectangle.
 *
 * Inside a bezel along the edge, each pixel samples the backdrop from further
 * inside the shape, which bends the content behind the glass the way the rim of
 * a lens does. The interior and everything outside the shape stay neutral.
 * Red encodes the horizontal shift and green the vertical one, with 128 as
 * "no shift", for an SVG `feDisplacementMap` reading channels R and G.
 */

/** Geometry of one map. */
export interface LensGeometry {
  /** Width in CSS pixels. */
  width: number
  /** Height in CSS pixels. */
  height: number
  /** Corner radius in CSS pixels, at most half the shorter side. */
  radius: number
  /** Width of the refracting band along the edge. */
  bezel: number
}

/** Bezel width for an element: a third of the shorter side, between 6 and 28 pixels. */
export function bezelFor(width: number, height: number): number {
  return Math.max(6, Math.min(Math.min(width, height) * 0.34, 28))
}

/** `feDisplacementMap` scale for a bezel: the largest shift is about 0.85 of the bezel. */
export function scaleFor(bezel: number): number {
  return Math.round(bezel * 1.7)
}

/**
 * Compute RGBA pixels of the map.
 * @param geometry - size, corner radius and bezel width.
 * @returns `width × height × 4` bytes in row-major order.
 */
export function lensPixels({ width, height, radius, bezel }: LensGeometry): Uint8ClampedArray {
  const data = new Uint8ClampedArray(width * height * 4)
  const hx = width / 2
  const hy = height / 2
  const r = Math.max(0, Math.min(radius, hx, hy))
  for (let j = 0; j < height; j++) {
    for (let i = 0; i < width; i++) {
      const px = i + 0.5 - hx
      const py = j + 0.5 - hy
      const qx = Math.abs(px) - (hx - r)
      const qy = Math.abs(py) - (hy - r)
      // Signed distance to the rounded rectangle, negated: positive inside.
      const depth = -(Math.hypot(Math.max(qx, 0), Math.max(qy, 0)) + Math.min(Math.max(qx, qy), 0) - r)
      let dx = 0
      let dy = 0
      if (depth > 0 && depth < bezel) {
        let nx: number
        let ny: number
        if (qx > 0 && qy > 0) {
          const length = Math.hypot(qx, qy) || 1
          nx = (qx / length) * Math.sign(px)
          ny = (qy / length) * Math.sign(py)
        } else if (qx > qy) {
          nx = Math.sign(px)
          ny = 0
        } else {
          nx = 0
          ny = Math.sign(py)
        }
        const strength = Math.pow(1 - depth / bezel, 2.4)
        dx = -nx * strength
        dy = -ny * strength
      }
      const k = (j * width + i) * 4
      data[k] = 128 + dx * 127
      data[k + 1] = 128 + dy * 127
      data[k + 2] = 128
      data[k + 3] = 255
    }
  }
  return data
}
