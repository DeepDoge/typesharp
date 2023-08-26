import { ScriptReader } from "./reader"
import { TopLevelToken } from "./topLevelToken"

export namespace Block {
	export type Token = {
		tokenType: "block"
		tokens: TopLevelToken.Token[]
	}

	export function expect(reader: ScriptReader): Token | ScriptReader.SyntaxError | null {
		if (!reader.expect("{")) return null

		const tokens: Token["tokens"] = []
		while (true) {
			reader.skipWhitespace()
			const token = TopLevelToken.expect(reader)
			if (!token) break
			if (token instanceof ScriptReader.SyntaxError) return token
			tokens.push(token)
		}

		reader.skipWhitespace()

		if (!reader.expect("}")) return reader.syntaxError(`Expected "}"`)

		return {
			tokenType: "block",
			tokens,
		} satisfies Token
	}
}
