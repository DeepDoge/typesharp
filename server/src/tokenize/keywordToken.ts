import type { Token } from "."
import type { ScriptReader } from "./reader"

const tokenType = "keyword"
export type KeywordToken<TKeyword extends string> = Token<`${typeof tokenType}(${TKeyword})`, { keyword: TKeyword }>
export const KeywordToken = <TKeyword extends string>(keyword: TKeyword): Token.BuilderNoError<KeywordToken<TKeyword>> => ({
	tokenType() {
		return `${tokenType}(${keyword})` as const
	},
	expect(reader: ScriptReader): KeywordToken<TKeyword> | null {
		const startAt = reader.getIndex()
		const checkpoint = reader.checkpoint()

		for (const char of keyword) {
			if (reader.peek() !== char) return checkpoint.restore(), null
			reader.next()
		}

		return {
			tokenType: `${tokenType}(${keyword})` as const,
			keyword,
			location: {
				startAt,
				endAt: reader.getIndex(),
			},
		}
	},
})
