import type { Token } from "."
import { DefinitionToken } from "."
import { BlockToken } from "./blockToken"
import { KeywordToken } from "./keywordToken"
import { ScriptReader } from "./reader"
import { WordToken } from "./wordToken"

const tokenType = "typeTrait"
export type TypeTraitToken = Token<
	typeof tokenType,
	{
		keyword: KeywordToken<"type trait">
		name: WordToken
		block: BlockToken<DefinitionToken>
	}
>
export const TypeTraitToken: Token.Builder<TypeTraitToken> = {
	tokenType() {
		return tokenType
	},
	expect(reader) {
		const error = (error: ScriptReader.SyntaxError) => reader.syntaxError(`While expecting type trait definition:\n\t${error.message}`)
		const startAt = reader.getIndex()

		const keyword = KeywordToken("type trait").expect(reader)
		if (!keyword) return null

		if (!reader.expectWhitespace()) return error(reader.syntaxError(`Expected whitespace after "${keyword.keyword}"`))

		const name = WordToken.expect(reader)
		if (!name) return error(reader.syntaxError(`Expected name`))

		if (!reader.expectWhitespace()) return error(reader.syntaxError(`Expected whitespace after "${name.word}"`))

		const block = BlockToken(DefinitionToken).expect(reader)
		if (!block) return error(reader.syntaxError(`Expected block after ${name.word}`))
		if (block instanceof ScriptReader.SyntaxError) return error(block)

		return {
			tokenType: this.tokenType(),
			keyword,
			name,
			block,
			location: {
				startAt,
				endAt: reader.getIndex(),
			},
		}
	},
}
