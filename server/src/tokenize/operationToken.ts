import type { ScriptReader } from "./reader"
import { Value } from "./valueToken"

export namespace Operation {
	export type Token = {
		tokenType: "operator"
		operator: (typeof operators)[number]
		right: Value.Token
	}

	const operators = ["+", "-", "*", "/", "==", "!=", "<", ">", "<=", ">=", "&&", "||"] as const
	export function expect(scriptReader: ScriptReader): Token | Error | null {
		const error = (error: Error) => new Error(`While expecting operator: ${error.message}`)

		for (const operator of operators) {
			if (!scriptReader.expect(operator)) continue

			// Not allow ugly code... >:D
			if (!scriptReader.expectWhitespace()) return error(new Error(`Expected whitespace after operator`))

			const right = Value.expect(scriptReader)
			if (!right) return error(new Error(`Expected right-hand side of operator`))
			if (right instanceof Error) return error(new Error(`While expecting right-hand side of operator: ${right.message}`))

			return {
				tokenType: "operator",
				operator,
				right,
			} satisfies Token
		}

		return null
	}
}
