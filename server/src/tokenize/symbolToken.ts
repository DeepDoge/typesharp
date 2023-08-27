import type { TokenLocation } from "."
import type { ScriptReader } from "./reader"

export namespace Symbol {
	export type Token<TSymbol extends string> = TokenLocation & {
		tokenType: "symbol"
		symbol: TSymbol
	}

	export function expect<const TSymbol extends string>(reader: ScriptReader, symbol: TSymbol): Token<TSymbol> | null {
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
		} satisfies Token<TSymbol>
	}
}
