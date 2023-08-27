import type { TokenLocation } from "."
import { ScriptReader } from "./reader"
import { Symbol } from "./symbolToken"
import { TypeName } from "./typeNameToken"

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
		export type Token = TokenLocation & {
			tokenType: "literalNumber"
			value: string
			satisfies: {
				colonSymbol: Symbol.Token<":">
				type: TypeName.Token
			} | null
			isFloat: boolean
		}

		export function expect(reader: ScriptReader): Token | ScriptReader.SyntaxError | null {
			const error = (error: ScriptReader.SyntaxError) => reader.syntaxError(`While expecting number literal:\n\t${error.message}`)
			const startAt = reader.getIndex()

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

			let satisfies: Token["satisfies"] = null
			const colon = Symbol.expect(reader, ":")
			if (colon) {
				if (!reader.expectWhitespace()) return error(reader.syntaxError(`Expected whitespace after colon`))
				const typeName = TypeName.expect(reader)
				if (!typeName) return error(reader.syntaxError(`Expected type name after colon`))
				if (typeName instanceof ScriptReader.SyntaxError) return error(typeName)
				satisfies = { colonSymbol: colon, type: typeName }
			}

			return {
				tokenType: "literalNumber",
				value,
				isFloat,
				satisfies,
				location: {
					startAt,
					endAt: reader.getIndex(),
				},
			} satisfies Token
		}
	}
}
