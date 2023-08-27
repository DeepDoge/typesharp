import type { Token } from "."
import { KeywordToken } from "./keywordToken"
import { ScriptReader } from "./reader"
import { ValueToken } from "./valueToken"

export type ReturnToken = Token<
	"return",
	{
		keyword: KeywordToken<"return">
		value: ValueToken | null
	}
>
export namespace ReturnToken {
	export function expect(reader: ScriptReader): ReturnToken | ScriptReader.SyntaxError | null {
		const error = (error: ScriptReader.SyntaxError) => reader.syntaxError(`While expecting return statement:\n\t${error.message}`)
		const startAt = reader.getIndex()

		const keyword = KeywordToken.expect(reader, "return")
		if (!keyword) return null

		const hadWhitespaceBeforeValue = reader.expectWhitespace()

		const value = ValueToken.expect(reader)
		if (value instanceof ScriptReader.SyntaxError) return error(value)
		if (value && !hadWhitespaceBeforeValue) return error(reader.syntaxError(`Expected whitespace between "${keyword}" keyword and value`))

		return {
			tokenType: "return",
			keyword,
			value,
			location: {
				startAt,
				endAt: reader.getIndex(),
			},
		} satisfies ReturnToken
	}
}
