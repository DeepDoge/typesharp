import type { Token } from "."
import { ScriptReader } from "./reader"
import { SymbolToken } from "./symbolToken"

type A = `${"a" | "b"}`

const tokenType = "operation"
export type OperationToken<TOperator extends string, TRight extends Token> = Token<
	`${typeof tokenType}(${TOperator}, ${TRight["tokenType"]})`,
	{ operator: SymbolToken<TOperator>; right: TRight }
>
export const OperationToken = <TOperator extends string, TRight extends Token>(
	operatorString: TOperator,
	rightBuilder: Token.Builder<TRight>
): Token.Builder<OperationToken<TOperator, TRight>> => ({
	tokenType() {
		return `${tokenType}(${operatorString}, ${rightBuilder.tokenType()})` as const
	},
	expect(reader) {
		const error = (error: ScriptReader.SyntaxError) => reader.syntaxError(`While expecting operator:\n\t${error.message}`)
		const startAt = reader.getIndex()

		const checkpoint = reader.checkpoint()

		checkpoint.restore()
		const operator = SymbolToken(operatorString).expect(reader)
		if (!operator) return null

		if (!reader.expectWhitespace()) return error(reader.syntaxError(`Expected whitespace after operator: "${operator.symbol}"`))

		const right = rightBuilder.expect(reader)
		if (!right) return error(reader.syntaxError(`Expected right-hand side of operator`))
		if (right instanceof ScriptReader.SyntaxError)
			return error(reader.syntaxError(`While expecting right-hand side of operator:\n\t${right.message}`))

		return {
			tokenType: this.tokenType(),
			operator,
			right,
			location: {
				startAt,
				endAt: reader.getIndex(),
			},
		}
	},
})
