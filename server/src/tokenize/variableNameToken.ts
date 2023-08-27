import type { TokenLocation } from "."
import type { ScriptReader } from "./reader"
import { Word } from "./wordToken"

export namespace VariableName {
	export type Token = TokenLocation & {
		tokenType: "variableName"
		name: Word.Token
	}

	export function expect(reader: ScriptReader): Token | ScriptReader.SyntaxError | null {
		const startAt = reader.getIndex()

		const name = Word.expect(reader)
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
