import type { Token } from "."
import { ScriptReader } from "./reader"
import { SymbolToken } from "./symbolToken"
import { ValueToken } from "./valueToken"

export type TypeOperationToken = Token<"typeOperation", { operator: SymbolToken<TypeOperationToken.Operator>; right: ValueToken }>

export namespace TypeOperationToken {
	export const operators = ["|", "&"] as const
	export type Operator = (typeof operators)[number]

	export function expect(reader: ScriptReader): TypeOperationToken | ScriptReader.SyntaxError | null {
		const error = (error: ScriptReader.SyntaxError) => reader.syntaxError(`While expecting type operator:\n\t${error.message}`)
		const startAt = reader.getIndex()

		const checkpoint = reader.checkpoint()
		for (const operatorString of operators) {
			checkpoint.restore()
			const operator = SymbolToken.expect(reader, operatorString)
			if (!operator) continue

			const afterOperatorCheckpoint = reader.checkpoint()
			if (!reader.expectWhitespace()) return error(reader.syntaxError(`Expected whitespace after operator: "${operator.symbol}"`))

			const right = ValueToken.expect(reader)
			if (!right) {
				afterOperatorCheckpoint.restore()
				return error(reader.syntaxError(`Expected right-hand side of operator`))
			}
			if (right instanceof ScriptReader.SyntaxError) {
				return error(reader.syntaxError(`While expecting right-hand side of operator:\n\t${right.message}`))
			}

			return {
				tokenType: "typeOperation",
				operator,
				right,
				location: {
					startAt,
					endAt: reader.getIndex(),
				},
			} satisfies TypeOperationToken
		}

		return null
	}
}
