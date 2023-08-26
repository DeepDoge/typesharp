import { ScriptReader } from "./reader"
import { Value } from "./valueToken"

export namespace Return {
	export type Token = {
		tokenType: "return"
		value: Value.Token | null
	}

	export function expect(reader: ScriptReader): Token | ScriptReader.SyntaxError | null {
		const error = (error: ScriptReader.SyntaxError) => reader.syntaxError(`While expecting return statement:\n\t${error.message}`)

		const keyword = "return" as const
		if (!reader.expectString(keyword)) return null

		const hadWhitespaceBeforeValue = reader.expectWhitespace()

		const value = Value.expect(reader)
		if (value instanceof ScriptReader.SyntaxError) return error(value)
		if (value && !hadWhitespaceBeforeValue) return error(reader.syntaxError(`Expected whitespace between "${keyword}" keyword and value`))

		return {
			tokenType: "return",
			value,
		} satisfies Token
	}
}
