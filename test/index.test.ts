/* global describe, it, beforeEach */
/* tslint:disable whitespace */

declare var describe: any, it;

import { assert } from "chai";
import { styleRules, cssStyleDeclarationsToText } from "../index";



describe("styleRules", () => {
  it("should return an empty list if the style is empty", () => {
      assert.lengthOf(styleRules({}), 0);
  });
  it("should return a single rule when the object has only local style declarations", () => {
      assert.lengthOf(styleRules({color:"red"}), 1);
  });
  it("should parse nested pseudo components", () => {
      assert.lengthOf(styleRules({color:"red",":hover":{}}), 1);
      assert.lengthOf(styleRules({color:"red",":hover":{color:"blue"}}), 2);
  });
  it("should parse media query conditoinals", () => {
      assert.lengthOf(styleRules({"@media (max-width:1px)":{}}), 0);
      assert.lengthOf(styleRules({"@media (max-width:1px)":{color:"red"}}), 1);
  });
  it("should ignore @keyframes and @font-face", () => {
      assert.lengthOf(styleRules({"@keyframes":{test:{"0%":{width:"1px"}}}}), 0);
      assert.lengthOf(styleRules({"@font-face":{test:{}}}), 0);
  });
});



describe("cssStyleDeclarationsToText", () => {
    it("should return the CSS string for simple rules", () => {
        assert.equal(cssStyleDeclarationsToText({color:"red"}), "color:red");
    });
    it("should support multiple property values in an array", () => {
        assert.equal(cssStyleDeclarationsToText({color:["red","blue"]}), "color:red;color:blue");
    });
});
