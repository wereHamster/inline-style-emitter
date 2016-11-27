/* tslint:disable whitespace */

import * as React from "react";
import * as ReactDOM from "react-dom";

import {cssElementStyle, newHandle, wrapElement, DocumentEmitter,
    CSSFontFaceDeclarationEx, CSSKeyframe} from "../index";

const emitter = new DocumentEmitter(window);
const h = newHandle(React, emitter);


const fontFamily1: CSSFontFaceDeclarationEx = {
    fontFamily: 'font-1',
    src: 'url(./font.woff2)',
};
const fontFamily2: CSSFontFaceDeclarationEx = {
    fontFamily: 'font-2',
    src: ['url(./font.woff)', 'url(./font.woff2)'],
};
const fontFamily3: CSSFontFaceDeclarationEx = {
    src: 'url(./font.woff2)',
    fontWeight: 'bold',
};

const styleCache = new Map();
const style = (i: number) => {
    if (styleCache.has(i)) {
        return styleCache.get(i);
    }

    const s = cssElementStyle({
        display: "inline-block",
        // width: "3px",
        // height: "3px",
        color: 'white',
        backgroundColor: `hsl(${i % 360},100%,50%)`,
        fontFamily: fontFamily3,
        foo: 'bar',


        animationDuration: '2s',
        animationIterationCount: 'infinite',
        // animationTimingFunction: 'ease-in',
        animationName: [
            CSSKeyframe(0, {
                width: 1,
            }),
            [30, {
                width: 2,
            }],
            [100, {
                width: 3,
            }],
        ],
    });

    styleCache.set(i, s);
    return s;
};

function div(i) {
    return React.DOM.div({ style: style(i) }, 'text');
}

let generationNumber = 0;
requestAnimationFrame(function render() {
    requestAnimationFrame(render);
    generationNumber = generationNumber + 1;

    const divs = Array.from(Array(100)).map((_, i) => div(generationNumber + i));
    const rootNode = wrapElement(h, React.DOM.div({}, ...divs));

    ReactDOM.render(rootNode, document.getElementById("root"));
});

// (<any>window).Perf = require("react-addons-perf");