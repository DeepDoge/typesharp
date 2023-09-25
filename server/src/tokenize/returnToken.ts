import type { Token } from "."
import { KeywordToken } from "./keywordToken"
import { ScriptReader } from "./reader"
import { ValueToken } from "./valueToken"

const tokenType = "return"
export type ReturnToken = Token<
	typeof tokenType,
	{
		keyword: KeywordToken<"return">
		value: ValueToken | null
	}
>
export const ReturnToken: Token.Builder<ReturnToken> = {
	tokenType() {
		return tokenType
	},
	expect(reader) {
		const error = (error: ScriptReader.SyntaxError) => reader.syntaxError(`While expecting return statement:\n\t${error.message}`)
		const startAt = reader.getIndex()

		const keyword = KeywordToken("return").expect(reader)
		if (!keyword) return null

		const hadWhitespaceBeforeValue = reader.expectWhitespace()

		const value = ValueToken.expect(reader)
		if (value instanceof ScriptReader.SyntaxError) return error(value)
		if (value && !hadWhitespaceBeforeValue) return error(reader.syntaxError(`Expected whitespace between "${keyword}" keyword and value`))

		return {
			tokenType: this.tokenType(),
			keyword,
			value,
			location: {
				startAt,
				endAt: reader.getIndex(),
			},
		}
	},
}
