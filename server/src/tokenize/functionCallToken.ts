import { ScriptReader } from "./reader"
import { Value } from "./valueToken"

export namespace FunctionCall {
	export type Token = {
		tokenType: "functionCall"
		name: string
		args: Value.Token[]
	}

	export function expect(reader: ScriptReader): Token | ScriptReader.SyntaxError | null {
		const error = (error: ScriptReader.SyntaxError) => reader.syntaxError(`While expecting function call:\n\t${error.message}`)

		const name = reader.expectWord()
		if (!name) return null

		if (!reader.expect("(")) return null

		const args: Token["args"] = []
		while (true) {
			reader.skipWhitespace()
			const arg = Value.expect(reader)
			if (!arg) break
			if (arg instanceof ScriptReader.SyntaxError) return error(arg)
			args.push(arg)

			reader.skipWhitespace()
			if (!reader.expect(",")) break
		}

		if (!reader.expect(")")) return error(reader.syntaxError(`Expected ")"`))

		return {
			tokenType: "functionCall",
			name,
			args,
		} satisfies Token
	}
}
