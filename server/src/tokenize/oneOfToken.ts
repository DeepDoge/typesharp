import type { Token } from "."
import { ScriptReader } from "./reader"

const tokenType = "oneOf"
export const OneOfToken = <TBuilder extends Token.Builder<Token>>(tokenBuilders: () => readonly TBuilder[]): Token.Builder<Token.Of<TBuilder>> => ({
	tokenType,
	is(value): value is Token.Of<TBuilder> {
		return tokenBuilders().some((builder) => builder.is(value))
	},
	expect(reader) {
		const error = (error: ScriptReader.SyntaxError) =>
			reader.syntaxError(
				`While expecting one of ${tokenBuilders()
					.map((builder) => `"${builder.tokenType}"`)
					.join(", ")}:\n\t${error.message}`
			)

		const checkpoint = reader.checkpoint()
		for (const tokenBuilder of tokenBuilders()) {
			checkpoint.restore()
			const token = tokenBuilder.expect(reader)
			if (!token) continue
			if (token instanceof ScriptReader.SyntaxError) return error(token)
			return token as Token.Of<TBuilder>
		}

		return null
	},
})
