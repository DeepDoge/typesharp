import type { ScriptReader } from "./reader"

export namespace TypeName {
	export type Token = {
		tokenType: "typeName"
		name: string
	}

	export function expect(reader: ScriptReader): Token | null {
		const name = reader.expectWord()
		if (!name) return null

		return {
			tokenType: "typeName",
			name,
		}
	}
}
