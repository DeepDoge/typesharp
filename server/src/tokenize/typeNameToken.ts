import type { TokenLocation } from "."
import type { ScriptReader } from "./reader"

export namespace TypeName {
	export type Token = TokenLocation & {
		tokenType: "typeName"
		name: string
	}

	export function expect(reader: ScriptReader): Token | null {
		const startAt = reader.getIndex()

		const name = reader.expectWord()
		if (!name) return null

		return {
			tokenType: "typeName",
			name,
			location: {
				startAt,
				endAt: reader.getIndex(),
			},
		} satisfies Token
	}
}
