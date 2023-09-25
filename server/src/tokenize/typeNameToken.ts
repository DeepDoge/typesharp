import type { Token } from "."
import type { ScriptReader } from "./reader"
import { WordToken } from "./wordToken"

const tokenType = "typeName"
export type TypeNameToken = Token<typeof tokenType, { name: WordToken }>
export const TypeNameToken: Token.Builder<TypeNameToken> = {
	tokenType,
	is(value: Token): value is TypeNameToken {
		return value.tokenType === tokenType
	},
	expect(reader: ScriptReader): TypeNameToken | ScriptReader.SyntaxError | null {
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
