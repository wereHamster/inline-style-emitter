// We're not actually importing React, just the types.
import { Props, ReactElement, ReactNode } from "react";



// -----------------------------------------------------------------------------
// A Style is a plain JavaScript object whose keys correspond to CSS properties.
// It is similar to CSSStyleDeclaration, except it doesn't have any of the
// special attributes and methods. And we support an extended syntax where
// you can include pseudo elements and classes, @keyframes, @font-face, and
// media queries.
//
// The Style object is standalone and self-sufficient. It fully describes
// all CSS rules which apply to a particular HTML element on a web page.
// The CSS style declarations within should not have dependencies to any other
// CSS rules.

export type Style = { [key: string]: any };



// -----------------------------------------------------------------------------
// An abstract declaration of a single CSS rule. It doesn't contain any user
// generated identifiers. Just enough data so we can generate a unique class
// name and then the CSS text out of it.
//
// The Rule is not entirely standalone, it may depend on other CSS rules which
// define required keyframes and font faces.
//
// One such rule represents one CSSRule which is either inserted into
// a CSSStyleSheet or written into a file (depending on the Emitter
// implementation).

export type Rule = {
    conditions: string[];
    // ^ A list of media queries and other conditions to wrap the style with.
    // CSS conditional and grouping rules can be nested, so this is an array.

    suffixes: string[];
    // ^ Pseudo classes, pseudo elements and other suffixes to append to the
    // class selector. Multiple suffixes can be added, hence an array.

    style: { [key: string]: string | string[] };
    // ^ Like CSSStyleDeclaration but without the 'cssText' property. Just the
    // pure CSS keys and values.
    //
    // In addition to plain strings, we support arrays as values in this
    // object. Arrays are converted to multiple declarations for the same key.
    // This is used to provide graceful degradation on older browsers which do
    // not support the latest syntax.
}



// -----------------------------------------------------------------------------
// styleRules
//
// Convert a Style object into a list of rules.

export function
styleRules(x: Style): Rule[] {
    let rules = [];
    extractStyleRules(rules, x, [], []);
    return rules;
}


// -----------------------------------------------------------------------------
// extractStyleRules
//
// Extract style rules from the style object and insert them into the 'rules'
// list. This function is recursive.

function extractStyleRules
( rules: Rule[]
, s: Style
, conditions: string[]
, suffixes: string[]
): void {

    // The CSSStyleDeclarations which are attached to the 'root' level of the
    // style object. If there are any defined we insert them into the rules
    // list at the end.

    let cssStyleDeclarations: { [key: string]: string } = {};


    // First go through the object and extract keyframe declarations. These
    // need to be processed first because the rest may depend on those.
    // Then take the rest of the fields and parse them according to their type.

    if (s["@keyframes"]) {
        // TODO: Parse keyframe declarations.
    }

    if (s["@font-face"]) {
        // TODO: Parse fontface declarations.
    }

    Object.keys(s).forEach(k => {
        if (k === "@keyframes" || k === "@font-face") {
            // Skip these keys, keyframes and font faces have been parsed
            // before.

        } else if (k[0] === ":") {
            // Pseudo classes and pseudo elements.
            extractStyleRules(rules, s[k], conditions, concat(suffixes, [k]));

        } else if (k[0] === "@") {
            // Media query or another @-rule. Except @keyframes an @font-face,
            // those are handled earlier.
            extractStyleRules(rules, s[k], concat(suffixes, [k]), []);

        } else {
            // TODO: Replace keyframe placeholders with generated names.
            cssStyleDeclarations[k] = s[k];
        }
    });

    if (Object.keys(cssStyleDeclarations).length > 0) {
        rules.push({ conditions, suffixes, style: cssStyleDeclarations });
    }
}


// A hash which is suitable to be used as a class name. The hash is made over
// the style declarations and all conditions and suffixes.
function ruleHash(rule: Rule): string {
    return "" + stringHash(
        [ rule.conditions.join("")
        , rule.suffixes.join("")
        , JSON.stringify(Object.keys(rule.style).sort().map(k => {
            return [k, rule.style[k]];
          }))
        ].join("")
    );
}


function hyphenate(str: string): string {
    return str
        .replace(/([A-Z])/g, "-$1")
        .replace(/^ms-/, "-ms-") // Internet Explorer vendor prefix.
        .toLowerCase();
}

export function
cssStyleDeclarationsToText(x: { [key: string]: string | string[] }): string {
    let ret = "";

    function append(k, v) {
        ret = ret + (ret.length === 0 ? "" : ";") + hyphenate(k) + ":" + v;
    }

    for (let k in x) {
        let v = x[k];
        if (Array.isArray(v)) {
            v.forEach(v => append(k, v));
        } else {
            append(k, v);
        }
    }

    return ret;
}


function classNameFromHash(hash: string): string {
    return "c" + hash;
}

export function
ruleText(rule: Rule): string {
    return wrapWithCondition(rule.conditions,
        [ "."
        , classNameFromHash(ruleHash(rule))
        , rule.suffixes.join("")
        , "{"
        , cssStyleDeclarationsToText(rule.style)
        , "}"
        ].join("")
    );

    function wrapWithCondition(conditions, text) {
        if (conditions.length === 0) {
            return text;
        } else {
            return wrapWithCondition(conditions.slice(1),
                conditions[0] + "{" + text + "}");
        }
    }
}

function concat(xs, ys) {
    return [].concat.call([], xs, ys);
}





// A simple string hash function.
//
// TODO: Use a better hash function, one with more bits (at least 64).
// https://github.com/vkandy/jenkins-hash-js/blob/master/src/jenkins.js seems
// a good candidate which is small and has no dependencies.
function stringHash(str: string): string {
    let length = str.length
      , value  = 0x811c9dc5;

    for (let i = 0; i < length; i++) {
        value ^= str.charCodeAt(i);
        value += (value << 1) + (value << 4) + (value << 7) + (value << 8) + (value << 24);
    }

    return (value >>> 0).toString(16);
}



// -----------------------------------------------------------------------------
// The Emitter is an interface which implements the logic of actually
// emitting the style objects. This can be either directly into the DOM
// CSSStyleSheet objects or into a file in the case of server-side rendering.

export interface Emitter {

    emitStyle(style: Style): string[];
    // ^ The function takes a Style and returns a list of class names which
    // should be attached to an element so that it is styled accordingly.

}


// -----------------------------------------------------------------------------
// An DocumentEmitter which writes the styles directly into the DOM. It creates
// a new CSSStyleSheet object and inserts the rule into that.
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

export class DocumentEmitter implements Emitter {

    styleSheet: CSSStyleSheet;
    // ^ The DOM StyleSheet into which we insert the rules. It is created
    // in the constructor.

    cssRules: Set<string> = new Set();
    // ^ We keep track of which rules (based on their hash) we've already
    // inserted. This is needed to avoid inserting the same rule multiple times.
    //
    // The CSSStyleSheet doesn't provide a good interface for determining if
    // a particular rule is present or not.


    constructor(private document: Document) {
        let style = document.createElement("style");
        style.type = "text/css";
        document.head.appendChild(style);

        this.styleSheet = <CSSStyleSheet> document.styleSheets[document.styleSheets.length - 1];
    }

    emitStyle(style: Style): string[] {
        return styleRules(style).map(rule => {
            let hash = ruleHash(rule);

            if (!this.cssRules.has(hash)) {
                this.styleSheet.insertRule(ruleText(rule), 0);
                this.cssRules.add(hash);
            }

            return classNameFromHash(hash);
        });
    }
}



// -----------------------------------------------------------------------------
// ...

export class Handle {
    constructor(public emitter: Emitter) {}
}


// -----------------------------------------------------------------------------
// emitStyle
//
// THe only public function we have so far.

function
emitStyle(h: Handle, style: Style): string[] {
    return h.emitter.emitStyle(style);
}



// -----------------------------------------------------------------------------
// React Integration
// -----------------------------------------------------------------------------
//
// 'processStyleProperties' walks through a ReactNode tree and emits styles
// into the handle. The new tree has all 'style' props replaced with
// 'className'.

// Go through a React node, recursively, and generate class rules out of
// 'style' properties. Removes the 'style' property and replaces it with
// the generated 'className'.
export function
processStyleProperties<T>(h: Handle, React, el: ReactElement<T>): ReactElement<T> {
    let oldProps    = <{ children?, style?, className? }> el.props
      , oldChildren = oldProps.children
      , style       = oldProps.style;

    let newChildren = oldChildren
        ? generateStyleSheetForNode(h, React, oldChildren)
        : undefined;

    // Only set 'className' if the old props have a style and no className.
    // Users still may have a reason to manually set className if they use an
    // external stylesheet (eg. bootstrap, or an icon set).
    let newProps = style && oldProps.className === undefined
        ? { style: undefined, className: emitStyle(h, style).join(" ") }
        : undefined;

    // Avoid cloning the element if neither the props nor the children have
    // changed.
    if (newProps === undefined && newChildren === undefined) {
        return el;
    } else {
        return React.cloneElement(el, newProps, newChildren);
    }
}

function generateStyleSheetForNode(h: Handle, React, node: ReactNode): ReactNode {
    if (Array.isArray(node)) {
        return React.Children.map(node, x => {
            return generateStyleSheetForNode(h, React, x);
        });
    } else if (React.isValidElement(node)) {
        return processStyleProperties(h, React, <ReactElement<any>> node);

    } else { // string | number | boolean | {}
        return node;
    }
}
