import { Maybe, catMaybes } from "../Maybe";

import { CSSRuleExHash, CSSRuleEx, cssRuleExText, CSSStyleDeclarationEx,
    CSSElementStyle, CSSStyle } from "./Internal/Types";
import { cssStyleRules } from "./Parser";



// -----------------------------------------------------------------------------
// The Emitter is an interface which implements the logic of actually writing
// a style object into a target location. This can be either directly into a DOM
// CSSStyleSheet objects or into a file in the case of server-side rendering.

export interface Emitter {
    emitRule(rule: CSSRuleEx): void;
    emitStyle(style: CSSStyle): void;
}



// -----------------------------------------------------------------------------
// The 'MemoryEmitter' stores the rules in memory. You can at any point access
// the list of emitted CSS rules.
//
// It is useful for server-side rendering.  

export class MemoryEmitter implements Emitter {

    cssRules: Map<CSSRuleExHash, CSSRuleEx> = new Map();
    // ^ All CSS rules which have been emitted using this emitter. Treat
    // as read-only when you access it directly. It can only be modified
    // by the 'emitStyle' function.

    emitRule = (rule: CSSRuleEx): void => {
        this.cssRules.set(rule.hash, rule);
    }

    emitStyle = (style: CSSStyle): void => {
        cssStyleRules(style).map(this.emitRule);
    }
}

export const newMemoryEmitter = (): MemoryEmitter =>
    new MemoryEmitter();



// -----------------------------------------------------------------------------
// An DocumentEmitter writes the styles directly into the DOM. It creates
// a new CSSStyleSheet object and inserts the rules into that.
//
// Rules are only ever inserted, old ones are not removed. This is a problem
// for <IE9 which has a limit on how many CSS rules it can have. And it wastes
// a bit of memory because we keep rules around which are potentially not
// needed.
//
// However, if the application doesn't use dynamic styles (eg. theming), then
// there is a fixed upper bound which the application will slowly approach but
// never exceed.
//
// It might still be useful to remove unused rules, however we should first
// measure the performance of the two approaches and then decide whether the
// tradeoff is worth it or not.

const supportedProperties = (() => {
    const rmsPrefix = /^-ms-/;
    const rdashAlpha = /-([a-z])/g;
    const fcamelCase = (_, l) => l.toUpperCase();
    const camelCase = (x: string): string =>
        x.replace(rmsPrefix, "ms-").replace(rdashAlpha, fcamelCase);

    return (window: Window): Set<string> => {
        const computedStyle = window.getComputedStyle(document.documentElement, "");
        return new Set(Array.from(computedStyle).map(camelCase));
    };
})();

export class DocumentEmitter implements Emitter {

    private styleSheet: CSSStyleSheet;
    // ^ The DOM StyleSheet into which we insert the rules. It is created
    // in the constructor.

    private cssRules: Set<string> = new Set();
    // ^ We keep track of which rules (based on their hash) we've already
    // inserted. This is needed to avoid inserting the same rule multiple times.
    //
    // The CSSStyleSheet doesn't provide a good interface for determining if
    // a particular rule is present or not.


    private supportedProperties: Set<string> = new Set();
    // ^ The set of CSS properties which are supported by the document.

    propertyIsSupported = (prop: string): boolean =>
        this.supportedProperties.has(prop);


    constructor(private window: Window) {
        const {document} = window;

        const style = document.createElement("style");
        style.type = "text/css";
        document.head.appendChild(style);

        this.styleSheet = <CSSStyleSheet> document.styleSheets[document.styleSheets.length - 1];

        this.supportedProperties = supportedProperties(window);
    }


    emitRule = (rule: CSSRuleEx): void => {
        const {hash} = rule;

        if (!this.cssRules.has(hash)) {
            this.cssRules.add(hash);
            this.styleSheet.insertRule(cssRuleExText(this, rule),
                this.styleSheet.cssRules.length);
        }
    }

    emitStyle = (style: CSSStyle): void => {
        cssStyleRules(style).map(this.emitRule);
    }
}

export const newDocumentEmitter = (window: Window): DocumentEmitter =>
    new DocumentEmitter(window);