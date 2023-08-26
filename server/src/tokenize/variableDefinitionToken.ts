import type { ScriptReader } from "./reader"
import { Value } from "./valueToken"

export namespace VariableDefinition {
	export type Token = {
		tokenType: "variableDefinition"
		name: string
		type: string | null
		value: Value.Token
	}

	export function expect(scriptReader: ScriptReader): Token | Error | null {
		const error = (error: Error) => new Error(`While expecting variable definition: ${error.message}`)

		const keyword = scriptReader.expect("var")
		if (!keyword) return null

		scriptReader.expectWhitespace()

		const name = scriptReader.expectWord()
		if (!name) return null

		const beforeColorCheckpoint = scriptReader.checkpoint()
		let type: Token["type"] = null
		const colon = scriptReader.expect(":")
		if (colon) {
			scriptReader.skipWhitespace()
			const typeName = scriptReader.expectWord()
			if (!typeName) return error(new Error(`Expected type name after colon`))
			type = typeName
		} else beforeColorCheckpoint.restore()

		scriptReader.skipWhitespace()

		const equals = scriptReader.expect("=")
		if (!equals) return error(new Error(`Expected equals sign`))

		scriptReader.skipWhitespace()

		const value = Value.expect(scriptReader)
		if (!value) return error(new Error(`Expected value`))
		if (value instanceof Error) return error(value)

		return {
			tokenType: "variableDefinition",
			name,
			type,
			value,
		} satisfies Token
	}
}
