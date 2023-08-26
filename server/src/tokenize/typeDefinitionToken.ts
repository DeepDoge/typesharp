import type { TokenLocation } from "."
import { ScriptReader } from "./reader"
import { Type } from "./typeToken"

export namespace TypeDefinition {
	export type Token = TokenLocation & {
		tokenType: "typeDefinition"
		name: string
		type: Type.Token
	}

	export function expect(reader: ScriptReader): Token | ScriptReader.SyntaxError | null {
		const error = (error: ScriptReader.SyntaxError) => reader.syntaxError(`While expecting variable definition:\n\t${error.message}`)
		const startAt = reader.getIndex()

		const keyword = "type" as const
		if (!reader.expectString(keyword)) return null

		if (!reader.expectWhitespace()) return error(reader.syntaxError(`Expected whitespace after "${keyword}"`))

		const name = reader.expectWord()
		if (!name) return null

		if (!reader.expectWhitespace()) return error(reader.syntaxError(`Expected whitespace after name`))

		const equals = reader.expectString("=")
		if (!equals) return error(reader.syntaxError(`Expected equals sign`))

		if (!reader.expectWhitespace()) return error(reader.syntaxError(`Expected whitespace after equals sign`))

		const type = Type.expect(reader)
		if (!type) return error(reader.syntaxError(`Expected value`))
		if (type instanceof ScriptReader.SyntaxError) return error(type)

		return {
			tokenType: "typeDefinition",
			name,
			type,
			location: {
				startAt,
				endAt: reader.getIndex(),
			},
		} satisfies Token
	}
}
