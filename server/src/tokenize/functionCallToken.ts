import type { Token } from "."
import { ScriptReader } from "./reader"
import { SymbolToken } from "./symbolToken"
import { ValueToken } from "./valueToken"
import { WordToken } from "./wordToken"

const tokenType = "functionCall"
export type FunctionCallToken = Token<
	typeof tokenType,
	{
		name: WordToken
		args: ValueToken[]
	}
>
export const FunctionCallToken: Token.Builder<FunctionCallToken> = {
	tokenType,
	is(value): value is FunctionCallToken {
		return value.tokenType === tokenType
	},
	expect(reader: ScriptReader): FunctionCallToken | ScriptReader.SyntaxError | null {
		const error = (error: ScriptReader.SyntaxError) => reader.syntaxError(`While expecting function call:\n\t${error.message}`)
		const startAt = reader.getIndex()

		const name = WordToken.expect(reader)
		if (!name) return null

		const open = SymbolToken("(").expect(reader)
		if (!open) return null

		const args: FunctionCallToken["args"] = []
		while (true) {
			reader.skipWhitespace()
			const arg = ValueToken.expect(reader)
			if (!arg) break
			if (arg instanceof ScriptReader.SyntaxError) return error(arg)
			args.push(arg)

			reader.skipWhitespace()
			if (!SymbolToken(",").expect(reader)) break
		}

		const close = SymbolToken(")").expect(reader)
		if (!close) return error(reader.syntaxError(`Expected closing parantheses`))

		return {
			tokenType,
			name,
			args,
			location: {
				startAt,
				endAt: reader.getIndex(),
			},
		}
	},
}
