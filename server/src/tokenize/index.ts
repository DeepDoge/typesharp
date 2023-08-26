import { ScriptReader } from "./reader"
import { TopLevelToken } from "./topLevelToken"

export function tokenize(script: string): TopLevelToken.Token[] | ScriptReader.SyntaxError {
	const reader = ScriptReader.create(script)
	const tokens: TopLevelToken.Token[] = []

	while (true) {
		reader.skipWhitespace()

		const token = TopLevelToken.expect(reader)
		if (!token) break
		if (token instanceof ScriptReader.SyntaxError) return token
		tokens.push(token)
	}

	return tokens
}
