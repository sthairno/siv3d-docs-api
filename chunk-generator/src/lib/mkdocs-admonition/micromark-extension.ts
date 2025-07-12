import {
    State,
    TokenizeContext,
    Code,
    Extension as MicromarkExtension,
    Effects,
} from "micromark-util-types";
import { factorySpace } from "micromark-factory-space";
import { asciiControl, markdownLineEnding } from "micromark-util-character";
import { codes, types } from "micromark-util-symbol";
import {} from "./types";
import assert from "node:assert";

export const mkdocsAdmonition: MicromarkExtension = {
    document: {
        [codes.exclamationMark]: {
            name: "mkdocs-admonition",
            tokenize: tokenizeAdmonition,
            continuation: { tokenize: tokenizeAdmonitionContinuation },
            exit,
        },
        [codes.questionMark]: {
            name: "mkdocs-admonition-collapsible",
            tokenize: tokenizeAdmonition,
            continuation: { tokenize: tokenizeAdmonitionContinuation },
            exit,
        },
    },
};

function tokenizeAdmonition(
    this: TokenizeContext,
    effects: Effects,
    ok: State,
    nok: State
): State {
    let markerCode: number = 0;
    let markerSize: number = 0;
    let typeBuffer: string = "";

    return start;

    /**
     * ```markdown
     * !!! <type> "<title>"
     * ^
     * ```
     */
    function start(code: Code): State | undefined {
        assert(code === codes.exclamationMark || code === codes.questionMark);
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
    function marker(code: Code): State | undefined {
        if (markerSize < 3) {
            markerSize++;
            if (code === markerCode) {
                effects.consume(code);
                return marker;
            } else {
                return nok(code);
            }
        } else if (markerSize === 3 && code === codes.plusSign) {
            effects.consume(code);
            return marker;
        }

        effects.exit("mkdocsAdmonitionMarker");

        return factorySpace(effects, typeBegin, types.whitespace)(code);
    }

    /**
     * ```markdown
     * !!! <type> "<title>"
     *     ^
     * ```
     */
    function typeBegin(code: Code): State | undefined {
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
    function type(code: Code): State | undefined {
        if (
            code !== null &&
            codes.lowercaseA <= code &&
            code <= codes.lowercaseZ
        ) {
            typeBuffer += String.fromCharCode(code);
            effects.consume(code);
            return type;
        }
        effects.exit("mkdocsAdmonitionType");

        if (typeBuffer.length === 0) {
            return nok(code);
        }

        if (code === codes.eof || markdownLineEnding(code)) {
            effects.exit("mkdocsAdmonitionHeader");
            return ok(code);
        } else {
            return factorySpace(effects, titleBegin, types.whitespace)(code);
        }
    }

    /**
     * ```markdown
     * !!! <type> "<title>"
     *             ^
     * ```
     */
    function titleBegin(code: Code): State | undefined {
        if (code === codes.eof || markdownLineEnding(code)) {
            effects.exit("mkdocsAdmonitionHeader");
            return ok(code);
        }

        if (code === codes.quotationMark) {
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
    function title(code: Code): State | undefined {
        if (code === codes.eof || markdownLineEnding(code)) {
            return nok(code);
        }

        if (
            code !== null &&
            code !== codes.quotationMark &&
            !asciiControl(code)
        ) {
            effects.consume(code);
            return title;
        }

        if (code === codes.quotationMark) {
            effects.consume(code);
            effects.exit("mkdocsAdmonitionTitle");
            return factorySpace(effects, end, types.whitespace);
        }

        return nok(code);
    }

    /**
     * ```markdown
     * !!! <type> "<title>"
     *                     ^
     * ```
     */
    function end(code: Code): State | undefined {
        if (code === codes.eof || markdownLineEnding(code)) {
            effects.exit("mkdocsAdmonitionHeader");
            return ok(code);
        }

        return nok(code);
    }
}

function tokenizeAdmonitionContinuation(
    this: TokenizeContext,
    effects: Effects,
    ok: State,
    nok: State
): State {
    let indentCount: number = 0;

    return start;

    /**
     * ```markdown
     * !!! <type> "<title>"
     * ␣␣␣␣<content>
     * ^
     * ```
     */
    function start(code: Code): State | undefined {
        if (markdownLineEnding(code)) {
            return ok(code);
        }

        effects.enter("mkdocsAdmonitionIndent");
        indentCount = 0;

        if (code === codes.horizontalTab) {
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
    function skipIndent(code: Code): State | undefined {
        if (indentCount++ < 4) {
            if (code === codes.space) {
                effects.consume(code);
                return skipIndent;
            } else {
                return nok(code);
            }
        }

        effects.exit("mkdocsAdmonitionIndent");

        return ok(code);
    }
}

function exit(this: TokenizeContext, effects: Effects): undefined {
    effects.exit("mkdocsAdmonition");
}
