
import { Key, I64, i64Hex, hash, _xor } from "../../../Crypto/SipHash";
const hashKey: Key = [0x12345678, 0x23456789, 0x34567890, 0x45678901];


import { SDVFontFamily } from "./SDV/SDVFontFamily";
export { SDVFontFamily, CSSFontFaceDeclarationEx } from "./SDV/SDVFontFamily";

import { styleRules } from "../Parser";



// ---------------------------------------------------------------------------
// CSSHostH describes the host environment in which the CSS rules take effect.

export interface CSSHostH {
    propertyIsSupported(prop: string): boolean;
    // ^ Return true if the given CSS property is supported by the host. The
    // implementation is encouraged to use a cache if the check is expensive.
    // But the function MUST be otherwise pure.
}



// ---------------------------------------------------------------------------
// The raw CSS declarations. The keys are not further processed, ie. numbers
// are not postfixed with units! The only non-standard behavior is that it
// generates multiple entries for the same key if the value is an array.

export type CSSDeclarations = {
    [key: string]: number | string | string[];
}


export const renderCSSDeclarations = (() => {
    const hyphenate = (x: string): string => x
        .replace(/([A-Z])/g, "-$1")
        .replace(/^ms-/, "-ms-") // Internet Explorer vendor prefix.
        .toLowerCase();

    const append = (str: string, k: string, v: string | number): string =>
        str + (str.length === 0 ? "" : ";") + hyphenate(k) + ":" + v;

    return (cssHostH: CSSHostH, x: CSSDeclarations): string => Object.keys(x).reduce((str, k) => {
        if (k !== "src" && !cssHostH.propertyIsSupported(k)) {
            return str;
        } else {
            const v = x[k];
            return Array.isArray(v)
                ? v.reduce((a, v) => append(a, k, v), str)
                : append(str, k, v);
        }
    }, "");
})();



// ---------------------------------------------------------------------------
// This is like a CSSRule, but with a few differences:
//
//  - Each style has a unique hash. It is used by the Emitter to determine
//    if the rule has already been emitted or not.
//  - The cssText is NOT part of the object, it must be computed by the
//    'cssRuleExText' function.
//
// The 'type' field uses the same values as 'CSSRule' type constants.

export type CSSRuleEx
    = CSSStyleRuleEx
    | CSSFontFaceRuleEx
    | CSSKeyframesRuleEx

export type CSSStyleRuleEx = {
    type: 1;
    hash: CSSRuleExHash;
    conditions: string[];
    suffixes: string[];
    cssDeclarations: CSSDeclarations;
    className: string;
}

export type CSSFontFaceRuleEx = {
    type: 5;
    hash: CSSRuleExHash;
    cssDeclarations: CSSDeclarations;
}

export type CSSKeyframesRuleEx = {
    type: 7;
    hash: CSSRuleExHash;
    keyframes: CSSKeyframe[];
    animationName: string;
}


// ---------------------------------------------------------------------------
// Convert a CSSRuleEx to a string which can be inserted into a <style> tag
// or written out into a .css file.

export const cssRuleExText = (() => {
    const wrapWithCondition = (c: string[], text: string): string =>
        c.length === 0 ? text : wrapWithCondition(c.slice(1), c[0] + "{" + text + "}");

    // When rendering the CSSFontFaceRuleEx declarations, we do not filter out any
    // properties. This is because 'propertyIsSupported' only considers normal style
    // properties and not special ones which are used in @font-face, such as "src".
    const fontFaceCSSHostH: CSSHostH = {
        propertyIsSupported: () => true,
    };

    const cssStyleRuleExText = (cssHostH: CSSHostH, rule: CSSStyleRuleEx): string =>
        wrapWithCondition(rule.conditions,
            [ "."
            , rule.className
            , rule.suffixes.join("")
            , "{"
            , renderCSSDeclarations(cssHostH, rule.cssDeclarations)
            , "}"
            ].join(""));

    const cssKeyframesRuleExText = (cssHostH: CSSHostH, rule: CSSKeyframesRuleEx): string => {
        const block: string = rule.keyframes.reduce((acc, [k, decls]) => {
            const offset: string = typeof k === "number" ? `${k}%` : k;
            return acc + `${offset} {${renderCSSDeclarations(cssHostH, decls)}}`;
        }, "");

        return `@keyframes ${rule.animationName}{${block}}`;
    };

    return (cssHostH: CSSHostH, rule: CSSRuleEx): string => {
        switch (rule.type) {
        case 1: return cssStyleRuleExText(cssHostH, rule);
        case 5: return `@font-face{${renderCSSDeclarations(fontFaceCSSHostH, rule.cssDeclarations)}}`;
        case 7: return cssKeyframesRuleExText(cssHostH, rule);
        }
    };
})();



// ---------------------------------------------------------------------------
// Each CSSRuleEx is identified by a unique hash. The emitter can use this to
// detect whether to emit the rule into the underlying structure or not.

export type CSSRuleExHash = string;

const stringHash = (v: I64, str: string): void => {
    _xor(v, hash(hashKey, str));
};

// In CSS we have to deal with many forms of CSS declaration blocks. This
// function mixes the hash of such an object into the given hash state.
const cssDeclarationsHash = (h: I64, decls: CSSDeclarations): void => {
    const sortedKeys = Object.keys(decls).sort();
    for (let i = 0; i < sortedKeys.length; i++) {
        const key = sortedKeys[i];
        stringHash(h, key);

        const v = decls[key];
        if (typeof v === "string") {
            stringHash(h, v);
        } else if (typeof v === "number") {
            stringHash(h, "" + v);
        } else {
            for (let j = 0; j < v.length; j++) {
                stringHash(h, v[j]);
            }
        }
    }
}

export const styleHash = (decls: CSSDeclarations, extra: string[]): string => {
    let i, h = hash(hashKey, "");

    cssDeclarationsHash(h, decls);

    for (i = 0; i < extra.length; i++) {
        stringHash(h, extra[i]);
    }

    return i64Hex(h);
};

export const keyframesHash = (keyframes: CSSKeyframe[]): string => {
    let i, h = hash(hashKey, "");

    for (i = 0; i < keyframes.length; i++) {
        const [k, decls] = keyframes[i];
        stringHash(h, "" + k);
        cssDeclarationsHash(h, decls);
    }

    return i64Hex(h);
};



// -----------------------------------------------------------------------------
// SDV - Style Declaration value
//
// This section contains types which are supported as values in declarations.


// animationName

// Consider the 'CSSKeyframe' type internal, the constructor should be used
// in external code to create keyframes.
export type CSSKeyframe = [number, CSSDeclarations];
export const CSSKeyframe = (key: number, style: CSSDeclarations): CSSKeyframe =>
    [key, style];

export type SDVAnimationName
    = string
      // ^ If the keyframes are defined externally.
    | CSSKeyframe[]
      // ^ A list of keyframes, will be emitted into a @keyframes rule.



// -----------------------------------------------------------------------------
// A 'CSSStyleDeclarationEx' is a plain JavaScript object whose keys
// correspond to CSS properties. It is similar to 'CSSStyleDeclaration' (hence
// the name similarity), except it doesn't have any of the special attributes
// and methods. And it supports an extended syntax where you can include
// pseudo elements and classes, @keyframes, @font-face, and media queries.
//
// The object is standalone and self-sufficient. It fully describes all CSS
// styles and rules which apply to a particular HTML element on a web page.
// The CSS style declarations within do not have dependencies to any other
// CSS rules.

export type CSSStyleDeclarationEx = {
    // Properties with complex value types.
    fontFamily?: SDVFontFamily;
    animationName?: SDVAnimationName;

    // Other properties.
    [key: string]: string | number | string[] | any;
};


// A prepared, pre-parsed form of 'CSSStyleDeclarationEx'. Users are
// encouraged to use this form instead of 'CSSStyleDeclarationEx',
// because it will be much more performant.
//
// It is a class because we need to distinguish between this and
// 'CSSStyleDeclarationEx' in the 'CSSStyle' type. A type tag would be
// dangerous because it could conflict with a property in
// 'CSSStyleDeclarationEx'.
//
// Note: Do not create subclasses!

export class CSSElementStyle {
    constructor(public cssRules: CSSRuleEx[]) {}
}


export type CSSStyle
    = CSSElementStyle
    | CSSStyleDeclarationEx