import { ScriptReader } from "./reader"
import { Value } from "./valueToken"

export namespace VariableDefinition {
	export type Token = {
		tokenType: "variableDefinition"
		name: string
		type: string | null
		value: Value.Token
	}

	const notError = new ScriptReader.NotError("Not a variable definition")

	export function expect(scriptReader: ScriptReader): Token | Error | ScriptReader.NotError {
		const error = (error: Error) => new Error(`While expecting variable definition: ${error.message}`)

		const keyword = scriptReader.expect("var")
		if (keyword instanceof Error) return notError

		scriptReader.expectWhitespace()

		const name = scriptReader.expectWord()
		if (name instanceof Error) return notError

		const beforeColorCheckpoint = scriptReader.checkpoint()
		let type: Token["type"] = null
		const colon = scriptReader.expect(":")
		if (!(colon instanceof Error)) {
			scriptReader.skipWhitespace()
			const typeName = scriptReader.expectWord()
			if (typeName instanceof Error) return error(new Error(`Expected type name after colon`))
			type = typeName
		} else beforeColorCheckpoint.restore()

		scriptReader.skipWhitespace()

		const equals = scriptReader.expect("=")
		if (equals instanceof Error) return error(equals)

		scriptReader.skipWhitespace()

		const value = Value.expect(scriptReader)
		if (value instanceof Error) return error(value)

		return {
			tokenType: "variableDefinition",
			name,
			type,
			value,
		} satisfies Token
	}
}
