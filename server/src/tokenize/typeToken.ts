import type { Token } from "."
import { LiteralToken } from "./literalToken"
import { ScriptReader } from "./reader"
import { TypeNameToken } from "./typeNameToken"
import { TypeOperationToken } from "./typeOperationToken"

export type TypeToken = Token<
	"type",
	{
		token: Exclude<ReturnType<(typeof TypeToken.typeTokens)[number]["expect"]>, null | ScriptReader.SyntaxError>
		operation: TypeOperationToken | null
	}
>
export namespace TypeToken {
	export const typeTokens = [TypeNameToken, LiteralToken] as const

	export function is(value: Token): value is TypeToken {
		return value.tokenType === "type"
	}
	export function expect(reader: ScriptReader): TypeToken | ScriptReader.SyntaxError | null {
		const error = (error: ScriptReader.SyntaxError) => reader.syntaxError(`While expecting value:\n\t${error.message}`)
		const startAt = reader.getIndex()

		const checkpoint = reader.checkpoint()
		let token: TypeToken["token"] | null = null
		for (const typeToken of typeTokens) {
			checkpoint.restore()
			const resultToken = typeToken.expect(reader)
			if (!resultToken) continue
			if (resultToken instanceof ScriptReader.SyntaxError) return error(resultToken)

			token = resultToken
			break
		}
		if (token === null) return null

		const checkpoint2 = reader.checkpoint()
		const hadWhitespaceBeforeOperation = reader.expectWhitespace()

		const operation = TypeOperationToken.expect(reader)
		if (operation) {
			if (operation instanceof ScriptReader.SyntaxError) return error(operation)
			if (!hadWhitespaceBeforeOperation) return error(reader.syntaxError(`Expected whitespace before operator: "${operation.operator.symbol}"`))
			return {
				tokenType: "type",
				token,
				operation,
				location: {
					startAt,
					endAt: reader.getIndex(),
				},
			} satisfies TypeToken
		} else checkpoint2.restore()

		return {
			tokenType: "type",
			token,
			operation: null,
			location: {
				startAt,
				endAt: reader.getIndex(),
			},
		} satisfies TypeToken
	}
}
