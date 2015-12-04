import * as React from "react";
import * as ReactDOM from "react-dom";

import {Handle, processStyleProperties, DocumentEmitter} from "../index";

let emitter = new DocumentEmitter(document);
let h = new Handle(emitter);

let rootNode = React.DOM.div
    ( { style: {margin: "10px 20px", ":hover": { color: "red", backgroundColor: "blue" }, "@media (max-width: 700px)": { color: "green", ":active": { marginLeft: "10px" }}}}
    , React.DOM.div({ style: {margin: "10px 21px", "::after": { content: "''", width: "10px", height: "10px", background: "magenta", display: "inline-block",border:"1px solid black", borderRadius: "2px", marginLeft: "40px"}}}, "xxx")
    , React.DOM.span({ style: { color: "red", backgroundColor: "blue" } }, "test 1")
    , React.DOM.span({ style: { color: "red", backgroundColor: "blue" } }, "test 2")
    );

let newRootNode = processStyleProperties(h, React, rootNode);
ReactDOM.render(newRootNode, document.getElementById("root"));
