import type { Token } from "."
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
		equals: SymbolToken<"="> | null
		value: ValueToken | null
	}
>
export const VariableDefinitionToken: Token.Builder<VariableDefinitionToken> = {
	tokenType,
	is(value): value is VariableDefinitionToken {
		return value.tokenType === tokenType
	},
	expect(reader) {
		const error = (error: ScriptReader.SyntaxError) => reader.syntaxError(`While expecting variable definition:\n\t${error.message}`)
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

		const equals = SymbolToken("=").expect(reader)
		if (!equals) {
			if (reader.expectEndOfLine() === null) return error(reader.syntaxError(`Expected equals sign after name`))
			return {
				tokenType,
				keyword,
				name,
				colon,
				type,
				equals: null,
				value: null,
				location: {
					startAt,
					endAt: reader.getIndex(),
				},
			}
		}
		if (!hadWhitespaceAfterName) return error(reader.syntaxError(`Expected whitespace before equals sign`))
		if (!reader.expectWhitespace()) return error(reader.syntaxError(`Expected whitespace after equals sign`))

		const value = ValueToken.expect(reader)
		if (!value) return error(reader.syntaxError(`Expected value`))
		if (value instanceof ScriptReader.SyntaxError) return error(value)

		return {
			tokenType,
			keyword,
			name,
			colon,
			equals,
			type,
			value,
			location: {
				startAt,
				endAt: reader.getIndex(),
			},
		}
	},
}
