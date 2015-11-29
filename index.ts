// We're not actually importing React, just the types.
import { ReactNode, ReactElement } from "react";



// A simple string hash function.
function stringHash(str) {
    let hash = 5381, i = str.length;

    while (i) {
      hash = (hash * 33) ^ str.charCodeAt(--i);
    }

    /* JavaScript does bitwise operations (like XOR, above) on 32-bit signed
     * integers. Since we want the results to be always positive, convert the
     * signed int to an unsigned by doing an unsigned bitshift. */
    return hash >>> 0;
}


// -----------------------------------------------------------------------------
// A Style is a plain JavaScript object whose keys correspond to CSS properties.
// It is the raw input which is passed to the emitter.
//
// It is similar to CSSStyleDeclaration, except it doesn't have any of the
// special attributes and methods.

export type Style = { [key: string]: any };


// A deterministic hash function for Style. Because JavaScript doesn't guarantee
// ordering of the keys in an object, we have to sort them manually.
//
// TODO: Use a better hash function, one with more bits (at least 64).
// https://github.com/vkandy/jenkins-hash-js/blob/master/src/jenkins.js seems
// a good candidate which is small and has no dependencies.
function styleHash(x: Style): string {
    return "" + stringHash(JSON.stringify(Object.keys(x).sort().map(k => {
        return [k, x[k]];
    })));
}


// -----------------------------------------------------------------------------
// The Emitter is an interface which implements the logic of actually
// emitting the style objects. This can be either directly into the DOM
// CSSStyleSheet objects or into a file in the case of server-side rendering.

export interface Emitter {

    emitStyle(style: Style): string;
    // ^ The function takes a Style and returns a class name under which the
    // style can be referenced.

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

    cssRules: Map<string, {}> = new Map<string, {}>();
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


    emitStyle(style: Style): string {
        let className = "c" + styleHash(style);

        let n = this.document.createElement("div");
        for (let k in style) {
            n.style[k] = style[k];
        }

        if (!this.cssRules.has(className)) {
            this.styleSheet.insertRule("." + className + " {" + n.style.cssText + "}", 0);
            this.cssRules.set(className, {});
        }

        return className;
    }
}



export class Handle {
    constructor(public emitter: Emitter) {}
}

function
emitStyle(h: Handle, style: Style): string {
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
processStyleProperties(h: Handle, React, node: ReactNode): ReactNode {
    if (Array.isArray(node)) {
        return React.Children.map(node, x => {
            return processStyleProperties(h, React, x);
        });
    } else if (React.isValidElement(node)) {
        generateStyleSheetForElement(h, React, <ReactElement<any>> node);

    } else { // string | number | boolean | {}
        return node;
    }
}


function generateStyleSheetForElement(h: Handle, React, el: ReactElement<any>) {
    let oldProps    = el.props
      , oldChildren = oldProps.children
      , style       = oldProps.style;

    let newChildren = oldChildren
        ? processStyleProperties(h, React, oldChildren)
        : undefined;

    // Only set 'className' if the old props have a style and no className.
    // Users still may have a reason to manually set className if they use an
    // external stylesheet (eg. bootstrap, or an icon set).
    let newProps = style && oldProps.className === undefined
        ? { style: undefined, className: emitStyle(h, style) }
        : undefined;

    // Avoid cloning the element if neither the props nor the children have
    // changed.
    if (newProps === undefined && newChildren === undefined) {
        return el;
    } else {
        return React.cloneElement(el, newProps, newChildren);
    }
}
