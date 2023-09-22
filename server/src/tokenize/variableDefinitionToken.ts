import type { Token } from "."
import { KeywordToken } from "./keywordToken"
import { ScriptReader } from "./reader"
import { SymbolToken } from "./symbolToken"
import { TypeToken } from "./typeToken"
import { ValueToken } from "./valueToken"
import { VariableNameToken } from "./variableNameToken"

export type VariableDefinitionToken = Token<
	"variableDefinition",
	{
		keyword: KeywordToken<"var">
		name: VariableNameToken
		colon: SymbolToken<":"> | null
		type: TypeToken | null
		equals: SymbolToken<"=">
		value: ValueToken
	}
>
export namespace VariableDefinition {
	export function expect(reader: ScriptReader): VariableDefinitionToken | ScriptReader.SyntaxError | null {
		const error = (error: ScriptReader.SyntaxError) => reader.syntaxError(`While expecting variable definition:\n\t${error.message}`)
		const startAt = reader.getIndex()

		const keyword = KeywordToken.expect(reader, "var")
		if (!keyword) return null

		if (!reader.expectWhitespace()) return error(reader.syntaxError(`Expected whitespace after "${keyword.keyword}"`))

		const name = VariableNameToken.expect(reader)
		if (name instanceof ScriptReader.SyntaxError) return error(name)
		if (!name) return null

		const beforeColorCheckpoint = reader.checkpoint()
		let type: VariableDefinitionToken["type"] = null
		const colon = SymbolToken.expect(reader, ":")
		if (colon) {
			if (!reader.expectWhitespace()) return error(reader.syntaxError(`Expected whitespace after colon`))
			const typeToken = TypeToken.expect(reader)
			if (!typeToken) return error(reader.syntaxError(`Expected type name after colon`))
			if (typeToken instanceof ScriptReader.SyntaxError) return error(typeToken)
			type = typeToken
		} else beforeColorCheckpoint.restore()

		if (!reader.expectWhitespace()) return error(reader.syntaxError(`Expected whitespace before equals sign`))

		const equals = SymbolToken.expect(reader, "=")
		if (!equals) return error(reader.syntaxError(`Expected equals sign`))

		if (!reader.expectWhitespace()) return error(reader.syntaxError(`Expected whitespace between equals sign and value`))

		const value = ValueToken.expect(reader)
		if (!value) return error(reader.syntaxError(`Expected value`))
		if (value instanceof ScriptReader.SyntaxError) return error(value)

		return {
			tokenType: "variableDefinition",
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
		} satisfies VariableDefinitionToken
	}
}
