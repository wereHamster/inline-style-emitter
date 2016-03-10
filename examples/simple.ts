/* tslint:disable whitespace */

import * as React from "react";
import * as ReactDOM from "react-dom";

import {Handle, processStyleProperties, DocumentEmitter} from "../index";

let emitter = new DocumentEmitter(document);
let h = new Handle(emitter);

function Foo({foo}) {
    return React.DOM.div({style:{margin: "10px 21px"}}, "Foo", foo);
}

class Bar extends React.Component<{bar:string},{}> {
    render() {
        return React.DOM.div({style:{margin: "10px 22px"}}, "Bar", this.props.bar);
    }
}

let complexStyle = {
    margin: '10px 20px',

    ":hover": {
        color: "red",
        backgroundColor: "blue",

        "@media (max-width: 700px)": {
            color: 'magenta',
        },
    },

    "@media (max-width: 700px)": {
        color: "green",
        ":active": {
            marginLeft: "10px",
        },
    },
}

let rootNode = React.DOM.div
    ( { style: complexStyle }
    , React.DOM.div({ style: {margin: "10px 21px", "::after": { content: "''", width: "10px", height: "10px", background: "magenta", display: "inline-block",border:"1px solid black", borderRadius: "2px", marginLeft: "40px"}}}, "xxx")
    , React.DOM.span({ style: { color: "red", backgroundColor: "blue" } }, "test 1")
    , React.DOM.span({ style: { color: "red", backgroundColor: "blue" } }, "test 2")
    , React.createElement(Foo, { foo: 'from prop' })
    , React.createElement(Bar, { bar: 'from prop' })
    );

let newRootNode = processStyleProperties(h, React, rootNode);
ReactDOM.render(newRootNode, document.getElementById("root"));
