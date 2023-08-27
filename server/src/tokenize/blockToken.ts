import type { TokenLocation } from "."
import { ScriptReader } from "./reader"
import { Symbol } from "./symbolToken"
import { TopLevelToken } from "./topLevelToken"

export namespace Block {
	export type Token = TokenLocation & {
		tokenType: "block"
		tokens: TopLevelToken.Token[]
	}

	export function expect<T extends boolean>(
		reader: ScriptReader,
		ignoreCurlyBraces?: T
	): Token | ScriptReader.SyntaxError | (T extends true ? never : null) {
		const startAt = reader.getIndex()
		if (!ignoreCurlyBraces && !Symbol.expect(reader, "{")) return null as never

		reader.skipWhitespace()

		const tokens: Token["tokens"] = []
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

		if (!ignoreCurlyBraces && !Symbol.expect(reader, "}")) return reader.syntaxError(`Expected "}"`)

		return {
			tokenType: "block",
			tokens,
			location: {
				startAt,
				endAt: reader.getIndex(),
			},
		} satisfies Token
	}
}
