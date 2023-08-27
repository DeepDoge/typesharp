import type { Token } from "."
import { ScriptReader } from "./reader"
import { SymbolToken } from "./symbolToken"
import { TypeNameToken } from "./typeNameToken"

export type LiteralToken = LiteralToken.Number
export namespace LiteralToken {
	export function expect(reader: ScriptReader): LiteralToken | ScriptReader.SyntaxError | null {
		const numberLiteral = Number.expect(reader)
		if (numberLiteral) {
			if (numberLiteral instanceof ScriptReader.SyntaxError) return numberLiteral
			return numberLiteral
		}
		return null
	}

	export type Number = Token<
		"literalNumber",
		{
			value: string
			satisfies: TypeNameToken | null
			isFloat: boolean
		}
	>
	export namespace Number {
		export function expect(reader: ScriptReader): Number | ScriptReader.SyntaxError | null {
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

			let satisfies: Number["satisfies"] = null
			const colon = SymbolToken.expect(reader, ":")
			if (colon) {
				if (!reader.expectWhitespace()) return error(reader.syntaxError(`Expected whitespace after colon`))
				const typeToken = TypeNameToken.expect(reader)
				if (!typeToken) return error(reader.syntaxError(`Expected type name after colon`))
				if (typeToken instanceof ScriptReader.SyntaxError) return error(typeToken)
				satisfies = typeToken
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
			} satisfies Number
		}
	}
}
