import type { $ZodStringFormats } from "../core/checks.js";
import type * as errors from "../core/errors.js";
import * as util from "../core/util.js";

const error: () => errors.$ZodErrorMap = () => {
  const Sizable: Record<string, { unit: string; verb: string }> = {
    string: { unit: "znakov", verb: "mať" },
    file: { unit: "bajtov", verb: "mať" },
    array: { unit: "prvkov", verb: "mať" },
    set: { unit: "prvkov", verb: "mať" },
  };

  function getSizing(origin: string): { unit: string; verb: string } | null {
    return Sizable[origin] ?? null;
  }

  const parsedType = (data: any): string => {
    const t = typeof data;

    switch (t) {
      case "number": {
        return Number.isNaN(data) ? "NaN" : "číslo";
      }
      case "string": {
        return "reťazec";
      }
      case "boolean": {
        return "boolean";
      }
      case "bigint": {
        return "bigint";
      }
      case "function": {
        return "funkcia";
      }
      case "symbol": {
        return "symbol";
      }
      case "undefined": {
        return "undefined";
      }
      case "object": {
        if (Array.isArray(data)) {
          return "pole";
        }
        if (data === null) {
          return "null";
        }

        if (Object.getPrototypeOf(data) !== Object.prototype && data.constructor) {
          return data.constructor.name;
        }
      }
    }
    return t;
  };

  const Nouns: {
    [k in $ZodStringFormats | (string & {})]?: string;
  } = {
    regex: "regulárny výraz",
    email: "e-mailová adresa",
    url: "URL",
    emoji: "emoji",
    uuid: "UUID",
    uuidv4: "UUIDv4",
    uuidv6: "UUIDv6",
    nanoid: "nanoid",
    guid: "GUID",
    cuid: "cuid",
    cuid2: "cuid2",
    ulid: "ULID",
    xid: "XID",
    ksuid: "KSUID",
    datetime: "dátum a čas vo formáte ISO",
    date: "dátum vo formáte ISO",
    time: "čas vo formáte ISO",
    duration: "doba trvania ISO",
    ipv4: "IPv4 adresa",
    ipv6: "IPv6 adresa",
    cidrv4: "rozsah IPv4",
    cidrv6: "rozsah IPv6",
    base64: "reťazec zakódovaný vo formáte base64",
    base64url: "reťazec zakódovaný vo formáte base64url",
    json_string: "reťazec vo formáte JSON",
    e164: "číslo E.164",
    jwt: "JWT",
    template_literal: "vstup",
  };

  return (issue) => {
    switch (issue.code) {
      case "invalid_type":
        return `Neplatný vstup: očakávané ${issue.expected}, prijaté ${parsedType(issue.input)}`;
      case "invalid_value":
        if (issue.values.length === 1) return `Neplatný vstup: očakávané ${util.stringifyPrimitive(issue.values[0])}`;
        return `Neplatná možnosť: očakávaná jedna z hodnôt ${util.joinValues(issue.values, "|")}`;
      case "too_big": {
        const adj = issue.inclusive ? "<=" : "<";
        const sizing = getSizing(issue.origin);
        if (sizing) {
          return `Hodnota je príliš veľká: ${issue.origin ?? "hodnota"} musí mať ${adj}${issue.maximum.toString()} ${sizing.unit ?? "prvkov"}`;
        }
        return `Hodnota je príliš veľká: ${issue.origin ?? "hodnota"} musí byť ${adj}${issue.maximum.toString()}`;
      }
      case "too_small": {
        const adj = issue.inclusive ? ">=" : ">";
        const sizing = getSizing(issue.origin);
        if (sizing) {
          return `Hodnota je příliš malá: ${issue.origin ?? "hodnota"} musí mať ${adj}${issue.minimum.toString()} ${sizing.unit ?? "prvkov"}`;
        }
        return `Hodnota je příliš malá: ${issue.origin ?? "hodnota"} musí byť ${adj}${issue.minimum.toString()}`;
      }
      case "invalid_format": {
        const _issue = issue as errors.$ZodStringFormatIssues;
        if (_issue.format === "starts_with") return `Neplatný reťazec: musí začínať na "${_issue.prefix}"`;
        if (_issue.format === "ends_with") return `Neplatný reťazec: musí končiť na "${_issue.suffix}"`;
        if (_issue.format === "includes") return `Neplatný reťazec: musí obsahovať "${_issue.includes}"`;
        if (_issue.format === "regex") return `Neplatný reťazec: musí odpovedať vzoru ${_issue.pattern}`;
        return `Neplatný formát ${Nouns[_issue.format] ?? issue.format}`;
      }
      case "not_multiple_of":
        return `Neplatné číslo: musí byť násobkom ${issue.divisor}`;
      case "unrecognized_keys":
        return `Neznáme kľúče: ${util.joinValues(issue.keys, ", ")}`;
      case "invalid_key":
        return `Neplatný kľúč v ${issue.origin}`;
      case "invalid_union":
        return "Neplatný vstup";
      case "invalid_element":
        return `Neplatná hodnota v ${issue.origin}`;
      default:
        return `Neplatný vstup`;
    }
  };
};

export default function (): { localeError: errors.$ZodErrorMap } {
  return {
    localeError: error(),
  };
}
