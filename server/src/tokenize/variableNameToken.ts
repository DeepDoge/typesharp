import type { Token } from "."
import type { ScriptReader } from "./reader"
import { WordToken } from "./wordToken"

export type VariableNameToken = Token<"variableName", { name: WordToken }>
export namespace VariableNameToken {
	export function is(value: Token): value is VariableNameToken {
		return value.tokenType === "variableName"
	}
	export function expect(reader: ScriptReader): VariableNameToken | ScriptReader.SyntaxError | null {
		const startAt = reader.getIndex()

		const name = WordToken.expect(reader)
		if (!name) return null

		return {
			tokenType: "variableName",
			name,
			location: {
				startAt,
				endAt: reader.getIndex(),
			},
		} satisfies VariableNameToken
	}
}
