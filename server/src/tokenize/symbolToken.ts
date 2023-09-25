import type { Token } from "."
import type { ScriptReader } from "./reader"

const tokenType = "symbol"
export type SymbolToken<TSymbol extends string> = Token<
	`${typeof tokenType}(${TSymbol})`,
	{
		symbol: TSymbol
	}
>
export const SymbolToken = <TSymbol extends string>(symbol: TSymbol): Token.BuilderNoError<SymbolToken<TSymbol>> => ({
	tokenType() {
		return `${tokenType}(${symbol})` as const
	},
	expect(reader: ScriptReader): SymbolToken<TSymbol> | null {
		const startAt = reader.getIndex()
		const checkpoint = reader.checkpoint()

		for (const char of symbol) {
			if (reader.peek() !== char) return checkpoint.restore(), null
			reader.next()
		}

		return {
			tokenType: this.tokenType(),
			symbol,
			location: {
				startAt,
				endAt: reader.getIndex(),
			},
		}
	},
})
