import type { Token } from "."
import type { ScriptReader } from "./reader"

export type SymbolToken<TSymbol extends string> = Token<
	"symbol",
	{
		symbol: TSymbol
	}
>
export namespace SymbolToken {
	export function expect<const TSymbol extends string>(reader: ScriptReader, symbol: TSymbol): SymbolToken<TSymbol> | null {
		const startAt = reader.getIndex()

		for (const char of symbol) {
			if (reader.peek() !== char) return null
			reader.next()
		}

		return {
			tokenType: "symbol",
			symbol,
			location: {
				startAt,
				endAt: reader.getIndex(),
			},
		} satisfies SymbolToken<TSymbol>
	}
}
