import type { Token } from "."
import { ScriptReader } from "./reader"

function callOrReturn<T extends object>(value: (() => T) | T): T {
	if (typeof value === "function") return value()
	return value
}

export const OneOfToken = <TBuilder extends Token.Builder<Token>>(tokenBuilders: readonly TBuilder[] | (() => readonly TBuilder[])) => {
	type T = Token.Of<TBuilder>
	const self: Token.Builder<T> = {
		tokenType() {
			return `${callOrReturn(tokenBuilders)
				.map((builder) => builder.tokenType())
				.join(" | ")}`
		},
		expect(reader) {
			const checkpoint = reader.checkpoint()
			for (const tokenBuilder of callOrReturn(tokenBuilders)) {
				checkpoint.restore()
				const token = tokenBuilder.expect(reader)
				if (!token) continue
				if (token instanceof ScriptReader.SyntaxError) return token
				return token as T
			}

			return null
		},
	}

	return self
}
