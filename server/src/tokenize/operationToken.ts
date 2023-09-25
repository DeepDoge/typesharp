import type { Token } from "."
import { ScriptReader } from "./reader"
import { SymbolToken } from "./symbolToken"

const tokenType = "operation"
export type OperationToken<TOperator extends string, TRight extends Token> = Token<
	typeof tokenType,
	{ operator: SymbolToken<TOperator>; right: TRight }
>
export const OperationToken = <TOperator extends string, TRight extends Token>(
	operators: readonly TOperator[],
	rightBuilder: Token.Builder<TRight>
): Token.Builder<OperationToken<TOperator, TRight>> => ({
	tokenType,
	is(value: Token): value is OperationToken<TOperator, TRight> {
		if (value.tokenType !== tokenType) return false
		const token = value as OperationToken<TOperator, TRight>
		if (!operators.includes(token.operator.symbol)) return false
		if (!rightBuilder.is(token.right)) return false
		return true
	},
	expect(reader) {
		const error = (error: ScriptReader.SyntaxError) => reader.syntaxError(`While expecting operator:\n\t${error.message}`)
		const startAt = reader.getIndex()

		const checkpoint = reader.checkpoint()
		for (const operatorString of operators) {
			checkpoint.restore()
			const operator = SymbolToken(operatorString).expect(reader)
			if (!operator) continue

			if (!reader.expectWhitespace()) return error(reader.syntaxError(`Expected whitespace after operator: "${operator.symbol}"`))

			const right = rightBuilder.expect(reader)
			if (!right) return error(reader.syntaxError(`Expected right-hand side of operator`))
			if (right instanceof ScriptReader.SyntaxError)
				return error(reader.syntaxError(`While expecting right-hand side of operator:\n\t${right.message}`))

			return {
				tokenType,
				operator,
				right,
				location: {
					startAt,
					endAt: reader.getIndex(),
				},
			}
		}
		checkpoint.restore()

		return null
	},
})
