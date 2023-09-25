import type { Token } from "."
import type { ScriptReader } from "./reader"
import { WordToken } from "./wordToken"

const tokenType = "variableName"
export type VariableNameToken = Token<typeof tokenType, { name: WordToken }>
export const VariableNameToken: Token.Builder<VariableNameToken> = {
	tokenType() {
		return tokenType
	},
	expect(reader: ScriptReader): VariableNameToken | ScriptReader.SyntaxError | null {
		const startAt = reader.getIndex()

		const name = WordToken.expect(reader)
		if (!name) return null

		return {
			tokenType: this.tokenType(),
			name,
			location: {
				startAt,
				endAt: reader.getIndex(),
			},
		}
	},
}
