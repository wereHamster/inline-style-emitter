/* global describe, it, expect */

declare var describe: any, it: any, expect: any;

import * as React from "react";
import { createElement } from "react";
import renderer from "react-test-renderer";

import { cssElementStyle } from "../Data/CSS";
import { MemoryEmitter } from "../Data/CSS/Emitter";
import { newHandle, wrapElement } from "./CSS";




function testSnapshots1(inputs, f) {
    describe("snapshots", () =>
        inputs.forEach(input =>
            it(JSON.stringify(input), () =>
                expect(f(input)).toMatchSnapshot())));
}



describe("createElement + cssElementStyle", () => {
    testSnapshots1(
        [ {}
        , {color: "red"}
        , {color: "red", ":hover": {}}
        , {color: "red", ":hover": {color: "blue"}}
        , {"@media (max-width:1px)": {}}
        , {"@media (max-width:1px)": {color: "red"}}
        ], obj => renderer.create(createElement("div", {style: cssElementStyle(obj)})).toJSON());
});

describe("wrapElement", () => {
    const seH = newHandle(React, new MemoryEmitter());

    const div = key => createElement("div", { key });
    const fragment = [div(1), div(2), div(3)];

    const nullType = () => null;
    const componentType = ({children}: {children?: any}) =>
        createElement("div", {children});


    // Test all possible combinations of type and children.
    describe("snapshots", () => {
        [nullType, componentType].forEach((type, typeI) => {
            [[], [null], [false], fragment, [fragment]].forEach((children, childrenI) => {
                it(JSON.stringify({typeI, childrenI}), () => {
                    const el = wrapElement(seH, createElement(type, {}, ...children));
                    expect(renderer.create(el).toJSON()).toMatchSnapshot();
                });
            });
        });
    });


    it("should propagate null", () => {
        expect(wrapElement(seH, null)).toBe(null);
    });
    it("should not fail when the element render function returns null", () => {
        expect(() => wrapElement(seH, createElement(nullType)))
            .not.toThrow();
    });
    it("should not fail when the children are passed as spread arguments", () => {
        expect(() => wrapElement(seH, createElement(nullType, {}, ...fragment)))
            .not.toThrow();
    });
    it("should not fail when the children are an array", () => {
        expect(() => wrapElement(seH, createElement(nullType, {}, fragment)))
            .not.toThrow();
    });
    it("should append to className if it is already set", () => {
        const div = createElement("div", {
            style: cssElementStyle({color: "red"}),
            className: "icon-x",
        });

        expect(renderer.create(wrapElement(seH, div)).toJSON().props.className)
            .toBe("icon-x s29ec1a4d45b6d719");
    });
});
