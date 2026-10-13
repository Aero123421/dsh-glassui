/*! dsh-glassui 0.1.1 | MIT License | https://github.com/Aero123421/dsh-glassui#readme */

// src/host/index.ts
import z from "@deepseek-ai/schemastery";

// src/shared/settings.ts
var ENTRY_ID = "dsh-glassui";
var BOOT_GLOBAL = "__DSH_GLASSUI__";
var WALLPAPER_PRESETS = [
  "bay",
  "sunrise",
  "meadow",
  "graphite",
  "lagoon",
  "dusk",
  "dune",
  "tide",
  "aurora",
  "bloom",
  "prism"
];
var WALLPAPER_CHOICES = ["auto", ...WALLPAPER_PRESETS, "none", "custom"];
var SIDEBAR_STYLES = ["floating", "docked"];
var CODE_BLOCK_STYLES = ["glass", "solid"];
var DEFAULT_SETTINGS = Object.freeze({
  enabled: true,
  tint: 35,
  wallpaper: "auto",
  wallpaperUrl: "",
  sidebar: "floating",
  codeBlocks: "glass",
  refraction: true,
  highlights: true,
  exclude: ""
});
var MAX_WALLPAPER_URL_LENGTH = 2048;
var MAX_EXCLUDE_LENGTH = 1e3;
var IMAGE_DATA_URL = /^data:image\/(?:png|jpe?g|webp|gif|avif);base64,[a-z0-9+/=]+$/i;
function isSafeWallpaperUrl(url) {
  if (url.length === 0 || url.length > MAX_WALLPAPER_URL_LENGTH) return false;
  if (/["'()\\\s<>]/.test(url)) return false;
  if (IMAGE_DATA_URL.test(url)) return true;
  if (url.startsWith("/") && !url.startsWith("//")) return true;
  if (url.startsWith("./") || url.startsWith("../")) return true;
  try {
    const parsed = new URL(url);
    return parsed.protocol === "https:" || parsed.protocol === "http:";
  } catch {
    return false;
  }
}
function oneOf(choices, value, fallback) {
  return typeof value === "string" && choices.includes(value) ? value : fallback;
}
function bool(value, fallback) {
  return typeof value === "boolean" ? value : fallback;
}
function text(value, max, fallback) {
  return typeof value === "string" && value.length <= max ? value.trim() : fallback;
}
function normalizeSettings(input) {
  const source = typeof input === "object" && input !== null ? input : {};
  const d2 = DEFAULT_SETTINGS;
  const tint = typeof source.tint === "number" && Number.isFinite(source.tint) ? Math.min(100, Math.max(0, Math.round(source.tint))) : d2.tint;
  return {
    enabled: bool(source.enabled, d2.enabled),
    tint,
    wallpaper: oneOf(WALLPAPER_CHOICES, source.wallpaper, d2.wallpaper),
    wallpaperUrl: text(source.wallpaperUrl, MAX_WALLPAPER_URL_LENGTH, d2.wallpaperUrl),
    sidebar: oneOf(SIDEBAR_STYLES, source.sidebar, d2.sidebar),
    codeBlocks: oneOf(CODE_BLOCK_STYLES, source.codeBlocks, d2.codeBlocks),
    refraction: bool(source.refraction, d2.refraction),
    highlights: bool(source.highlights, d2.highlights),
    exclude: text(source.exclude, MAX_EXCLUDE_LENGTH, d2.exclude)
  };
}

// src/shared/dom.ts
var ATTR_ROOT = "data-glassui";
var ATTR_SIDEBAR = "data-glassui-sidebar";
var ATTR_WALLPAPER = "data-glassui-wallpaper";
var ATTR_HIGHLIGHTS = "data-glassui-highlights";
var ATTR_RAW = "data-glassui-raw";
var ATTR_SURFACE = "data-glassui-surface";
var ATTR_FILL = "data-glassui-fill";
var ATTR_FLAT = "data-glassui-flat";
var ATTR_ECHO = "data-glassui-echo";
var ATTR_PAINT = "data-glassui-paint";
var ATTR_FLOAT = "data-glassui-float";
var ATTR_LENS = "data-glassui-lens";
var ATTR_EXCLUDED = "data-glassui-excluded";
var ATTR_MATERIAL = "data-glassui-material";
var ATTR_OWNED = "data-glassui-owned";
var VAR_TINT = "--glassui-t";
var VAR_WALLPAPER = "--glassui-wallpaper";
var VAR_POINTER_X = "--glassui-lx";
var VAR_POINTER_Y = "--glassui-ly";
var FOOTPRINT_SELECTOR = [
  ATTR_ROOT,
  ATTR_SIDEBAR,
  ATTR_WALLPAPER,
  ATTR_HIGHLIGHTS,
  ATTR_RAW,
  ATTR_SURFACE,
  ATTR_FILL,
  ATTR_FLAT,
  ATTR_ECHO,
  ATTR_PAINT,
  ATTR_FLOAT,
  ATTR_LENS,
  ATTR_EXCLUDED,
  ATTR_OWNED
].map((name2) => `[${name2}]`).join(",");

// src/shared/tokens.ts
var FILL_TOKENS = {
  input: "--dsw-specific-input-major",
  sidebar: "--dsw-specific-sidebar-fill",
  toast: "--dsw-alias-toast-bg",
  tooltip: "--dsw-alias-tooltip-bg",
  layer1: "--dsw-alias-bg-layer-1",
  layer2: "--dsw-alias-bg-layer-2",
  layer3: "--dsw-alias-bg-layer-3",
  floating: "--dsw-alias-button-floating-fill",
  elevated: "--dsw-alias-button-elevated-fill",
  overlay: "--dsw-alias-bg-overlay",
  base: "--dsw-alias-bg-base",
  code: "--dsw-alias-markdown-code-block",
  codeBanner: "--dsw-alias-markdown-code-block-banner"
};
var FILL_KEYS = Object.keys(FILL_TOKENS);
var RESERVED_TOKENS = [
  "--dsw-alias-markdown-inline-code",
  "--dsw-alias-markdown-citation",
  "--dsw-alias-markdown-tag",
  "--dsw-alias-markdown-placeholder",
  "--dsw-specific-bubble",
  "--dsw-specific-selector",
  "--dsw-specific-tip",
  "--dsw-specific-login-input",
  "--dsw-specific-sidebar-nav-item-active",
  "--dsw-specific-sidebar-nav-item-hover",
  "--dsw-alias-bg-module-platform",
  "--dsw-alias-bg-multi-select",
  "--dsw-alias-bg-document-preview",
  "--dsw-alias-interactive-bg-hover-solid",
  "--dsw-alias-button-primary-dimmed"
];
var ELEVATION_TOKENS = {
  panel: "--dsw-elevation-panel",
  prominent: "--dsw-elevation-prominent",
  soft: "--dsw-elevation-soft"
};
var ELEVATION_STROKE = "--dsw-elevation-stroke";
var ELEVATION_SENTINELS = {
  panel: "rgb(1 0 61 / 0)",
  prominent: "rgb(1 0 62 / 0)",
  soft: "rgb(1 0 63 / 0)"
};
var MENU_TOKENS = {
  fill: "--dsw-menu-surface-fill",
  filter: "--dsw-menu-backdrop-filter",
  overlayFill: "--dsw-specific-menu",
  groupHeader: "--dsw-alias-menu-group-header-fill"
};
var DARK_ATTRIBUTE = "data-ds-dark-theme";
var PLATFORM_ATTRIBUTE = "data-platform";
var ALL_UPSTREAM_TOKENS = [
  ...Object.values(FILL_TOKENS),
  ...RESERVED_TOKENS,
  ...Object.values(ELEVATION_TOKENS),
  ELEVATION_STROKE,
  ...Object.values(MENU_TOKENS)
];

// src/shared/wallpapers.ts
var RIBBONS = {
  bay: {
    light: {
      bg: ["#b9d4ff", "#eef4ff"],
      glow: "rgba(255,255,255,0.75)",
      crest: "rgba(255,255,255,0.7)",
      shade: "rgba(10,40,120,0.16)",
      ribbons: [
        ["#9cc6ff", "#cfe6ff"],
        ["#5f9df7", "#97ccff"],
        ["#4cc0e8", "#3d8ff2"],
        ["#2f72e8", "#6aaeff"],
        ["#1d4fc4", "#4b8cf0"]
      ]
    },
    dark: {
      bg: ["#040a1e", "#0b1838"],
      glow: "rgba(80,140,255,0.35)",
      crest: "rgba(170,210,255,0.35)",
      shade: "rgba(0,0,0,0.45)",
      ribbons: [
        ["#183a8c", "#2c63c6"],
        ["#1d55b8", "#3a8ae0"],
        ["#0f7fa6", "#2266c8"],
        ["#2a3fb0", "#4b78e0"],
        ["#101f66", "#2647a8"]
      ]
    }
  },
  sunrise: {
    light: {
      bg: ["#ffd9bf", "#fff1e8"],
      glow: "rgba(255,255,255,0.75)",
      crest: "rgba(255,255,255,0.7)",
      shade: "rgba(120,30,60,0.14)",
      ribbons: [
        ["#ffc49a", "#ffe0c2"],
        ["#ff9a8c", "#ffc49a"],
        ["#f084b8", "#ff9e94"],
        ["#b58cf0", "#ef8cc4"],
        ["#7e6ee6", "#b48cf0"]
      ]
    },
    dark: {
      bg: ["#16070c", "#24101e"],
      glow: "rgba(255,120,90,0.3)",
      crest: "rgba(255,200,170,0.3)",
      shade: "rgba(0,0,0,0.45)",
      ribbons: [
        ["#8a3a1e", "#c26434"],
        ["#962c44", "#c4563a"],
        ["#82306e", "#b0425a"],
        ["#55348e", "#8a3a7c"],
        ["#2c2470", "#5a3490"]
      ]
    }
  },
  meadow: {
    light: {
      bg: ["#d2f0dc", "#f1faf3"],
      glow: "rgba(255,255,255,0.75)",
      crest: "rgba(255,255,255,0.7)",
      shade: "rgba(10,80,50,0.14)",
      ribbons: [
        ["#bfeac8", "#e0f6e2"],
        ["#86d8a6", "#bdebc8"],
        ["#4fc4a6", "#86d89a"],
        ["#2fa59a", "#5ccaa0"],
        ["#1f7f86", "#3aa894"]
      ]
    },
    dark: {
      bg: ["#03120e", "#08201a"],
      glow: "rgba(80,220,160,0.25)",
      crest: "rgba(170,255,210,0.28)",
      shade: "rgba(0,0,0,0.45)",
      ribbons: [
        ["#185c3c", "#2a8a56"],
        ["#11704e", "#2a9a66"],
        ["#0c6a64", "#1a8a6e"],
        ["#0e5260", "#127068"],
        ["#08343e", "#0e5056"]
      ]
    }
  },
  graphite: {
    light: {
      bg: ["#dcdfe5", "#f4f5f7"],
      glow: "rgba(255,255,255,0.8)",
      crest: "rgba(255,255,255,0.75)",
      shade: "rgba(0,0,0,0.12)",
      ribbons: [
        ["#d2d6dd", "#e8eaee"],
        ["#b6bbc5", "#d4d8de"],
        ["#9aa0ac", "#bcc1c9"],
        ["#7e8492", "#a2a8b2"],
        ["#626876", "#868c98"]
      ]
    },
    dark: {
      bg: ["#0c0d0f", "#1a1b1f"],
      glow: "rgba(255,255,255,0.12)",
      crest: "rgba(255,255,255,0.22)",
      shade: "rgba(0,0,0,0.5)",
      ribbons: [
        ["#3a3d44", "#4e525a"],
        ["#2e3138", "#43474f"],
        ["#25282e", "#373a42"],
        ["#1d1f24", "#2c2f35"],
        ["#141519", "#22242a"]
      ]
    }
  },
  lagoon: {
    light: {
      bg: ["#bdeff0", "#effbfb"],
      glow: "rgba(255,255,255,0.75)",
      crest: "rgba(255,255,255,0.7)",
      shade: "rgba(0,90,100,0.15)",
      ribbons: [
        ["#a6eae6", "#d4f6f2"],
        ["#62d6d2", "#9fe9e2"],
        ["#2fc0c8", "#5fd8cf"],
        ["#1a9fb6", "#3cc2c4"],
        ["#0d7a98", "#1fa2b2"]
      ]
    },
    dark: {
      bg: ["#021317", "#06252b"],
      glow: "rgba(60,220,220,0.25)",
      crest: "rgba(160,255,250,0.28)",
      shade: "rgba(0,0,0,0.45)",
      ribbons: [
        ["#0d5a5e", "#178a86"],
        ["#0b6e72", "#16a0a0"],
        ["#08707e", "#0f8e96"],
        ["#075866", "#0b7682"],
        ["#043a46", "#08525e"]
      ]
    }
  },
  dusk: {
    light: {
      bg: ["#e4d7ff", "#fbf1ff"],
      glow: "rgba(255,255,255,0.7)",
      crest: "rgba(255,255,255,0.7)",
      shade: "rgba(70,20,110,0.15)",
      ribbons: [
        ["#d9c4ff", "#f0e2ff"],
        ["#b79cff", "#dcc0ff"],
        ["#e39cdc", "#c3a0ff"],
        ["#f08cb4", "#d896e8"],
        ["#8a6cf0", "#cf86d8"]
      ]
    },
    dark: {
      bg: ["#0c0718", "#1a0f2e"],
      glow: "rgba(190,120,255,0.28)",
      crest: "rgba(230,190,255,0.3)",
      shade: "rgba(0,0,0,0.45)",
      ribbons: [
        ["#3a2a7a", "#5a3c9c"],
        ["#4c2a86", "#7a3a96"],
        ["#6a2c80", "#9a3c78"],
        ["#3c2470", "#6a2e86"],
        ["#1e1650", "#3c2070"]
      ]
    }
  },
  dune: {
    light: {
      bg: ["#f6e6cf", "#fdf7ee"],
      glow: "rgba(255,255,255,0.75)",
      crest: "rgba(255,255,255,0.7)",
      shade: "rgba(110,60,10,0.14)",
      ribbons: [
        ["#f2dcb8", "#faecd6"],
        ["#e9c590", "#f4dbb2"],
        ["#dea872", "#ecc48e"],
        ["#cf8c5c", "#e2a876"],
        ["#b46e48", "#cf8c60"]
      ]
    },
    dark: {
      bg: ["#120c06", "#22170c"],
      glow: "rgba(255,180,100,0.22)",
      crest: "rgba(255,220,170,0.26)",
      shade: "rgba(0,0,0,0.5)",
      ribbons: [
        ["#5a3e22", "#7a5630"],
        ["#6a4426", "#8c5c32"],
        ["#74462a", "#966036"],
        ["#5e3622", "#7c4a2c"],
        ["#3a2216", "#58321e"]
      ]
    }
  },
  tide: {
    light: {
      bg: ["#c6e2ff", "#f2f8ff"],
      glow: "rgba(255,255,255,0.8)",
      crest: "rgba(255,255,255,0.75)",
      shade: "rgba(10,50,130,0.16)",
      ribbons: [
        ["#9ee6ff", "#d0f4ff"],
        ["#5fcff5", "#9ee6ff"],
        ["#3aa8f0", "#5fd0f0"],
        ["#2f7ce6", "#4fb0f2"],
        ["#2552c8", "#3c88e8"]
      ]
    },
    dark: {
      bg: ["#020b1a", "#071a33"],
      glow: "rgba(60,170,255,0.32)",
      crest: "rgba(150,220,255,0.35)",
      shade: "rgba(0,0,0,0.45)",
      ribbons: [
        ["#0f4a7a", "#1d74a8"],
        ["#0e5f8e", "#1f8ac0"],
        ["#0b6f9a", "#1a5fb0"],
        ["#173c94", "#2c66c8"],
        ["#0b1f5a", "#183c94"]
      ]
    }
  }
};
var BLOB_GEOMETRY = [
  [0.14, 0.2, 760],
  [0.76, 0.16, 820],
  [0.5, 0.86, 860],
  [0.94, 0.7, 640],
  [0.26, 0.92, 600]
];
var PRISM_GEOMETRY = [
  [0.5, 0.08, 720],
  [0.08, 0.58, 700],
  [0.92, 0.5, 700],
  [0.32, 0.98, 620],
  [0.72, 0.96, 640]
];
var BLOBS = {
  prism: {
    light: {
      geometry: PRISM_GEOMETRY,
      bg: ["#f6f3ff", "#fdf8fb"],
      glow: "rgba(255,255,255,0.6)",
      blobs: [
        ["#ff9ad5", 0.8],
        ["#8fd3ff", 0.85],
        ["#ffe27a", 0.7],
        ["#a6f0c6", 0.75],
        ["#c3a2ff", 0.75]
      ]
    },
    dark: {
      geometry: PRISM_GEOMETRY,
      bg: ["#07061a", "#0d0a22"],
      glow: "rgba(160,120,255,0.16)",
      blobs: [
        ["#ff3fa4", 0.55],
        ["#2d9cff", 0.6],
        ["#ffb800", 0.35],
        ["#20d38a", 0.5],
        ["#8b5cff", 0.55]
      ]
    }
  },
  aurora: {
    light: {
      bg: ["#e6efff", "#f6f1ff"],
      glow: "rgba(255,255,255,0.55)",
      blobs: [
        ["#5ec8ff", 0.9],
        ["#a98bff", 0.8],
        ["#4fe0b8", 0.75],
        ["#7aa6ff", 0.8],
        ["#ffb3dc", 0.6]
      ]
    },
    dark: {
      bg: ["#03061a", "#080b26"],
      glow: "rgba(80,120,255,0.18)",
      blobs: [
        ["#14c995", 0.7],
        ["#2f55ff", 0.75],
        ["#7d3cff", 0.65],
        ["#00a6cc", 0.6],
        ["#ff3d93", 0.38]
      ]
    }
  },
  bloom: {
    light: {
      bg: ["#fff0e6", "#fff8f2"],
      glow: "rgba(255,255,255,0.55)",
      blobs: [
        ["#ff9a6b", 0.85],
        ["#ff86ba", 0.75],
        ["#ffc94d", 0.7],
        ["#b893ff", 0.65],
        ["#ff7676", 0.5]
      ]
    },
    dark: {
      bg: ["#10060d", "#1b0a16"],
      glow: "rgba(255,120,90,0.16)",
      blobs: [
        ["#ff5a2a", 0.6],
        ["#e0307f", 0.65],
        ["#ffa600", 0.38],
        ["#6f3cff", 0.6],
        ["#ff3a3a", 0.38]
      ]
    }
  }
};
var PRESETS = {
  bay: { style: "ribbons" },
  sunrise: { style: "ribbons" },
  meadow: { style: "ribbons" },
  graphite: { style: "ribbons" },
  lagoon: { style: "ribbons" },
  dusk: { style: "ribbons" },
  dune: { style: "ribbons" },
  tide: {
    style: "ribbons",
    groups: [
      { items: [0, 1, 2], motion: { duration: 36, x: 1.2, y: 2.4, scale: 1.02 } },
      { items: [3, 4], motion: { duration: 26, x: -1.8, y: -2.2, scale: 1 } }
    ]
  },
  aurora: {
    style: "blobs",
    groups: [
      { items: [0, 3], motion: { duration: 48, x: 7, y: 5, scale: 1.12 } },
      { items: [1, 4], motion: { duration: 60, x: -8, y: 6, scale: 0.9 } },
      { items: [2], motion: { duration: 40, x: 5, y: -7, scale: 1.15 } }
    ]
  },
  prism: {
    style: "blobs",
    groups: [
      { items: [0, 2], motion: { duration: 56, x: 6, y: 7, scale: 1.1 } },
      { items: [1, 3], motion: { duration: 46, x: 7, y: -6, scale: 1.12 } },
      { items: [4], motion: { duration: 38, x: -8, y: -5, scale: 0.92 } }
    ]
  },
  bloom: {
    style: "blobs",
    groups: [
      { items: [0, 3], motion: { duration: 52, x: -6, y: 6, scale: 1.14 } },
      { items: [1, 4], motion: { duration: 44, x: 7, y: -5, scale: 0.9 } },
      { items: [2], motion: { duration: 64, x: -5, y: -6, scale: 1.1 } }
    ]
  }
};
var WIDTH = 1600;
var HEIGHT = 1e3;
var SAMPLES = 12;
function round(value) {
  return String(Math.round(value * 10) / 10);
}
function crest(k) {
  const y0 = HEIGHT * (0.26 + k * 0.135);
  const amp = HEIGHT * (0.075 + k * 0.012);
  const f1 = 0.9 + k * 0.28;
  const f2 = 2.1 + k * 0.45;
  const phase = k * 1.15 + 0.4;
  const points = [];
  for (let i = 0; i <= SAMPLES; i++) {
    const x = -WIDTH * 0.06 + WIDTH * 1.12 * i / SAMPLES;
    const s = x / WIDTH;
    const y = y0 + amp * Math.sin(f1 * s * Math.PI * 2 + phase) + amp * 0.38 * Math.sin(f2 * s * Math.PI * 2 + phase * 1.7) - s * HEIGHT * 0.1;
    points.push([x, y]);
  }
  return points;
}
function ribbonPath(points) {
  const at = (i) => points[Math.max(0, Math.min(points.length - 1, i))] ?? [0, 0];
  const [x0, y0] = at(0);
  let d2 = `M${round(x0)} ${round(y0)}`;
  for (let i = 0; i < points.length - 1; i++) {
    const [ax, ay] = at(i - 1);
    const [bx, by] = at(i);
    const [cx, cy] = at(i + 1);
    const [ex, ey] = at(i + 2);
    const c1x = bx + (cx - ax) / 6;
    const c1y = by + (cy - ay) / 6;
    const c2x = cx - (ex - bx) / 6;
    const c2y = cy - (ey - by) / 6;
    d2 += `C${round(c1x)} ${round(c1y)} ${round(c2x)} ${round(c2y)} ${round(cx)} ${round(cy)}`;
  }
  const right = WIDTH * 1.06;
  const left = -WIDTH * 0.06;
  return `${d2}L${round(right)} ${HEIGHT + 120}L${round(left)} ${HEIGHT + 120}Z`;
}
function part() {
  return { defs: /* @__PURE__ */ new Map(), body: [] };
}
function svg(parts2, overscan = 0) {
  const defs = /* @__PURE__ */ new Map();
  for (const { defs: own } of parts2) for (const [id, markup] of own) defs.set(id, markup);
  const box = [-WIDTH * overscan, -HEIGHT * overscan, WIDTH * (1 + 2 * overscan), HEIGHT * (1 + 2 * overscan)];
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${box.map(round).join(" ")}" preserveAspectRatio="xMidYMid slice"><defs>${[...defs.values()].join("")}</defs>${parts2.flatMap((p) => p.body).join("")}</svg>`;
}
function base(bg, glow) {
  const p = part();
  p.defs.set(
    "b",
    `<linearGradient id="b" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${bg[0]}"/><stop offset="1" stop-color="${bg[1]}"/></linearGradient>`
  );
  p.defs.set(
    "g",
    `<radialGradient id="g" gradientUnits="userSpaceOnUse" cx="${WIDTH * 0.22}" cy="${HEIGHT * 0.05}" r="${WIDTH * 0.7}"><stop offset="0" stop-color="${glow}"/><stop offset="1" stop-color="${glow}" stop-opacity="0"/></radialGradient>`
  );
  p.body.push(
    `<rect width="${WIDTH}" height="${HEIGHT}" fill="url(#b)"/>`,
    `<rect width="${WIDTH}" height="${HEIGHT}" fill="url(#g)"/>`
  );
  return p;
}
function ribbon(palette, k) {
  const [from, to] = palette.ribbons[k] ?? ["#000", "#000"];
  const p = part();
  p.defs.set(
    "s",
    '<filter id="s" x="-10%" y="-20%" width="120%" height="140%"><feGaussianBlur stdDeviation="18"/></filter>'
  );
  p.defs.set(
    "f",
    '<filter id="f" x="-5%" y="-5%" width="110%" height="110%"><feGaussianBlur stdDeviation="2.5"/></filter>'
  );
  p.defs.set(
    "c",
    '<filter id="c" x="-5%" y="-5%" width="110%" height="110%"><feGaussianBlur stdDeviation="3"/></filter>'
  );
  p.defs.set(
    `r${k}`,
    `<linearGradient id="r${k}" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="${WIDTH}" y2="${HEIGHT * 0.4}"><stop offset="0" stop-color="${from}"/><stop offset="1" stop-color="${to}"/></linearGradient>`
  );
  p.defs.set(`p${k}`, `<path id="p${k}" d="${ribbonPath(crest(k))}"/>`);
  p.body.push(
    `<use href="#p${k}" fill="${palette.shade}" filter="url(#s)" transform="translate(0 -12)"/>`,
    `<use href="#p${k}" fill="url(#r${k})" fill-opacity="0.92" filter="url(#f)"/>`,
    `<use href="#p${k}" fill="none" stroke="${palette.crest}" stroke-width="2.5" filter="url(#c)"/>`
  );
  return p;
}
function blob(palette, k, mirror) {
  const [color, strength] = palette.blobs[k] ?? ["#000", 0];
  const [x, y, r] = (palette.geometry ?? BLOB_GEOMETRY)[k] ?? [0.5, 0.5, 400];
  const cx = (mirror ? 1 - x : x) * WIDTH;
  const cy = y * HEIGHT;
  const p = part();
  p.defs.set(
    `o${k}`,
    `<radialGradient id="o${k}"><stop offset="0" stop-color="${color}" stop-opacity="${strength}"/><stop offset="0.45" stop-color="${color}" stop-opacity="${round(strength * 0.55)}"/><stop offset="1" stop-color="${color}" stop-opacity="0"/></radialGradient>`
  );
  p.body.push(`<circle cx="${round(cx)}" cy="${round(cy)}" r="${r}" fill="url(#o${k})"/>`);
  return p;
}
function parts(preset, scheme) {
  if (PRESETS[preset].style === "blobs") {
    const palette2 = BLOBS[preset][scheme];
    return [base(palette2.bg, palette2.glow), ...palette2.blobs.map((_, k) => blob(palette2, k, preset === "bloom"))];
  }
  const palette = RIBBONS[preset][scheme];
  return [base(palette.bg, palette.glow), ...palette.ribbons.map((_, k) => ribbon(palette, k))];
}
function wallpaperSvg(preset, scheme) {
  return svg(parts(preset, scheme));
}
function svgDataUrl(markup) {
  const encoded = markup.replace(/"/g, "'").replace(/\s+/g, " ").replace(/%/g, "%25").replace(/#/g, "%23").replace(/</g, "%3C").replace(/>/g, "%3E");
  return `data:image/svg+xml,${encoded}`;
}
function svgImage(markup) {
  return `url("${svgDataUrl(markup)}")`;
}
var images = /* @__PURE__ */ new Map();
function wallpaperImage(preset, scheme) {
  const key = `${preset}|${scheme}`;
  let image = images.get(key);
  if (image === void 0) {
    image = svgImage(wallpaperSvg(preset, scheme));
    images.set(key, image);
  }
  return image;
}

// src/shared/stylesheet.ts
function paneRim(top, bottom, edge) {
  const rect = "<rect width='100%' height='100%' rx='18' ry='18' fill='none'";
  const svg2 = [
    "<svg xmlns='http://www.w3.org/2000/svg' width='100%' height='100%'>",
    "<linearGradient id='r' x1='0' y1='0' x2='1' y2='1'>",
    `<stop offset='0' stop-color='white' stop-opacity='${top}'/>`,
    `<stop offset='0.32' stop-color='white' stop-opacity='${Math.round(top * 20) / 100}'/>`,
    "<stop offset='0.62' stop-color='white' stop-opacity='0.04'/>",
    `<stop offset='1' stop-color='white' stop-opacity='${bottom}'/>`,
    "</linearGradient>",
    `${rect} stroke='black' stroke-opacity='${edge}' stroke-width='1'/>`,
    `${rect} stroke='url(#r)' stroke-width='3'/>`,
    "</svg>"
  ].join("");
  return `url("${svgDataUrl(svg2)}")`;
}
var ROOT = `:root[${ATTR_ROOT}]`;
var BODY = `${ROOT} body`;
var BODY_DARK = `${ROOT} body[${DARK_ATTRIBUTE}]`;
var INCLUDED = `:not([${ATTR_EXCLUDED}]):not([${ATTR_EXCLUDED}] *)`;
var S = `${BODY} [${ATTR_SURFACE}]${INCLUDED}`;
var GLASS = `${S}:not([${ATTR_SURFACE}="backdrop"]):not([${ATTR_FLAT}])`;
function rule(selector, declarations) {
  const body = Object.entries(declarations).map(([property, value]) => `  ${property}: ${value};`).join("\n");
  return `${selector} {
${body}
}`;
}
var ROOT_PARAMETERS = {
  [VAR_TINT]: 0.35,
  "--glassui-floor": 0,
  "--glassui-tt": `max(var(${VAR_TINT}), var(--glassui-floor))`,
  "--glassui-blur": "calc(6px + var(--glassui-tt) * 22px)",
  "--glassui-filter": "blur(var(--glassui-blur)) saturate(180%) brightness(1.04)",
  "--glassui-fill-a": "calc(0.16 + var(--glassui-tt) * 0.62)",
  "--glassui-dense-a": "calc(0.52 + var(--glassui-tt) * 0.42)",
  "--glassui-smoke-a": "calc(0.5 + var(--glassui-tt) * 0.42)",
  // Code blocks stay dense enough for syntax colors to keep their contrast.
  "--glassui-code-a": "calc(0.4 + var(--glassui-tt) * 0.4)",
  "--glassui-canvas-a": "calc(0.4 + var(--glassui-tt) * 0.5)",
  "--glassui-inset": "8px",
  // Matches the rx of the pane rim drawn by paneRim().
  "--glassui-radius": "18px"
};
var LIGHT = {
  "--glassui-glass-rgb": "255 255 255",
  "--glassui-smoke-rgb": "30 30 32",
  "--glassui-rim-hi": 0.9,
  "--glassui-rim-lo": 0.38,
  "--glassui-edge": "rgb(0 0 0 / 0.08)",
  "--glassui-drop": "rgb(0 0 0 / 0.14)",
  "--glassui-contact": "rgb(0 0 0 / 0.2)",
  "--glassui-sheen": 0.2,
  "--glassui-light-a": 0.3,
  "--glassui-pane-rim": paneRim(0.95, 0.5, 0.1),
  [MENU_TOKENS.fill]: "rgb(250 250 252 / calc(0.5 + var(--glassui-tt) * 0.42))",
  [MENU_TOKENS.overlayFill]: "rgb(250 250 252 / calc(0.86 + var(--glassui-tt) * 0.12))",
  [MENU_TOKENS.groupHeader]: "rgb(250 250 252 / calc(0.8 + var(--glassui-tt) * 0.18))"
};
var DARK = {
  "--glassui-glass-rgb": "40 40 44",
  "--glassui-smoke-rgb": "44 44 48",
  "--glassui-rim-hi": 0.32,
  "--glassui-rim-lo": 0.12,
  "--glassui-edge": "rgb(0 0 0 / 0.5)",
  "--glassui-drop": "rgb(0 0 0 / 0.42)",
  "--glassui-contact": "rgb(0 0 0 / 0.5)",
  "--glassui-sheen": 0.07,
  "--glassui-light-a": 0.16,
  "--glassui-pane-rim": paneRim(0.4, 0.18, 0.5),
  [MENU_TOKENS.fill]: "rgb(44 44 48 / calc(0.46 + var(--glassui-tt) * 0.44))",
  [MENU_TOKENS.overlayFill]: "rgb(44 44 48 / calc(0.86 + var(--glassui-tt) * 0.12))",
  [MENU_TOKENS.groupHeader]: "rgb(44 44 48 / calc(0.8 + var(--glassui-tt) * 0.18))"
};
var SHARED = {
  "--glassui-rim": [
    "inset 1px 1.5px 0 -0.5px rgb(255 255 255 / var(--glassui-rim-hi))",
    "inset -1px -1px 0 -0.5px rgb(255 255 255 / var(--glassui-rim-lo))",
    "0 0 0 0.5px var(--glassui-edge)"
  ].join(", "),
  "--glassui-contained-rim": [
    "inset 1px 1.5px 0 -0.5px rgb(255 255 255 / var(--glassui-rim-hi))",
    "inset -1px -1px 0 -0.5px rgb(255 255 255 / var(--glassui-rim-lo))",
    "inset 0 0 0 0.5px var(--glassui-edge)"
  ].join(", "),
  [MENU_TOKENS.filter]: "var(--glassui-filter)",
  // Each watched fill as <body> sees it, nudges and other plugins' overrides
  // included. Surfaces mix their glass from these; a surface cannot reference
  // the token it overrides.
  ...Object.fromEntries(FILL_KEYS.map((key) => [`--glassui-src-${key}`, `var(${FILL_TOKENS[key]})`]))
};
function elevation(sentinel, near, far) {
  return `var(${ELEVATION_STROKE}), var(--glassui-rim), ${near}, ${far}, 0 0 0 0 ${sentinel}`;
}
var ELEVATION = {
  [ELEVATION_TOKENS.panel]: elevation(
    ELEVATION_SENTINELS.panel,
    "0 2px 6px -2px rgb(0 0 0 / 0.06)",
    "0 10px 28px -10px var(--glassui-drop)"
  ),
  [ELEVATION_TOKENS.prominent]: elevation(
    ELEVATION_SENTINELS.prominent,
    "0 3px 10px -3px rgb(0 0 0 / 0.08)",
    "0 18px 44px -14px var(--glassui-drop)"
  ),
  [ELEVATION_TOKENS.soft]: elevation(
    ELEVATION_SENTINELS.soft,
    "0 4px 16px -6px rgb(0 0 0 / 0.06)",
    "0 14px 36px -16px var(--glassui-drop)"
  )
};
var CONTAINED_ELEVATION = Object.fromEntries(
  ["panel", "prominent", "soft"].map((tier) => [
    ELEVATION_TOKENS[tier],
    [
      "var(--glassui-contained-rim)",
      "0 1px 2px -3px rgb(0 0 0 / 0.12)",
      "0 16px 22px -33px var(--glassui-contact)",
      `0 0 0 0 ${ELEVATION_SENTINELS[tier]}`
    ].join(", ")
  ])
);
var SHEEN = "linear-gradient(to bottom, rgb(255 255 255 / var(--glassui-sheen)), rgb(255 255 255 / 0) 42%)";
var POINTER_LIGHT = `radial-gradient(240px circle at var(${VAR_POINTER_X}) var(${VAR_POINTER_Y}), rgb(255 255 255 / var(--glassui-light-a)), rgb(255 255 255 / 0) 70%)`;
var PROPERTIES = [
  `@property ${VAR_POINTER_X} { syntax: '<length>'; inherits: false; initial-value: -9999px; }`,
  `@property ${VAR_POINTER_Y} { syntax: '<length>'; inherits: false; initial-value: -9999px; }`,
  "@property --glassui-light { syntax: '*'; inherits: false; }",
  "@property --glassui-pane { syntax: '*'; inherits: false; }",
  "@property --glassui-pane-size { syntax: '*'; inherits: false; }"
].join("\n");
function surfaceRules() {
  const rules = [
    rule(`${S}[${ATTR_SURFACE}="sidebar"], ${S}[${ATTR_SURFACE}="composer"]`, {
      "--glassui-pct": "calc(var(--glassui-fill-a) * 100%)"
    }),
    rule(`${S}[${ATTR_SURFACE}="panel"], ${S}[${ATTR_SURFACE}="menu"]`, {
      "--glassui-pct": "calc(var(--glassui-dense-a) * 100%)"
    }),
    rule(`${S}[${ATTR_SURFACE}="smoke"]`, { "--glassui-pct": "calc(var(--glassui-smoke-a) * 100%)" }),
    rule(`${S}[${ATTR_SURFACE}="code"]`, { "--glassui-pct": "calc(var(--glassui-code-a) * 100%)" }),
    rule(`${S}[${ATTR_SURFACE}="backdrop"], ${S}[${ATTR_FLAT}]`, { "--glassui-pct": "0%" }),
    rule(GLASS, {
      // Safari ignores custom properties inside the prefixed property.
      "-webkit-backdrop-filter": "blur(18px) saturate(180%)",
      "backdrop-filter": "var(--glassui-filter)"
    }),
    // A part repainting its surface's glass would double it; the surface shows through instead.
    rule(`${BODY} [${ATTR_ECHO}]`, { "background-color": "transparent" }),
    // Code blocks have no elevation of their own; a rim gives the glass its edge.
    rule(`${GLASS}[${ATTR_SURFACE}="code"]`, { "box-shadow": "var(--glassui-rim)" })
  ];
  const mix = (key) => `color-mix(in srgb, var(--glassui-src-${key}) var(--glassui-pct, 100%), transparent)`;
  for (const key of FILL_KEYS) rules.push(rule(`${S}[${ATTR_FILL}="${key}"]`, { [FILL_TOKENS[key]]: mix(key) }));
  rules.push(rule(`${S}[${ATTR_SURFACE}="code"][${ATTR_FILL}="code"]`, { [FILL_TOKENS.codeBanner]: "transparent" }));
  rules.push(
    // Layers, top to bottom: pointer light, the floating pane's rim, the sheen.
    // Each layer is `none` unless its feature is on; sizes keep the floating
    // pane's layers inside its inset.
    rule(`${GLASS}[${ATTR_PAINT}]`, {
      // Browsers without @property (Firefox before 128) inherit these; reset them per surface.
      "--glassui-pane": "none",
      "--glassui-pane-size": "100% 100%",
      "background-image": `var(--glassui-light, none), var(--glassui-pane, none), ${SHEEN}`,
      "background-size": "auto, var(--glassui-pane-size, 100% 100%), var(--glassui-pane-size, 100% 100%)",
      "background-position": "center",
      "background-repeat": "no-repeat"
    }),
    rule(`${ROOT}[${ATTR_HIGHLIGHTS}] body [${ATTR_SURFACE}][${ATTR_PAINT}]`, { "--glassui-light": POINTER_LIGHT }),
    // The floating sidebar is shaped with clip-path rather than margins: DSH sizes
    // the sidebar's content in pixels to the column width, and a margin would cut
    // into it. The 8px inset falls inside the content's own padding.
    rule(`${ROOT}[${ATTR_SIDEBAR}="floating"] body [${ATTR_SURFACE}="sidebar"][${ATTR_FLOAT}]:not([${ATTR_FLAT}])`, {
      "clip-path": "inset(var(--glassui-inset) round var(--glassui-radius))",
      "--glassui-pane": "var(--glassui-pane-rim)",
      "--glassui-pane-size": "calc(100% - 2 * var(--glassui-inset)) calc(100% - 2 * var(--glassui-inset))"
    })
  );
  return rules;
}
function materialRules() {
  const M = `${BODY} [${ATTR_MATERIAL}]${INCLUDED}`;
  return [
    rule(`${M}:not([${ATTR_MATERIAL}="none"])`, {
      "-webkit-backdrop-filter": "blur(18px) saturate(180%)",
      "backdrop-filter": "var(--glassui-filter)",
      "box-shadow": "var(--glassui-rim), 0 10px 28px -10px var(--glassui-drop)"
    }),
    rule(`${M}[${ATTR_MATERIAL}="regular"]`, {
      "background-color": "rgb(var(--glassui-glass-rgb) / var(--glassui-fill-a))"
    }),
    rule(`${M}[${ATTR_MATERIAL}="dense"]`, {
      "background-color": "rgb(var(--glassui-glass-rgb) / var(--glassui-dense-a))"
    }),
    rule(`${M}[${ATTR_MATERIAL}="smoke"]`, {
      "background-color": "rgb(var(--glassui-smoke-rgb) / var(--glassui-smoke-a))"
    })
  ];
}
function wallpaperRules() {
  return [
    rule(`${ROOT}[${ATTR_WALLPAPER}]`, {
      background: `var(${VAR_WALLPAPER}) center / cover no-repeat fixed`
    }),
    rule(`${ROOT}[${ATTR_WALLPAPER}] body${INCLUDED}`, {
      "background-color": "color-mix(in srgb, var(--dsw-alias-bg-base) calc(var(--glassui-canvas-a) * 100%), transparent)"
    })
  ];
}
function accessibilityRules() {
  return [
    `@media (prefers-contrast: more) {
${[
      rule(ROOT, { "--glassui-floor": 0.85 }),
      rule(BODY, { "--glassui-edge": "rgb(0 0 0 / 0.45)" }),
      rule(BODY_DARK, { "--glassui-edge": "rgb(255 255 255 / 0.35)" })
    ].join("\n")}
}`,
    `@media (prefers-reduced-transparency: reduce) {
${rule(ROOT, { "--glassui-floor": 1 })}
}`,
    // Without backdrop blur, translucent fills would put text over unblurred content.
    `@supports not ((backdrop-filter: blur(1px)) or (-webkit-backdrop-filter: blur(1px))) {
${rule(ROOT, { "--glassui-floor": 0.9 })}
}`
  ].join("\n");
}
function buildStylesheet() {
  const parts2 = [
    "/* dsh-glassui: Liquid Glass-style material for DSH Web. Inert unless <html> has data-glassui. */",
    PROPERTIES,
    // Screens only: printing keeps DSH's own look. Forced colors (Windows high contrast) is left alone entirely.
    "@media screen and (forced-colors: none) {",
    rule(ROOT, ROOT_PARAMETERS),
    rule(`${BODY}${INCLUDED}`, { ...LIGHT, ...SHARED }),
    rule(`${BODY_DARK}${INCLUDED}`, DARK),
    rule(`${BODY}${INCLUDED}, ${BODY} *${INCLUDED}`, ELEVATION),
    rule(`${S}[${ATTR_LENS}]`, {
      ...CONTAINED_ELEVATION,
      // Menus can use literal shadows rather than elevation tokens.
      "box-shadow": "var(--glassui-contained-rim), 0 16px 22px -33px var(--glassui-contact)"
    }),
    ...surfaceRules(),
    ...materialRules(),
    ...wallpaperRules(),
    accessibilityRules(),
    "}"
  ];
  return `${parts2.join("\n")}
`;
}

// src/host/boot.ts
function bootWallpaper(settings) {
  switch (settings.wallpaper) {
    case "none":
      return void 0;
    case "custom": {
      if (!isSafeWallpaperUrl(settings.wallpaperUrl)) return void 0;
      const image = `url("${settings.wallpaperUrl}")`;
      return { name: "custom", light: image, dark: image, skipOnDarwin: false };
    }
    case "auto":
      return {
        name: "bay",
        light: wallpaperImage("bay", "light"),
        dark: wallpaperImage("bay", "dark"),
        skipOnDarwin: true
      };
    default:
      return {
        name: settings.wallpaper,
        light: wallpaperImage(settings.wallpaper, "light"),
        dark: wallpaperImage(settings.wallpaper, "dark"),
        skipOnDarwin: false
      };
  }
}
function scriptJson(value) {
  return JSON.stringify(value).replace(/</g, "\\u003c");
}
function bootScript(settings) {
  const wallpaper = bootWallpaper(settings);
  return [
    "(function () {",
    "  try {",
    "    var root = document.documentElement",
    "    if (window.matchMedia && window.matchMedia('(forced-colors: active)').matches) return",
    `    root.setAttribute(${scriptJson(ATTR_ROOT)}, 'on')`,
    `    root.setAttribute(${scriptJson(ATTR_SIDEBAR)}, ${scriptJson(settings.sidebar)})`,
    `    root.style.setProperty(${scriptJson(VAR_TINT)}, ${scriptJson(String(settings.tint / 100))})`,
    `    var wallpaper = ${scriptJson(wallpaper ?? null)}`,
    `    if (!wallpaper || (wallpaper.skipOnDarwin && root.getAttribute(${scriptJson(PLATFORM_ATTRIBUTE)}) === 'darwin')) return`,
    `    var dark = !!document.body && document.body.hasAttribute(${scriptJson(DARK_ATTRIBUTE)})`,
    `    root.style.setProperty(${scriptJson(VAR_WALLPAPER)}, dark ? wallpaper.dark : wallpaper.light)`,
    `    root.setAttribute(${scriptJson(ATTR_WALLPAPER)}, wallpaper.name)`,
    "  } catch (error) {",
    "    console.warn('dsh-glassui: boot script failed; the client half will apply the material', error)",
    "  }",
    "})()"
  ].join("\n");
}
var stylesheet;
function bootRows(settings, version) {
  const payload = { version, settings };
  const rows = [{ kind: "global", name: BOOT_GLOBAL, value: payload }];
  if (!settings.enabled) return rows;
  stylesheet ??= buildStylesheet();
  rows.push({ kind: "style", text: stylesheet }, { kind: "script", placement: "body", text: bootScript(settings) });
  return rows;
}

// src/host/index.ts
var name = ENTRY_ID;
var d = DEFAULT_SETTINGS;
var Config = z.object({
  enabled: z.boolean().default(d.enabled).description("Turn the glass material on or off.").volatile(),
  tint: z.natural().max(100).default(d.tint).description("Glass density, from 0 (ultra clear) to 100 (fully tinted).").volatile(),
  wallpaper: z.union(WALLPAPER_CHOICES).default(d.wallpaper).description('Wallpaper behind the app. "auto" uses Bay in a browser and none in the macOS desktop app.').volatile(),
  wallpaperUrl: z.string().max(MAX_WALLPAPER_URL_LENGTH).default(d.wallpaperUrl).description(
    'Image used when the wallpaper is "custom": an http(s) URL, a path on this server, or a base64 image data URL.'
  ).volatile(),
  sidebar: z.union(SIDEBAR_STYLES).default(d.sidebar).description("Float the sidebar as an inset pane, or keep it docked.").volatile(),
  codeBlocks: z.union(CODE_BLOCK_STYLES).default(d.codeBlocks).description("Show code blocks as a denser glass, or keep them solid.").volatile(),
  refraction: z.boolean().default(d.refraction).description("Bend the background along glass edges (Chromium-based browsers only).").volatile(),
  highlights: z.boolean().default(d.highlights).description("A soft highlight that follows the pointer.").volatile(),
  exclude: z.string().max(MAX_EXCLUDE_LENGTH).default(d.exclude).description("CSS selectors of elements the plugin must leave untouched, comma separated.").volatile()
});
function readSettings(config) {
  return normalizeSettings({
    enabled: config.enabled.get(),
    tint: config.tint.get(),
    wallpaper: config.wallpaper.get(),
    wallpaperUrl: config.wallpaperUrl.get(),
    sidebar: config.sidebar.get(),
    codeBlocks: config.codeBlocks.get(),
    refraction: config.refraction.get(),
    highlights: config.highlights.get(),
    exclude: config.exclude.get()
  });
}
function apply(ctx, config) {
  ctx.on("webserver/index-inject", (table) => {
    table.push(...bootRows(readSettings(config), "0.1.1"));
  });
}
export {
  Config,
  apply,
  name,
  readSettings
};
