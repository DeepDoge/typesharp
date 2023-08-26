import { ScriptReader } from "./reader"
import { Type } from "./typeToken"
import { Value } from "./valueToken"

export namespace VariableDefinition {
	export type Token = {
		tokenType: "variableDefinition"
		name: string
		type: Type.Token | null
		value: Value.Token
	}

	export function expect(reader: ScriptReader): Token | ScriptReader.SyntaxError | null {
		const error = (error: ScriptReader.SyntaxError) => reader.syntaxError(`While expecting variable definition:\n\t${error.message}`)

		const keyword = "var" as const
		if (!reader.expectString(keyword)) return null

		if (!reader.expectWhitespace()) return error(reader.syntaxError(`Expected whitespace after "${keyword}"`))

		const name = reader.expectWord()
		if (!name) return null

		const beforeColorCheckpoint = reader.checkpoint()
		let type: Token["type"] = null
		const colon = reader.expectString(":")
		if (colon) {
			if (!reader.expectWhitespace()) return error(reader.syntaxError(`Expected whitespace after colon`))
			const typeToken = Type.expect(reader)
			if (!typeToken) return error(reader.syntaxError(`Expected type name after colon`))
			if (typeToken instanceof ScriptReader.SyntaxError) return error(typeToken)
			type = typeToken
		} else {
			beforeColorCheckpoint.restore()
			if (!reader.expectWhitespace()) return error(reader.syntaxError(`Expected whitespace after name`))
		}

		const equals = reader.expectString("=")
		if (!equals) return error(reader.syntaxError(`Expected equals sign`))

		if (!reader.expectWhitespace()) return error(reader.syntaxError(`Expected whitespace between equals sign and value`))

		const value = Value.expect(reader)
		if (!value) return error(reader.syntaxError(`Expected value`))
		if (value instanceof ScriptReader.SyntaxError) return error(value)

		return {
			tokenType: "variableDefinition",
			name,
			type,
			value,
		} satisfies Token
	}
}
