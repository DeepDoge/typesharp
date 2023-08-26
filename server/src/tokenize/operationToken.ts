import { ScriptReader } from "./reader"
import { Value } from "./valueToken"

export namespace Operation {
	export type Token = {
		tokenType: "operator"
		operator: (typeof operators)[number]
		right: Value.Token
	}

	const notError = new ScriptReader.NotError("Not an operator")

	const operators = ["+", "-", "*", "/", "==", "!=", "<", ">", "<=", ">=", "&&", "||"] as const
	export function expect(scriptReader: ScriptReader): Token | Error | ScriptReader.NotError {
		for (const operator of operators) {
			const operatorToken = scriptReader.expect(operator)
			if (operatorToken instanceof Error) continue

			scriptReader.skipWhitespace()

			const right = Value.expect(scriptReader)
			if (right instanceof Error) return new Error(`While expecting right-hand side of operator: ${right.message}`)

			return {
				tokenType: "operator",
				operator,
				right,
			} satisfies Token
		}

		return notError
	}
}
