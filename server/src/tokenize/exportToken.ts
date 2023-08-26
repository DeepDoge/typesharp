import type { TokenLocation } from "."
import { ScriptReader } from "./reader"
import { TypeDefinition } from "./typeDefinitionToken"
import { VariableDefinition } from "./variableDefinitionToken"

export namespace Export {
	export type Token = TokenLocation & {
		tokenType: "export"
		token: Exclude<ReturnType<(typeof exportableTokens)[number]["expect"]>, null | ScriptReader.SyntaxError>
	}

	const exportableTokens = [VariableDefinition, TypeDefinition] as const

	export function expect(reader: ScriptReader): Token | ScriptReader.SyntaxError | null {
		const error = (error: ScriptReader.SyntaxError) => reader.syntaxError(`While expecting export:\n\t${error.message}`)
		const startAt = reader.getIndex()

		const keyword = "export" as const
		if (!reader.expectString(keyword)) return null

		if (!reader.expectWhitespace()) return error(reader.syntaxError(`Expected whitespace after "${keyword}"`))

		const checkpoint = reader.checkpoint()
		let token: Token["token"] | null = null
		for (const exportableToken of exportableTokens) {
			checkpoint.restore()
			const value = exportableToken.expect(reader)
			if (!value) continue
			if (value instanceof ScriptReader.SyntaxError) return error(value)

			token = value
			break
		}
		if (token === null) return error(reader.syntaxError(`Expected exportable token`))
		return {
			tokenType: "export",
			token,
			location: {
				startAt,
				endAt: reader.getIndex(),
			},
		} satisfies Token
	}
}
