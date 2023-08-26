import { FunctionCall } from "./functionCallToken"
import { Literal } from "./literalToken"
import { ScriptReader } from "./reader"
import { ValueOperation } from "./valueOperationToken"
import { VariableName } from "./variableNameToken"

export namespace Value {
	export type Token = {
		tokenType: "value"
		token: Exclude<ReturnType<(typeof valueTokens)[number]["expect"]>, null | ScriptReader.SyntaxError>
		operation: ValueOperation.Token | null
	}

	export const valueTokens = [FunctionCall, Literal, VariableName] as const

	export function expect(reader: ScriptReader): Token | ScriptReader.SyntaxError | null {
		const error = (error: ScriptReader.SyntaxError) => reader.syntaxError(`While expecting value:\n\t${error.message}`)

		const checkpoint = reader.checkpoint()
		let token: Token["token"] | null = null
		for (const valueToken of valueTokens) {
			checkpoint.restore()
			const value = valueToken.expect(reader)
			if (!value) continue
			if (value instanceof ScriptReader.SyntaxError) return error(value)

			token = value
			break
		}
		if (token === null) return null

		const checkpoint2 = reader.checkpoint()
		const hadWhitespaceBeforeOperation = reader.expectWhitespace()

		const operation = ValueOperation.expect(reader)
		if (operation) {
			if (operation instanceof ScriptReader.SyntaxError) return error(operation)
			if (!hadWhitespaceBeforeOperation) return error(reader.syntaxError(`Expected whitespace before operator: "${operation.operator}"`))
			return {
				tokenType: "value",
				token,
				operation,
			} satisfies Token
		} else checkpoint2.restore()

		return {
			tokenType: "value",
			token,
			operation: null,
		} satisfies Token
	}
}
