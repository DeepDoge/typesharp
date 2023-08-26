import { FunctionCall } from "./functionCallToken"
import { Literal } from "./literalToken"
import { Operation } from "./operationToken"
import type { ScriptReader } from "./reader"
import { VariableName } from "./variableNameToken"

export namespace Value {
	export type Token = {
		tokenType: "value"
		token: VariableName.Token | FunctionCall.Token | Literal.Token
		operation: Operation.Token | null
	}

	export const valueTokens = [VariableName, FunctionCall, Literal] as const

	export function expect(scriptReader: ScriptReader): Token | Error | null {
		const error = (error: Error) => new Error(`While expecting value: ${error.message}`)

		let token: Token["token"] | null = null
		for (const valueToken of valueTokens) {
			const value = valueToken.expect(scriptReader)
			if (!value) continue

			if (value instanceof Error) return error(value)
			token = value
			break
		}
		if (token === null) return null

		const hadWhitespaceBeforeOperation = scriptReader.expectWhitespace()

		const operation = Operation.expect(scriptReader)
		if (operation) {
			if (operation instanceof Error) return error(operation)
			if (!hadWhitespaceBeforeOperation) return error(new Error(`Expected whitespace before operator`))
			return {
				tokenType: "value",
				token,
				operation,
			} satisfies Token
		}

		return {
			tokenType: "value",
			token,
			operation: null,
		} satisfies Token
	}
}
