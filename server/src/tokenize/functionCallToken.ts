import type { ScriptReader } from "./reader"
import { Value } from "./valueToken"

export namespace FunctionCall {
	export type Token = {
		tokenType: "functionCall"
		name: string
		args: Value.Token[]
	}

	export function expect(scriptReader: ScriptReader): Token | Error | null {
		const error = (error: Error) => new Error(`While expecting function call: ${error.message}`)

		const name = scriptReader.expectWord()
		if (!name) return null

		scriptReader.skipWhitespace()

		const openParen = scriptReader.expect("(")
		if (!openParen) return null

		scriptReader.skipWhitespace()

		const args: Token["args"] = []
		while (true) {
			const arg = Value.expect(scriptReader)
			if (!arg) return error(new Error(`Expected argument`))
			if (arg instanceof Error) return error(arg)
			args.push(arg)

			scriptReader.skipWhitespace()

			const comma = scriptReader.expect(",")
			if (!comma) break
		}

		scriptReader.skipWhitespace()

		const closeParen = scriptReader.expect(")")
		if (!closeParen) return error(new Error(`Expected closing parenthesis`))

		return {
			tokenType: "functionCall",
			name,
			args,
		} satisfies Token
	}
}
