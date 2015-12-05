import * as React from "react";
import * as ReactDOM from "react-dom";

import {Handle, processStyleProperties, DocumentEmitter} from "../index";

let emitter = new DocumentEmitter(document);
let h = new Handle(emitter);

function Foo() {
    return React.DOM.div({style:{margin: "10px 21px"}}, "Foo");
}

class Bar extends React.Component<{},{}> {
    render() {
        return React.DOM.div({style:{margin: "10px 22px"}}, "Bar");
    }
}

let rootNode = React.DOM.div
    ( { style: {margin: "10px 20px", ":hover": { color: "red", backgroundColor: "blue" }, "@media (max-width: 700px)": { color: "green", ":active": { marginLeft: "10px" }}}}
    , React.DOM.div({ style: {margin: "10px 21px", "::after": { content: "''", width: "10px", height: "10px", background: "magenta", display: "inline-block",border:"1px solid black", borderRadius: "2px", marginLeft: "40px"}}}, "xxx")
    , React.DOM.span({ style: { color: "red", backgroundColor: "blue" } }, "test 1")
    , React.DOM.span({ style: { color: "red", backgroundColor: "blue" } }, "test 2")
    , React.createElement(Foo)
    , React.createElement(Bar)
    );

let newRootNode = processStyleProperties(h, React, rootNode);
ReactDOM.render(newRootNode, document.getElementById("root"));
