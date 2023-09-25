import type { Token } from "."
import { ScriptReader } from "./reader"
import { SymbolToken } from "./symbolToken"

const tokenType = "equals"
export type EqualsToken<T extends Token> = Token<
	typeof tokenType,
	{
		symbol: SymbolToken<"=">
		token: T
	}
>
export const EqualsToken = <T extends Token>(tokenBuilder: Token.Builder<T>): Token.Builder<EqualsToken<T>> => ({
	tokenType,
	is(value): value is EqualsToken<T> {
		if (value.tokenType !== tokenType) return false
		const token = value as EqualsToken<Token>
		if (tokenBuilder.is(value)) return true
		return false
	},
	expect(reader: ScriptReader): EqualsToken<T> | null | ScriptReader.SyntaxError {
		const error = (error: ScriptReader.SyntaxError) => reader.syntaxError(`While expecting equals:\n\t${error.message}`)
		const startAt = reader.getIndex()

		const symbol = SymbolToken("=").expect(reader)
		if (!symbol) return null

		const token = tokenBuilder.expect(reader)
		if (!token) return error(reader.syntaxError(`Expected token after equals`))
		if (token instanceof ScriptReader.SyntaxError) return error(token)

		return {
			tokenType,
			symbol,
			token,
			location: {
				startAt,
				endAt: reader.getIndex(),
			},
		}
	},
})
