import type { Token } from "."
import { LiteralNumberToken } from "./literalNumberToken"
import { OneOfToken } from "./oneOfToken"
import { OperationToken } from "./operationToken"
import { ScriptReader } from "./reader"
import { TypeNameToken } from "./typeNameToken"

const tokenType = "type"
export type TypeToken = Token<
	typeof tokenType,
	{
		token: TypeNameToken | LiteralNumberToken
		operation: OperationToken<"|" | "&", TypeToken> | null
	}
>
export const TypeToken: Token.Builder<TypeToken> = {
	tokenType,
	is(value): value is TypeToken {
		return value.tokenType === tokenType
	},
	expect(reader) {
		const error = (error: ScriptReader.SyntaxError) => reader.syntaxError(`While expecting value:\n\t${error.message}`)
		const startAt = reader.getIndex()

		let token = OneOfToken(() => [TypeNameToken, LiteralNumberToken]).expect(reader)
		if (token === null) return null
		if (token instanceof ScriptReader.SyntaxError) return error(token)

		const checkpoint2 = reader.checkpoint()
		const hadWhitespaceBeforeOperation = reader.expectWhitespace()

		const operation = OperationToken(["&", "|"], TypeToken).expect(reader)
		if (operation instanceof ScriptReader.SyntaxError) return error(operation)
		if (operation) {
			if (!hadWhitespaceBeforeOperation) return error(reader.syntaxError(`Expected whitespace before operator: "${operation.operator.symbol}"`))
			return {
				tokenType,
				token,
				operation,
				location: {
					startAt,
					endAt: reader.getIndex(),
				},
			}
		} else checkpoint2.restore()

		return {
			tokenType,
			token,
			operation: null,
			location: {
				startAt,
				endAt: reader.getIndex(),
			},
		}
	},
}
