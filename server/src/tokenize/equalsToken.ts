import type { Token } from "."
import { ScriptReader } from "./reader"
import { SymbolToken } from "./symbolToken"

const tokenType = "equals"
export type EqualsToken<T extends Token> = Token<
	`${typeof tokenType}(${T["tokenType"]})`,
	{
		symbol: SymbolToken<"=">
		token: T
	}
>
export const EqualsToken = <T extends Token>(tokenBuilder: Token.Builder<T>): Token.Builder<EqualsToken<T>> => ({
	tokenType() {
		return `${tokenType}(${tokenBuilder.tokenType()})` as const
	},
	expect(reader: ScriptReader): EqualsToken<T> | null | ScriptReader.SyntaxError {
		const error = (error: ScriptReader.SyntaxError) => reader.syntaxError(`While expecting equals:\n\t${error.message}`)
		const startAt = reader.getIndex()

		const symbol = SymbolToken("=").expect(reader)
		if (!symbol) return null

		if (!reader.expectWhitespace()) return error(reader.syntaxError(`Expected whitespace after equals`))

		const token = tokenBuilder.expect(reader)
		if (!token) return error(reader.syntaxError(`Expected token after equals`))
		if (token instanceof ScriptReader.SyntaxError) return error(token)

		return {
			tokenType: this.tokenType(),
			symbol,
			token,
			location: {
				startAt,
				endAt: reader.getIndex(),
			},
		}
	},
})
