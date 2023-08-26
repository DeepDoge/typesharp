import type { ScriptReader } from "./reader"

export namespace Literal {
	export type Token = Number.Token

	export function expect(scriptReader: ScriptReader): Token | Error | null {
		const numberLiteral = Number.expect(scriptReader)
		if (numberLiteral) {
			if (numberLiteral instanceof Error) return numberLiteral
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

		export function expect(scriptReader: ScriptReader): Token | Error | null {
			const error = (error: Error) => new Error(`While expecting number literal: ${error.message}`)

			let value = ""
			let isFloat = false
			while (true) {
				const char = scriptReader.peek()
				if (char === null) break
				if (char === ".") {
					if (isFloat) return error(new Error(`Unexpected second decimal point`))
					isFloat = true
					value += scriptReader.next()
					continue
				}
				if (!/^[0-9]$/.test(char)) break
				value += scriptReader.next()
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
