import type { Token } from "."
import type { ScriptReader } from "./reader"

export type KeywordToken<TKeyword extends string> = Token<"keyword", { keyword: TKeyword }>
export namespace KeywordToken {
	export function expect<const TKeyword extends string>(reader: ScriptReader, keyword: TKeyword): KeywordToken<TKeyword> | null {
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
		} satisfies KeywordToken<TKeyword>
	}
}
