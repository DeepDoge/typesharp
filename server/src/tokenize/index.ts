import type { FunctionCall } from "./functionCallToken"
import type { Literal } from "./literalToken"
import type { Operation } from "./operationToken"
import { ScriptReader } from "./reader"
import { Value } from "./valueToken"
import { VariableDefinition } from "./variableDefinitionToken"
import type { VariableName } from "./variableNameToken"

export type Token = FunctionCall.Token | Literal.Token | Operation.Token | Value.Token | VariableDefinition.Token | VariableName.Token

export function tokenize(script: string) {
	const reader = ScriptReader.create(script)
	const tokens: Token[] = []

	const topLevelTokens = [VariableDefinition, Value] as const

	whileLoop: while (true) {
		reader.skipWhitespace()

		const checkpoint = reader.checkpoint()
		for (const topLevelToken of topLevelTokens) {
			checkpoint.restore()
			const token = topLevelToken.expect(reader)
			if (token) {
				if (token instanceof ScriptReader.SyntaxError) return token
				tokens.push(token)
				reader.expectEndOfLine()
				continue whileLoop
			}
		}

		reader.skipWhitespace()
		const char = reader.peek()
		if (!char) break
		return reader.syntaxError(`Unexpected character "${char}"`)
	}

	return tokens
}
