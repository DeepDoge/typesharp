import { ScriptReader } from "./reader"
import { Type } from "./typeToken"

export namespace TypeDefinition {
	export type Token = {
		tokenType: "typeDefinition"
		name: string
		type: Type.Token
	}

	export function expect(reader: ScriptReader): Token | ScriptReader.SyntaxError | null {
		const error = (error: ScriptReader.SyntaxError) => reader.syntaxError(`While expecting variable definition:\n\t${error.message}`)

		const keyword = reader.expectString("type")
		if (!keyword) return null

		if (!reader.expectWhitespace()) return error(reader.syntaxError(`Expected whitespace after "var"`))

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
		} satisfies Token
	}
}
