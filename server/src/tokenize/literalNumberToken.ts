import type { Token } from "."
import type { ScriptReader } from "./reader"

const tokenType = "literalNumber"
export type LiteralNumberToken = Token<typeof tokenType, { value: string; isFloat: boolean }>
export const LiteralNumberToken: Token.Builder<LiteralNumberToken> = {
	tokenType,
	is(value): value is LiteralNumberToken {
		return value.tokenType === tokenType
	},
	expect(reader) {
		const error = (error: ScriptReader.SyntaxError) => reader.syntaxError(`While expecting number literal:\n\t${error.message}`)
		const startAt = reader.getIndex()
		const checkpoint = reader.checkpoint()

		let value = ""
		let isFloat = false
		let char: string | null = null
		while ((char = reader.peek())) {
			if (char === ".") {
				if (isFloat) return error(reader.syntaxError(`Unexpected second decimal point`))
				isFloat = true
				value += reader.next()
				continue
			}
			if (!/^[0-9]$/.test(char)) break
			value += reader.next()
		}

		if (value === "") return checkpoint.restore(), null

		return {
			tokenType,
			value,
			isFloat,
			location: {
				startAt,
				endAt: reader.getIndex(),
			},
		}
	},
}
