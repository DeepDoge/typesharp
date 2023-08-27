import type { TokenLocation } from "."
import type { ScriptReader } from "./reader"

export namespace Keyword {
	export type Token<TKeyword extends string> = TokenLocation & {
		tokenType: "keyword"
		keyword: TKeyword
	}

	export function expect<const TKeyword extends string>(reader: ScriptReader, keyword: TKeyword): Token<TKeyword> | null {
		const startAt = reader.getIndex()

		for (const char of keyword) {
			if (reader.peek() !== char) return null
			reader.next()
		}

		return {
			tokenType: "keyword",
			keyword,
			location: {
				startAt,
				endAt: reader.getIndex(),
			},
		} satisfies Token<TKeyword>
	}
}
