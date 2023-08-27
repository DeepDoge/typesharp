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
			if (token) {
				if (token instanceof ScriptReader.SyntaxError) return token
				tokens.push(token)
				if (!reader.expectEndOfLine()) return reader.syntaxError(`Expected end of line after token, go to next line or add a semicolon`)
			} else break
		}

		reader.skipWhitespace()

		if (!ignoreCurlyBraces && !SymbolToken.expect(reader, "}")) return reader.syntaxError(`Expected "}"`)

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
