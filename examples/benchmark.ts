/* tslint:disable whitespace */

import * as React from "react";
import * as ReactDOM from "react-dom";

import {Handle, processStyleProperties, DocumentEmitter} from "../index";

const emitter = new DocumentEmitter(document);
const h = new Handle(emitter);

function div(i) {
    return React.DOM.div({ style: { display: 'inline-block', width: "3px", height: "3px", backgroundColor: `hsl(${i % 360},100%,50%)` }});
}

let generationNumber = 0;
requestAnimationFrame(function render() {
    requestAnimationFrame(render);
    generationNumber = generationNumber + 1;

    const divs = Array.from(Array(1000)).map((_, i) => div(generationNumber + i));
    const rootNode = processStyleProperties(h, React, React.DOM.div({}, ...divs));

    ReactDOM.render(rootNode, document.getElementById("root"));
});
