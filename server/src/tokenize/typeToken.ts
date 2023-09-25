import { DefinitionToken, PrimitiveTypeToken, type Token } from "."
import { BlockToken } from "./blockToken"
import { ExportToken } from "./exportToken"
import { LiteralNumberToken } from "./literalNumberToken"
import { OneOfToken } from "./oneOfToken"
import { OperationToken } from "./operationToken"
import { ScriptReader } from "./reader"
import { TupleToken } from "./tupleToken"
import { TypeNameToken } from "./typeNameToken"

const primitiveOperators = ["|", "&"] as const
const operators = [...primitiveOperators.map((operator) => `${operator}=` as const), ...primitiveOperators] as const
type TypeOperator = (typeof operators)[number]

type $Token =
	| PrimitiveTypeToken
	| Token<`tuple(${string})`, { members: $Token[] }>
	| Token<`block(${string})`, { members: ($Token | DefinitionToken | ExportToken<DefinitionToken>)[] }>

const $Token: Token.Builder<$Token> = OneOfToken(() => [
	PrimitiveTypeToken,
	TupleToken($Token),
	BlockToken(OneOfToken([ExportToken(DefinitionToken), DefinitionToken, $Token])),
])

const tokenType = "type"
export type TypeToken = Token<
	typeof tokenType,
	{
		token: TypeNameToken | LiteralNumberToken
		operation: OperationToken<TypeOperator, TypeToken> | null
	}
>
export const TypeToken: Token.Builder<TypeToken> = {
	tokenType() {
		return tokenType
	},
	expect(reader) {
		const error = (error: ScriptReader.SyntaxError) => reader.syntaxError(`While expecting ${this.tokenType()}:\n\t${error.message}`)
		const startAt = reader.getIndex()

		let token = OneOfToken(() => [TypeNameToken, LiteralNumberToken]).expect(reader)
		if (token === null) return null
		if (token instanceof ScriptReader.SyntaxError) return error(token)

		const checkpoint2 = reader.checkpoint()
		const hadWhitespaceBeforeOperation = reader.expectWhitespace()

		const operation = OneOfToken(operators.map((operator) => OperationToken(operator, TypeToken))).expect(reader)
		if (operation instanceof ScriptReader.SyntaxError) return error(operation)
		if (operation) {
			if (!hadWhitespaceBeforeOperation) return error(reader.syntaxError(`Expected whitespace before operator: "${operation.operator.symbol}"`))
			return {
				tokenType: this.tokenType(),
				token,
				operation,
				location: {
					startAt,
					endAt: reader.getIndex(),
				},
			}
		} else checkpoint2.restore()

		return {
			tokenType: this.tokenType(),
			token,
			operation: null,
			location: {
				startAt,
				endAt: reader.getIndex(),
			},
		}
	},
}
