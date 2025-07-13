"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.mkdocsAdmonition = void 0;
const micromark_factory_space_1 = require("micromark-factory-space");
const micromark_util_character_1 = require("micromark-util-character");
const micromark_util_symbol_1 = require("micromark-util-symbol");
const node_assert_1 = __importDefault(require("node:assert"));
exports.mkdocsAdmonition = {
    document: {
        [micromark_util_symbol_1.codes.exclamationMark]: {
            name: "mkdocs-admonition",
            tokenize: tokenizeAdmonition,
            continuation: { tokenize: tokenizeAdmonitionContinuation },
            exit,
        },
        [micromark_util_symbol_1.codes.questionMark]: {
            name: "mkdocs-admonition-collapsible",
            tokenize: tokenizeAdmonition,
            continuation: { tokenize: tokenizeAdmonitionContinuation },
            exit,
        },
    },
};
function tokenizeAdmonition(effects, ok, nok) {
    let markerCode = 0;
    let markerSize = 0;
    let typeBuffer = "";
    return start;
    /**
     * ```markdown
     * !!! <type> "<title>"
     * ^
     * ```
     */
    function start(code) {
        (0, node_assert_1.default)(code === micromark_util_symbol_1.codes.exclamationMark || code === micromark_util_symbol_1.codes.questionMark);
        markerCode = code;
        effects.enter("mkdocsAdmonition", { _container: true });
        effects.enter("mkdocsAdmonitionHeader");
        effects.enter("mkdocsAdmonitionMarker");
        return marker(code);
    }
    /**
     * ```markdown
     * !!! <type> "<title>"
     * ^^^^
     * ```
     */
    function marker(code) {
        if (markerSize < 3) {
            markerSize++;
            if (code === markerCode) {
                effects.consume(code);
                return marker;
            }
            else {
                return nok(code);
            }
        }
        else if (markerSize === 3 && code === micromark_util_symbol_1.codes.plusSign) {
            effects.consume(code);
            return marker;
        }
        effects.exit("mkdocsAdmonitionMarker");
        return (0, micromark_factory_space_1.factorySpace)(effects, typeBegin, micromark_util_symbol_1.types.whitespace)(code);
    }
    /**
     * ```markdown
     * !!! <type> "<title>"
     *     ^
     * ```
     */
    function typeBegin(code) {
        effects.enter("mkdocsAdmonitionType");
        typeBuffer = "";
        return type(code);
    }
    /**
     * ```markdown
     * !!! <type> "<title>"
     *     ^^^^^^^^
     * ```
     */
    function type(code) {
        if (code !== null &&
            micromark_util_symbol_1.codes.lowercaseA <= code &&
            code <= micromark_util_symbol_1.codes.lowercaseZ) {
            typeBuffer += String.fromCharCode(code);
            effects.consume(code);
            return type;
        }
        effects.exit("mkdocsAdmonitionType");
        if (typeBuffer.length === 0) {
            return nok(code);
        }
        if (code === micromark_util_symbol_1.codes.eof || (0, micromark_util_character_1.markdownLineEnding)(code)) {
            effects.exit("mkdocsAdmonitionHeader");
            return ok(code);
        }
        else {
            return (0, micromark_factory_space_1.factorySpace)(effects, titleBegin, micromark_util_symbol_1.types.whitespace)(code);
        }
    }
    /**
     * ```markdown
     * !!! <type> "<title>"
     *             ^
     * ```
     */
    function titleBegin(code) {
        if (code === micromark_util_symbol_1.codes.eof || (0, micromark_util_character_1.markdownLineEnding)(code)) {
            effects.exit("mkdocsAdmonitionHeader");
            return ok(code);
        }
        if (code === micromark_util_symbol_1.codes.quotationMark) {
            effects.enter("mkdocsAdmonitionTitle");
            effects.consume(code);
            return title;
        }
        return nok(code);
    }
    /**
     * ```markdown
     * !!! <type> "<title>"
     *              ^^^^^^^^
     * ```
     */
    function title(code) {
        if (code === micromark_util_symbol_1.codes.eof || (0, micromark_util_character_1.markdownLineEnding)(code)) {
            return nok(code);
        }
        if (code !== null &&
            code !== micromark_util_symbol_1.codes.quotationMark &&
            !(0, micromark_util_character_1.asciiControl)(code)) {
            effects.consume(code);
            return title;
        }
        if (code === micromark_util_symbol_1.codes.quotationMark) {
            effects.consume(code);
            effects.exit("mkdocsAdmonitionTitle");
            return (0, micromark_factory_space_1.factorySpace)(effects, end, micromark_util_symbol_1.types.whitespace);
        }
        return nok(code);
    }
    /**
     * ```markdown
     * !!! <type> "<title>"
     *                     ^
     * ```
     */
    function end(code) {
        if (code === micromark_util_symbol_1.codes.eof || (0, micromark_util_character_1.markdownLineEnding)(code)) {
            effects.exit("mkdocsAdmonitionHeader");
            return ok(code);
        }
        return nok(code);
    }
}
function tokenizeAdmonitionContinuation(effects, ok, nok) {
    let indentCount = 0;
    return start;
    /**
     * ```markdown
     * !!! <type> "<title>"
     * ␣␣␣␣<content>
     * ^
     * ```
     */
    function start(code) {
        if ((0, micromark_util_character_1.markdownLineEnding)(code)) {
            return ok(code);
        }
        effects.enter("mkdocsAdmonitionIndent");
        indentCount = 0;
        if (code === micromark_util_symbol_1.codes.horizontalTab) {
            effects.consume(code);
            effects.exit("mkdocsAdmonitionIndent");
            return ok(code);
        }
        return skipIndent(code);
    }
    /**
     * ```markdown
     * !!! <type> "<title>"
     * ␣␣␣␣<content>
     * ^^^^
     * ```
     */
    function skipIndent(code) {
        if (indentCount++ < 4) {
            if (code === micromark_util_symbol_1.codes.space) {
                effects.consume(code);
                return skipIndent;
            }
            else {
                return nok(code);
            }
        }
        effects.exit("mkdocsAdmonitionIndent");
        return ok(code);
    }
}
function exit(effects) {
    effects.exit("mkdocsAdmonition");
}
