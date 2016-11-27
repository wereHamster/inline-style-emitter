/* global describe, it, expect */

declare var describe: any, it: any, expect: any;

import { CSSStyleDeclarationEx, CSSFontFaceDeclarationEx,
    CSSKeyframe } from "./Internal/Types";
import { cssElementStyle, styleRules, processValue } from "./Parser";



function testSnapshots1(inputs, f) {
    describe("snapshots", () =>
        inputs.forEach(input =>
            it(JSON.stringify(input), () =>
                expect(f(input)).toMatchSnapshot())));
}


const fontFamily1: CSSFontFaceDeclarationEx = {
    fontFamily: "FontAwesome",
    src: "url(./FontAwesome.woff2)",
};
const fontFamily2: CSSFontFaceDeclarationEx = {
    src: ["url(./FontAwesome.woff)", "url(./FontAwesome.woff2)"],
    fontStyle: "italic",
};
const animationName1: CSSKeyframe[] = [[0, {}]];

describe("cssElementStyle", () => {
    testSnapshots1(
        [ {}
        , {color: "red"}
        , {color: "red", ":hover": {}}
        , {color: "red", ":hover": {color: "blue"}}
        , {"@media (max-width:1px)": {}}
        , {"@media (max-width:1px)": {color: "red"}}
        ], cssElementStyle);
});

describe("styleRules", () => {
    describe("number of generated rules", () => {
        const expectLength = (n: number, x: CSSStyleDeclarationEx): void =>
            expect(styleRules(x).length).toBe(n);

        it("should return an empty list if the style is empty", () =>
            expectLength(0, {}));

        it("should return a single rule when the object has only local style declarations", () =>
            expectLength(1, {color: "red"}));

        it("should ignore empty nested pseudo components", () =>
            expectLength(1, {color: "red", ":hover": {}}));

        it("should parse nested pseudo components", () =>
            expectLength(2, {color: "red", ":hover": {color: "blue"}}));

        it("should ignore media query conditional with empty content", () =>
            expectLength(0, {"@media (max-width:1px)": {}}));

        it("should parse media query conditional", () =>
            expectLength(1, {"@media (max-width:1px)": {color: "red"}}));

        it("should generate an additional rule for fontFamily (single object)", () =>
            expectLength(2, {fontFamily: fontFamily1, color: "green"}));

        it("should generate an additional rule for fontFamily when the base object is otherwise empty", () =>
            expectLength(2, {fontFamily: fontFamily1}));

        it("should generate additional rules for fontFamily (list of objects)", () =>
            expectLength(3, {fontFamily: [fontFamily1, fontFamily2]}));
    });


    testSnapshots1(
        [ {}
        , {color: "red"}
        , {color: "red", ":hover": {}}
        , {color: "red", ":hover": {color: "blue"}}
        , {"@media (max-width:1px)": {}}
        , {"@media (max-width:1px)": {color: "red"}}
        ], styleRules);
});


describe("valueProcessors", () => {
    describe("margin", () => {
        it("leaves zero untouched", () => {
            expect(processValue([], "margin", 0)).toBe(0);
        });
        it("leaves strings untouched", () => {
            expect(processValue([], "margin", "0 auto")).toBe("0 auto");
        });
        it("appends 'px' suffix to non-zero numbers", () => {
            expect(processValue([], "margin", 1)).toBe("1px");
        });
    });
    describe("fontFamily", () => {
        it("leaves strings untouched", () => {
            expect(processValue([], "fontFamily", "sans")).toBe("sans");
        });
        it("converts an object into a string", () => {
            expect(processValue([], "fontFamily", fontFamily1)).toBe("FontAwesome");
        });
        it("converts an mixed array into strings", () => {
            expect(processValue([], "fontFamily", ["sans", fontFamily1])).toEqual(["sans", "FontAwesome"]);
        });
    });
    describe("flex", () => {
        it("leaves non-zero numbers untouched", () => {
            expect(processValue([], "flex", 1)).toBe(1);
        });
    });
    describe("WebkitFlex", () => {
        it("leaves non-zero numbers untouched", () => {
            expect(processValue([], "WebkitFlex", 1)).toBe(1);
        });
    });
    describe("animationName", () => {
        it("leaves strings untouched", () => {
            expect(processValue([], "animationName", "fancy-animation-1")).toBe("fancy-animation-1");
        });
        it("converts an object into a string", () => {
            expect(processValue([], "animationName", animationName1)).toBe("a-2cb14fb710d5b162");
        });
    });
});
