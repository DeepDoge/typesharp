import { FunctionCall } from "./functionCallToken"
import { Literal } from "./literalToken"
import { Operation } from "./operationToken"
import { ScriptReader } from "./reader"
import { VariableName } from "./variableNameToken"

export namespace Value {
	export type Token = {
		tokenType: "value"
		token: VariableName.Token | FunctionCall.Token | Literal.Token
		operation: Operation.Token | null
	}

	export const valueTokens = [VariableName, FunctionCall, Literal] as const

	const notError = new ScriptReader.NotError("Not a value")

	export function expect(scriptReader: ScriptReader): Token | Error | ScriptReader.NotError {
		const error = (error: Error) => new Error(`While expecting value: ${error.message}`)

		let token: Token["token"] | null = null
		for (const valueToken of valueTokens) {
			const value = valueToken.expect(scriptReader)
			if (!(value instanceof ScriptReader.NotError)) {
				if (value instanceof Error) return error(value)
				token = value
				break
			}
		}
		if (token === null) return notError

		scriptReader.skipWhitespace()

		const operation = Operation.expect(scriptReader)
		if (!(operation instanceof ScriptReader.NotError)) {
			if (operation instanceof Error) return error(operation)
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
