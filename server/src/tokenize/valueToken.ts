import type { Token } from "."
import { FunctionCallToken } from "./functionCallToken"
import { LiteralToken } from "./literalToken"
import { ScriptReader } from "./reader"
import { SymbolToken } from "./symbolToken"
import { TypeToken } from "./typeToken"
import { ValueOperationToken } from "./valueOperationToken"
import { VariableNameToken } from "./variableNameToken"

export type ValueToken = Token<
	"value",
	{
		token: Exclude<ReturnType<(typeof ValueToken.valueTokens)[number]["expect"]>, null | ScriptReader.SyntaxError>
		satifises: TypeToken | null
		operation: ValueOperationToken | null
	}
>
export namespace ValueToken {
	export const valueTokens = [FunctionCallToken, LiteralToken, VariableNameToken] as const

	export function expect(reader: ScriptReader): ValueToken | ScriptReader.SyntaxError | null {
		const error = (error: ScriptReader.SyntaxError) => reader.syntaxError(`While expecting value:\n\t${error.message}`)
		const startAt = reader.getIndex()

		const startCheckpoint = reader.checkpoint()
		let token: ValueToken["token"] | null = null
		for (const valueToken of valueTokens) {
			startCheckpoint.restore()
			const value = valueToken.expect(reader)
			if (!value) continue
			if (value instanceof ScriptReader.SyntaxError) return error(value)

			token = value
			break
		}
		if (token === null) return null

		const afterValueCheckpoint = reader.checkpoint()
		const colon = SymbolToken.expect(reader, ":")
		if (colon instanceof ScriptReader.SyntaxError) return error(colon)
		if (colon && !reader.expectWhitespace()) return error(reader.syntaxError(`Expected whitespace after "${colon.symbol}" symbol`))
		const satifises = colon ? TypeToken.expect(reader) : (afterValueCheckpoint.restore(), null)
		if (satifises instanceof ScriptReader.SyntaxError) return error(satifises)
		if (colon && !satifises) return error(reader.syntaxError(`Expected type after "${colon.symbol}" symbol`))

		const beforeOperationCheckpoint = reader.checkpoint()
		const hadWhitespaceBeforeOperation = reader.expectWhitespace()

		const operation = ValueOperationToken.expect(reader)
		if (operation instanceof ScriptReader.SyntaxError) return error(operation)
		if (operation) {
			if (!hadWhitespaceBeforeOperation) return error(reader.syntaxError(`Expected whitespace before operator: "${operation.operator.symbol}"`))
		} else beforeOperationCheckpoint.restore()

		return {
			tokenType: "value",
			token,
			satifises,
			operation,
			location: {
				startAt,
				endAt: reader.getIndex(),
			},
		} satisfies ValueToken
	}
}
