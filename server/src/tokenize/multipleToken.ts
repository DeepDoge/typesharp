import type { Token } from "."
import { ScriptReader } from "./reader"

const tokenType = "multiple"
export type MultipleToken<TMember extends Token> = Token<typeof tokenType, { members: TMember[] }>
export const MultipleToken = <TMember extends Token>(memberBuilder: Token.Builder<TMember>): Token.Builder<MultipleToken<TMember>> => ({
	tokenType,
	is(value): value is MultipleToken<TMember> {
		if (value.tokenType !== tokenType) return false
		const token = value as MultipleToken<Token>
		if (token.members.some((member) => !memberBuilder.is(member))) return false
		return true
	},
	expect(reader: ScriptReader) {
		const error = (error: ScriptReader.SyntaxError) => reader.syntaxError(`While expecting multiple tokens:\n\t${error.message}`)
		const startAt = reader.getIndex()

		const members: TMember[] = []
		while (true) {
			reader.skipWhitespace()
			const token = memberBuilder.expect(reader)
			if (token instanceof ScriptReader.SyntaxError) return error(token)
			if (!token) break
			members.push(token)

			if (!reader.expectEndOfLine()) return error(reader.syntaxError(`Expected end of line after token`))
		}

		return {
			tokenType,
			members,
			location: {
				startAt,
				endAt: reader.getIndex(),
			},
		}
	},
})
