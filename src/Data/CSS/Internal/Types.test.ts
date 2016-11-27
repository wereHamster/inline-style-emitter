/* global describe, it, expect */

declare var describe: any, it: any, expect: any;

import { CSSHostH, renderCSSDeclarations } from "./Types";


function testSnapshots1(inputs, f) {
    describe("snapshots", () =>
        inputs.forEach(input =>
            it(JSON.stringify(input), () =>
                expect(f(input)).toMatchSnapshot())));
}


describe("renderCSSDeclarations", () => {
    const cssHostH: CSSHostH = {
        propertyIsSupported: () => true,
    };

    it("should return the CSS string for simple rules", () =>
        expect(renderCSSDeclarations(cssHostH, {color: "red"}))
            .toBe("color:red"));

    it("should support multiple property values in an array", () =>
        expect(renderCSSDeclarations(cssHostH, {color: ["red", "blue"]}))
            .toBe("color:red;color:blue"));

    it("should support plain numbers as values", () =>
        expect(renderCSSDeclarations(cssHostH, {margin: 0}))
            .toBe("margin:0"));


    testSnapshots1(
        [ {color: "red"}
        , {color: ["red", "blue"]}
        , {margin: 0}
        ], x => renderCSSDeclarations(cssHostH, x));
});