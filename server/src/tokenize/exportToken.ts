import type { Token } from "."
import { KeywordToken } from "./keywordToken"
import { ScriptReader } from "./reader"

const tokenType = "export"
export type ExportToken<T extends Token> = Token<
	`${typeof tokenType}(${T["tokenType"]})`,
	{
		keyword: KeywordToken<"pub">
		token: T
	}
>
export const ExportToken = <T extends Token>(tokenBuilder: Token.Builder<T>): Token.Builder<ExportToken<T>> => ({
	tokenType() {
		return `${tokenType}(${tokenBuilder.tokenType()})` as const
	},
	expect(reader: ScriptReader) {
		const error = (error: ScriptReader.SyntaxError) => reader.syntaxError(`While expecting ${this.tokenType()}:\n\t${error.message}`)
		const startAt = reader.getIndex()

		const keyword = KeywordToken("pub").expect(reader)
		if (!keyword) return null

		if (!reader.expectWhitespace()) return error(reader.syntaxError(`Expected whitespace after "${keyword}"`))

		let token = tokenBuilder.expect(reader)
		if (token === null) return error(reader.syntaxError(`Expected exportable token`))
		if (token instanceof ScriptReader.SyntaxError) return error(token)

		return {
			tokenType: this.tokenType(),
			keyword,
			token,
			location: {
				startAt,
				endAt: reader.getIndex(),
			},
		}
	},
})
