import { ScriptReader } from "./reader"
import { TopLevelToken } from "./topLevelToken"

export namespace Block {
	export type Token = {
		tokenType: "block"
		tokens: TopLevelToken.Token[]
	}

	export function expect<T extends boolean>(
		reader: ScriptReader,
		ignoreCurlyBraces?: T
	): Token | ScriptReader.SyntaxError | (T extends true ? never : null) {
		if (!ignoreCurlyBraces && !reader.expect("{")) return null as never

		const tokens: Token["tokens"] = []
		while (true) {
			reader.skipWhitespace()
			const token = TopLevelToken.expect(reader)
			if (!token) {
				const char = reader.peek()
				if (char === "}") break
				if (char) return reader.syntaxError(`Unexpected character: ${char}`)
				else break
			}
			if (token instanceof ScriptReader.SyntaxError) return token
			tokens.push(token)
		}

		reader.skipWhitespace()

		if (!ignoreCurlyBraces && !reader.expect("}")) return reader.syntaxError(`Expected "}"`)

		return {
			tokenType: "block",
			tokens,
		} satisfies Token
	}
}
