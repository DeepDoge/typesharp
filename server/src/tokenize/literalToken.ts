import { ScriptReader } from "./reader"

export namespace Literal {
	export type Token = Number.Token

	const notError = new ScriptReader.NotError("Not a literal")

	export function expect(scriptReader: ScriptReader): Token | ScriptReader.NotError {
		const numberLiteral = Number.expect(scriptReader)
		if (!(numberLiteral instanceof ScriptReader.NotError)) {
			if (numberLiteral instanceof Error) return numberLiteral
			return numberLiteral
		}

		return notError
	}

	export namespace Number {
		export type Token = {
			tokenType: "literalNumber"
			value: string
			isFloat: boolean
		}

		const notError = new ScriptReader.NotError("Not a number literal")

		export function expect(scriptReader: ScriptReader): Token | Error | ScriptReader.NotError {
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

			if (value === "") return notError

			return {
				tokenType: "literalNumber",
				value,
				isFloat,
			} satisfies Token
		}
	}
}
