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

	whileLoop: while (reader.hasMore()) {
		reader.skipWhitespace()

		for (const topLevelToken of topLevelTokens) {
			const checkpoint = reader.checkpoint()
			const token = topLevelToken.expect(reader)
			if (!(token instanceof ScriptReader.NotError)) {
				if (token instanceof Error) return token
				tokens.push(token)
				reader.expectEndOfLine()
				continue whileLoop
			}
			checkpoint.restore()
		}
		return new Error(`Unexpected character ${reader.peek()}`)
	}
}
