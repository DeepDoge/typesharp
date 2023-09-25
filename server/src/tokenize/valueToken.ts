import { PrimitiveTopLevelToken, PrimitiveValueToken, type Token } from "."
import { BlockToken } from "./blockToken"
import { ExportToken } from "./exportToken"
import { OneOfToken } from "./oneOfToken"
import { OperationToken } from "./operationToken"
import { ScriptReader } from "./reader"
import { SymbolToken } from "./symbolToken"
import { TupleToken } from "./tupleToken"
import { TypeToken } from "./typeToken"
import { VariableDefinitionToken } from "./variableDefinitionToken"

const mathOperators = ["+", "-", "*", "/"] as const
const operators = [
	...mathOperators.map((operator) => `${operator}=` as const),
	...mathOperators,
	"==",
	"!=",
	"<",
	">",
	"<=",
	">=",
	"&&",
	"||",
] as const

type $Token =
	| PrimitiveValueToken
	| Token<`tuple(${string})`, { members: $Token[] }>
	| Token<`block(${string})`, { members: (ExportToken<VariableDefinitionToken> | PrimitiveTopLevelToken)[] }>
const $Token = (): Token.Builder<$Token> =>
	OneOfToken(() => [
		PrimitiveValueToken,
		TupleToken($Token()),
		BlockToken(OneOfToken([ExportToken(VariableDefinitionToken), PrimitiveTopLevelToken])),
	])

const tokenType = "value"
export type ValueToken = Token<
	typeof tokenType,
	{
		token: $Token
		satifises: TypeToken | null
		operation: OperationToken<(typeof operators)[number], ValueToken> | null
	}
>
export const ValueToken: Token.Builder<ValueToken> = {
	tokenType() {
		return tokenType
	},
	expect(reader) {
		const error = (error: ScriptReader.SyntaxError) => reader.syntaxError(`While expecting ${this.tokenType()}:\n\t${error.message}`)
		const startAt = reader.getIndex()

		let token = $Token().expect(reader)
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

		const operation = OneOfToken(operators.map((operator) => OperationToken(operator, ValueToken))).expect(reader)
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
