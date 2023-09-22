import type { Token } from "."
import type { ScriptReader } from "./reader"
import { WordToken } from "./wordToken"

export type TypeNameToken = Token<"typeName", { name: WordToken }>
export namespace TypeNameToken {
	export function is(value: Token): value is TypeNameToken {
		return value.tokenType === "typeName"
	}
	export function expect(reader: ScriptReader): TypeNameToken | null {
		const startAt = reader.getIndex()

		const name = WordToken.expect(reader)
		if (!name) return null

		return {
			tokenType: "typeName",
			name,
			location: {
				startAt,
				endAt: reader.getIndex(),
			},
		} satisfies TypeNameToken
	}
}
