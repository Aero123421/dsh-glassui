/*! dsh-glassui 0.2.5 | MIT License | https://github.com/Aero123421/dsh-glassui#readme */
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __commonJS = (cb, mod) => function __require() {
  try {
    return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
  } catch (e) {
    throw mod = 0, e;
  }
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// node_modules/semver/internal/constants.js
var require_constants = __commonJS({
  "node_modules/semver/internal/constants.js"(exports, module) {
    "use strict";
    var SEMVER_SPEC_VERSION = "2.0.0";
    var MAX_LENGTH = 256;
    var MAX_SAFE_INTEGER = Number.MAX_SAFE_INTEGER || /* istanbul ignore next */
    9007199254740991;
    var MAX_SAFE_COMPONENT_LENGTH = 16;
    var MAX_SAFE_BUILD_LENGTH = MAX_LENGTH - 6;
    var RELEASE_TYPES = [
      "major",
      "premajor",
      "minor",
      "preminor",
      "patch",
      "prepatch",
      "prerelease"
    ];
    module.exports = {
      MAX_LENGTH,
      MAX_SAFE_COMPONENT_LENGTH,
      MAX_SAFE_BUILD_LENGTH,
      MAX_SAFE_INTEGER,
      RELEASE_TYPES,
      SEMVER_SPEC_VERSION,
      FLAG_INCLUDE_PRERELEASE: 1,
      FLAG_LOOSE: 2
    };
  }
});

// node_modules/semver/internal/debug.js
var require_debug = __commonJS({
  "node_modules/semver/internal/debug.js"(exports, module) {
    "use strict";
    var debug = typeof process === "object" && process.env && process.env.NODE_DEBUG && /\bsemver\b/i.test(process.env.NODE_DEBUG) ? (...args) => console.error("SEMVER", ...args) : () => {
    };
    module.exports = debug;
  }
});

// node_modules/semver/internal/re.js
var require_re = __commonJS({
  "node_modules/semver/internal/re.js"(exports, module) {
    "use strict";
    var {
      MAX_SAFE_COMPONENT_LENGTH,
      MAX_SAFE_BUILD_LENGTH,
      MAX_LENGTH
    } = require_constants();
    var debug = require_debug();
    exports = module.exports = {};
    var re = exports.re = [];
    var safeRe = exports.safeRe = [];
    var src = exports.src = [];
    var safeSrc = exports.safeSrc = [];
    var t = exports.t = {};
    var R = 0;
    var LETTERDASHNUMBER = "[a-zA-Z0-9-]";
    var safeRegexReplacements = [
      ["\\s", 1],
      ["\\d", MAX_LENGTH],
      [LETTERDASHNUMBER, MAX_SAFE_BUILD_LENGTH]
    ];
    var makeSafeRegex = (value) => {
      for (const [token, max] of safeRegexReplacements) {
        value = value.split(`${token}*`).join(`${token}{0,${max}}`).split(`${token}+`).join(`${token}{1,${max}}`);
      }
      return value;
    };
    var createToken = (name2, value, isGlobal) => {
      const safe = makeSafeRegex(value);
      const index = R++;
      debug(name2, index, value);
      t[name2] = index;
      src[index] = value;
      safeSrc[index] = safe;
      re[index] = new RegExp(value, isGlobal ? "g" : void 0);
      safeRe[index] = new RegExp(safe, isGlobal ? "g" : void 0);
    };
    createToken("NUMERICIDENTIFIER", "0|[1-9]\\d*");
    createToken("NUMERICIDENTIFIERLOOSE", "\\d+");
    createToken("NONNUMERICIDENTIFIER", `\\d*[a-zA-Z-]${LETTERDASHNUMBER}*`);
    createToken("MAINVERSION", `(${src[t.NUMERICIDENTIFIER]})\\.(${src[t.NUMERICIDENTIFIER]})\\.(${src[t.NUMERICIDENTIFIER]})`);
    createToken("MAINVERSIONLOOSE", `(${src[t.NUMERICIDENTIFIERLOOSE]})\\.(${src[t.NUMERICIDENTIFIERLOOSE]})\\.(${src[t.NUMERICIDENTIFIERLOOSE]})`);
    createToken("PRERELEASEIDENTIFIER", `(?:${src[t.NONNUMERICIDENTIFIER]}|${src[t.NUMERICIDENTIFIER]})`);
    createToken("PRERELEASEIDENTIFIERLOOSE", `(?:${src[t.NONNUMERICIDENTIFIER]}|${src[t.NUMERICIDENTIFIERLOOSE]})`);
    createToken("PRERELEASE", `(?:-(${src[t.PRERELEASEIDENTIFIER]}(?:\\.${src[t.PRERELEASEIDENTIFIER]})*))`);
    createToken("PRERELEASELOOSE", `(?:-?(${src[t.PRERELEASEIDENTIFIERLOOSE]}(?:\\.${src[t.PRERELEASEIDENTIFIERLOOSE]})*))`);
    createToken("BUILDIDENTIFIER", `${LETTERDASHNUMBER}+`);
    createToken("BUILD", `(?:\\+(${src[t.BUILDIDENTIFIER]}(?:\\.${src[t.BUILDIDENTIFIER]})*))`);
    createToken("FULLPLAIN", `v?${src[t.MAINVERSION]}${src[t.PRERELEASE]}?${src[t.BUILD]}?`);
    createToken("FULL", `^${src[t.FULLPLAIN]}$`);
    createToken("LOOSEPLAIN", `[v=\\s]*${src[t.MAINVERSIONLOOSE]}${src[t.PRERELEASELOOSE]}?${src[t.BUILD]}?`);
    createToken("LOOSE", `^${src[t.LOOSEPLAIN]}$`);
    createToken("GTLT", "((?:<|>)?=?)");
    createToken("XRANGEIDENTIFIERLOOSE", `${src[t.NUMERICIDENTIFIERLOOSE]}|x|X|\\*`);
    createToken("XRANGEIDENTIFIER", `${src[t.NUMERICIDENTIFIER]}|x|X|\\*`);
    createToken("XRANGEPLAIN", `[v=\\s]*(${src[t.XRANGEIDENTIFIER]})(?:\\.(${src[t.XRANGEIDENTIFIER]})(?:\\.(${src[t.XRANGEIDENTIFIER]})(?:${src[t.PRERELEASE]})?${src[t.BUILD]}?)?)?`);
    createToken("XRANGEPLAINLOOSE", `[v=\\s]*(${src[t.XRANGEIDENTIFIERLOOSE]})(?:\\.(${src[t.XRANGEIDENTIFIERLOOSE]})(?:\\.(${src[t.XRANGEIDENTIFIERLOOSE]})(?:${src[t.PRERELEASELOOSE]})?${src[t.BUILD]}?)?)?`);
    createToken("XRANGE", `^${src[t.GTLT]}\\s*${src[t.XRANGEPLAIN]}$`);
    createToken("XRANGELOOSE", `^${src[t.GTLT]}\\s*${src[t.XRANGEPLAINLOOSE]}$`);
    createToken("COERCEPLAIN", `${"(^|[^\\d])(\\d{1,"}${MAX_SAFE_COMPONENT_LENGTH}})(?:\\.(\\d{1,${MAX_SAFE_COMPONENT_LENGTH}}))?(?:\\.(\\d{1,${MAX_SAFE_COMPONENT_LENGTH}}))?`);
    createToken("COERCE", `${src[t.COERCEPLAIN]}(?:$|[^\\d])`);
    createToken("COERCEFULL", src[t.COERCEPLAIN] + `(?:${src[t.PRERELEASE]})?(?:${src[t.BUILD]})?(?:$|[^\\d])`);
    createToken("COERCERTL", src[t.COERCE], true);
    createToken("COERCERTLFULL", src[t.COERCEFULL], true);
    createToken("LONETILDE", "(?:~>?)");
    createToken("TILDETRIM", `(\\s*)${src[t.LONETILDE]}\\s+`, true);
    exports.tildeTrimReplace = "$1~";
    createToken("TILDE", `^${src[t.LONETILDE]}${src[t.XRANGEPLAIN]}$`);
    createToken("TILDELOOSE", `^${src[t.LONETILDE]}${src[t.XRANGEPLAINLOOSE]}$`);
    createToken("LONECARET", "(?:\\^)");
    createToken("CARETTRIM", `(\\s*)${src[t.LONECARET]}\\s+`, true);
    exports.caretTrimReplace = "$1^";
    createToken("CARET", `^${src[t.LONECARET]}${src[t.XRANGEPLAIN]}$`);
    createToken("CARETLOOSE", `^${src[t.LONECARET]}${src[t.XRANGEPLAINLOOSE]}$`);
    createToken("COMPARATORLOOSE", `^${src[t.GTLT]}\\s*(${src[t.LOOSEPLAIN]})$|^$`);
    createToken("COMPARATOR", `^${src[t.GTLT]}\\s*(${src[t.FULLPLAIN]})$|^$`);
    createToken("COMPARATORTRIM", `(\\s*)${src[t.GTLT]}\\s*(${src[t.LOOSEPLAIN]}|${src[t.XRANGEPLAIN]})`, true);
    exports.comparatorTrimReplace = "$1$2$3";
    createToken("HYPHENRANGE", `^\\s*(${src[t.XRANGEPLAIN]})\\s+-\\s+(${src[t.XRANGEPLAIN]})\\s*$`);
    createToken("HYPHENRANGELOOSE", `^\\s*(${src[t.XRANGEPLAINLOOSE]})\\s+-\\s+(${src[t.XRANGEPLAINLOOSE]})\\s*$`);
    createToken("STAR", "(<|>)?=?\\s*\\*");
    createToken("GTE0", "^\\s*>=\\s*0\\.0\\.0\\s*$");
    createToken("GTE0PRE", "^\\s*>=\\s*0\\.0\\.0-0\\s*$");
  }
});

// node_modules/semver/internal/parse-options.js
var require_parse_options = __commonJS({
  "node_modules/semver/internal/parse-options.js"(exports, module) {
    "use strict";
    var looseOption = Object.freeze({ loose: true });
    var emptyOpts = Object.freeze({});
    var parseOptions = (options) => {
      if (!options) {
        return emptyOpts;
      }
      if (typeof options !== "object") {
        return looseOption;
      }
      return options;
    };
    module.exports = parseOptions;
  }
});

// node_modules/semver/internal/identifiers.js
var require_identifiers = __commonJS({
  "node_modules/semver/internal/identifiers.js"(exports, module) {
    "use strict";
    var numeric = /^[0-9]+$/;
    var compareIdentifiers = (a, b) => {
      if (typeof a === "number" && typeof b === "number") {
        return a === b ? 0 : a < b ? -1 : 1;
      }
      const anum = numeric.test(a);
      const bnum = numeric.test(b);
      if (anum && bnum) {
        a = +a;
        b = +b;
      }
      return a === b ? 0 : anum && !bnum ? -1 : bnum && !anum ? 1 : a < b ? -1 : 1;
    };
    var rcompareIdentifiers = (a, b) => compareIdentifiers(b, a);
    module.exports = {
      compareIdentifiers,
      rcompareIdentifiers
    };
  }
});

// node_modules/semver/classes/semver.js
var require_semver = __commonJS({
  "node_modules/semver/classes/semver.js"(exports, module) {
    "use strict";
    var debug = require_debug();
    var { MAX_LENGTH, MAX_SAFE_INTEGER } = require_constants();
    var { safeRe: re, t } = require_re();
    var parseOptions = require_parse_options();
    var { compareIdentifiers } = require_identifiers();
    var isPrereleaseIdentifier = (prerelease, identifier) => {
      const identifiers = identifier.split(".");
      if (identifiers.length > prerelease.length) {
        return false;
      }
      for (let i = 0; i < identifiers.length; i++) {
        if (compareIdentifiers(prerelease[i], identifiers[i]) !== 0) {
          return false;
        }
      }
      return true;
    };
    var SemVer = class _SemVer {
      constructor(version, options) {
        options = parseOptions(options);
        if (version instanceof _SemVer) {
          if (version.loose === !!options.loose && version.includePrerelease === !!options.includePrerelease) {
            return version;
          } else {
            version = version.version;
          }
        } else if (typeof version !== "string") {
          throw new TypeError(`Invalid version. Must be a string. Got type "${typeof version}".`);
        }
        if (version.length > MAX_LENGTH) {
          throw new TypeError(
            `version is longer than ${MAX_LENGTH} characters`
          );
        }
        debug("SemVer", version, options);
        this.options = options;
        this.loose = !!options.loose;
        this.includePrerelease = !!options.includePrerelease;
        const m = version.trim().match(options.loose ? re[t.LOOSE] : re[t.FULL]);
        if (!m) {
          throw new TypeError(`Invalid Version: ${version}`);
        }
        this.raw = version;
        this.major = +m[1];
        this.minor = +m[2];
        this.patch = +m[3];
        if (this.major > MAX_SAFE_INTEGER || this.major < 0) {
          throw new TypeError("Invalid major version");
        }
        if (this.minor > MAX_SAFE_INTEGER || this.minor < 0) {
          throw new TypeError("Invalid minor version");
        }
        if (this.patch > MAX_SAFE_INTEGER || this.patch < 0) {
          throw new TypeError("Invalid patch version");
        }
        if (!m[4]) {
          this.prerelease = [];
        } else {
          this.prerelease = m[4].split(".").map((id) => {
            if (/^[0-9]+$/.test(id)) {
              const num = +id;
              if (num >= 0 && num < MAX_SAFE_INTEGER) {
                return num;
              }
            }
            return id;
          });
        }
        this.build = m[5] ? m[5].split(".") : [];
        this.format();
      }
      format() {
        this.version = `${this.major}.${this.minor}.${this.patch}`;
        if (this.prerelease.length) {
          this.version += `-${this.prerelease.join(".")}`;
        }
        return this.version;
      }
      toString() {
        return this.version;
      }
      compare(other) {
        debug("SemVer.compare", this.version, this.options, other);
        if (!(other instanceof _SemVer)) {
          if (typeof other === "string" && other === this.version) {
            return 0;
          }
          other = new _SemVer(other, this.options);
        }
        if (other.version === this.version) {
          return 0;
        }
        return this.compareMain(other) || this.comparePre(other);
      }
      compareMain(other) {
        if (!(other instanceof _SemVer)) {
          other = new _SemVer(other, this.options);
        }
        if (this.major < other.major) {
          return -1;
        }
        if (this.major > other.major) {
          return 1;
        }
        if (this.minor < other.minor) {
          return -1;
        }
        if (this.minor > other.minor) {
          return 1;
        }
        if (this.patch < other.patch) {
          return -1;
        }
        if (this.patch > other.patch) {
          return 1;
        }
        return 0;
      }
      comparePre(other) {
        if (!(other instanceof _SemVer)) {
          other = new _SemVer(other, this.options);
        }
        if (this.prerelease.length && !other.prerelease.length) {
          return -1;
        } else if (!this.prerelease.length && other.prerelease.length) {
          return 1;
        } else if (!this.prerelease.length && !other.prerelease.length) {
          return 0;
        }
        let i = 0;
        do {
          const a = this.prerelease[i];
          const b = other.prerelease[i];
          debug("prerelease compare", i, a, b);
          if (a === void 0 && b === void 0) {
            return 0;
          } else if (b === void 0) {
            return 1;
          } else if (a === void 0) {
            return -1;
          } else if (a === b) {
            continue;
          } else {
            return compareIdentifiers(a, b);
          }
        } while (++i);
      }
      compareBuild(other) {
        if (!(other instanceof _SemVer)) {
          other = new _SemVer(other, this.options);
        }
        let i = 0;
        do {
          const a = this.build[i];
          const b = other.build[i];
          debug("build compare", i, a, b);
          if (a === void 0 && b === void 0) {
            return 0;
          } else if (b === void 0) {
            return 1;
          } else if (a === void 0) {
            return -1;
          } else if (a === b) {
            continue;
          } else {
            return compareIdentifiers(a, b);
          }
        } while (++i);
      }
      // preminor will bump the version up to the next minor release, and immediately
      // down to pre-release. premajor and prepatch work the same way.
      inc(release, identifier, identifierBase) {
        if (release.startsWith("pre")) {
          if (!identifier && identifierBase === false) {
            throw new Error("invalid increment argument: identifier is empty");
          }
          if (identifier) {
            const match = `-${identifier}`.match(this.options.loose ? re[t.PRERELEASELOOSE] : re[t.PRERELEASE]);
            if (!match || match[1] !== identifier) {
              throw new Error(`invalid identifier: ${identifier}`);
            }
          }
        }
        switch (release) {
          case "premajor":
            this.prerelease.length = 0;
            this.patch = 0;
            this.minor = 0;
            this.major++;
            this.inc("pre", identifier, identifierBase);
            break;
          case "preminor":
            this.prerelease.length = 0;
            this.patch = 0;
            this.minor++;
            this.inc("pre", identifier, identifierBase);
            break;
          case "prepatch":
            this.prerelease.length = 0;
            this.inc("patch", identifier, identifierBase);
            this.inc("pre", identifier, identifierBase);
            break;
          // If the input is a non-prerelease version, this acts the same as
          // prepatch.
          case "prerelease":
            if (this.prerelease.length === 0) {
              this.inc("patch", identifier, identifierBase);
            }
            this.inc("pre", identifier, identifierBase);
            break;
          case "release":
            if (this.prerelease.length === 0) {
              throw new Error(`version ${this.raw} is not a prerelease`);
            }
            this.prerelease.length = 0;
            break;
          case "major":
            if (this.minor !== 0 || this.patch !== 0 || this.prerelease.length === 0) {
              this.major++;
            }
            this.minor = 0;
            this.patch = 0;
            this.prerelease = [];
            break;
          case "minor":
            if (this.patch !== 0 || this.prerelease.length === 0) {
              this.minor++;
            }
            this.patch = 0;
            this.prerelease = [];
            break;
          case "patch":
            if (this.prerelease.length === 0) {
              this.patch++;
            }
            this.prerelease = [];
            break;
          // This probably shouldn't be used publicly.
          // 1.0.0 'pre' would become 1.0.0-0 which is the wrong direction.
          case "pre": {
            const base2 = Number(identifierBase) ? 1 : 0;
            if (this.prerelease.length === 0) {
              this.prerelease = [base2];
            } else {
              let i = this.prerelease.length;
              while (--i >= 0) {
                if (typeof this.prerelease[i] === "number") {
                  this.prerelease[i]++;
                  i = -2;
                }
              }
              if (i === -1) {
                if (identifier === this.prerelease.join(".") && identifierBase === false) {
                  throw new Error("invalid increment argument: identifier already exists");
                }
                this.prerelease.push(base2);
              }
            }
            if (identifier) {
              let prerelease = [identifier, base2];
              if (identifierBase === false) {
                prerelease = [identifier];
              }
              if (isPrereleaseIdentifier(this.prerelease, identifier)) {
                const prereleaseBase = this.prerelease[identifier.split(".").length];
                if (isNaN(prereleaseBase)) {
                  this.prerelease = prerelease;
                }
              } else {
                this.prerelease = prerelease;
              }
            }
            break;
          }
          default:
            throw new Error(`invalid increment argument: ${release}`);
        }
        this.raw = this.format();
        if (this.build.length) {
          this.raw += `+${this.build.join(".")}`;
        }
        return this;
      }
    };
    module.exports = SemVer;
  }
});

// node_modules/semver/functions/parse.js
var require_parse = __commonJS({
  "node_modules/semver/functions/parse.js"(exports, module) {
    "use strict";
    var SemVer = require_semver();
    var parse = (version, options, throwErrors = false) => {
      if (version instanceof SemVer) {
        return version;
      }
      try {
        return new SemVer(version, options);
      } catch (er) {
        if (!throwErrors) {
          return null;
        }
        throw er;
      }
    };
    module.exports = parse;
  }
});

// node_modules/semver/functions/valid.js
var require_valid = __commonJS({
  "node_modules/semver/functions/valid.js"(exports, module) {
    "use strict";
    var parse = require_parse();
    var valid = (version, options) => {
      const v = parse(version, options);
      return v ? v.version : null;
    };
    module.exports = valid;
  }
});

// node_modules/semver/functions/clean.js
var require_clean = __commonJS({
  "node_modules/semver/functions/clean.js"(exports, module) {
    "use strict";
    var parse = require_parse();
    var clean = (version, options) => {
      const s = parse(version.trim().replace(/^[=v]+/, ""), options);
      return s ? s.version : null;
    };
    module.exports = clean;
  }
});

// node_modules/semver/functions/inc.js
var require_inc = __commonJS({
  "node_modules/semver/functions/inc.js"(exports, module) {
    "use strict";
    var SemVer = require_semver();
    var inc = (version, release, options, identifier, identifierBase) => {
      if (typeof options === "string") {
        identifierBase = identifier;
        identifier = options;
        options = void 0;
      }
      try {
        return new SemVer(
          version instanceof SemVer ? version.version : version,
          options
        ).inc(release, identifier, identifierBase).version;
      } catch (er) {
        return null;
      }
    };
    module.exports = inc;
  }
});

// node_modules/semver/functions/diff.js
var require_diff = __commonJS({
  "node_modules/semver/functions/diff.js"(exports, module) {
    "use strict";
    var parse = require_parse();
    var diff = (version1, version2) => {
      const v1 = parse(version1, null, true);
      const v2 = parse(version2, null, true);
      const comparison = v1.compare(v2);
      if (comparison === 0) {
        return null;
      }
      const v1Higher = comparison > 0;
      const highVersion = v1Higher ? v1 : v2;
      const lowVersion = v1Higher ? v2 : v1;
      const highHasPre = !!highVersion.prerelease.length;
      const lowHasPre = !!lowVersion.prerelease.length;
      if (lowHasPre && !highHasPre) {
        if (!lowVersion.patch && !lowVersion.minor) {
          return "major";
        }
        if (lowVersion.compareMain(highVersion) === 0) {
          if (lowVersion.minor && !lowVersion.patch) {
            return "minor";
          }
          return "patch";
        }
      }
      const prefix = highHasPre ? "pre" : "";
      if (v1.major !== v2.major) {
        return prefix + "major";
      }
      if (v1.minor !== v2.minor) {
        return prefix + "minor";
      }
      if (v1.patch !== v2.patch) {
        return prefix + "patch";
      }
      return "prerelease";
    };
    module.exports = diff;
  }
});

// node_modules/semver/functions/major.js
var require_major = __commonJS({
  "node_modules/semver/functions/major.js"(exports, module) {
    "use strict";
    var SemVer = require_semver();
    var major = (a, loose) => new SemVer(a, loose).major;
    module.exports = major;
  }
});

// node_modules/semver/functions/minor.js
var require_minor = __commonJS({
  "node_modules/semver/functions/minor.js"(exports, module) {
    "use strict";
    var SemVer = require_semver();
    var minor = (a, loose) => new SemVer(a, loose).minor;
    module.exports = minor;
  }
});

// node_modules/semver/functions/patch.js
var require_patch = __commonJS({
  "node_modules/semver/functions/patch.js"(exports, module) {
    "use strict";
    var SemVer = require_semver();
    var patch = (a, loose) => new SemVer(a, loose).patch;
    module.exports = patch;
  }
});

// node_modules/semver/functions/prerelease.js
var require_prerelease = __commonJS({
  "node_modules/semver/functions/prerelease.js"(exports, module) {
    "use strict";
    var parse = require_parse();
    var prerelease = (version, options) => {
      const parsed = parse(version, options);
      return parsed && parsed.prerelease.length ? parsed.prerelease : null;
    };
    module.exports = prerelease;
  }
});

// node_modules/semver/functions/compare.js
var require_compare = __commonJS({
  "node_modules/semver/functions/compare.js"(exports, module) {
    "use strict";
    var SemVer = require_semver();
    var compare = (a, b, loose) => new SemVer(a, loose).compare(new SemVer(b, loose));
    module.exports = compare;
  }
});

// node_modules/semver/functions/rcompare.js
var require_rcompare = __commonJS({
  "node_modules/semver/functions/rcompare.js"(exports, module) {
    "use strict";
    var compare = require_compare();
    var rcompare = (a, b, loose) => compare(b, a, loose);
    module.exports = rcompare;
  }
});

// node_modules/semver/functions/compare-loose.js
var require_compare_loose = __commonJS({
  "node_modules/semver/functions/compare-loose.js"(exports, module) {
    "use strict";
    var compare = require_compare();
    var compareLoose = (a, b) => compare(a, b, true);
    module.exports = compareLoose;
  }
});

// node_modules/semver/functions/compare-build.js
var require_compare_build = __commonJS({
  "node_modules/semver/functions/compare-build.js"(exports, module) {
    "use strict";
    var SemVer = require_semver();
    var compareBuild = (a, b, loose) => {
      const versionA = new SemVer(a, loose);
      const versionB = new SemVer(b, loose);
      return versionA.compare(versionB) || versionA.compareBuild(versionB);
    };
    module.exports = compareBuild;
  }
});

// node_modules/semver/functions/sort.js
var require_sort = __commonJS({
  "node_modules/semver/functions/sort.js"(exports, module) {
    "use strict";
    var compareBuild = require_compare_build();
    var sort = (list, loose) => list.sort((a, b) => compareBuild(a, b, loose));
    module.exports = sort;
  }
});

// node_modules/semver/functions/rsort.js
var require_rsort = __commonJS({
  "node_modules/semver/functions/rsort.js"(exports, module) {
    "use strict";
    var compareBuild = require_compare_build();
    var rsort = (list, loose) => list.sort((a, b) => compareBuild(b, a, loose));
    module.exports = rsort;
  }
});

// node_modules/semver/functions/gt.js
var require_gt = __commonJS({
  "node_modules/semver/functions/gt.js"(exports, module) {
    "use strict";
    var compare = require_compare();
    var gt = (a, b, loose) => compare(a, b, loose) > 0;
    module.exports = gt;
  }
});

// node_modules/semver/functions/lt.js
var require_lt = __commonJS({
  "node_modules/semver/functions/lt.js"(exports, module) {
    "use strict";
    var compare = require_compare();
    var lt = (a, b, loose) => compare(a, b, loose) < 0;
    module.exports = lt;
  }
});

// node_modules/semver/functions/eq.js
var require_eq = __commonJS({
  "node_modules/semver/functions/eq.js"(exports, module) {
    "use strict";
    var compare = require_compare();
    var eq = (a, b, loose) => compare(a, b, loose) === 0;
    module.exports = eq;
  }
});

// node_modules/semver/functions/neq.js
var require_neq = __commonJS({
  "node_modules/semver/functions/neq.js"(exports, module) {
    "use strict";
    var compare = require_compare();
    var neq = (a, b, loose) => compare(a, b, loose) !== 0;
    module.exports = neq;
  }
});

// node_modules/semver/functions/gte.js
var require_gte = __commonJS({
  "node_modules/semver/functions/gte.js"(exports, module) {
    "use strict";
    var compare = require_compare();
    var gte = (a, b, loose) => compare(a, b, loose) >= 0;
    module.exports = gte;
  }
});

// node_modules/semver/functions/lte.js
var require_lte = __commonJS({
  "node_modules/semver/functions/lte.js"(exports, module) {
    "use strict";
    var compare = require_compare();
    var lte = (a, b, loose) => compare(a, b, loose) <= 0;
    module.exports = lte;
  }
});

// node_modules/semver/functions/cmp.js
var require_cmp = __commonJS({
  "node_modules/semver/functions/cmp.js"(exports, module) {
    "use strict";
    var eq = require_eq();
    var neq = require_neq();
    var gt = require_gt();
    var gte = require_gte();
    var lt = require_lt();
    var lte = require_lte();
    var cmp = (a, op, b, loose) => {
      switch (op) {
        case "===":
          if (typeof a === "object") {
            a = a.version;
          }
          if (typeof b === "object") {
            b = b.version;
          }
          return a === b;
        case "!==":
          if (typeof a === "object") {
            a = a.version;
          }
          if (typeof b === "object") {
            b = b.version;
          }
          return a !== b;
        case "":
        case "=":
        case "==":
          return eq(a, b, loose);
        case "!=":
          return neq(a, b, loose);
        case ">":
          return gt(a, b, loose);
        case ">=":
          return gte(a, b, loose);
        case "<":
          return lt(a, b, loose);
        case "<=":
          return lte(a, b, loose);
        default:
          throw new TypeError(`Invalid operator: ${op}`);
      }
    };
    module.exports = cmp;
  }
});

// node_modules/semver/functions/coerce.js
var require_coerce = __commonJS({
  "node_modules/semver/functions/coerce.js"(exports, module) {
    "use strict";
    var SemVer = require_semver();
    var parse = require_parse();
    var { safeRe: re, t } = require_re();
    var coerce = (version, options) => {
      if (version instanceof SemVer) {
        return version;
      }
      if (typeof version === "number") {
        version = String(version);
      }
      if (typeof version !== "string") {
        return null;
      }
      options = options || {};
      let match = null;
      if (!options.rtl) {
        match = version.match(options.includePrerelease ? re[t.COERCEFULL] : re[t.COERCE]);
      } else {
        const coerceRtlRegex = options.includePrerelease ? re[t.COERCERTLFULL] : re[t.COERCERTL];
        let next;
        while ((next = coerceRtlRegex.exec(version)) && (!match || match.index + match[0].length !== version.length)) {
          if (!match || next.index + next[0].length !== match.index + match[0].length) {
            match = next;
          }
          coerceRtlRegex.lastIndex = next.index + next[1].length + next[2].length;
        }
        coerceRtlRegex.lastIndex = -1;
      }
      if (match === null) {
        return null;
      }
      const major = match[2];
      const minor = match[3] || "0";
      const patch = match[4] || "0";
      const prerelease = options.includePrerelease && match[5] ? `-${match[5]}` : "";
      const build = options.includePrerelease && match[6] ? `+${match[6]}` : "";
      return parse(`${major}.${minor}.${patch}${prerelease}${build}`, options);
    };
    module.exports = coerce;
  }
});

// node_modules/semver/functions/truncate.js
var require_truncate = __commonJS({
  "node_modules/semver/functions/truncate.js"(exports, module) {
    "use strict";
    var parse = require_parse();
    var constants = require_constants();
    var SemVer = require_semver();
    var truncate = (version, truncation, options) => {
      if (!constants.RELEASE_TYPES.includes(truncation)) {
        return null;
      }
      const clonedVersion = cloneInputVersion(version, options);
      return clonedVersion && doTruncation(clonedVersion, truncation);
    };
    var cloneInputVersion = (version, options) => {
      const versionStringToParse = version instanceof SemVer ? version.version : version;
      return parse(versionStringToParse, options);
    };
    var doTruncation = (version, truncation) => {
      if (isPrerelease(truncation)) {
        return version.version;
      }
      version.prerelease = [];
      switch (truncation) {
        case "major":
          version.minor = 0;
          version.patch = 0;
          break;
        case "minor":
          version.patch = 0;
          break;
      }
      return version.format();
    };
    var isPrerelease = (type) => {
      return type.startsWith("pre");
    };
    module.exports = truncate;
  }
});

// node_modules/semver/internal/lrucache.js
var require_lrucache = __commonJS({
  "node_modules/semver/internal/lrucache.js"(exports, module) {
    "use strict";
    var LRUCache = class {
      constructor() {
        this.max = 1e3;
        this.map = /* @__PURE__ */ new Map();
      }
      get(key) {
        const value = this.map.get(key);
        if (value === void 0) {
          return void 0;
        } else {
          this.map.delete(key);
          this.map.set(key, value);
          return value;
        }
      }
      delete(key) {
        return this.map.delete(key);
      }
      set(key, value) {
        const deleted = this.delete(key);
        if (!deleted && value !== void 0) {
          if (this.map.size >= this.max) {
            const firstKey = this.map.keys().next().value;
            this.delete(firstKey);
          }
          this.map.set(key, value);
        }
        return this;
      }
    };
    module.exports = LRUCache;
  }
});

// node_modules/semver/classes/range.js
var require_range = __commonJS({
  "node_modules/semver/classes/range.js"(exports, module) {
    "use strict";
    var SPACE_CHARACTERS = /\s+/g;
    var Range = class _Range {
      constructor(range, options) {
        options = parseOptions(options);
        if (range instanceof _Range) {
          if (range.loose === !!options.loose && range.includePrerelease === !!options.includePrerelease) {
            return range;
          } else {
            return new _Range(range.raw, options);
          }
        }
        if (range instanceof Comparator) {
          this.raw = range.value;
          this.set = [[range]];
          this.formatted = void 0;
          return this;
        }
        this.options = options;
        this.loose = !!options.loose;
        this.includePrerelease = !!options.includePrerelease;
        this.raw = range.trim().replace(SPACE_CHARACTERS, " ");
        this.set = this.raw.split("||").map((r) => this.parseRange(r.trim())).filter((c) => c.length);
        if (!this.set.length) {
          throw new TypeError(`Invalid SemVer Range: ${this.raw}`);
        }
        if (this.set.length > 1) {
          const first = this.set[0];
          this.set = this.set.filter((c) => !isNullSet(c[0]));
          if (this.set.length === 0) {
            this.set = [first];
          } else if (this.set.length > 1) {
            for (const c of this.set) {
              if (c.length === 1 && isAny(c[0])) {
                this.set = [c];
                break;
              }
            }
          }
        }
        this.formatted = void 0;
      }
      get range() {
        if (this.formatted === void 0) {
          this.formatted = "";
          for (let i = 0; i < this.set.length; i++) {
            if (i > 0) {
              this.formatted += "||";
            }
            const comps = this.set[i];
            for (let k = 0; k < comps.length; k++) {
              if (k > 0) {
                this.formatted += " ";
              }
              this.formatted += comps[k].toString().trim();
            }
          }
        }
        return this.formatted;
      }
      format() {
        return this.range;
      }
      toString() {
        return this.range;
      }
      parseRange(range) {
        range = range.replace(BUILDSTRIPRE, "");
        const memoOpts = (this.options.includePrerelease && FLAG_INCLUDE_PRERELEASE) | (this.options.loose && FLAG_LOOSE);
        const memoKey = memoOpts + ":" + range;
        const cached = cache.get(memoKey);
        if (cached) {
          return cached;
        }
        const loose = this.options.loose;
        const hr = loose ? re[t.HYPHENRANGELOOSE] : re[t.HYPHENRANGE];
        range = range.replace(hr, hyphenReplace(this.options.includePrerelease));
        debug("hyphen replace", range);
        range = range.replace(re[t.COMPARATORTRIM], comparatorTrimReplace);
        debug("comparator trim", range);
        range = range.replace(re[t.TILDETRIM], tildeTrimReplace);
        debug("tilde trim", range);
        range = range.replace(re[t.CARETTRIM], caretTrimReplace);
        debug("caret trim", range);
        let rangeList = range.split(" ").map((comp) => parseComparator(comp, this.options)).join(" ").split(/\s+/).map((comp) => replaceGTE0(comp, this.options));
        if (loose) {
          rangeList = rangeList.filter((comp) => {
            debug("loose invalid filter", comp, this.options);
            return !!comp.match(re[t.COMPARATORLOOSE]);
          });
        }
        debug("range list", rangeList);
        const rangeMap = /* @__PURE__ */ new Map();
        const comparators = rangeList.map((comp) => new Comparator(comp, this.options));
        for (const comp of comparators) {
          if (isNullSet(comp)) {
            return [comp];
          }
          rangeMap.set(comp.value, comp);
        }
        if (rangeMap.size > 1 && rangeMap.has("")) {
          rangeMap.delete("");
        }
        const result = [...rangeMap.values()];
        cache.set(memoKey, result);
        return result;
      }
      intersects(range, options) {
        if (!(range instanceof _Range)) {
          throw new TypeError("a Range is required");
        }
        return this.set.some((thisComparators) => {
          return isSatisfiable(thisComparators, options) && range.set.some((rangeComparators) => {
            return isSatisfiable(rangeComparators, options) && thisComparators.every((thisComparator) => {
              return rangeComparators.every((rangeComparator) => {
                return thisComparator.intersects(rangeComparator, options);
              });
            });
          });
        });
      }
      // if ANY of the sets match ALL of its comparators, then pass
      test(version) {
        if (!version) {
          return false;
        }
        if (typeof version === "string") {
          try {
            version = new SemVer(version, this.options);
          } catch (er) {
            return false;
          }
        }
        for (let i = 0; i < this.set.length; i++) {
          if (testSet(this.set[i], version, this.options)) {
            return true;
          }
        }
        return false;
      }
    };
    module.exports = Range;
    var LRU = require_lrucache();
    var cache = new LRU();
    var parseOptions = require_parse_options();
    var Comparator = require_comparator();
    var debug = require_debug();
    var SemVer = require_semver();
    var {
      safeRe: re,
      src,
      t,
      comparatorTrimReplace,
      tildeTrimReplace,
      caretTrimReplace
    } = require_re();
    var { FLAG_INCLUDE_PRERELEASE, FLAG_LOOSE } = require_constants();
    var BUILDSTRIPRE = new RegExp(src[t.BUILD], "g");
    var isNullSet = (c) => c.value === "<0.0.0-0";
    var isAny = (c) => c.value === "";
    var isSatisfiable = (comparators, options) => {
      let result = true;
      const remainingComparators = comparators.slice();
      let testComparator = remainingComparators.pop();
      while (result && remainingComparators.length) {
        result = remainingComparators.every((otherComparator) => {
          return testComparator.intersects(otherComparator, options);
        });
        testComparator = remainingComparators.pop();
      }
      return result;
    };
    var parseComparator = (comp, options) => {
      comp = comp.replace(re[t.BUILD], "");
      debug("comp", comp, options);
      comp = replaceCarets(comp, options);
      debug("caret", comp);
      comp = replaceTildes(comp, options);
      debug("tildes", comp);
      comp = replaceXRanges(comp, options);
      debug("xrange", comp);
      comp = replaceStars(comp, options);
      debug("stars", comp);
      return comp;
    };
    var isX = (id) => !id || id.toLowerCase() === "x" || id === "*";
    var invalidXRangeOrder = (M, m, p) => isX(M) && !isX(m) || isX(m) && p && !isX(p);
    var replaceTildes = (comp, options) => {
      return comp.trim().split(/\s+/).map((c) => replaceTilde(c, options)).join(" ");
    };
    var replaceTilde = (comp, options) => {
      const r = options.loose ? re[t.TILDELOOSE] : re[t.TILDE];
      const z2 = options.includePrerelease ? "-0" : "";
      return comp.replace(r, (_, M, m, p, pr) => {
        debug("tilde", comp, _, M, m, p, pr);
        let ret;
        if (isX(M)) {
          ret = "";
        } else if (isX(m)) {
          ret = `>=${M}.0.0${z2} <${+M + 1}.0.0-0`;
        } else if (isX(p)) {
          ret = `>=${M}.${m}.0${z2} <${M}.${+m + 1}.0-0`;
        } else if (pr) {
          debug("replaceTilde pr", pr);
          ret = `>=${M}.${m}.${p}-${pr} <${M}.${+m + 1}.0-0`;
        } else {
          ret = `>=${M}.${m}.${p} <${M}.${+m + 1}.0-0`;
        }
        debug("tilde return", ret);
        return ret;
      });
    };
    var replaceCarets = (comp, options) => {
      return comp.trim().split(/\s+/).map((c) => replaceCaret(c, options)).join(" ");
    };
    var replaceCaret = (comp, options) => {
      debug("caret", comp, options);
      const r = options.loose ? re[t.CARETLOOSE] : re[t.CARET];
      const z2 = options.includePrerelease ? "-0" : "";
      return comp.replace(r, (_, M, m, p, pr) => {
        debug("caret", comp, _, M, m, p, pr);
        let ret;
        if (isX(M)) {
          ret = "";
        } else if (isX(m)) {
          ret = `>=${M}.0.0${z2} <${+M + 1}.0.0-0`;
        } else if (isX(p)) {
          if (M === "0") {
            ret = `>=${M}.${m}.0${z2} <${M}.${+m + 1}.0-0`;
          } else {
            ret = `>=${M}.${m}.0${z2} <${+M + 1}.0.0-0`;
          }
        } else if (pr) {
          debug("replaceCaret pr", pr);
          if (M === "0") {
            if (m === "0") {
              ret = `>=${M}.${m}.${p}-${pr} <${M}.${m}.${+p + 1}-0`;
            } else {
              ret = `>=${M}.${m}.${p}-${pr} <${M}.${+m + 1}.0-0`;
            }
          } else {
            ret = `>=${M}.${m}.${p}-${pr} <${+M + 1}.0.0-0`;
          }
        } else {
          debug("no pr");
          if (M === "0") {
            if (m === "0") {
              ret = `>=${M}.${m}.${p} <${M}.${m}.${+p + 1}-0`;
            } else {
              ret = `>=${M}.${m}.${p} <${M}.${+m + 1}.0-0`;
            }
          } else {
            ret = `>=${M}.${m}.${p} <${+M + 1}.0.0-0`;
          }
        }
        debug("caret return", ret);
        return ret;
      });
    };
    var replaceXRanges = (comp, options) => {
      debug("replaceXRanges", comp, options);
      return comp.split(/\s+/).map((c) => replaceXRange(c, options)).join(" ");
    };
    var replaceXRange = (comp, options) => {
      comp = comp.trim();
      const r = options.loose ? re[t.XRANGELOOSE] : re[t.XRANGE];
      return comp.replace(r, (ret, gtlt, M, m, p, pr) => {
        debug("xRange", comp, ret, gtlt, M, m, p, pr);
        if (invalidXRangeOrder(M, m, p)) {
          return comp;
        }
        const xM = isX(M);
        const xm = xM || isX(m);
        const xp = xm || isX(p);
        const anyX = xp;
        if (gtlt === "=" && anyX) {
          gtlt = "";
        }
        pr = options.includePrerelease ? "-0" : "";
        if (xM) {
          if (gtlt === ">" || gtlt === "<") {
            ret = "<0.0.0-0";
          } else {
            ret = "*";
          }
        } else if (gtlt && anyX) {
          if (xm) {
            m = 0;
          }
          p = 0;
          if (gtlt === ">") {
            gtlt = ">=";
            if (xm) {
              M = +M + 1;
              m = 0;
              p = 0;
            } else {
              m = +m + 1;
              p = 0;
            }
          } else if (gtlt === "<=") {
            gtlt = "<";
            if (xm) {
              M = +M + 1;
            } else {
              m = +m + 1;
            }
          }
          if (gtlt === "<") {
            pr = "-0";
          }
          ret = `${gtlt + M}.${m}.${p}${pr}`;
        } else if (xm) {
          ret = `>=${M}.0.0${pr} <${+M + 1}.0.0-0`;
        } else if (xp) {
          ret = `>=${M}.${m}.0${pr} <${M}.${+m + 1}.0-0`;
        }
        debug("xRange return", ret);
        return ret;
      });
    };
    var replaceStars = (comp, options) => {
      debug("replaceStars", comp, options);
      return comp.trim().replace(re[t.STAR], "");
    };
    var replaceGTE0 = (comp, options) => {
      debug("replaceGTE0", comp, options);
      return comp.trim().replace(re[options.includePrerelease ? t.GTE0PRE : t.GTE0], "");
    };
    var hyphenReplace = (incPr) => ($0, from, fM, fm, fp, fpr, fb, to, tM, tm, tp, tpr) => {
      if (isX(fM)) {
        from = "";
      } else if (isX(fm)) {
        from = `>=${fM}.0.0${incPr ? "-0" : ""}`;
      } else if (isX(fp)) {
        from = `>=${fM}.${fm}.0${incPr ? "-0" : ""}`;
      } else if (fpr) {
        from = `>=${from}`;
      } else {
        from = `>=${from}${incPr ? "-0" : ""}`;
      }
      if (isX(tM)) {
        to = "";
      } else if (isX(tm)) {
        to = `<${+tM + 1}.0.0-0`;
      } else if (isX(tp)) {
        to = `<${tM}.${+tm + 1}.0-0`;
      } else if (tpr) {
        to = `<=${tM}.${tm}.${tp}-${tpr}`;
      } else if (incPr) {
        to = `<${tM}.${tm}.${+tp + 1}-0`;
      } else {
        to = `<=${to}`;
      }
      return `${from} ${to}`.trim();
    };
    var testSet = (set, version, options) => {
      for (let i = 0; i < set.length; i++) {
        if (!set[i].test(version)) {
          return false;
        }
      }
      if (version.prerelease.length && !options.includePrerelease) {
        for (let i = 0; i < set.length; i++) {
          debug(set[i].semver);
          if (set[i].semver === Comparator.ANY) {
            continue;
          }
          if (set[i].semver.prerelease.length > 0) {
            const allowed = set[i].semver;
            if (allowed.major === version.major && allowed.minor === version.minor && allowed.patch === version.patch) {
              return true;
            }
          }
        }
        return false;
      }
      return true;
    };
  }
});

// node_modules/semver/classes/comparator.js
var require_comparator = __commonJS({
  "node_modules/semver/classes/comparator.js"(exports, module) {
    "use strict";
    var ANY = /* @__PURE__ */ Symbol("SemVer ANY");
    var Comparator = class _Comparator {
      static get ANY() {
        return ANY;
      }
      constructor(comp, options) {
        options = parseOptions(options);
        if (comp instanceof _Comparator) {
          if (comp.loose === !!options.loose) {
            return comp;
          } else {
            comp = comp.value;
          }
        }
        comp = comp.trim().split(/\s+/).join(" ");
        debug("comparator", comp, options);
        this.options = options;
        this.loose = !!options.loose;
        this.parse(comp);
        if (this.semver === ANY) {
          this.value = "";
        } else {
          this.value = this.operator + this.semver.version;
        }
        debug("comp", this);
      }
      parse(comp) {
        const r = this.options.loose ? re[t.COMPARATORLOOSE] : re[t.COMPARATOR];
        const m = comp.match(r);
        if (!m) {
          throw new TypeError(`Invalid comparator: ${comp}`);
        }
        this.operator = m[1] !== void 0 ? m[1] : "";
        if (this.operator === "=") {
          this.operator = "";
        }
        if (!m[2]) {
          this.semver = ANY;
        } else {
          this.semver = new SemVer(m[2], this.options.loose);
        }
      }
      toString() {
        return this.value;
      }
      test(version) {
        debug("Comparator.test", version, this.options.loose);
        if (this.semver === ANY || version === ANY) {
          return true;
        }
        if (typeof version === "string") {
          try {
            version = new SemVer(version, this.options);
          } catch (er) {
            return false;
          }
        }
        return cmp(version, this.operator, this.semver, this.options);
      }
      intersects(comp, options) {
        if (!(comp instanceof _Comparator)) {
          throw new TypeError("a Comparator is required");
        }
        if (this.operator === "") {
          if (this.value === "") {
            return true;
          }
          return new Range(comp.value, options).test(this.value);
        } else if (comp.operator === "") {
          if (comp.value === "") {
            return true;
          }
          return new Range(this.value, options).test(comp.semver);
        }
        options = parseOptions(options);
        if (options.includePrerelease && (this.value === "<0.0.0-0" || comp.value === "<0.0.0-0")) {
          return false;
        }
        if (!options.includePrerelease && (this.value.startsWith("<0.0.0") || comp.value.startsWith("<0.0.0"))) {
          return false;
        }
        if (this.operator.startsWith(">") && comp.operator.startsWith(">")) {
          return true;
        }
        if (this.operator.startsWith("<") && comp.operator.startsWith("<")) {
          return true;
        }
        if (this.semver.version === comp.semver.version && this.operator.includes("=") && comp.operator.includes("=")) {
          return true;
        }
        if (cmp(this.semver, "<", comp.semver, options) && this.operator.startsWith(">") && comp.operator.startsWith("<")) {
          return true;
        }
        if (cmp(this.semver, ">", comp.semver, options) && this.operator.startsWith("<") && comp.operator.startsWith(">")) {
          return true;
        }
        return false;
      }
    };
    module.exports = Comparator;
    var parseOptions = require_parse_options();
    var { safeRe: re, t } = require_re();
    var cmp = require_cmp();
    var debug = require_debug();
    var SemVer = require_semver();
    var Range = require_range();
  }
});

// node_modules/semver/functions/satisfies.js
var require_satisfies = __commonJS({
  "node_modules/semver/functions/satisfies.js"(exports, module) {
    "use strict";
    var Range = require_range();
    var satisfies = (version, range, options) => {
      try {
        range = new Range(range, options);
      } catch (er) {
        return false;
      }
      return range.test(version);
    };
    module.exports = satisfies;
  }
});

// node_modules/semver/ranges/to-comparators.js
var require_to_comparators = __commonJS({
  "node_modules/semver/ranges/to-comparators.js"(exports, module) {
    "use strict";
    var Range = require_range();
    var toComparators = (range, options) => new Range(range, options).set.map((comp) => comp.map((c) => c.value).join(" ").trim().split(" "));
    module.exports = toComparators;
  }
});

// node_modules/semver/ranges/max-satisfying.js
var require_max_satisfying = __commonJS({
  "node_modules/semver/ranges/max-satisfying.js"(exports, module) {
    "use strict";
    var SemVer = require_semver();
    var Range = require_range();
    var maxSatisfying = (versions, range, options) => {
      let max = null;
      let maxSV = null;
      let rangeObj = null;
      try {
        rangeObj = new Range(range, options);
      } catch (er) {
        return null;
      }
      versions.forEach((v) => {
        if (rangeObj.test(v)) {
          if (!max || maxSV.compare(v) === -1) {
            max = v;
            maxSV = new SemVer(max, options);
          }
        }
      });
      return max;
    };
    module.exports = maxSatisfying;
  }
});

// node_modules/semver/ranges/min-satisfying.js
var require_min_satisfying = __commonJS({
  "node_modules/semver/ranges/min-satisfying.js"(exports, module) {
    "use strict";
    var SemVer = require_semver();
    var Range = require_range();
    var minSatisfying = (versions, range, options) => {
      let min = null;
      let minSV = null;
      let rangeObj = null;
      try {
        rangeObj = new Range(range, options);
      } catch (er) {
        return null;
      }
      versions.forEach((v) => {
        if (rangeObj.test(v)) {
          if (!min || minSV.compare(v) === 1) {
            min = v;
            minSV = new SemVer(min, options);
          }
        }
      });
      return min;
    };
    module.exports = minSatisfying;
  }
});

// node_modules/semver/ranges/min-version.js
var require_min_version = __commonJS({
  "node_modules/semver/ranges/min-version.js"(exports, module) {
    "use strict";
    var SemVer = require_semver();
    var Range = require_range();
    var gt = require_gt();
    var minVersion = (range, loose) => {
      range = new Range(range, loose);
      let minver = new SemVer("0.0.0");
      if (range.test(minver)) {
        return minver;
      }
      minver = new SemVer("0.0.0-0");
      if (range.test(minver)) {
        return minver;
      }
      minver = null;
      for (let i = 0; i < range.set.length; ++i) {
        const comparators = range.set[i];
        let setMin = null;
        comparators.forEach((comparator) => {
          const compver = new SemVer(comparator.semver.version);
          switch (comparator.operator) {
            case ">":
              if (compver.prerelease.length === 0) {
                compver.patch++;
              } else {
                compver.prerelease.push(0);
              }
              compver.raw = compver.format();
            /* fallthrough */
            case "":
            case ">=":
              if (!setMin || gt(compver, setMin)) {
                setMin = compver;
              }
              break;
            case "<":
            case "<=":
              break;
            /* istanbul ignore next */
            default:
              throw new Error(`Unexpected operation: ${comparator.operator}`);
          }
        });
        if (setMin && (!minver || gt(minver, setMin))) {
          minver = setMin;
        }
      }
      if (minver && range.test(minver)) {
        return minver;
      }
      return null;
    };
    module.exports = minVersion;
  }
});

// node_modules/semver/ranges/valid.js
var require_valid2 = __commonJS({
  "node_modules/semver/ranges/valid.js"(exports, module) {
    "use strict";
    var Range = require_range();
    var validRange = (range, options) => {
      try {
        return new Range(range, options).range || "*";
      } catch (er) {
        return null;
      }
    };
    module.exports = validRange;
  }
});

// node_modules/semver/ranges/outside.js
var require_outside = __commonJS({
  "node_modules/semver/ranges/outside.js"(exports, module) {
    "use strict";
    var SemVer = require_semver();
    var Comparator = require_comparator();
    var { ANY } = Comparator;
    var Range = require_range();
    var satisfies = require_satisfies();
    var gt = require_gt();
    var lt = require_lt();
    var lte = require_lte();
    var gte = require_gte();
    var outside = (version, range, hilo, options) => {
      version = new SemVer(version, options);
      range = new Range(range, options);
      let gtfn, ltefn, ltfn, comp, ecomp;
      switch (hilo) {
        case ">":
          gtfn = gt;
          ltefn = lte;
          ltfn = lt;
          comp = ">";
          ecomp = ">=";
          break;
        case "<":
          gtfn = lt;
          ltefn = gte;
          ltfn = gt;
          comp = "<";
          ecomp = "<=";
          break;
        default:
          throw new TypeError('Must provide a hilo val of "<" or ">"');
      }
      if (satisfies(version, range, options)) {
        return false;
      }
      for (let i = 0; i < range.set.length; ++i) {
        const comparators = range.set[i];
        let high = null;
        let low = null;
        comparators.forEach((comparator) => {
          if (comparator.semver === ANY) {
            comparator = new Comparator(">=0.0.0");
          }
          high = high || comparator;
          low = low || comparator;
          if (gtfn(comparator.semver, high.semver, options)) {
            high = comparator;
          } else if (ltfn(comparator.semver, low.semver, options)) {
            low = comparator;
          }
        });
        if (high.operator === comp || high.operator === ecomp) {
          return false;
        }
        if ((!low.operator || low.operator === comp) && ltefn(version, low.semver)) {
          return false;
        } else if (low.operator === ecomp && ltfn(version, low.semver)) {
          return false;
        }
      }
      return true;
    };
    module.exports = outside;
  }
});

// node_modules/semver/ranges/gtr.js
var require_gtr = __commonJS({
  "node_modules/semver/ranges/gtr.js"(exports, module) {
    "use strict";
    var outside = require_outside();
    var gtr = (version, range, options) => outside(version, range, ">", options);
    module.exports = gtr;
  }
});

// node_modules/semver/ranges/ltr.js
var require_ltr = __commonJS({
  "node_modules/semver/ranges/ltr.js"(exports, module) {
    "use strict";
    var outside = require_outside();
    var ltr = (version, range, options) => outside(version, range, "<", options);
    module.exports = ltr;
  }
});

// node_modules/semver/ranges/intersects.js
var require_intersects = __commonJS({
  "node_modules/semver/ranges/intersects.js"(exports, module) {
    "use strict";
    var Range = require_range();
    var intersects = (r1, r2, options) => {
      r1 = new Range(r1, options);
      r2 = new Range(r2, options);
      return r1.intersects(r2, options);
    };
    module.exports = intersects;
  }
});

// node_modules/semver/ranges/simplify.js
var require_simplify = __commonJS({
  "node_modules/semver/ranges/simplify.js"(exports, module) {
    "use strict";
    var satisfies = require_satisfies();
    var compare = require_compare();
    module.exports = (versions, range, options) => {
      const set = [];
      let first = null;
      let prev = null;
      const v = versions.sort((a, b) => compare(a, b, options));
      for (const version of v) {
        const included = satisfies(version, range, options);
        if (included) {
          prev = version;
          if (!first) {
            first = version;
          }
        } else {
          if (prev) {
            set.push([first, prev]);
          }
          prev = null;
          first = null;
        }
      }
      if (first) {
        set.push([first, null]);
      }
      const ranges = [];
      for (const [min, max] of set) {
        if (min === max) {
          ranges.push(min);
        } else if (!max && min === v[0]) {
          ranges.push("*");
        } else if (!max) {
          ranges.push(`>=${min}`);
        } else if (min === v[0]) {
          ranges.push(`<=${max}`);
        } else {
          ranges.push(`${min} - ${max}`);
        }
      }
      const simplified = ranges.join(" || ");
      const original = typeof range.raw === "string" ? range.raw : String(range);
      return simplified.length < original.length ? simplified : range;
    };
  }
});

// node_modules/semver/ranges/subset.js
var require_subset = __commonJS({
  "node_modules/semver/ranges/subset.js"(exports, module) {
    "use strict";
    var Range = require_range();
    var Comparator = require_comparator();
    var { ANY } = Comparator;
    var satisfies = require_satisfies();
    var compare = require_compare();
    var subset = (sub, dom, options = {}) => {
      if (sub === dom) {
        return true;
      }
      sub = new Range(sub, options);
      dom = new Range(dom, options);
      let sawNonNull = false;
      OUTER: for (const simpleSub of sub.set) {
        for (const simpleDom of dom.set) {
          const isSub = simpleSubset(simpleSub, simpleDom, options);
          sawNonNull = sawNonNull || isSub !== null;
          if (isSub) {
            continue OUTER;
          }
        }
        if (sawNonNull) {
          return false;
        }
      }
      return true;
    };
    var minimumVersionWithPreRelease = [new Comparator(">=0.0.0-0")];
    var minimumVersion = [new Comparator(">=0.0.0")];
    var simpleSubset = (sub, dom, options) => {
      if (sub === dom) {
        return true;
      }
      if (sub.length === 1 && sub[0].semver === ANY) {
        if (dom.length === 1 && dom[0].semver === ANY) {
          return true;
        } else if (options.includePrerelease) {
          sub = minimumVersionWithPreRelease;
        } else {
          sub = minimumVersion;
        }
      }
      if (dom.length === 1 && dom[0].semver === ANY) {
        if (options.includePrerelease) {
          return true;
        } else {
          dom = minimumVersion;
        }
      }
      const eqSet = /* @__PURE__ */ new Set();
      let gt, lt;
      for (const c of sub) {
        if (c.operator === ">" || c.operator === ">=") {
          gt = higherGT(gt, c, options);
        } else if (c.operator === "<" || c.operator === "<=") {
          lt = lowerLT(lt, c, options);
        } else {
          eqSet.add(c.semver);
        }
      }
      if (eqSet.size > 1) {
        return null;
      }
      let gtltComp;
      if (gt && lt) {
        gtltComp = compare(gt.semver, lt.semver, options);
        if (gtltComp > 0) {
          return null;
        } else if (gtltComp === 0 && (gt.operator !== ">=" || lt.operator !== "<=")) {
          return null;
        }
      }
      for (const eq of eqSet) {
        if (gt && !satisfies(eq, String(gt), options)) {
          return null;
        }
        if (lt && !satisfies(eq, String(lt), options)) {
          return null;
        }
        for (const c of dom) {
          if (!satisfies(eq, String(c), options)) {
            return false;
          }
        }
        return true;
      }
      let higher, lower;
      let hasDomLT, hasDomGT;
      let needDomLTPre = lt && !options.includePrerelease && lt.semver.prerelease.length ? lt.semver : false;
      let needDomGTPre = gt && !options.includePrerelease && gt.semver.prerelease.length ? gt.semver : false;
      if (needDomLTPre && needDomLTPre.prerelease.length === 1 && lt.operator === "<" && needDomLTPre.prerelease[0] === 0) {
        needDomLTPre = false;
      }
      for (const c of dom) {
        hasDomGT = hasDomGT || c.operator === ">" || c.operator === ">=";
        hasDomLT = hasDomLT || c.operator === "<" || c.operator === "<=";
        if (gt) {
          if (needDomGTPre) {
            if (c.semver.prerelease && c.semver.prerelease.length && c.semver.major === needDomGTPre.major && c.semver.minor === needDomGTPre.minor && c.semver.patch === needDomGTPre.patch) {
              needDomGTPre = false;
            }
          }
          if (c.operator === ">" || c.operator === ">=") {
            higher = higherGT(gt, c, options);
            if (higher === c && higher !== gt) {
              return false;
            }
          } else if (gt.operator === ">=" && !c.test(gt.semver)) {
            return false;
          }
        }
        if (lt) {
          if (needDomLTPre) {
            if (c.semver.prerelease && c.semver.prerelease.length && c.semver.major === needDomLTPre.major && c.semver.minor === needDomLTPre.minor && c.semver.patch === needDomLTPre.patch) {
              needDomLTPre = false;
            }
          }
          if (c.operator === "<" || c.operator === "<=") {
            lower = lowerLT(lt, c, options);
            if (lower === c && lower !== lt) {
              return false;
            }
          } else if (lt.operator === "<=" && !c.test(lt.semver)) {
            return false;
          }
        }
        if (!c.operator && (lt || gt) && gtltComp !== 0) {
          return false;
        }
      }
      if (gt && hasDomLT && !lt && gtltComp !== 0) {
        return false;
      }
      if (lt && hasDomGT && !gt && gtltComp !== 0) {
        return false;
      }
      if (needDomGTPre || needDomLTPre) {
        return false;
      }
      return true;
    };
    var higherGT = (a, b, options) => {
      if (!a) {
        return b;
      }
      const comp = compare(a.semver, b.semver, options);
      return comp > 0 ? a : comp < 0 ? b : b.operator === ">" && a.operator === ">=" ? b : a;
    };
    var lowerLT = (a, b, options) => {
      if (!a) {
        return b;
      }
      const comp = compare(a.semver, b.semver, options);
      return comp < 0 ? a : comp > 0 ? b : b.operator === "<" && a.operator === "<=" ? b : a;
    };
    module.exports = subset;
  }
});

// node_modules/semver/index.js
var require_semver2 = __commonJS({
  "node_modules/semver/index.js"(exports, module) {
    "use strict";
    var internalRe = require_re();
    var constants = require_constants();
    var SemVer = require_semver();
    var identifiers = require_identifiers();
    var parse = require_parse();
    var valid = require_valid();
    var clean = require_clean();
    var inc = require_inc();
    var diff = require_diff();
    var major = require_major();
    var minor = require_minor();
    var patch = require_patch();
    var prerelease = require_prerelease();
    var compare = require_compare();
    var rcompare = require_rcompare();
    var compareLoose = require_compare_loose();
    var compareBuild = require_compare_build();
    var sort = require_sort();
    var rsort = require_rsort();
    var gt = require_gt();
    var lt = require_lt();
    var eq = require_eq();
    var neq = require_neq();
    var gte = require_gte();
    var lte = require_lte();
    var cmp = require_cmp();
    var coerce = require_coerce();
    var truncate = require_truncate();
    var Comparator = require_comparator();
    var Range = require_range();
    var satisfies = require_satisfies();
    var toComparators = require_to_comparators();
    var maxSatisfying = require_max_satisfying();
    var minSatisfying = require_min_satisfying();
    var minVersion = require_min_version();
    var validRange = require_valid2();
    var outside = require_outside();
    var gtr = require_gtr();
    var ltr = require_ltr();
    var intersects = require_intersects();
    var simplifyRange = require_simplify();
    var subset = require_subset();
    module.exports = {
      parse,
      valid,
      clean,
      inc,
      diff,
      major,
      minor,
      patch,
      prerelease,
      compare,
      rcompare,
      compareLoose,
      compareBuild,
      sort,
      rsort,
      gt,
      lt,
      eq,
      neq,
      gte,
      lte,
      cmp,
      coerce,
      truncate,
      Comparator,
      Range,
      satisfies,
      toComparators,
      maxSatisfying,
      minSatisfying,
      minVersion,
      validRange,
      outside,
      gtr,
      ltr,
      intersects,
      simplifyRange,
      subset,
      SemVer,
      re: internalRe.re,
      src: internalRe.src,
      tokens: internalRe.t,
      SEMVER_SPEC_VERSION: constants.SEMVER_SPEC_VERSION,
      RELEASE_TYPES: constants.RELEASE_TYPES,
      compareIdentifiers: identifiers.compareIdentifiers,
      rcompareIdentifiers: identifiers.rcompareIdentifiers
    };
  }
});

// src/host/index.ts
import z from "@deepseek-ai/schemastery";

// src/host/update-routes.ts
import { createRequire } from "node:module";
import { pathToFileURL } from "node:url";

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
  inlineCodeOpacity: 72,
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
    inlineCodeOpacity: typeof source.inlineCodeOpacity === "number" && Number.isFinite(source.inlineCodeOpacity) ? Math.min(100, Math.max(0, Math.round(source.inlineCodeOpacity))) : d2.inlineCodeOpacity,
    refraction: bool(source.refraction, d2.refraction),
    highlights: bool(source.highlights, d2.highlights),
    exclude: text(source.exclude, MAX_EXCLUDE_LENGTH, d2.exclude)
  };
}
function sameSettings(a, b) {
  return Object.keys(DEFAULT_SETTINGS).every((key) => a[key] === b[key]);
}

// src/host/updates.mjs
import { createHash, randomUUID as randomUUID2 } from "node:crypto";
import { mkdir, mkdtemp, writeFile, readFile, rename, lstat, readdir, open, rm, link } from "node:fs/promises";
import { join, resolve, sep, basename, win32 } from "node:path";
import { Worker } from "node:worker_threads";
import { gunzipSync } from "node:zlib";

// src/host/update-request-id.ts
import { randomUUID } from "node:crypto";
function updateRequestId(value = randomUUID()) {
  if (!/^[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12}$/.test(value)) throw new Error("invalid-request");
  return value;
}

// src/host/updates.mjs
var import_semver = __toESM(require_semver2(), 1);
var REPOSITORY = "Aero123421/dsh-glassui";
var PACKAGE = "dsh-glassui";
var RELEASES = `https://github.com/${REPOSITORY}/releases`;
var ROOT = `https://api.github.com/repos/${REPOSITORY}`;
var MAX_PACKAGE = 32 * 1024 * 1024;
var UUID = /^[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12}$/;
function reasonOf(error) {
  const allowed = [
    "manager-unavailable",
    "read-only",
    "source",
    "metadata",
    "asset",
    "channel",
    "incompatible",
    "compatibility-unknown",
    "busy",
    "checksum",
    "redirect",
    "size",
    "stale-candidate",
    "release-unavailable",
    "storage",
    "interrupted"
  ];
  return allowed.includes(error?.message) ? error.message : "network";
}
function semanticVersion(value) {
  if (typeof value !== "string") throw new Error("metadata");
  const match = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-([0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*))?(?:\+([0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*))?$/.exec(
    value
  );
  if (!match || match[4]?.split(".").some((part2) => /^\d+$/.test(part2) && part2.length > 1 && part2.startsWith("0")))
    throw new Error("metadata");
  return { numbers: match.slice(1, 4).map(BigInt), pre: match[4]?.split(".") };
}
function compareVersions(left, right) {
  const a = semanticVersion(left), b = semanticVersion(right);
  for (let i = 0; i < 3; i++) if (a.numbers[i] !== b.numbers[i]) return a.numbers[i] > b.numbers[i] ? 1 : -1;
  if (!a.pre || !b.pre) return a.pre ? -1 : b.pre ? 1 : 0;
  for (let i = 0; i < Math.max(a.pre.length, b.pre.length); i++) {
    const x = a.pre[i], y = b.pre[i];
    if (x === y) continue;
    if (x === void 0 || y === void 0) return x === void 0 ? -1 : 1;
    const nx = /^\d+$/.test(x), ny = /^\d+$/.test(y);
    if (nx && ny) return BigInt(x) > BigInt(y) ? 1 : -1;
    if (nx !== ny) return nx ? -1 : 1;
    return x > y ? 1 : -1;
  }
  return 0;
}
function allowedUrl(value) {
  const url = new URL(value);
  if (url.protocol !== "https:" || url.username || url.password || url.port || url.hash) throw new Error("redirect");
  if (url.hostname === "api.github.com" && url.pathname.startsWith(`/repos/${REPOSITORY}/`)) return url;
  if (url.hostname === "github.com" && url.pathname.startsWith(`/${REPOSITORY}/releases/download/`)) return url;
  if (url.hostname === "raw.githubusercontent.com" && url.pathname.startsWith(`/${REPOSITORY}/`)) return url;
  if (["release-assets.githubusercontent.com", "objects.githubusercontent.com"].includes(url.hostname)) return url;
  throw new Error("redirect");
}
async function boundedFetch(url, limit, { fetcher = fetch, signal } = {}) {
  const timeout = AbortSignal.timeout(2e4);
  const combined = signal ? AbortSignal.any([signal, timeout]) : timeout;
  for (let redirects = 0; redirects <= 4; redirects++) {
    const response = await fetcher(allowedUrl(url), {
      redirect: "manual",
      signal: combined,
      headers: { accept: "application/vnd.github+json" }
    });
    if ([301, 302, 303, 307, 308].includes(response.status)) {
      const next = response.headers.get("location");
      await response.body?.cancel();
      if (!next) throw new Error("redirect");
      url = new URL(next, url).href;
      continue;
    }
    if (!response.ok) {
      await response.body?.cancel();
      throw new Error(response.status === 404 ? "release-unavailable" : "network");
    }
    if (Number(response.headers.get("content-length")) > limit) {
      await response.body?.cancel();
      throw new Error("size");
    }
    const chunks = [];
    let bytes = 0;
    const reader = response.body?.getReader();
    if (!reader) throw new Error("network");
    try {
      for (; ; ) {
        combined.throwIfAborted();
        const { done, value } = await reader.read();
        if (done) return Buffer.concat(chunks, bytes);
        bytes += value.byteLength;
        if (bytes > limit) throw new Error("size");
        chunks.push(Buffer.from(value));
      }
    } finally {
      await reader.cancel().catch(() => {
      });
      reader.releaseLock();
    }
  }
  throw new Error("redirect");
}
function sourceKind(source, cacheDir, installedVersion) {
  if (typeof source !== "string") throw new Error("source");
  if (/^github:Aero123421\/dsh-glassui(?:#[A-Za-z0-9._/-]+)?$/.test(source)) return "github";
  if (/^(?:git\+)?https:\/\/github\.com\/Aero123421\/dsh-glassui(?:\.git)?(?:#[A-Za-z0-9._/-]+)?$/.test(source))
    return "github";
  if (/^https:\/\/github\.com\/Aero123421\/dsh-glassui\/releases\/download\/v[^/]+\/dsh-glassui-[^/]+\.tgz$/.test(source))
    return "tarball";
  if (cacheDir && source.startsWith("file:") && resolve(source.slice(5)).startsWith(resolve(cacheDir) + sep))
    return "tarball";
  if (installedVersion && source.startsWith("file:")) {
    semanticVersion(installedVersion);
    const file = source.slice(5);
    if ([basename(file), win32.basename(file)].includes(`dsh-glassui-${installedVersion}.tgz`)) return "tarball";
  }
  throw new Error("source");
}
function releaseCandidate(release, current) {
  if (!release || !Number.isSafeInteger(release.id) || release.id <= 0 || release.draft !== false || release.prerelease !== false || typeof release.tag_name !== "string" || !release.tag_name.startsWith("v"))
    throw new Error("metadata");
  const version = release.tag_name.slice(1);
  if (semanticVersion(version).pre) throw new Error("channel");
  const expectedLink = `${RELEASES}/tag/${release.tag_name}`;
  if (release.html_url !== expectedLink || typeof release.body !== "string" || !Array.isArray(release.assets))
    throw new Error("metadata");
  const filename = `dsh-glassui-${version}.tgz`;
  function asset(name2) {
    const matches = release.assets.filter((asset2) => asset2?.name === name2);
    if (matches.length !== 1) throw new Error("asset");
    const item = matches[0];
    if (!Number.isSafeInteger(item.id) || item.id <= 0 || !Number.isSafeInteger(item.size) || item.size <= 0 || item.browser_download_url !== `https://github.com/${REPOSITORY}/releases/download/${release.tag_name}/${name2}`)
      throw new Error("asset");
    return item.browser_download_url;
  }
  const candidate = {
    id: String(release.id),
    version,
    tag: release.tag_name,
    url: expectedLink,
    notes: release.body.slice(0, 6e3),
    filename,
    tarball: asset(filename),
    checksum: asset("SHA256SUMS")
  };
  return compareVersions(version, current) > 0 ? candidate : null;
}
function checkCompatibility(packageJson, candidate, runtime) {
  semanticVersion(runtime);
  if (!packageJson || packageJson.name !== PACKAGE || packageJson.version !== candidate.version || typeof packageJson.dsh?.bundle?.patch !== "string")
    throw new Error("metadata");
  const peers = Object.entries(packageJson.peerDependencies ?? {}).filter(
    ([name2]) => name2 === "@deepseek-ai/dsh" || name2.startsWith("@deepseek-ai/dsh-")
  );
  if (!peers.length || peers.some(([, range]) => typeof range !== "string")) throw new Error("compatibility-unknown");
  for (const [, range] of peers) {
    const decision = peerRangeDecision(range, runtime);
    if (decision === "unknown") throw new Error("compatibility-unknown");
    if (decision === "incompatible") throw new Error("incompatible");
  }
  return runtime;
}
function peerRangeDecision(range, runtime) {
  const current = import_semver.default.parse(runtime, { includePrerelease: true });
  if (!current || typeof range !== "string" || range.trim() === "") return "unknown";
  const text2 = range.trim();
  if (!import_semver.default.validRange(text2)) return "unknown";
  if (!import_semver.default.satisfies(runtime, text2, { includePrerelease: true })) return "incompatible";
  return peerRangeInCurrentSeries(text2, current) ? "ok" : "unknown";
}
var DSH_02_FLOOR = "0.2.0-rc.2";
function seriesFloor(current) {
  if (current.major === 0 && current.minor === 2) return DSH_02_FLOOR;
  if (current.major === 0) return `${current.major}.${current.minor}.0-0`;
  return `${current.major}.0.0-0`;
}
function seriesNext(current) {
  return current.major === 0 ? `${current.major}.${current.minor + 1}.0-0` : `${current.major + 1}.0.0-0`;
}
function boundedComparator(item, direction) {
  const exact = (item.operator === "" || item.operator === "=") && typeof item.semver?.version === "string";
  if (exact) return true;
  if (direction === "upper") return item.operator === "<" || item.operator === "<=";
  return item.operator === ">" || item.operator === ">=";
}
function peerRangeInCurrentSeries(range, current) {
  let parsed;
  try {
    parsed = new import_semver.default.Range(range, { includePrerelease: true });
  } catch {
    return false;
  }
  if (parsed.set.length === 0) return false;
  const shaped = parsed.set.every(
    (comparators) => comparators.some((item) => boundedComparator(item, "lower")) && comparators.some((item) => boundedComparator(item, "upper"))
  );
  if (!shaped) return false;
  const options = { includePrerelease: true };
  try {
    if (import_semver.default.intersects(range, `<${seriesFloor(current)}`, options)) return false;
    if (import_semver.default.intersects(range, `>=${seriesNext(current)}`, options)) return false;
  } catch {
    return false;
  }
  return true;
}
function packageManifest(bytes) {
  const tar = gunzipSync(bytes, { maxOutputLength: 128 * 1024 * 1024 });
  let manifest;
  for (let offset = 0; offset + 512 <= tar.length; ) {
    const header = tar.subarray(offset, offset + 512);
    if (header.every((byte) => byte === 0)) break;
    const name2 = header.subarray(0, 100).toString().replace(/\0.*$/, "");
    const prefix = header.subarray(345, 500).toString().replace(/\0.*$/, "");
    const sizeText = header.subarray(124, 136).toString().replace(/\0.*$/, "").trim();
    if (!/^[0-7]+$/.test(sizeText)) throw new Error("metadata");
    const size = Number.parseInt(sizeText, 8);
    if (!Number.isSafeInteger(size) || offset + 512 + size > tar.length) throw new Error("metadata");
    const path = prefix ? `${prefix}/${name2}` : name2;
    if (path === "package/package.json") {
      if (manifest || ![0, 48].includes(header[156]) || size > 65536) throw new Error("metadata");
      manifest = JSON.parse(tar.subarray(offset + 512, offset + 512 + size).toString());
    }
    offset += 512 + Math.ceil(size / 512) * 512;
  }
  if (!manifest) throw new Error("metadata");
  return manifest;
}
function safeResult(result) {
  if (!result) return null;
  return {
    changed: result.changed,
    application: result.application,
    stage: result.stage,
    target: PACKAGE,
    bundle: result.bundle,
    version: result.version,
    enabled: result.enabled,
    ...result.error ? { error: { code: result.error.code } } : {},
    ...result.packageResult ? {
      packageResult: {
        exitCode: result.packageResult.exitCode,
        timedOut: result.packageResult.timedOut,
        kind: result.packageResult.kind
      }
    } : {}
  };
}
function resultState(result, expected, runtime, installed) {
  if (!result) return "unknown";
  if (["cancelled", "overridden"].includes(result.application)) return result.application;
  if (result.error || result.application === "failed" || result.packageResult && (result.packageResult.exitCode !== 0 || result.packageResult.timedOut))
    return "failed";
  if (result.bundle !== PACKAGE || result.version !== expected || !installed?.installed || installed.version !== expected || installed.error || installed.readOnlyReason)
    return "unknown";
  if (result.application === "restart-required") return "restart-required";
  return result.application === "applied" && runtime === expected ? "applied" : "unknown";
}
var retainedInstalls = /* @__PURE__ */ new Set();
function retainInstall(promise) {
  retainedInstalls.add(promise);
  const release = () => {
    retainedInstalls.delete(promise);
  };
  void promise.then(release, release);
  return promise;
}
function failedInstall(code = "operation-error") {
  return {
    changed: false,
    application: "failed",
    stage: "install",
    target: PACKAGE,
    error: { code }
  };
}
var BUNDLE_LIST_ATTEMPTS = 3;
var RESTORE_ATTEMPT_LIMIT = 3;
var RESTORE_ATTEMPT_INTERVAL_MS = 1e4;
var RESTORE_LOCK_TTL_MS = 6e4;
var RESTORE_LOCK_RENEW_MS = 15e3;
var RESTORE_LOCK_SKEW_MS = 5e3;
async function installedCopy(manager) {
  let failed = 0;
  while (failed < BUNDLE_LIST_ATTEMPTS) {
    try {
      const row = (await manager.listBundles()).find((item) => item?.name === PACKAGE && item.installed);
      return { known: true, row: row ?? null };
    } catch {
      failed += 1;
    }
  }
  return { known: false, row: null };
}
function versionRestored(previous, row) {
  return typeof previous?.version === "string" && previous.version !== "" && row?.installed === true && row.version === previous.version && !row.error && !row.readOnlyReason;
}
function classifyRestore(restored, previous, listed) {
  if (restored?.application === "cancelled") return listed.known && !listed.row ? "cancelled-absent" : "cancelled";
  if (!listed.known) return "unconfirmed";
  const back = versionRestored(previous, listed.row);
  if (restored?.application === "restart-required") return back ? "pending" : "failed";
  return back ? "ok" : "failed";
}
function appendReceipt(operation, receipt) {
  if (!Array.isArray(operation.receipts)) operation.receipts = [];
  if (operation.receipts.some((item) => item && item.kind === receipt.kind && item.id === receipt.id)) return;
  operation.receipts.push(receipt);
}
function previousSpec(operation) {
  const source = operation.previousSource;
  const version = operation.previousVersion;
  if (typeof source !== "string" || source === "" || typeof version !== "string" || version === "") return void 0;
  return { source, enabled: operation.previousEnabled === true, version };
}
function removalProven(operation) {
  if (operation.removedByUpdate !== operation.requestId) return false;
  if (operation.status === "restart-required") return false;
  const application = operation.result?.application;
  if (application === "applied" || application === "restart-required") return false;
  const receipts = Array.isArray(operation.receipts) ? operation.receipts : [];
  const index = receipts.findIndex((item) => item?.kind === "removed-by-update" && item.id === operation.requestId);
  const later = index >= 0 ? receipts.slice(index + 1) : receipts;
  return !later.some((item) => item?.kind === "apply" || item?.kind === "remove");
}
function packageWasInstalled(operation) {
  if (operation.observedPresent === true) return true;
  if (operation.restore === "ok" || operation.reason === "restored" || operation.reason === "restore-pending")
    return true;
  const application = operation.result?.application;
  if (application === "applied" || application === "restart-required") return true;
  const receipts = Array.isArray(operation.receipts) ? operation.receipts : [];
  return receipts.some((item) => item?.kind === "apply");
}
function journalLockHeld(operation, now) {
  const lock = operation.restoreLock;
  if (!lock || typeof lock.at !== "number" || !Number.isFinite(lock.at)) return false;
  if (lock.at > now + RESTORE_LOCK_SKEW_MS) return false;
  return now - lock.at < RESTORE_LOCK_TTL_MS;
}
function parseLease(text2) {
  let value;
  try {
    value = JSON.parse(text2);
  } catch {
    return null;
  }
  if (!value || typeof value !== "object") return null;
  if (typeof value.owner !== "string" || !UUID.test(value.owner)) return null;
  if (typeof value.expiresAt !== "number" || !Number.isFinite(value.expiresAt)) return null;
  return value;
}
function leaseHeld(lease, now) {
  if (!lease) return false;
  if (lease.expiresAt <= now) return false;
  if (lease.expiresAt > now + RESTORE_LOCK_TTL_MS + RESTORE_LOCK_SKEW_MS) return false;
  return true;
}
function sameFile(left, right) {
  return Boolean(left && right && left.ino && right.ino && left.dev === right.dev && left.ino === right.ino);
}
async function renameVerified(path, destination, expected) {
  let current;
  try {
    current = await lstat(path);
  } catch {
    return false;
  }
  if (current.isSymbolicLink() || !sameFile(current, expected)) return false;
  try {
    await rename(path, destination);
  } catch {
    return false;
  }
  let moved;
  try {
    moved = await lstat(destination);
  } catch {
    return false;
  }
  if (sameFile(moved, expected)) return true;
  try {
    await link(destination, path);
    await rm(destination, { force: true });
  } catch {
  }
  return false;
}
function installRecordOf(value) {
  if (!value || typeof value !== "object") return null;
  const record = (
    /** @type {{ requestId?: unknown, owner?: unknown, startedAt?: unknown }} */
    value
  );
  if (typeof record.requestId !== "string" || !UUID.test(record.requestId)) return null;
  if (typeof record.owner !== "string" || !UUID.test(record.owner)) return null;
  if (typeof record.startedAt !== "number" || !Number.isFinite(record.startedAt)) return null;
  return { requestId: record.requestId, owner: record.owner, startedAt: record.startedAt };
}
function isLockGrave(name2) {
  return name2.includes(".restore.lock.") && (name2.endsWith(".stale") || name2.endsWith(".release"));
}
function liveLockId(name2) {
  if (!name2.endsWith(".restore.lock")) return null;
  const id = name2.slice(0, -".restore.lock".length);
  return UUID.test(id) ? id : null;
}
async function removeExpiredLock(path) {
  let fh;
  try {
    fh = await open(path, "r");
  } catch {
    return;
  }
  let expected;
  let body;
  try {
    const fhStat = await fh.stat();
    const pathStat = await lstat(path);
    if (pathStat.isSymbolicLink() || !pathStat.isFile() || !sameFile(fhStat, pathStat)) return;
    expected = pathStat;
    body = parseLease(await readFile(fh, "utf8"));
  } catch {
    return;
  } finally {
    await fh.close().catch(() => {
    });
  }
  if (!expected || !body || body.expiresAt > Date.now()) return;
  let againStat;
  let again;
  try {
    againStat = await lstat(path);
    if (againStat.isSymbolicLink() || !sameFile(againStat, expected)) return;
    again = parseLease(await readFile(path, "utf8"));
  } catch {
    return;
  }
  if (!again || again.expiresAt > Date.now()) return;
  const grave = `${path}.${randomUUID2()}.stale`;
  if (!await renameVerified(path, grave, againStat)) return;
  let moved;
  try {
    moved = parseLease(await readFile(grave, "utf8"));
  } catch {
    moved = null;
  }
  if (!moved || moved.expiresAt > Date.now()) {
    try {
      await link(grave, path);
      await rm(grave, { force: true });
    } catch {
    }
    return;
  }
  await rm(grave, { force: true }).catch(() => {
  });
}
async function sweepLockGraves(directory) {
  let names;
  try {
    names = await readdir(directory);
  } catch {
    return;
  }
  await Promise.all(names.filter((name2) => liveLockId(name2)).map((name2) => removeExpiredLock(join(directory, name2))));
  let graves;
  try {
    graves = await readdir(directory);
  } catch {
    return;
  }
  const cutoff = Date.now() - RESTORE_LOCK_TTL_MS - RESTORE_LOCK_SKEW_MS;
  await Promise.all(
    graves.map(async (name2) => {
      if (!isLockGrave(name2)) return;
      const path = join(directory, name2);
      let stat;
      try {
        stat = await lstat(path);
      } catch {
        return;
      }
      if (!stat.isFile() || stat.isSymbolicLink()) return;
      if (stat.mtimeMs > cutoff) return;
      await rm(path, { force: true }).catch(() => {
      });
    })
  );
}
async function writeHandle(handle, body) {
  const bytes = Buffer.from(body);
  await handle.write(bytes, 0, bytes.length, 0);
  await handle.truncate(bytes.length);
}
var LOCK_RENEWER_SOURCE = `
import { open, readFile, lstat } from 'node:fs/promises'
import { workerData } from 'node:worker_threads'
const { path, owner, requestId, ttl, interval } = workerData
function parse(text) {
  try {
    const value = JSON.parse(text)
    if (!value || value.owner !== owner || value.requestId !== requestId) return null
    if (typeof value.expiresAt !== 'number' || !Number.isFinite(value.expiresAt)) return null
    return value
  } catch {
    return null
  }
}
async function renew() {
  let fh
  try {
    fh = await open(path, 'r+')
  } catch {
    return
  }
  try {
    const fhStat = await fh.stat()
    const pathStat = await lstat(path)
    if (pathStat.isSymbolicLink() || !pathStat.isFile()) return
    if (fhStat.ino !== pathStat.ino || fhStat.dev !== pathStat.dev) return
    if (!parse(await readFile(fh, 'utf8'))) return
    const next = JSON.stringify({ owner, requestId, expiresAt: Date.now() + ttl })
    const bytes = Buffer.from(next)
    await fh.write(bytes, 0, bytes.length, 0)
    await fh.truncate(bytes.length)
    const again = await lstat(path)
    const fhAgain = await fh.stat()
    if (again.ino !== fhAgain.ino || again.dev !== fhAgain.dev) return
    if (!parse(await readFile(path, 'utf8'))) return
  } catch {
    // The next interval tries again. A dead parent terminates this thread.
  } finally {
    await fh.close().catch(() => {})
  }
}
await renew()
setInterval(() => {
  void renew()
}, interval)
`;
function startLockRenewer(lock) {
  try {
    const worker = new Worker(LOCK_RENEWER_SOURCE, {
      eval: true,
      workerData: {
        path: lock.path,
        owner: lock.owner,
        requestId: lock.requestId,
        ttl: RESTORE_LOCK_TTL_MS,
        interval: RESTORE_LOCK_RENEW_MS
      }
    });
    worker.unref();
    worker.on("error", () => {
    });
    return worker;
  } catch {
    return null;
  }
}
async function stopLockRenewer(worker) {
  if (!worker) return;
  await worker.terminate().catch(() => {
  });
}
function enqueueLock(lock, fn) {
  const run = lock.queue.then(fn, fn);
  lock.queue = run.then(
    () => void 0,
    () => void 0
  );
  return run;
}
async function readLeaseStable(path) {
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const lease = parseLease(await readFile(path, "utf8"));
      if (lease) return { lease, missing: false };
    } catch (error) {
      if (error?.code === "ENOENT") return { lease: null, missing: true };
    }
  }
  return { lease: null, missing: false };
}
async function publishLock(path, requestId, owner) {
  const temp = `${path}.${randomUUID2()}.locktmp`;
  const body = JSON.stringify({ owner, requestId, expiresAt: Date.now() + RESTORE_LOCK_TTL_MS });
  let fh;
  try {
    fh = await open(temp, "wx", 384);
  } catch (error) {
    if (error?.code === "EEXIST") return null;
    throw error;
  }
  try {
    await writeHandle(fh, body);
    await link(temp, path);
  } catch (error) {
    await fh.close().catch(() => {
    });
    await rm(temp, { force: true }).catch(() => {
    });
    if (error?.code === "EEXIST") return null;
    throw error;
  }
  await rm(temp, { force: true }).catch(() => {
  });
  return { fh, path, owner, requestId, queue: Promise.resolve(), lost: false };
}
function unionReceipts(left, right) {
  const out = [];
  const items = [...Array.isArray(left) ? left : [], ...Array.isArray(right) ? right : []];
  for (const item of items) {
    if (!item || typeof item.kind !== "string" || typeof item.id !== "string") continue;
    if (out.some((existing) => existing.kind === item.kind && existing.id === item.id)) continue;
    out.push(item);
  }
  return out;
}
function absorbMonotonic(operation, disk) {
  operation.restoreAttempts = Math.max(attemptsOf(disk), attemptsOf(operation));
  const diskAt = typeof disk.restoreAttemptAt === "number" && Number.isFinite(disk.restoreAttemptAt) ? disk.restoreAttemptAt : 0;
  const opAt = typeof operation.restoreAttemptAt === "number" && Number.isFinite(operation.restoreAttemptAt) ? operation.restoreAttemptAt : 0;
  if (diskAt || opAt) operation.restoreAttemptAt = Math.max(diskAt, opAt);
  operation.observedPresent = Boolean(disk.observedPresent || operation.observedPresent);
  operation.receipts = unionReceipts(disk.receipts, operation.receipts);
  delete operation.restoreLock;
  const settledId = typeof operation.restoreInstallSettledId === "string" ? operation.restoreInstallSettledId : "";
  const drop = operation.restoreInstallDrop === true;
  delete operation.restoreInstallSettledId;
  delete operation.restoreInstallDrop;
  const memory = installRecordOf(operation.restoreInstall);
  const stored = installRecordOf(disk.restoreInstall);
  const diskPresent = disk.restoreInstall != null;
  const clearing = operation.restoreInstall === null && UUID.test(settledId);
  if (drop) delete operation.restoreInstall;
  else if (clearing && (!diskPresent || stored?.requestId === settledId)) delete operation.restoreInstall;
  else if (stored && memory) operation.restoreInstall = memory.startedAt >= stored.startedAt ? memory : stored;
  else if (diskPresent && !memory) operation.restoreInstall = stored ?? disk.restoreInstall;
  else if (memory) operation.restoreInstall = memory;
  else delete operation.restoreInstall;
}
async function listedPackage(manager) {
  try {
    const listed = await manager.listBundles();
    if (!Array.isArray(listed)) return "unknown";
    return listed.some((item) => item?.name === PACKAGE && item.installed) ? "present" : "absent";
  } catch {
    return "unknown";
  }
}
function attemptsOf(operation) {
  return Number.isSafeInteger(operation.restoreAttempts) && operation.restoreAttempts > 0 ? operation.restoreAttempts : 0;
}
function restorePlan(operation, { absent, installUnresolved, now, cacheDir, lockHeld = false, directoryUnread = false, priorUnsettled = false }) {
  if (!absent) return "skip";
  if (operation.reason === "restored" || operation.reason === "restore-failed") return "skip";
  const spec = previousSpec(operation);
  if (!spec) return "skip";
  try {
    sourceKind(spec.source, cacheDir, spec.version);
  } catch {
    return "invalid-source";
  }
  if (lockHeld) return "inflight";
  if (priorUnsettled) return "offer";
  if (attemptsOf(operation) >= RESTORE_ATTEMPT_LIMIT) return "limit";
  const recent = typeof operation.restoreAttemptAt === "number" && now - operation.restoreAttemptAt < RESTORE_ATTEMPT_INTERVAL_MS;
  const proven = removalProven(operation) && operation.status === "unknown";
  if (proven && recent && !directoryUnread && !installUnresolved) return "wait";
  if (proven && !installUnresolved && !directoryUnread) return "auto";
  return "offer";
}
async function installStillElsewhere(manager, requestId) {
  if (typeof requestId !== "string" || !UUID.test(requestId)) return true;
  if (!manager || typeof manager.waitForInstall !== "function") return true;
  try {
    return !await manager.waitForInstall(updateRequestId(requestId));
  } catch {
    return true;
  }
}
async function reinstallPrevious(manager, previous, hooks) {
  const source = previous?.source;
  if (typeof source !== "string" || source === "") return void 0;
  if (hooks?.validateSource) {
    try {
      sourceKind(source, hooks.cacheDir, previous.version);
    } catch {
      return void 0;
    }
  }
  if (typeof hooks?.blockIfIdleRequest === "string" && await installStillElsewhere(manager, hooks.blockIfIdleRequest))
    return void 0;
  const requestId = updateRequestId();
  if (hooks?.onRestoreRequest) await hooks.onRestoreRequest(requestId, previous.version);
  if (hooks?.stillOwned && !await hooks.stillOwned()) return void 0;
  if (hooks?.confirmAbsent && !await hooks.confirmAbsent()) return void 0;
  if (hooks?.noteInstallStart && !await hooks.noteInstallStart(requestId)) return void 0;
  if (hooks?.abandoned?.()) return void 0;
  if (hooks?.stillOwned && !await hooks.stillOwned()) return void 0;
  let restored;
  try {
    restored = await manager.installBundle(source, {
      enabled: previous.enabled === true,
      requestId
    });
  } catch {
    restored = failedInstall();
  }
  const listed = await installedCopy(manager);
  return { state: classifyRestore(restored, previous, listed), requestId };
}
function settleRemoval(operation, runtimeVersion) {
  if (operation.restore === "ok") {
    operation.status = "failed";
    operation.reason = "restored";
    return;
  }
  if (operation.restore === "pending") {
    if (runtimeVersion && runtimeVersion === operation.version) {
      if (operation.reason === "restore-pending") delete operation.reason;
      return;
    }
    operation.status = "restart-required";
    operation.reason = "restore-pending";
    return;
  }
  if (operation.restore === "cancelled" || operation.restore === "cancelled-absent") {
    operation.status = "cancelled";
    if (operation.restore === "cancelled-absent") operation.reason = "restore-failed";
    else delete operation.reason;
    return;
  }
  if (operation.restore === "failed") {
    operation.status = "failed";
    operation.reason = "restore-failed";
    return;
  }
  if (operation.restore === "unconfirmed" || operation.reinstall && operation.status === "failed") {
    operation.status = "unknown";
    operation.reason = "reinstall";
  }
}
var PluginUpdates = class {
  constructor({ manager, profileDir, runtimeVersion, isBusy = () => false, fetcher = fetch, version }) {
    Object.assign(this, { manager, profileDir, runtimeVersion, isBusy, fetcher, version });
    this.candidate = null;
    this.checking = null;
    this.running = null;
    this.closed = false;
    this.abort = new AbortController();
    this.restoreFlights = /* @__PURE__ */ new Map();
  }
  get cacheDir() {
    return this.profileDir && join(this.profileDir, ".dsh-glassui-updates");
  }
  async capability() {
    const manager = this.manager();
    if (!manager || typeof manager.listBundles !== "function" || typeof manager.installBundle !== "function" || typeof manager.waitForInstall !== "function" || !this.profileDir)
      throw new Error("manager-unavailable");
    const bundle = (await manager.listBundles()).find((item) => item.name === PACKAGE);
    if (!bundle?.installed || bundle.readOnlyReason || bundle.error) throw new Error("read-only");
    const source = sourceKind(bundle.source, this.cacheDir, bundle.version);
    if (bundle.source.startsWith("file:")) {
      try {
        if (!(await lstat(bundle.source.slice(5))).isFile()) throw new Error("source");
      } catch {
        throw new Error("source");
      }
    }
    const dshVersion = await this.runtimeVersion();
    semanticVersion(dshVersion);
    return { manager, bundle, source, dshVersion };
  }
  base() {
    return {
      runtimeVersion: this.version,
      releases: RELEASES,
      profileKey: this.profileDir ? createHash("sha256").update(PACKAGE + "\0" + resolve(this.profileDir)).digest("hex") : void 0
    };
  }
  async lastOperation() {
    try {
      const value = JSON.parse(await readFile(join(this.cacheDir, "latest.json"), "utf8"));
      return typeof value.requestId === "string" && UUID.test(value.requestId) ? value.requestId : void 0;
    } catch {
      return void 0;
    }
  }
  async status() {
    try {
      const { dshVersion } = await this.capability();
      const requestId = this.running?.requestId ?? await this.lastOperation();
      return requestId ? { ...await this.reconcile(requestId), dshVersion } : { ...this.base(), dshVersion, status: "idle" };
    } catch (error) {
      return { ...this.base(), status: "blocked", reason: reasonOf(error) };
    }
  }
  async privateDir() {
    await mkdir(this.cacheDir, { recursive: true, mode: 448 });
    if (!(await lstat(this.cacheDir)).isDirectory() || (await lstat(this.cacheDir)).isSymbolicLink())
      throw new Error("storage");
    return this.cacheDir;
  }
  async getCandidate(current) {
    const options = { fetcher: this.fetcher, signal: this.abort.signal };
    const release = JSON.parse((await boundedFetch(`${ROOT}/releases/latest`, 256 * 1024, options)).toString());
    const candidate = releaseCandidate(release, current);
    if (!candidate) return null;
    const packageJson = JSON.parse(
      (await boundedFetch(
        `https://raw.githubusercontent.com/${REPOSITORY}/${candidate.tag}/package.json`,
        64 * 1024,
        options
      )).toString()
    );
    candidate.compatibility = checkCompatibility(packageJson, candidate, await this.runtimeVersion());
    return candidate;
  }
  check() {
    if (this.checking) return this.checking;
    this.checking = (async () => {
      try {
        if (this.closed || this.running) throw new Error("busy");
        const { bundle } = await this.capability();
        const last = await this.lastOperation();
        if (last && ["installing", "unknown", "restart-required"].includes((await this.reconcile(last)).status))
          throw new Error("busy");
        this.candidate = await this.getCandidate(bundle.version ?? this.version);
        return {
          ...this.base(),
          status: this.candidate ? "available" : "current",
          candidate: this.candidate && this.publicCandidate(this.candidate),
          checkedAt: (/* @__PURE__ */ new Date()).toISOString()
        };
      } catch (error) {
        this.candidate = null;
        return { ...this.base(), status: "blocked", reason: reasonOf(error) };
      }
    })().finally(() => {
      this.checking = null;
    });
    return this.checking;
  }
  publicCandidate(candidate) {
    const { id, version, url, notes, compatibility } = candidate;
    return { id, version, url, notes, compatibility };
  }
  async begin(id, operationId, profileKey) {
    if (!profileKey || profileKey !== this.base().profileKey) throw new Error("profile");
    if (typeof operationId !== "string") throw new Error("invalid-request");
    const requestId = updateRequestId(operationId);
    await this.capability();
    if (this.running?.requestId === requestId) return { ...this.base(), ...this.running };
    try {
      await readFile(join(this.cacheDir, `${requestId}.json`));
      return this.reconcile(requestId);
    } catch (error) {
      if (error.code !== "ENOENT") throw error;
    }
    const last = await this.lastOperation();
    if (last && ["installing", "unknown", "restart-required"].includes((await this.reconcile(last)).status))
      throw new Error("busy");
    if (this.closed || this.running || this.checking || this.isBusy()) throw new Error("busy");
    if (typeof id !== "string" || !this.candidate || id !== this.candidate.id) throw new Error("stale-candidate");
    const candidate = this.candidate;
    this.running = { requestId, version: candidate.version, status: "preparing" };
    try {
      await this.privateDir();
      await this.save(this.running, true);
    } catch (error) {
      this.running = null;
      throw error;
    }
    void this.execute(candidate, this.running).finally(() => {
      this.running = null;
    });
    return { ...this.base(), ...this.running };
  }
  async save(operation, claim = false) {
    const directory = await this.privateDir(), file = join(directory, `${operation.requestId}.json`);
    const temp = join(directory, `${operation.requestId}.${randomUUID2()}.tmp`);
    await writeFile(temp, JSON.stringify(operation), { flag: "wx", mode: 384 });
    await rename(temp, file);
    if (!claim) return;
    const index = join(directory, `${randomUUID2()}.tmp`);
    await writeFile(index, JSON.stringify({ requestId: operation.requestId }), { flag: "wx", mode: 384 });
    await rename(index, join(directory, "latest.json"));
  }
  async execute(candidate, operation) {
    let managerInvoked = false;
    try {
      const before = await this.capability();
      const fresh = await this.getCandidate(before.bundle.version ?? this.version);
      if (!fresh || fresh.id !== candidate.id || fresh.version !== candidate.version || fresh.tarball !== candidate.tarball)
        throw new Error("stale-candidate");
      const options = { fetcher: this.fetcher, signal: this.abort.signal };
      const checksum = (await boundedFetch(candidate.checksum, 8192, options)).toString();
      const lines = checksum.trim().split(/\r?\n/);
      if (lines.length !== 1) throw new Error("checksum");
      const match = /^([a-fA-F0-9]{64}) {2}(\S+)$/.exec(lines[0]);
      if (!match || match[2] !== candidate.filename) throw new Error("checksum");
      const bytes = await boundedFetch(candidate.tarball, MAX_PACKAGE, options);
      if (createHash("sha256").update(bytes).digest("hex") !== match[1].toLowerCase()) throw new Error("checksum");
      checkCompatibility(packageManifest(bytes), candidate, await this.runtimeVersion());
      const dir = await mkdtemp(join(await this.privateDir(), "verified-"));
      const path = join(dir, candidate.filename);
      await writeFile(path, bytes, { flag: "wx", mode: 384 });
      const latest = await this.capability();
      if (latest.bundle.source !== before.bundle.source || latest.bundle.enabled !== before.bundle.enabled || this.isBusy() || this.closed)
        throw new Error("busy");
      const spec = path;
      operation.status = "installing";
      await this.save(operation);
      if (this.closed || this.isBusy()) throw new Error("busy");
      const final = await this.capability();
      if (this.closed || this.isBusy() || final.bundle.source !== before.bundle.source) throw new Error("busy");
      if (compareVersions(candidate.version, final.bundle.version) <= 0) throw new Error("stale-candidate");
      managerInvoked = true;
      const manager = final.manager;
      const previous = {
        source: final.bundle.source,
        enabled: final.bundle.enabled === true,
        version: typeof final.bundle.version === "string" ? final.bundle.version : void 0
      };
      operation.previousSource = previous.source;
      operation.previousEnabled = previous.enabled;
      if (previous.version) operation.previousVersion = previous.version;
      try {
        await this.save(operation);
      } catch {
      }
      const result = await retainInstall(
        manager.installBundle(spec, {
          enabled: final.bundle.enabled,
          requestId: operation.requestId,
          saveExact: true
        })
      );
      operation.result = safeResult(result);
      if (result?.error?.code === "already-installed") operation.reason = "manual-update";
      const application = result?.application;
      if (application === "applied" || application === "restart-required") {
        operation.recordedAt = Date.now();
        appendReceipt(operation, {
          kind: "apply",
          id: operation.requestId,
          at: operation.recordedAt,
          application
        });
      }
      if (previous.version) operation.previousVersion = previous.version;
      let installed;
      try {
        installed = (await manager.listBundles()).find((item) => item.name === PACKAGE);
      } catch {
        installed = void 0;
      }
      operation.status = resultState(result, operation.version, this.version, installed);
      settleRemoval(operation, this.version);
    } catch (error) {
      operation.status = managerInvoked ? "unknown" : "failed";
      operation.reason = reasonOf(error);
    }
    try {
      await this.save(operation);
    } catch {
    }
  }
  async reconcile(requestId) {
    if (typeof requestId !== "string" || !UUID.test(requestId)) throw new Error("invalid-request");
    let operation;
    try {
      operation = JSON.parse(await readFile(join(this.cacheDir, `${requestId}.json`), "utf8"));
    } catch {
      return { ...this.base(), status: "unknown", requestId };
    }
    if (operation.requestId !== requestId || typeof operation.version !== "string")
      return { ...this.base(), status: "unknown", requestId };
    semanticVersion(operation.version);
    if (this.running?.requestId === requestId) return { ...this.base(), ...this.running };
    if (operation.status === "preparing") {
      operation.status = "failed";
      operation.reason = "interrupted";
      await this.save(operation);
    }
    let installUnresolved = false;
    if (["installing", "unknown"].includes(operation.status) && !operation.result) {
      const manager = this.manager();
      let result;
      try {
        result = manager && await manager.waitForInstall(requestId);
      } catch {
        result = null;
      }
      if (result) {
        operation.result = safeResult(result);
      } else {
        operation.status = "unknown";
        installUnresolved = true;
      }
    }
    let restoreResult;
    if (typeof operation.restoreRequestId === "string" && UUID.test(operation.restoreRequestId) && operation.restore !== "ok") {
      try {
        const manager = this.manager();
        restoreResult = manager ? await manager.waitForInstall(operation.restoreRequestId) : void 0;
      } catch {
        restoreResult = void 0;
      }
    }
    let bundle;
    let listFailed = false;
    try {
      bundle = (await this.manager()?.listBundles())?.find((item) => item.name === PACKAGE);
    } catch (error) {
      if (!restoreResult) throw error;
      listFailed = true;
      operation.restore = restoreResult.application === "cancelled" ? "cancelled" : "unconfirmed";
      bundle = void 0;
    }
    if (restoreResult && !listFailed) {
      const listed = bundle === void 0 && !this.manager() ? { known: false, row: null } : { known: true, row: bundle?.installed ? bundle : null };
      operation.restore = classifyRestore(restoreResult, { version: operation.previousVersion }, listed);
    }
    let installed = bundle?.version;
    if (operation.result) operation.status = resultState(operation.result, operation.version, this.version, bundle);
    if (["installing", "restart-required", "unknown", "applied"].includes(operation.status) && this.version === operation.version) {
      operation.status = bundle?.installed && !bundle.error && !bundle.readOnlyReason && installed === operation.version ? "applied" : "unknown";
    }
    settleRemoval(operation, this.version);
    if (operation.status === "applied" && (operation.reason === "reinstall" || operation.reason === "restore-pending"))
      delete operation.reason;
    const absent = !listFailed && bundle?.installed !== true;
    const sawPresent = !listFailed && bundle?.installed === true;
    const presenceChanged = sawPresent && operation.observedPresent !== true;
    if (sawPresent) {
      operation.observedPresent = true;
      if (operation.restoreInstall != null) this.markInstallFinished(operation);
    }
    if (this.cacheDir) await sweepLockGraves(this.cacheDir);
    const receiptsBefore = Array.isArray(operation.receipts) ? operation.receipts.length : 0;
    if (absent && operation.reason !== "restored" && operation.reason !== "restore-failed" && packageWasInstalled(operation))
      appendReceipt(operation, { kind: "remove", id: operation.requestId, at: Date.now() });
    let directoryUnread = false;
    if (absent && removalProven(operation)) {
      const foreign = await this.laterForeignReceipt(operation);
      if (foreign === true)
        appendReceipt(operation, { kind: "apply", id: `foreign:${operation.requestId}`, at: Date.now() });
      else if (foreign === "unreadable") directoryUnread = true;
    }
    const receiptAdded = (Array.isArray(operation.receipts) ? operation.receipts.length : 0) > receiptsBefore;
    let priorUnsettled = false;
    if (absent && operation.restoreInstall != null && operation.restore !== "ok" && operation.reason !== "restored") {
      const record = installRecordOf(operation.restoreInstall);
      let prior = null;
      if (record) {
        try {
          const manager = this.manager();
          prior = manager && typeof manager.waitForInstall === "function" ? await manager.waitForInstall(record.requestId) : null;
        } catch {
          prior = null;
        }
      }
      if (prior && record) {
        operation.restore = classifyRestore(
          prior,
          { version: operation.previousVersion },
          {
            known: !listFailed,
            row: !listFailed && bundle?.installed ? bundle : null
          }
        );
        operation.restoreRequestId = record.requestId;
        settleRemoval(operation, this.version);
        this.markInstallFinished(operation);
      } else priorUnsettled = true;
    }
    const lockHeld = journalLockHeld(operation, Date.now()) || await this.fileLockHeld(operation.requestId);
    const plan = restorePlan(operation, {
      absent,
      installUnresolved,
      now: Date.now(),
      cacheDir: this.cacheDir,
      lockHeld,
      directoryUnread,
      priorUnsettled
    });
    const journalTouched = presenceChanged || receiptAdded || operation.restoreInstallSettledId || operation.restoreInstallDrop === true;
    if (journalTouched && plan !== "auto") await this.persistRestoreJournal(operation);
    delete operation.restoreInstallSettledId;
    delete operation.restoreInstallDrop;
    if (plan === "auto") {
      const restoredVersion = await this.restoreMissing(operation);
      if (typeof restoredVersion === "string") installed = restoredVersion;
    } else if (plan === "offer") operation.reason = "restore-offer";
    else if (plan === "limit") operation.reason = "restore-limit";
    else if (plan === "invalid-source") operation.reason = "source";
    return { ...this.base(), ...operation, installedVersion: installed };
  }
  /**
   * Another operation journal recorded an apply or removal after this one removed the package.
   * One unreadable sibling is read again and, if it is still broken, renamed aside under a
   * name that includes the time and a random id. If the directory itself cannot be
   * read, this pass does not treat that as a later receipt for every operation.
   * @param {object} operation
   * @returns {Promise<boolean | 'unreadable'>}
   */
  async laterForeignReceipt(operation) {
    let names;
    try {
      names = await readdir(this.cacheDir);
    } catch {
      return "unreadable";
    }
    const receipts = Array.isArray(operation.receipts) ? operation.receipts : [];
    const marker = receipts.find((item) => item?.kind === "removed-by-update" && item.id === operation.requestId);
    const at = typeof marker?.at === "number" ? marker.at : typeof operation.removedAt === "number" ? operation.removedAt : 0;
    for (const name2 of names) {
      if (!name2.endsWith(".json") || name2 === "latest.json") continue;
      const id = name2.slice(0, -5);
      if (id === operation.requestId || !UUID.test(id)) continue;
      let other;
      try {
        other = JSON.parse(await readFile(join(this.cacheDir, name2), "utf8"));
      } catch (error) {
        if (error?.code !== "ENOENT") await this.quarantineJournal(name2);
        continue;
      }
      const otherReceipts = Array.isArray(other?.receipts) ? other.receipts : [];
      if (otherReceipts.some(
        (item) => (item?.kind === "apply" || item?.kind === "remove") && typeof item.at === "number" && item.at > at
      ))
        return true;
      const application = other?.result?.application;
      if ((application === "applied" || application === "restart-required") && typeof other?.recordedAt === "number" && other.recordedAt > at)
        return true;
    }
    return false;
  }
  /**
   * Install the saved previous spec once per operation in this process.
   * A second caller waits for that install instead of starting another.
   * Automatic installs require a proven removal. Settings passes `manual`.
   * @param {object} operation
   * @param {{ manual?: boolean }} [options]
   * @returns {Promise<string | undefined>}
   */
  async restoreMissing(operation, options = {}) {
    const id = operation.requestId;
    if (typeof id !== "string") return void 0;
    const existing = this.restoreFlights.get(id);
    if (existing) {
      const version = await existing;
      await this.copyJournal(operation);
      return version;
    }
    let release;
    const opened = new Promise((resolve2) => {
      release = resolve2;
    });
    const flight = (async () => {
      await opened;
      return this.restoreMissingOwned(operation, options);
    })();
    this.restoreFlights.set(id, flight);
    release();
    try {
      return await flight;
    } finally {
      if (this.restoreFlights.get(id) === flight) this.restoreFlights.delete(id);
    }
  }
  /**
   * @param {object} operation
   */
  async copyJournal(operation) {
    try {
      const saved = JSON.parse(await readFile(join(this.cacheDir, `${operation.requestId}.json`), "utf8"));
      if (saved?.requestId === operation.requestId) Object.assign(operation, saved);
    } catch {
    }
  }
  /**
   * @param {object} operation
   * @param {{ manual?: boolean }} options
   * @returns {Promise<string | undefined>}
   */
  async restoreMissingOwned(operation, { manual = false } = {}) {
    if (this.closed) return void 0;
    const spec = previousSpec(operation);
    if (!spec) return void 0;
    try {
      sourceKind(spec.source, this.cacheDir, spec.version);
    } catch {
      operation.reason = "source";
      return void 0;
    }
    if (!manual && !removalProven(operation)) return void 0;
    if (!manual && !operation.result) return void 0;
    const manager = this.manager();
    if (!manager || typeof manager.installBundle !== "function" || typeof manager.listBundles !== "function")
      return void 0;
    if (journalLockHeld(operation, Date.now())) return void 0;
    const lock = await this.acquireRestoreLock(operation.requestId);
    if (!lock) return void 0;
    const timer = setInterval(() => {
      void this.renewRestoreLock(lock).then(
        (ok) => {
          if (!ok) lock.lost = true;
        },
        () => {
          lock.lost = true;
        }
      );
    }, RESTORE_LOCK_RENEW_MS);
    timer.unref?.();
    const renewer = startLockRenewer(lock);
    try {
      if (this.closed) return void 0;
      await this.reloadOperation(operation);
      const current = previousSpec(operation);
      if (!current) return void 0;
      try {
        sourceKind(current.source, this.cacheDir, current.version);
      } catch {
        operation.reason = "source";
        return void 0;
      }
      if (journalLockHeld(operation, Date.now())) return void 0;
      const now = Date.now();
      if (!manual && attemptsOf(operation) >= RESTORE_ATTEMPT_LIMIT) {
        operation.reason = "restore-limit";
        await this.saveMerged(operation);
        return void 0;
      }
      const recent = typeof operation.restoreAttemptAt === "number" && now - operation.restoreAttemptAt < RESTORE_ATTEMPT_INTERVAL_MS;
      if (!manual && recent) return void 0;
      if (!manual && !removalProven(operation)) return void 0;
      if (!manual && !operation.result) return void 0;
      const presence = await listedPackage(manager);
      if (presence !== "absent") {
        if (presence === "present") {
          operation.observedPresent = true;
          if (operation.restoreInstall != null) this.markInstallFinished(operation);
          try {
            await this.saveMerged(operation);
          } catch {
          }
          return await this.listedVersion();
        }
        return void 0;
      }
      const pending = await this.blockOnUnsettledInstall(operation, manager, manual);
      if (pending === "settled") return await this.listedVersion();
      if (pending === "offer") return void 0;
      operation.restoreAttempts = attemptsOf(operation) + 1;
      operation.restoreAttemptAt = now;
      delete operation.restoreLock;
      try {
        await this.saveMerged(operation);
      } catch {
        return void 0;
      }
      const restore = await reinstallPrevious(manager, current, {
        validateSource: true,
        cacheDir: this.cacheDir,
        stillOwned: async () => {
          if (lock.lost) return false;
          const ok = await this.renewRestoreLock(lock);
          if (!ok) lock.lost = true;
          return ok;
        },
        confirmAbsent: async () => await listedPackage(manager) === "absent",
        noteInstallStart: async (requestId) => {
          if (lock.lost) return false;
          if (!await this.renewRestoreLock(lock)) {
            lock.lost = true;
            return false;
          }
          operation.restoreInstall = { requestId, owner: lock.owner, startedAt: Date.now() };
          operation.restoreRequestId = requestId;
          try {
            await this.saveMerged(operation);
          } catch {
            delete operation.restoreInstall;
            return false;
          }
          const kept = installRecordOf(operation.restoreInstall);
          if (!kept || kept.requestId !== requestId) return false;
          if (!await this.renewRestoreLock(lock)) {
            lock.lost = true;
            return false;
          }
          return true;
        },
        abandoned: () => lock.lost === true,
        onRestoreRequest: async (requestId, previousVersion) => {
          operation.restoreRequestId = requestId;
          if (typeof previousVersion === "string" && previousVersion !== "") operation.previousVersion = previousVersion;
          try {
            await this.saveMerged(operation);
          } catch {
          }
        }
      });
      if (!restore) return void 0;
      operation.restore = restore.state;
      operation.restoreRequestId = restore.requestId;
      settleRemoval(operation, this.version);
      if (operation.status === "applied" && (operation.reason === "reinstall" || operation.reason === "restore-pending"))
        delete operation.reason;
      await this.finishRestoreInstall(operation, lock, restore.requestId);
      return await this.listedVersion();
    } finally {
      clearInterval(timer);
      await stopLockRenewer(renewer);
      await this.releaseRestoreLock(lock);
    }
  }
  /**
   * Forget the in-flight restore install. A readable record is cleared only when
   * the disk copy is still that request id. An unreadable record is dropped.
   * @param {object} operation
   */
  markInstallFinished(operation) {
    if (operation.restoreInstall == null) return;
    const record = installRecordOf(operation.restoreInstall);
    operation.restoreInstall = null;
    if (record) operation.restoreInstallSettledId = record.requestId;
    else operation.restoreInstallDrop = true;
  }
  /**
   * A previous restore install has a result in this process. Record that outcome
   * and clear its id. The caller holds the restore lock.
   * @param {object} operation
   * @param {{ requestId: string, owner: string, startedAt: number }} record
   * @param {object} result
   */
  async rememberSettledInstall(operation, record, result) {
    const listed = await installedCopy(this.manager());
    operation.restore = classifyRestore(result, { version: operation.previousVersion }, listed);
    operation.restoreRequestId = record.requestId;
    settleRemoval(operation, this.version);
    if (operation.status === "applied" && (operation.reason === "reinstall" || operation.reason === "restore-pending"))
      delete operation.reason;
    this.markInstallFinished(operation);
    try {
      await this.saveMerged(operation);
    } catch {
    }
  }
  /**
   * Automatic restore does not start while an earlier restore install is unsettled.
   * Settings checks the bundle list before installing over an unknown result.
   * A present package is not installed again. A known result is recorded and not started again.
   * @param {object} operation
   * @param {Manager} manager
   * @param {boolean} manual
   * @returns {Promise<false | 'offer' | 'settled'>}
   */
  async blockOnUnsettledInstall(operation, manager, manual) {
    if (operation.restoreInstall == null) return false;
    const record = installRecordOf(operation.restoreInstall);
    let prior = null;
    if (record && typeof manager.waitForInstall === "function") {
      try {
        prior = await manager.waitForInstall(record.requestId);
      } catch {
        prior = null;
      }
    }
    if (prior && record) {
      await this.rememberSettledInstall(operation, record, prior);
      return "settled";
    }
    if (manual) {
      const presence = await listedPackage(manager);
      if (presence === "present") {
        operation.observedPresent = true;
        this.markInstallFinished(operation);
        try {
          await this.saveMerged(operation);
        } catch {
        }
        return "settled";
      }
      if (presence !== "absent") {
        operation.reason = "restore-offer";
        try {
          await this.saveMerged(operation);
        } catch {
        }
        return "offer";
      }
      return false;
    }
    operation.reason = "restore-offer";
    try {
      await this.saveMerged(operation);
    } catch {
    }
    return "offer";
  }
  /**
   * Clear the install record for `requestId` while holding a lock.
   * If this lease was lost, take the lock again. If that fails, leave the record
   * so another process does not auto-install over an unknown result.
   * @param {object} operation
   * @param {{ fh: import('node:fs/promises').FileHandle, path: string, owner: string, requestId: string, queue: Promise<void>, lost: boolean }} lock
   * @param {string} requestId
   */
  async finishRestoreInstall(operation, lock, requestId) {
    operation.restoreInstall = null;
    operation.restoreInstallSettledId = requestId;
    const write = async () => {
      await this.saveMerged(operation);
    };
    let held = false;
    if (!lock.lost) held = await this.renewRestoreLock(lock);
    if (!held) lock.lost = true;
    if (held) {
      try {
        await write();
      } catch {
      }
      delete operation.restoreInstallSettledId;
      return;
    }
    const again = await this.acquireRestoreLock(operation.requestId);
    if (!again) {
      delete operation.restoreInstallSettledId;
      return;
    }
    try {
      await write();
    } catch {
    } finally {
      delete operation.restoreInstallSettledId;
      await this.releaseRestoreLock(again);
    }
  }
  /**
   * @param {string} requestId
   */
  async fileLockHeld(requestId) {
    if (!this.cacheDir || typeof requestId !== "string" || !UUID.test(requestId)) return false;
    const seen = await readLeaseStable(join(this.cacheDir, `${requestId}.restore.lock`));
    return leaseHeld(seen.lease, Date.now());
  }
  /**
   * Exclusive lock file. Expired, unreadable, and absurdly future leases can be taken over
   * by renaming them aside; only one rename wins.
   * @param {string} requestId
   */
  async acquireRestoreLock(requestId) {
    if (typeof requestId !== "string" || !UUID.test(requestId)) return null;
    const directory = await this.privateDir();
    await sweepLockGraves(directory);
    const path = join(directory, `${requestId}.restore.lock`);
    const owner = randomUUID2();
    for (let attempt = 0; attempt < 2; attempt++) {
      const created = await publishLock(path, requestId, owner);
      if (created) return created;
      const seen = await readLeaseStable(path);
      if (seen.missing) continue;
      if (leaseHeld(seen.lease, Date.now())) return null;
      const taken = await this.takeoverRestoreLock(path, requestId, owner);
      if (taken) return taken;
    }
    return null;
  }
  /**
   * @param {string} path
   * @param {string} requestId
   * @param {string} owner
   */
  async takeoverRestoreLock(path, requestId, owner) {
    let fh;
    try {
      fh = await open(path, "r");
    } catch {
      return null;
    }
    let expected;
    let body = null;
    try {
      const fhStat = await fh.stat();
      const pathStat = await lstat(path);
      if (!pathStat.isSymbolicLink() && sameFile(fhStat, pathStat)) {
        expected = pathStat;
        body = parseLease(await readFile(fh, "utf8"));
      }
    } catch {
      expected = void 0;
    } finally {
      await fh.close().catch(() => {
      });
    }
    if (!expected || leaseHeld(body, Date.now())) return null;
    const grave = `${path}.${randomUUID2()}.stale`;
    if (!await renameVerified(path, grave, expected)) return null;
    let moved;
    try {
      moved = parseLease(await readFile(grave, "utf8"));
    } catch {
      moved = null;
    }
    if (leaseHeld(moved, Date.now())) {
      try {
        await link(grave, path);
        await rm(grave, { force: true });
      } catch {
      }
      return null;
    }
    try {
      return await publishLock(path, requestId, owner);
    } finally {
      await rm(grave, { force: true }).catch(() => {
      });
    }
  }
  /**
   * @param {{ fh: import('node:fs/promises').FileHandle, path: string, owner: string, requestId: string, queue: Promise<void>, lost: boolean }} lock
   */
  async renewRestoreLock(lock) {
    return enqueueLock(lock, async () => {
      let fhStat;
      let pathStat;
      try {
        fhStat = await lock.fh.stat();
        pathStat = await lstat(lock.path);
      } catch {
        return false;
      }
      if (!sameFile(fhStat, pathStat)) return false;
      const body = JSON.stringify({
        owner: lock.owner,
        requestId: lock.requestId,
        expiresAt: Date.now() + RESTORE_LOCK_TTL_MS
      });
      try {
        await writeHandle(lock.fh, body);
        const again = await lstat(lock.path);
        const fhAgain = await lock.fh.stat();
        if (!sameFile(again, fhAgain)) return false;
        const seen = parseLease(await readFile(lock.path, "utf8"));
        return Boolean(seen && seen.owner === lock.owner && leaseHeld(seen, Date.now()));
      } catch {
        return false;
      }
    });
  }
  /**
   * Remove the lock only when this holder still owns the file that was renamed aside.
   * @param {{ fh: import('node:fs/promises').FileHandle, path: string, owner: string, requestId: string, queue: Promise<void>, lost: boolean } | null} lock
   */
  async releaseRestoreLock(lock) {
    if (!lock) return;
    await enqueueLock(lock, async () => {
      let fhStat;
      let pathStat;
      try {
        fhStat = await lock.fh.stat();
        pathStat = await lstat(lock.path);
      } catch {
        return;
      }
      if (pathStat.isSymbolicLink() || !sameFile(fhStat, pathStat)) return;
      const grave = `${lock.path}.${randomUUID2()}.release`;
      if (!await renameVerified(lock.path, grave, pathStat)) return;
      let mine;
      try {
        const graveStat = await lstat(grave);
        const body = parseLease(await readFile(grave, "utf8"));
        mine = sameFile(fhStat, graveStat) && body?.owner === lock.owner;
      } catch {
        mine = false;
      }
      if (mine) {
        await rm(grave, { force: true }).catch(() => {
        });
        return;
      }
      try {
        await link(grave, lock.path);
        await rm(grave, { force: true }).catch(() => {
        });
      } catch {
      }
    });
    await lock.fh.close().catch(() => {
    });
  }
  /**
   * @param {string} name
   */
  async quarantineJournal(name2) {
    if (!name2.endsWith(".json") || name2 === "latest.json") return;
    const id = name2.slice(0, -5);
    if (!UUID.test(id)) return;
    const path = join(this.cacheDir, name2);
    let fh;
    try {
      fh = await open(path, "r");
    } catch {
      return;
    }
    let expected;
    let text2;
    try {
      const fhStat = await fh.stat();
      const pathStat = await lstat(path);
      if (pathStat.isSymbolicLink() || !sameFile(fhStat, pathStat)) return;
      expected = pathStat;
      text2 = await readFile(fh, "utf8");
    } catch {
      return;
    } finally {
      await fh.close().catch(() => {
      });
    }
    if (!expected) return;
    try {
      JSON.parse(text2);
      return;
    } catch {
    }
    let againStat;
    let again;
    try {
      againStat = await lstat(path);
      if (againStat.isSymbolicLink() || !sameFile(againStat, expected)) return;
      again = await readFile(path, "utf8");
    } catch {
      return;
    }
    try {
      JSON.parse(again);
      return;
    } catch {
    }
    const destination = join(this.cacheDir, `${name2}.${Date.now()}.${randomUUID2()}.quarantine`);
    await renameVerified(path, destination, againStat);
  }
  /**
   * @param {object} operation
   */
  async reloadOperation(operation) {
    try {
      const disk = JSON.parse(await readFile(join(this.cacheDir, `${operation.requestId}.json`), "utf8"));
      if (!disk || disk.requestId !== operation.requestId) return;
      for (const key of Object.keys(operation)) {
        if (!(key in disk)) delete operation[key];
      }
      Object.assign(operation, disk);
    } catch {
    }
  }
  /**
   * Re-read the journal under the caller's lock and keep attempt counts that another
   * process already recorded.
   * @param {object} operation
   */
  async saveMerged(operation) {
    let disk = {};
    try {
      const parsed = JSON.parse(await readFile(join(this.cacheDir, `${operation.requestId}.json`), "utf8"));
      if (parsed?.requestId === operation.requestId) disk = parsed;
    } catch {
      disk = {};
    }
    absorbMonotonic(operation, disk);
    await this.save(operation);
  }
  /**
   * @param {object} operation
   */
  async persistRestoreJournal(operation) {
    if (this.closed || journalLockHeld(operation, Date.now())) return false;
    const lock = await this.acquireRestoreLock(operation.requestId);
    if (!lock) return false;
    try {
      await this.saveMerged(operation);
      return true;
    } catch {
      return false;
    } finally {
      await this.releaseRestoreLock(lock);
    }
  }
  /** @returns {Promise<string | undefined>} */
  async listedVersion() {
    const manager = this.manager();
    if (!manager || typeof manager.listBundles !== "function") return void 0;
    try {
      const listed = (await manager.listBundles()).find((item) => item?.name === PACKAGE && item.installed);
      return typeof listed?.version === "string" ? listed.version : void 0;
    } catch {
      return void 0;
    }
  }
  /**
   * Settings asked to put the previous version back. This does not run for an
   * automatic reconcile, and it does not report that choice as `restore-failed`.
   * @param {unknown} requestId
   * @param {unknown} profileKey
   */
  async restore(requestId, profileKey) {
    if (!profileKey || profileKey !== this.base().profileKey) throw new Error("profile");
    if (typeof requestId !== "string" || !UUID.test(requestId)) throw new Error("invalid-request");
    const viewed = await this.reconcile(requestId);
    if (viewed.reason !== "restore-offer" && viewed.reason !== "restore-limit") return viewed;
    let operation;
    try {
      operation = JSON.parse(await readFile(join(this.cacheDir, `${requestId}.json`), "utf8"));
    } catch {
      return viewed;
    }
    if (operation.requestId !== requestId) return viewed;
    const installedVersion = await this.restoreMissing(operation, { manual: true });
    return { ...this.base(), ...operation, ...installedVersion ? { installedVersion } : {} };
  }
  dispose() {
    this.closed = true;
    this.abort.abort();
  }
};

// src/host/update-routes.ts
function payloadOf(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("invalid-request");
  return value;
}
function settingsOf(value) {
  const data = payloadOf(value);
  for (const [key, initial] of Object.entries(DEFAULT_SETTINGS)) {
    if (typeof data[key] !== typeof initial) throw new Error("invalid-request");
  }
  const settings = normalizeSettings(data);
  if (Object.entries(settings).some(([key, value2]) => value2 !== data[key])) throw new Error("invalid-request");
  return settings;
}
function applyUpdateRoutes(ctx, readSettings2, version) {
  let expected;
  const updates = new PluginUpdates({
    manager: () => ctx.get?.("pluginManager"),
    profileDir: ctx.get?.("profileContext")?.dir,
    version,
    runtimeVersion: async () => {
      const anchor = ctx.get?.("profileContext")?.installAnchor;
      if (!anchor) throw new Error("manager-unavailable");
      const path = createRequire(anchor).resolve("@deepseek-ai/dsh-app-boot");
      const module = await import(pathToFileURL(path).href);
      return module.getDshRuntimeVersion();
    },
    isBusy: () => expected !== void 0 && !sameSettings(readSettings2(), expected)
  });
  ctx.effect?.(() => () => updates.dispose(), "dsh-glassui: update retrieval");
  ctx.inject?.(["connection"], (child) => {
    for (const method of ["status", "check", "begin", "reconcile", "restore"]) {
      const endpoint = `dsh-glassui/update-${method}`;
      child.connection.fetch.register({
        path: `/api/${endpoint}`,
        methods: ["POST"],
        requestBody: "buffered",
        async fetch(request) {
          let rpcId;
          try {
            if (request.headers.get("content-type")?.split(";")[0] !== "application/json")
              return new Response("unsupported media type", { status: 415 });
            const envelope = payloadOf(await request.json());
            if (envelope.type !== "client-request" || typeof envelope.rpcId !== "string" || envelope.rpcId.length > 100 || envelope.method !== endpoint)
              return new Response("invalid request", { status: 400 });
            rpcId = envelope.rpcId;
            request.signal.throwIfAborted();
            const payload = payloadOf(envelope.payload);
            let value;
            if (method === "status") value = await updates.status();
            else if (method === "check") value = await updates.check();
            else if (method === "reconcile") value = await updates.reconcile(payload.requestId);
            else if (method === "restore") value = await updates.restore(payload.requestId, payload.profileKey);
            else {
              const settings = settingsOf(payload.settings);
              if (!sameSettings(readSettings2(), settings)) throw new Error("settings");
              if (!updates.running) expected = settings;
              value = await updates.begin(payload.candidateId, payload.requestId, payload.profileKey);
            }
            return Response.json(
              { type: "server-response", rpcId, result: { ok: true, value } },
              { headers: { "cache-control": "no-store" } }
            );
          } catch (error) {
            if (rpcId === void 0) return new Response("invalid request", { status: 400 });
            const code = error instanceof Error && ["settings", "busy", "invalid-request", "profile"].includes(error.message) ? error.message : "update-failed";
            return Response.json(
              {
                type: "server-response",
                rpcId,
                result: { ok: false, error: { code: `dsh-glassui/${code}`, message: code, details: {} } }
              },
              { headers: { "cache-control": "no-store" } }
            );
          }
        }
      });
    }
  });
}

// src/shared/dom.ts
var ATTR_ROOT = "data-glassui";
var ATTR_SIDEBAR = "data-glassui-sidebar";
var ATTR_WALLPAPER = "data-glassui-wallpaper";
var ATTR_STATIC_WALLPAPER = "data-glassui-static-wallpaper";
var ATTR_HIGHLIGHTS = "data-glassui-highlights";
var ATTR_ADJUSTING = "data-glassui-adjusting";
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
var VAR_INLINE_OPACITY = "--glassui-inline-opacity";
var VAR_WALLPAPER = "--glassui-wallpaper";
var VAR_POINTER_X = "--glassui-lx";
var VAR_POINTER_Y = "--glassui-ly";
var FOOTPRINT_SELECTOR = [
  ATTR_ROOT,
  ATTR_SIDEBAR,
  ATTR_WALLPAPER,
  ATTR_STATIC_WALLPAPER,
  ATTR_HIGHLIGHTS,
  ATTR_ADJUSTING,
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
var INLINE_CODE_TOKEN = "--dsw-alias-markdown-inline-code";
var RESERVED_TOKENS = [
  INLINE_CODE_TOKEN,
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
var ROOT2 = `:root[${ATTR_ROOT}]`;
var BODY = `${ROOT2} body`;
var BODY_DARK = `${ROOT2} body[${DARK_ATTRIBUTE}]`;
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
  [VAR_INLINE_OPACITY]: 0.72,
  "--glassui-floor": 0,
  "--glassui-tt": `max(var(${VAR_TINT}), var(--glassui-floor))`,
  "--glassui-blur": "calc(6px + var(--glassui-tt) * 22px)",
  "--glassui-filter": "blur(var(--glassui-blur)) saturate(180%) brightness(1.04)",
  "--glassui-fill-a": "max(var(--glassui-floor), calc(0.16 + var(--glassui-tt) * 0.62))",
  // Composer only. 0.74 keeps the light placeholder at 4.5:1 on black at tint 0;
  // the tint can still raise it, and other surfaces stay on --glassui-fill-a.
  "--glassui-composer-a": "max(0.74, var(--glassui-fill-a))",
  "--glassui-dense-a": "max(var(--glassui-floor), calc(0.52 + var(--glassui-tt) * 0.42))",
  "--glassui-smoke-a": "max(var(--glassui-floor), calc(0.5 + var(--glassui-tt) * 0.42))",
  // Code blocks stay dense enough for syntax colors to keep their contrast.
  "--glassui-code-a": "max(var(--glassui-floor), calc(0.4 + var(--glassui-tt) * 0.4))",
  "--glassui-canvas-a": "max(var(--glassui-floor), calc(0.4 + var(--glassui-tt) * 0.5))",
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
  [INLINE_CODE_TOKEN]: `rgb(245 246 248 / max(var(${VAR_INLINE_OPACITY}), var(--glassui-floor)))`,
  [MENU_TOKENS.fill]: "rgb(250 250 252 / max(var(--glassui-floor), calc(0.5 + var(--glassui-tt) * 0.42)))",
  [MENU_TOKENS.overlayFill]: "rgb(250 250 252 / max(var(--glassui-floor), calc(0.86 + var(--glassui-tt) * 0.12)))",
  [MENU_TOKENS.groupHeader]: "rgb(250 250 252 / max(var(--glassui-floor), calc(0.8 + var(--glassui-tt) * 0.18)))"
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
  [INLINE_CODE_TOKEN]: `rgb(48 48 54 / max(var(${VAR_INLINE_OPACITY}), var(--glassui-floor)))`,
  [MENU_TOKENS.fill]: "rgb(44 44 48 / max(var(--glassui-floor), calc(0.46 + var(--glassui-tt) * 0.44)))",
  [MENU_TOKENS.overlayFill]: "rgb(44 44 48 / max(var(--glassui-floor), calc(0.86 + var(--glassui-tt) * 0.12)))",
  [MENU_TOKENS.groupHeader]: "rgb(44 44 48 / max(var(--glassui-floor), calc(0.8 + var(--glassui-tt) * 0.18)))"
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
function composerTextRules() {
  const permission = `[data-composer-card] button:not([aria-haspopup]):has(> span + span)`;
  const model = `[data-composer-card] button:has([data-model-id])`;
  const targets = (scope) => [
    `${scope} [data-composer-placeholder]`,
    `${scope} ${permission}`,
    `${scope} ${permission} span`,
    `${scope} ${permission} svg`,
    `${scope} ${model}`,
    `${scope} ${model} span[data-model-id]`,
    `${scope} ${model} svg`
  ].join(",\n");
  return [
    rule(targets(`${BODY}:not([${DARK_ATTRIBUTE}])`), { color: "#4f5459" }),
    rule(targets(BODY_DARK), { color: "#c8ccd4" })
  ];
}
function surfaceRules() {
  const rules = [
    rule(`${S}[${ATTR_SURFACE}="sidebar"]`, {
      "--glassui-pct": "calc(var(--glassui-fill-a) * 100%)"
    }),
    rule(`${S}[${ATTR_SURFACE}="composer"]`, {
      "--glassui-pct": "calc(var(--glassui-composer-a) * 100%)"
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
    rule(`${ROOT2}[${ATTR_HIGHLIGHTS}] body [${ATTR_SURFACE}][${ATTR_PAINT}]`, { "--glassui-light": POINTER_LIGHT }),
    // The floating sidebar is shaped with clip-path rather than margins: DSH sizes
    // the sidebar's content in pixels to the column width, and a margin would cut
    // into it. The 8px inset falls inside the content's own padding.
    rule(`${ROOT2}[${ATTR_SIDEBAR}="floating"] body [${ATTR_SURFACE}="sidebar"][${ATTR_FLOAT}]:not([${ATTR_FLAT}])`, {
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
    rule(`${ROOT2}[${ATTR_WALLPAPER}]`, {
      background: `var(${VAR_WALLPAPER}) center / cover no-repeat fixed`
    }),
    // A transparent image keeps body-background propagation identical to the
    // boot/root wallpaper. `background-image: none` would move the body tint
    // underneath the cached wallpaper and visibly change every color.
    rule(`${ROOT2}[${ATTR_WALLPAPER}][${ATTR_STATIC_WALLPAPER}]`, {
      "background-image": "linear-gradient(transparent, transparent)"
    }),
    rule(`${ROOT2}[${ATTR_STATIC_WALLPAPER}] > [${ATTR_OWNED}="static-wallpaper"]`, {
      position: "fixed",
      inset: 0,
      "z-index": -1,
      "pointer-events": "none",
      contain: "strict",
      transform: "translateZ(0)",
      "background-position": "center",
      "background-size": "cover",
      "background-repeat": "no-repeat"
    }),
    rule(`${ROOT2}[${ATTR_WALLPAPER}] body${INCLUDED}`, {
      "background-color": "color-mix(in srgb, var(--dsw-alias-bg-base) calc(var(--glassui-canvas-a) * 100%), transparent)"
    })
  ];
}
function accessibilityRules() {
  return [
    `@media (prefers-contrast: more) {
${[
      rule(ROOT2, { "--glassui-floor": 0.85 }),
      rule(BODY, { "--glassui-edge": "rgb(0 0 0 / 0.45)" }),
      rule(BODY_DARK, { "--glassui-edge": "rgb(255 255 255 / 0.35)" })
    ].join("\n")}
}`,
    `@media (prefers-reduced-transparency: reduce) {
${rule(ROOT2, { "--glassui-floor": 1, "--glassui-filter": "none" })}
}`,
    // Without backdrop blur, translucent fills would put text over unblurred content.
    `@supports not ((backdrop-filter: blur(1px)) or (-webkit-backdrop-filter: blur(1px))) {
${rule(ROOT2, { "--glassui-floor": 0.9 })}
}`
  ].join("\n");
}
function buildStylesheet() {
  const parts2 = [
    "/* dsh-glassui: Liquid Glass-style material for DSH Web. Inert unless <html> has data-glassui. */",
    PROPERTIES,
    // Screens only: printing keeps DSH's own look. Forced colors (Windows high contrast) is left alone entirely.
    "@media screen and (forced-colors: none) {",
    rule(ROOT2, ROOT_PARAMETERS),
    rule(`${BODY}${INCLUDED}`, { ...LIGHT, ...SHARED }),
    rule(`${BODY_DARK}${INCLUDED}`, DARK),
    rule(`${BODY}${INCLUDED}, ${BODY} *${INCLUDED}`, ELEVATION),
    rule(`${S}[${ATTR_LENS}]`, {
      ...CONTAINED_ELEVATION,
      // Menus can use literal shadows rather than elevation tokens.
      "box-shadow": "var(--glassui-contained-rim), 0 16px 22px -33px var(--glassui-contact)"
    }),
    ...surfaceRules(),
    ...composerTextRules(),
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
    `    root.style.setProperty(${scriptJson(VAR_INLINE_OPACITY)}, ${scriptJson(String(settings.inlineCodeOpacity / 100))})`,
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
  inlineCodeOpacity: z.natural().max(100).default(d.inlineCodeOpacity).description("Inline-code background opacity, independent of glass density (0\u2013100).").volatile(),
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
    inlineCodeOpacity: config.inlineCodeOpacity.get(),
    refraction: config.refraction.get(),
    highlights: config.highlights.get(),
    exclude: config.exclude.get()
  });
}
function apply(ctx, config) {
  applyUpdateRoutes(ctx, () => readSettings(config), "0.2.5");
  ctx.on("webserver/index-inject", (table) => {
    table.push(...bootRows(readSettings(config), "0.2.5"));
  });
}
export {
  Config,
  apply,
  name,
  readSettings
};
