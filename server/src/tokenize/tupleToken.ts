import type { Token } from "."
import { ScriptReader } from "./reader"
import { SymbolToken } from "./symbolToken"

const tokenType = "tuple"
export type TupleToken<TMember extends Token> = Token<
	typeof tokenType,
	{
		members: TMember[]
	}
>
export const TupleToken = <TMember extends Token>(memberBuilder: Token.Builder<TMember>): Token.Builder<TupleToken<TMember>> => ({
	tokenType,
	is(value: Token): value is TupleToken<TMember> {
		if (value.tokenType !== tokenType) return false
		const token = value as TupleToken<Token>
		if (token.members.some((member) => !memberBuilder.is(member))) return false
		return true
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
			tokenType,
			members,
			location: {
				startAt,
				endAt: reader.getIndex(),
			},
		}
	},
})
