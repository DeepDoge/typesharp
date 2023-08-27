import type { TokenLocation } from "."
import { ScriptReader } from "./reader"
import { Symbol } from "./symbolToken"
import { Value } from "./valueToken"
import { Word } from "./wordToken"

export namespace FunctionCall {
	export type Token = TokenLocation & {
		tokenType: "functionCall"
		name: Word.Token
		args: Value.Token[]
	}

	export function expect(reader: ScriptReader): Token | ScriptReader.SyntaxError | null {
		const error = (error: ScriptReader.SyntaxError) => reader.syntaxError(`While expecting function call:\n\t${error.message}`)
		const startAt = reader.getIndex()

		const name = Word.expect(reader)
		if (!name) return null

		const open = Symbol.expect(reader, "(")
		if (!open) return null

		const args: Token["args"] = []
		while (true) {
			reader.skipWhitespace()
			const arg = Value.expect(reader)
			if (!arg) break
			if (arg instanceof ScriptReader.SyntaxError) return error(arg)
			args.push(arg)

			reader.skipWhitespace()
			if (!Symbol.expect(reader, ",")) break
		}

		const close = Symbol.expect(reader, ")")
		if (!close) return error(reader.syntaxError(`Expected closing parantheses`))

		return {
			tokenType: "functionCall",
			name,
			args,
			location: {
				startAt,
				endAt: reader.getIndex(),
			},
		} satisfies Token
	}
}
