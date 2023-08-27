import type { TokenLocation } from "."
import { ScriptReader } from "./reader"
import { Symbol } from "./symbolToken"
import { Value } from "./valueToken"

export namespace TypeOperation {
	export type Token = TokenLocation & {
		tokenType: "typeOperation"
		operator: Symbol.Token<(typeof operators)[number]>
		right: Value.Token
	}

	const operators = ["|", "&"] as const
	export function expect(reader: ScriptReader): Token | ScriptReader.SyntaxError | null {
		const error = (error: ScriptReader.SyntaxError) => reader.syntaxError(`While expecting type operator:\n\t${error.message}`)
		const startAt = reader.getIndex()

		const checkpoint = reader.checkpoint()
		for (const operatorString of operators) {
			checkpoint.restore()
			const operator = Symbol.expect(reader, operatorString)
			if (!operator) continue

			// Not allow ugly code... >:D
			if (!reader.expectWhitespace()) return error(reader.syntaxError(`Expected whitespace after operator: "${operatorString}"`))

			const right = Value.expect(reader)
			if (!right) return error(reader.syntaxError(`Expected right-hand side of operator`))
			if (right instanceof ScriptReader.SyntaxError)
				return error(reader.syntaxError(`While expecting right-hand side of operator:\n\t${right.message}`))

			return {
				tokenType: "typeOperation",
				operator,
				right,
				location: {
					startAt,
					endAt: reader.getIndex(),
				},
			} satisfies Token
		}

		return null
	}
}
