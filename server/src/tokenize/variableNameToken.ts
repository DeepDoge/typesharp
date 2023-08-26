import type { ScriptReader } from "./reader"

export namespace VariableName {
	export type Token = {
		tokenType: "variableName"
		name: string
	}

	export function expect(reader: ScriptReader): Token | null {
		const name = reader.expectWord()
		if (!name) return null

		return {
			tokenType: "variableName",
			name,
		}
	}
}
