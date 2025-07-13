"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.mkdocsAdmonitionToMarkdown = exports.mkdocsAdmonitionFromMarkdown = exports.mkdocsAdmonition = void 0;
__exportStar(require("./types"), exports);
var micromark_extension_1 = require("./micromark-extension");
Object.defineProperty(exports, "mkdocsAdmonition", { enumerable: true, get: function () { return micromark_extension_1.mkdocsAdmonition; } });
var mdast_extension_1 = require("./mdast-extension");
Object.defineProperty(exports, "mkdocsAdmonitionFromMarkdown", { enumerable: true, get: function () { return mdast_extension_1.mkdocsAdmonitionFromMarkdown; } });
var markdown_builder_1 = require("./markdown-builder");
Object.defineProperty(exports, "mkdocsAdmonitionToMarkdown", { enumerable: true, get: function () { return markdown_builder_1.mkdocsAdmonitionToMarkdown; } });
