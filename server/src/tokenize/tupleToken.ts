import type { Token } from "."
import { ScriptReader } from "./reader"
import { SymbolToken } from "./symbolToken"

const tokenType = "tuple"
export type TupleToken<TMember extends Token> = Token<
	`${typeof tokenType}(${TMember["tokenType"]})`,
	{
		members: TMember[]
	}
>
export const TupleToken = <TMember extends Token>(memberBuilder: Token.Builder<TMember>): Token.Builder<TupleToken<TMember>> => ({
	tokenType() {
		return `${tokenType}(${memberBuilder.tokenType()})` as const
	},
	expect(reader: ScriptReader): TupleToken<TMember> | ScriptReader.SyntaxError | null {
		const error = (error: ScriptReader.SyntaxError) => reader.syntaxError(`While expecting tuple:\n\t${error.message}`)
		const startAt = reader.getIndex()

		const openParenthesis = SymbolToken("(").expect(reader)
		if (!openParenthesis) return null
		reader.skipWhitespace()

		const members: TMember[] = []
		while (true) {
			const member = memberBuilder.expect(reader)
			if (!member) break
			if (member instanceof ScriptReader.SyntaxError) return error(member)
			members.push(member)

			if (!SymbolToken(",").expect(reader)) break
			if (!reader.expectWhitespace()) return error(reader.syntaxError(`Expected whitespace after comma`))
		}

		reader.skipWhitespace()
		const closeParenthesis = SymbolToken(")").expect(reader)
		if (!closeParenthesis) return error(reader.syntaxError(`Expected ")"`))

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
