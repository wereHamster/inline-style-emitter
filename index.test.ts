/* global describe, it, expect */
/* tslint:disable whitespace */

declare var describe: any, it: any, expect: any;

import { styleRules, cssStyleDeclarationsToText } from "./index";


function testSnapshots1(inputs, f) {
    describe("snapshots", () =>
        inputs.forEach(input =>
            it(JSON.stringify(input), () =>
                expect(f(input)).toMatchSnapshot())));
}


describe("styleRules", () => {
    it("should return an empty list if the style is empty", () => {
        expect(styleRules({}).length).toBe(0);
    });
    it("should return a single rule when the object has only local style declarations", () => {
        expect(styleRules({color:"red"}).length).toBe(1);
    });
    it("should parse nested pseudo components", () => {
        expect(styleRules({color:"red",":hover":{}}).length).toBe(1);
        expect(styleRules({color:"red",":hover":{color:"blue"}}).length).toBe(2);
    });
    it("should parse media query conditoinals", () => {
        expect(styleRules({"@media (max-width:1px)":{}}).length).toBe(0);
        expect(styleRules({"@media (max-width:1px)":{color:"red"}}).length).toBe(1);
    });
    it("should ignore @keyframes and @font-face", () => {
        expect(styleRules({"@keyframes":{test:{"0%":{width:"1px"}}}}).length).toBe(0);
        expect(styleRules({"@font-face":{test:{}}}).length).toBe(0);
    });

    testSnapshots1(
        [ {}
        , {color:"red"}
        , {color:"red",":hover":{}}
        , {color:"red",":hover":{color:"blue"}}
        , {"@media (max-width:1px)":{}}
        , {"@media (max-width:1px)":{color:"red"}}
        , {"@keyframes":{test:{"0%":{width:"1px"}}}}
        , {"@font-face":{test:{}}}
        ], styleRules);
});



describe("cssStyleDeclarationsToText", () => {
    it("should return the CSS string for simple rules", () => {
        expect(cssStyleDeclarationsToText({color:"red"})).toBe("color:red");
    });
    it("should support multiple property values in an array", () => {
        expect(cssStyleDeclarationsToText({color:["red","blue"]})).toBe("color:red;color:blue");
    });

    testSnapshots1(
        [ {color:"red"}
        , {color:["red","blue"]}
        ], cssStyleDeclarationsToText);
});
