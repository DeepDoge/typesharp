import type { Token } from "."
import { MultipleToken } from "./multipleToken"
import { ScriptReader } from "./reader"
import { SymbolToken } from "./symbolToken"

const tokenType = "block"
export type BlockToken<TMember extends Token> = Token<`${typeof tokenType}(${TMember["tokenType"]})`, { members: TMember[] }>
export const BlockToken = <TMember extends Token>(memberBuilder: Token.Builder<TMember>): Token.Builder<BlockToken<TMember>> => ({
	tokenType() {
		return `${tokenType}(${memberBuilder.tokenType()})` as const
	},
	expect(reader: ScriptReader) {
		const error = (error: ScriptReader.SyntaxError) => reader.syntaxError(`While expecting block:\n\t${error.message}`)
		const startAt = reader.getIndex()
		if (!SymbolToken("{").expect(reader)) return null

		reader.skipWhitespace()

		const multiple = MultipleToken(memberBuilder).expect(reader)
		if (multiple instanceof ScriptReader.SyntaxError) return error(multiple)

		reader.skipWhitespace()

		if (!SymbolToken("}").expect(reader)) return error(reader.syntaxError(`Expected "}"`))

		return {
			tokenType: this.tokenType(),
			members: multiple?.members ?? [],
			location: {
				startAt,
				endAt: reader.getIndex(),
			},
		}
	},
})
