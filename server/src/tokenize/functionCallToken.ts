import { ScriptReader } from "./reader"
import { Value } from "./valueToken"

export namespace FunctionCall {
	export type Token = {
		tokenType: "functionCall"
		name: string
		args: Value.Token[]
	}

	const notError = new ScriptReader.NotError("Not a function call")

	export function expect(scriptReader: ScriptReader): Token | Error {
		const error = (error: Error) => new Error(`While expecting function call: ${error.message}`)

		const name = scriptReader.expectWord()
		if (name instanceof Error) return notError

		scriptReader.skipWhitespace()

		const openParen = scriptReader.expect("(")
		if (openParen instanceof Error) return notError

		scriptReader.skipWhitespace()

		const args: Token["args"] = []
		while (true) {
			const arg = Value.expect(scriptReader)
			if (arg instanceof Error) return error(arg)
			args.push(arg)

			scriptReader.skipWhitespace()

			const comma = scriptReader.expect(",")
			if (comma instanceof Error) break
		}

		scriptReader.skipWhitespace()

		const closeParen = scriptReader.expect(")")
		if (closeParen instanceof Error) return error(new Error(`Expected closing parenthesis`))

		return {
			tokenType: "functionCall",
			name,
			args,
		} satisfies Token
	}
}
