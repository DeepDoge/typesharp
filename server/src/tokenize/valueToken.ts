import type { Token } from "."
import { FunctionCallToken } from "./functionCallToken"
import { LiteralToken } from "./literalToken"
import { ScriptReader } from "./reader"
import { ValueOperationToken } from "./valueOperationToken"
import { VariableNameToken } from "./variableNameToken"

export type ValueToken = Token<
	"value",
	{
		token: Exclude<ReturnType<(typeof ValueToken.valueTokens)[number]["expect"]>, null | ScriptReader.SyntaxError>
		operation: ValueOperationToken | null
	}
>
export namespace ValueToken {
	export const valueTokens = [FunctionCallToken, LiteralToken, VariableNameToken] as const

	export function expect(reader: ScriptReader): ValueToken | ScriptReader.SyntaxError | null {
		const error = (error: ScriptReader.SyntaxError) => reader.syntaxError(`While expecting value:\n\t${error.message}`)
		const startAt = reader.getIndex()

		const checkpoint = reader.checkpoint()
		let token: ValueToken["token"] | null = null
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

		const operation = ValueOperationToken.expect(reader)
		if (operation) {
			if (operation instanceof ScriptReader.SyntaxError) return error(operation)
			if (!hadWhitespaceBeforeOperation) return error(reader.syntaxError(`Expected whitespace before operator: "${operation.operator.symbol}"`))
			return {
				tokenType: "value",
				token,
				operation,
				location: {
					startAt,
					endAt: reader.getIndex(),
				},
			} satisfies ValueToken
		} else checkpoint2.restore()

		return {
			tokenType: "value",
			token,
			operation: null,
			location: {
				startAt,
				endAt: reader.getIndex(),
			},
		} satisfies ValueToken
	}
}
