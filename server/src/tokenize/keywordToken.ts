import type { Token } from "."
import type { ScriptReader } from "./reader"

const tokenType = "keyword"
export type KeywordToken<TKeyword extends string> = Token<typeof tokenType, { keyword: TKeyword }>
export const KeywordToken = <TKeyword extends string>(keyword: TKeyword): Token.BuilderOptional<KeywordToken<TKeyword>> => ({
	tokenType,
	is(value: Token): value is KeywordToken<TKeyword> {
		if (value.tokenType !== tokenType) return false
		const token = value as KeywordToken<TKeyword>
		if (token.keyword !== keyword) return false
		return true
	},
	expect(reader: ScriptReader): KeywordToken<TKeyword> | null {
		const startAt = reader.getIndex()
		const checkpoint = reader.checkpoint()

		for (const char of keyword) {
			if (reader.peek() !== char) return checkpoint.restore(), null
			reader.next()
		}

		return {
			tokenType,
			keyword,
			location: {
				startAt,
				endAt: reader.getIndex(),
			},
		}
	},
})
