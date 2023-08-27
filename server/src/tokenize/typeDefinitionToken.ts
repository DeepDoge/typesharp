import type { TokenLocation } from "."
import { Keyword } from "./keywordToken"
import { ScriptReader } from "./reader"
import { Symbol } from "./symbolToken"
import { Type } from "./typeToken"
import { Word } from "./wordToken"

export namespace TypeDefinition {
	export type Token = TokenLocation & {
		tokenType: "typeDefinition"
		keyword: Keyword.Token<"type">
		name: Word.Token
		equalSymbol: Symbol.Token<"=">
		type: Type.Token
	}

	export function expect(reader: ScriptReader): Token | ScriptReader.SyntaxError | null {
		const error = (error: ScriptReader.SyntaxError) => reader.syntaxError(`While expecting variable definition:\n\t${error.message}`)
		const startAt = reader.getIndex()

		const keyword = Keyword.expect(reader, "type")
		if (!keyword) return null

		if (!reader.expectWhitespace()) return error(reader.syntaxError(`Expected whitespace after "${keyword.keyword}"`))

		const name = Word.expect(reader)
		if (!name) return null

		if (!reader.expectWhitespace()) return error(reader.syntaxError(`Expected whitespace after name`))

		const equalSymbol = Symbol.expect(reader, "=")
		if (!equalSymbol) return error(reader.syntaxError(`Expected equals sign`))

		if (!reader.expectWhitespace()) return error(reader.syntaxError(`Expected whitespace after equals sign`))

		const type = Type.expect(reader)
		if (!type) return error(reader.syntaxError(`Expected value`))
		if (type instanceof ScriptReader.SyntaxError) return error(type)

		return {
			tokenType: "typeDefinition",
			keyword,
			name,
			equalSymbol,
			type,
			location: {
				startAt,
				endAt: reader.getIndex(),
			},
		} satisfies Token
	}
}
