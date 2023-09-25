import type { Token } from "."
import type { ScriptReader } from "./reader"
import { WordToken } from "./wordToken"

const tokenType = "variableName"
export type VariableNameToken = Token<typeof tokenType, { name: WordToken }>
export const VariableNameToken: Token.Builder<VariableNameToken> = {
	tokenType,
	is(value): value is VariableNameToken {
		return value.tokenType === tokenType
	},
	expect(reader: ScriptReader): VariableNameToken | ScriptReader.SyntaxError | null {
		const startAt = reader.getIndex()

		const name = WordToken.expect(reader)
		if (!name) return null

		return {
			tokenType,
			name,
			location: {
				startAt,
				endAt: reader.getIndex(),
			},
		}
	},
}
