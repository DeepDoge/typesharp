import type { Token } from "."
import { ScriptReader } from "./reader"
import { SymbolToken } from "./symbolToken"
import { TopLevelToken } from "./topLevelToken"

export type BlockToken = Token<"block", { tokens: TopLevelToken[] }>
export namespace Block {
	export function expect<T extends boolean>(
		reader: ScriptReader,
		ignoreCurlyBraces?: T
	): BlockToken | ScriptReader.SyntaxError | (T extends true ? never : null) {
		const startAt = reader.getIndex()
		if (!ignoreCurlyBraces && !SymbolToken.expect(reader, "{")) return null as never

		reader.skipWhitespace()

		const tokens: BlockToken["tokens"] = []
		while (true) {
			reader.skipWhitespace()
			const token = TopLevelToken.expect(reader)
			if (!token) {
				reader.skipWhitespace()
				if (ignoreCurlyBraces) {
					if (reader.peek() === null) break
					return reader.syntaxError(`Unexpected token "${reader.peek()}"`)
				} else {
					if (SymbolToken.expect(reader, "}")) break
					return reader.syntaxError(`Expected token or "}", got: "${reader.peek()}"`)
				}
			}
			if (token instanceof ScriptReader.SyntaxError) return token
			tokens.push(token)
			if (!reader.expectEndOfLine()) return reader.syntaxError(`Expected end of line after token, go to next line or add a semicolon`)
		}

		return {
			tokenType: "block",
			tokens,
			location: {
				startAt,
				endAt: reader.getIndex(),
			},
		} satisfies BlockToken
	}
}
