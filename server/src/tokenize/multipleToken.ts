import type { Token } from "."
import { ScriptReader } from "./reader"

const tokenType = "multiple"
export type MultipleToken<TMember extends Token> = Token<`${typeof tokenType}(${TMember["tokenType"]})`, { members: TMember[] }>
export const MultipleToken = <TMember extends Token>(memberBuilder: Token.Builder<TMember>): Token.BuilderNoNull<MultipleToken<TMember>> => ({
	tokenType() {
		return `${tokenType}(${memberBuilder.tokenType()})` as const
	},
	expect(reader: ScriptReader) {
		const error = (error: ScriptReader.SyntaxError) =>
			reader.syntaxError(`While expecting multiple tokens of type "${memberBuilder.tokenType()}":\n\t${error.message}`)
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
			tokenType: this.tokenType(),
			members,
			location: {
				startAt,
				endAt: reader.getIndex(),
			},
		}
	},
})
