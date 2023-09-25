import type { Token } from "."
import type { ScriptReader } from "./reader"

const tokenType = "symbol"
export type SymbolToken<TSymbol extends string> = Token<
	typeof tokenType,
	{
		symbol: TSymbol
	}
>
export const SymbolToken = <TSymbol extends string>(symbol: TSymbol): Token.BuilderOptional<SymbolToken<TSymbol>> => ({
	tokenType,
	is(value: Token): value is SymbolToken<TSymbol> {
		if (value.tokenType !== tokenType) return false
		const token = value as SymbolToken<TSymbol>
		if (token.symbol !== symbol) return false
		return true
	},
	expect(reader: ScriptReader): SymbolToken<TSymbol> | null {
		const startAt = reader.getIndex()
		const checkpoint = reader.checkpoint()

		for (const char of symbol) {
			if (reader.peek() !== char) return checkpoint.restore(), null
			reader.next()
		}

		return {
			tokenType,
			symbol,
			location: {
				startAt,
				endAt: reader.getIndex(),
			},
		}
	},
})
