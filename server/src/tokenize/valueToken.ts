import type { Token } from "."
import { FunctionCallToken } from "./functionCallToken"
import { LiteralNumberToken } from "./literalNumberToken"
import { OneOfToken } from "./oneOfToken"
import { OperationToken } from "./operationToken"
import { ScriptReader } from "./reader"
import { SymbolToken } from "./symbolToken"
import { TupleToken } from "./tupleToken"
import { TypeToken } from "./typeToken"
import { VariableNameToken } from "./variableNameToken"

const operators = ["+", "-", "*", "/", "==", "!=", "<", ">", "<=", ">=", "&&", "||"] as const

type Tokens = Token.Of<(typeof tokensBase)[number]> | Token<"tuple", { members: Tokens[] }>
const tokensBase = [FunctionCallToken, LiteralNumberToken, VariableNameToken] as const
const tokens: Token.Builder<Tokens>[] = [...tokensBase, TupleToken(OneOfToken(() => tokens))]

const tokenType = "value"
export type ValueToken = Token<
	typeof tokenType,
	{
		token: Token.Of<(typeof tokens)[number]>
		satifises: TypeToken | null
		operation: OperationToken<(typeof operators)[number], ValueToken> | null
	}
>
export const ValueToken: Token.Builder<ValueToken> = {
	tokenType,
	is(value): value is ValueToken {
		return value.tokenType === tokenType
	},
	expect(reader) {
		const error = (error: ScriptReader.SyntaxError) => reader.syntaxError(`While expecting value:\n\t${error.message}`)
		const startAt = reader.getIndex()

		let token = OneOfToken(() => tokens).expect(reader)
		if (token instanceof ScriptReader.SyntaxError) return error(token)
		if (token === null) return null

		const afterValueCheckpoint = reader.checkpoint()
		const colon = SymbolToken(":").expect(reader)
		if (colon instanceof ScriptReader.SyntaxError) return error(colon)
		if (colon && !reader.expectWhitespace()) return error(reader.syntaxError(`Expected whitespace after "${colon.symbol}" symbol`))
		const satifises = colon ? TypeToken.expect(reader) : (afterValueCheckpoint.restore(), null)
		if (satifises instanceof ScriptReader.SyntaxError) return error(satifises)
		if (colon && !satifises) return error(reader.syntaxError(`Expected type after "${colon.symbol}" symbol`))

		const beforeOperationCheckpoint = reader.checkpoint()
		const hadWhitespaceBeforeOperation = reader.expectWhitespace()

		const operation = OperationToken(operators, ValueToken).expect(reader)
		if (operation instanceof ScriptReader.SyntaxError) return error(operation)
		if (operation) {
			if (!hadWhitespaceBeforeOperation) return error(reader.syntaxError(`Expected whitespace before operator: "${operation.operator.symbol}"`))
		} else beforeOperationCheckpoint.restore()

		return {
			tokenType,
			token,
			satifises,
			operation,
			location: {
				startAt,
				endAt: reader.getIndex(),
			},
		}
	},
}
