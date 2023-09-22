import type { Token } from "."
import { ScriptReader } from "./reader"
import { SymbolToken } from "./symbolToken"
import { ValueToken } from "./valueToken"

export type ValueOperationToken = Token<
	"valueOperation",
	{
		operator: SymbolToken<ValueOperationToken.Operator>
		right: ValueToken
	}
>
export namespace ValueOperationToken {
	const operators = ["+", "-", "*", "/", "==", "!=", "<", ">", "<=", ">=", "&&", "||"] as const
	export type Operator = (typeof operators)[number]

	export function is(value: Token): value is ValueOperationToken {
		return value.tokenType === "valueOperation"
	}
	export function expect(reader: ScriptReader): ValueOperationToken | ScriptReader.SyntaxError | null {
		const error = (error: ScriptReader.SyntaxError) => reader.syntaxError(`While expecting value operator:\n\t${error.message}`)
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
				tokenType: "valueOperation",
				operator,
				right,
				location: {
					startAt,
					endAt: reader.getIndex(),
				},
			} satisfies ValueOperationToken
		}

		return null
	}
}
