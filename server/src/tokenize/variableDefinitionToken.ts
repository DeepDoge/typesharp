import { ScriptReader } from "./reader"
import { Value } from "./valueToken"

export namespace VariableDefinition {
	export type Token = {
		tokenType: "variableDefinition"
		name: string
		type: string | null
		value: Value.Token
	}

	export function expect(reader: ScriptReader): Token | ScriptReader.SyntaxError | null {
		const error = (error: ScriptReader.SyntaxError) => reader.syntaxError(`While expecting variable definition:\n\t${error.message}`)

		const keyword = reader.expect("var")
		if (!keyword) return null

		if (!reader.expectWhitespace()) return error(reader.syntaxError(`Expected whitespace after "var"`))

		const name = reader.expectWord()
		if (!name) return null

		const beforeColorCheckpoint = reader.checkpoint()
		let type: Token["type"] = null
		const colon = reader.expect(":")
		if (colon) {
			reader.skipWhitespace()
			const typeName = reader.expectWord()
			if (!typeName) return error(reader.syntaxError(`Expected type name after colon`))
			type = typeName
		} else beforeColorCheckpoint.restore()

		reader.skipWhitespace()

		const equals = reader.expect("=")
		if (!equals) return error(reader.syntaxError(`Expected equals sign`))

		reader.skipWhitespace()

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
