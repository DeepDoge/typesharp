import { ScriptReader } from "./reader"

export namespace VariableName {
	export type Token = {
		tokenType: "variableName"
		name: string
	}

	const notError = new ScriptReader.NotError("Not a variable name")

	export function expect(scriptReader: ScriptReader): Token | ScriptReader.NotError {
		const name = scriptReader.expectWord()
		if (name instanceof Error) return notError

		return {
			tokenType: "variableName",
			name,
		}
	}
}
