import type { TokenLocation } from "."
import { Keyword } from "./keywordToken"
import { ScriptReader } from "./reader"
import { Symbol } from "./symbolToken"
import { Type } from "./typeToken"
import { Value } from "./valueToken"
import { Word } from "./wordToken"

export namespace VariableDefinition {
	export type Token = TokenLocation & {
		tokenType: "variableDefinition"
		keyword: Keyword.Token<"var">
		name: Word.Token
		type: {
			colonSymbol: Symbol.Token<":">
			type: Type.Token
		} | null
		equalSymbol: Symbol.Token<"=">
		value: Value.Token
	}

	export function expect(reader: ScriptReader): Token | ScriptReader.SyntaxError | null {
		const error = (error: ScriptReader.SyntaxError) => reader.syntaxError(`While expecting variable definition:\n\t${error.message}`)
		const startAt = reader.getIndex()

		const keyword = Keyword.expect(reader, "var")
		if (!keyword) return null

		if (!reader.expectWhitespace()) return error(reader.syntaxError(`Expected whitespace after "${keyword.keyword}"`))

		const name = Word.expect(reader)
		if (!name) return null

		const beforeColorCheckpoint = reader.checkpoint()
		let type: Token["type"] = null
		const colon = Symbol.expect(reader, ":")

		if (colon) {
			if (!reader.expectWhitespace()) return error(reader.syntaxError(`Expected whitespace after colon`))
			const typeToken = Type.expect(reader)
			if (!typeToken) return error(reader.syntaxError(`Expected type name after colon`))
			if (typeToken instanceof ScriptReader.SyntaxError) return error(typeToken)
			type = { colonSymbol: colon, type: typeToken }
		} else {
			beforeColorCheckpoint.restore()
			if (!reader.expectWhitespace()) return error(reader.syntaxError(`Expected whitespace after name`))
		}

		const equals = Symbol.expect(reader, "=")
		if (!equals) return error(reader.syntaxError(`Expected equals sign`))

		if (!reader.expectWhitespace()) return error(reader.syntaxError(`Expected whitespace between equals sign and value`))

		const value = Value.expect(reader)
		if (!value) return error(reader.syntaxError(`Expected value`))
		if (value instanceof ScriptReader.SyntaxError) return error(value)

		return {
			tokenType: "variableDefinition",
			keyword,
			name,
			type,
			equalSymbol: equals,
			value,
			location: {
				startAt,
				endAt: reader.getIndex(),
			},
		} satisfies Token
	}
}
