import type { Token } from "."
import { EqualsToken } from "./equalsToken"
import { KeywordToken } from "./keywordToken"
import { ScriptReader } from "./reader"
import { SymbolToken } from "./symbolToken"
import { TypeToken } from "./typeToken"
import { ValueToken } from "./valueToken"
import { VariableNameToken } from "./variableNameToken"

const tokenType = "variableDefinition"
export type VariableDefinitionToken = Token<
	typeof tokenType,
	{
		keyword: KeywordToken<"var">
		name: VariableNameToken
		colon: SymbolToken<":"> | null
		type: TypeToken | null
		equals: EqualsToken<ValueToken> | null
	}
>
export const VariableDefinitionToken: Token.Builder<VariableDefinitionToken> = {
	tokenType() {
		return tokenType
	},
	expect(reader) {
		const error = (error: ScriptReader.SyntaxError) => reader.syntaxError(`While expecting ${this.tokenType()}:\n\t${error.message}`)
		const startAt = reader.getIndex()

		const keyword = KeywordToken("var").expect(reader)
		if (!keyword) return null

		if (!reader.expectWhitespace()) return error(reader.syntaxError(`Expected whitespace after "${keyword.keyword}"`))

		const name = VariableNameToken.expect(reader)
		if (name instanceof ScriptReader.SyntaxError) return error(name)
		if (!name) return null

		const beforeColorCheckpoint = reader.checkpoint()
		let type: VariableDefinitionToken["type"] = null
		const colon = SymbolToken(":").expect(reader)
		if (colon) {
			if (!reader.expectWhitespace()) return error(reader.syntaxError(`Expected whitespace after colon`))
			const typeToken = TypeToken.expect(reader)
			if (!typeToken) return error(reader.syntaxError(`Expected type name after colon`))
			if (typeToken instanceof ScriptReader.SyntaxError) return error(typeToken)
			type = typeToken
		} else beforeColorCheckpoint.restore()

		const hadWhitespaceAfterName = reader.expectWhitespace()

		const equals = EqualsToken(ValueToken).expect(reader)
		if (equals instanceof ScriptReader.SyntaxError) return error(equals)
		if (equals && !hadWhitespaceAfterName) return error(reader.syntaxError(`Expected whitespace after "${name.name.word}"`))

		return {
			tokenType: this.tokenType(),
			keyword,
			name,
			colon,
			equals,
			type,
			location: {
				startAt,
				endAt: reader.getIndex(),
			},
		}
	},
}
