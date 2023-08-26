import { ScriptReader } from "./reader"

export namespace Literal {
	export type Token = Number.Token

	export function expect(reader: ScriptReader): Token | ScriptReader.SyntaxError | null {
		const numberLiteral = Number.expect(reader)
		if (numberLiteral) {
			if (numberLiteral instanceof ScriptReader.SyntaxError) return numberLiteral
			return numberLiteral
		}
		return null
	}

	export namespace Number {
		export type Token = {
			tokenType: "literalNumber"
			value: string
			isFloat: boolean
		}

		export function expect(reader: ScriptReader): Token | ScriptReader.SyntaxError | null {
			const error = (error: ScriptReader.SyntaxError) => reader.syntaxError(`While expecting number literal:\n\t${error.message}`)

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

			if (value === "") return null

			return {
				tokenType: "literalNumber",
				value,
				isFloat,
			} satisfies Token
		}
	}
}
