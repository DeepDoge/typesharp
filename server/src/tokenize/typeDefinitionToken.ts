import type { Token } from "."
import { KeywordToken } from "./keywordToken"
import { ScriptReader } from "./reader"
import { SymbolToken } from "./symbolToken"
import { TypeToken } from "./typeToken"
import { WordToken } from "./wordToken"

export type TypeDefinitionToken = Token<
	"typeDefinition",
	{
		keyword: KeywordToken<"type">
		name: WordToken
		type: TypeToken
	}
>
export namespace TypeDefinitionToken {
	export function expect(reader: ScriptReader): TypeDefinitionToken | ScriptReader.SyntaxError | null {
		const error = (error: ScriptReader.SyntaxError) => reader.syntaxError(`While expecting variable definition:\n\t${error.message}`)
		const startAt = reader.getIndex()

		const keyword = KeywordToken.expect(reader, "type")
		if (!keyword) return null

		if (!reader.expectWhitespace()) return error(reader.syntaxError(`Expected whitespace after "${keyword.keyword}"`))

		const name = WordToken.expect(reader)
		if (!name) return null

		if (!reader.expectWhitespace()) return error(reader.syntaxError(`Expected whitespace after name`))

		const equalSymbol = SymbolToken.expect(reader, "=")
		if (!equalSymbol) return error(reader.syntaxError(`Expected equals sign`))

		if (!reader.expectWhitespace()) return error(reader.syntaxError(`Expected whitespace after equals sign`))

		const type = TypeToken.expect(reader)
		if (!type) return error(reader.syntaxError(`Expected value`))
		if (type instanceof ScriptReader.SyntaxError) return error(type)

		return {
			tokenType: "typeDefinition",
			keyword,
			name,
			type,
			location: {
				startAt,
				endAt: reader.getIndex(),
			},
		} satisfies TypeDefinitionToken
	}
}
