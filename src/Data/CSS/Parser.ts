import { fromMaybe, maybe } from "../Maybe";

import { SDVFontFamily, CSSFontFaceDeclarationEx } from "./Internal/SDV/SDVFontFamily";

import { CSSStyle, CSSDeclarations, CSSRuleEx, styleHash, keyframesHash,
    CSSStyleDeclarationEx, CSSElementStyle, SDVAnimationName,
    CSSKeyframe } from "./Internal/Types";



export const cssStyleRules = (style: CSSStyle): CSSRuleEx[] =>
    style instanceof CSSElementStyle ? style.cssRules : styleRules(style);


// Parse a 'CSSStyleDeclarationEx' object into a list of 'CSSRuleEx' objects.
export const cssElementStyle = (x: CSSStyleDeclarationEx): CSSElementStyle =>
    new CSSElementStyle(styleRules(x));

export const styleRules = (x: CSSStyleDeclarationEx): CSSRuleEx[] => {
    const rules = [];
    extractStyleRules(rules, x, [], []);
    return rules;
};


// -----------------------------------------------------------------------------
// extractStyleRules
//
// Extract style rules from the style object and insert them into the rules"
// list. This function is recursive.

function extractStyleRules
( rules: CSSRuleEx[]
, s: CSSStyleDeclarationEx
, conditions: string[]
, suffixes: string[]
): void {
    const cssDeclarations: CSSDeclarations = {};

    for (const k in s) {
        const v = s[k];

        if (k[0] === ":") {
            // Pseudo classes and pseudo elements.
            extractStyleRules(rules, v, conditions, concat(suffixes, [k]));
        } else if (k[0] === "@") {
            if (k.startsWith("@media")) {
                extractStyleRules(rules, v, concat(conditions, [k]), suffixes);
            } else {
                // Ignore other @-rules.
                console.warn(`extractStyleRules: Ignoring unknown @-rule "${k}"`);
            }
        } else {
            cssDeclarations[k] = processValue(rules, k, v);
        }
    }

    tellCSSStyleRule(rules, cssDeclarations, conditions, suffixes);
}


type ValueProcessor = (rules: CSSRuleEx[], v: any) => undefined | number | string | string[];
const valueProcessors = {
    fontFamily(rules: CSSRuleEx[], v: SDVFontFamily): string | string[] {
        if (typeof v === "string") {
            return v;
        } else if (Array.isArray(v)) {
            return v.map(x => typeof x === "string" ? x : tellCSSFontFaceRule(rules, x));
        } else {
            return fromMaybe("", tellCSSFontFaceRule(rules, v));
        }
    },
    animationName(rules: CSSRuleEx[], v: SDVAnimationName): string {
        if (typeof v === "string") {
            return v;
        } else {
            return tellCSSKeyframesRule(rules, v);
        }
    }
};

// XXX: Why is it allowed to return undefined? This will essentially remove
// the property from the decls. Do we want to allow that?
export const processValue = (rules: CSSRuleEx[], k: string, v: any): undefined | string | string[] =>
    fromMaybe(v, maybe(stringifyValue(k, v), f => f(rules, v), valueProcessors[k]));

const stringifyValue = (key: string, prop: number | string | string[]): number | string | string[] =>
  (typeof prop !== "number" || prop === 0 || unitlessNumbers.has(key))
    ? prop : `${prop}px`;



const concat = <T>(xs: T[], ys: T[]): T[] =>
    [].concat.call([], xs, ys);

const concatMap = <A, B>(f: (x: A) => B[], xs: A[]): B[] =>
    xs.reduce((acc, x) => concat(acc, f(x)), []);


// In some parts of the code we treat CSSRuleEx[] as a mutable reference into
// which you can write. Sortof like a writer monad. Use these functions to
// append rules to the list.

const tellCSSStyleRule = (rules: CSSRuleEx[], cssDeclarations: CSSDeclarations, conditions: string[], suffixes: string[]): void => {
    if (Object.keys(cssDeclarations).length === 0) {
        return;
    }

    rules.push({
        type: 1,
        get hash() {
            const value = styleHash(cssDeclarations, concat(conditions, suffixes));
            Object.defineProperty(this, "hash", { value });
            return value;
        },
        conditions,
        suffixes,
        cssDeclarations,
        get className() {
            const value = "s" + this.hash;
            Object.defineProperty(this, "className", { value });
            return value;
        },
    });
};

export const tellCSSFontFaceRule = (rules: CSSRuleEx[], s: CSSFontFaceDeclarationEx): string => {
    // ASSERT notEmpty(s)

    const hash = styleHash(s, []);
    const {fontFamily, cssDeclarations} = maybe(
        {fontFamily: `f-${hash}`, cssDeclarations: Object.assign({}, s, {fontFamily: `f-${hash}`})},
        fontFamily => ({fontFamily, cssDeclarations: s}),
        s.fontFamily);

    rules.push({ type: 5, hash, cssDeclarations });

    return fontFamily;
};

export const tellCSSKeyframesRule = (rules: CSSRuleEx[], keyframes: CSSKeyframe[]): string => {
    // ASSERT notEmpty(s)

    const hash = keyframesHash(keyframes);
    const animationName = `a-${hash}`;

    rules.push({ type: 7, hash, keyframes, animationName });

    return animationName;
};


// Copied from Aphrodite, which apparently copied it from React. Who did React copy it from?
const unitlessNumbers: Set<string> = (() => {
    const prefixes = ["Webkit", "ms", "Moz", "O"];
    const explode = (key: string): string[] =>
        [key, ...prefixes.map(x => x + key.charAt(0).toUpperCase() + key.substring(1))];

    return new Set(concatMap(explode, [
        "animationIterationCount",
        "borderImageOutset",
        "borderImageSlice",
        "borderImageWidth",
        "boxFlex",
        "boxFlexGroup",
        "boxOrdinalGroup",
        "columnCount",
        "flex",
        "flexGrow",
        "flexPositive",
        "flexShrink",
        "flexNegative",
        "flexOrder",
        "gridRow",
        "gridColumn",
        "fontWeight",
        "lineClamp",
        "lineHeight",
        "opacity",
        "order",
        "orphans",
        "tabSize",
        "widows",
        "zIndex",
        "zoom",

        // SVG-related properties
        "fillOpacity",
        "floodOpacity",
        "stopOpacity",
        "strokeDasharray",
        "strokeDashoffset",
        "strokeMiterlimit",
        "strokeOpacity",
        "strokeWidth",
    ]));
})();
