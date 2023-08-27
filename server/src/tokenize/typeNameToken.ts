import type { TokenLocation } from "."
import type { ScriptReader } from "./reader"
import { Word } from "./wordToken"

export namespace TypeName {
	export type Token = TokenLocation & {
		tokenType: "typeName"
		name: Word.Token
	}

	export function expect(reader: ScriptReader): Token | null {
		const startAt = reader.getIndex()

		const name = Word.expect(reader)
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
