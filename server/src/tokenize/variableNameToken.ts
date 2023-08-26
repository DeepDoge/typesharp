import type { ScriptReader } from "./reader"

export namespace VariableName {
	export type Token = {
		tokenType: "variableName"
		name: string
	}

	export function expect(scriptReader: ScriptReader): Token | null {
		const name = scriptReader.expectWord()
		if (!name) return null

		return {
			tokenType: "variableName",
			name,
		}
	}
}
