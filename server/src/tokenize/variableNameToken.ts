import type { TokenLocation } from "."
import type { ScriptReader } from "./reader"

export namespace VariableName {
	export type Token = TokenLocation & {
		tokenType: "variableName"
		name: string
	}

	export function expect(reader: ScriptReader): Token | null {
		const startAt = reader.getIndex()

		const name = reader.expectWord()
		if (!name) return null

		return {
			tokenType: "variableName",
			name,
			location: {
				startAt,
				endAt: reader.getIndex(),
			},
		} satisfies Token
	}
}
