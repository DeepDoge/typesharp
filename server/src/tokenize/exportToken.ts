import type { Token } from "."
import { KeywordToken } from "./keywordToken"
import { ScriptReader } from "./reader"
import { TypeDefinitionToken } from "./typeDefinitionToken"
import { VariableDefinition } from "./variableDefinitionToken"

export type ExportToken = Token<
	"export",
	{
		keyword: KeywordToken<"export">
		token: Exclude<ReturnType<ExportToken.ExportableToken["expect"]>, null | ScriptReader.SyntaxError>
	}
>
export namespace ExportToken {
	export const exportableTokens = [VariableDefinition, TypeDefinitionToken] as const
	export type ExportableToken = (typeof exportableTokens)[number]

	export function expect(reader: ScriptReader): ExportToken | ScriptReader.SyntaxError | null {
		const error = (error: ScriptReader.SyntaxError) => reader.syntaxError(`While expecting export:\n\t${error.message}`)
		const startAt = reader.getIndex()

		const keyword = KeywordToken.expect(reader, "export")
		if (!keyword) return null

		if (!reader.expectWhitespace()) return error(reader.syntaxError(`Expected whitespace after "${keyword}"`))

		const checkpoint = reader.checkpoint()
		let token: ExportToken["token"] | null = null
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
			keyword,
			token,
			location: {
				startAt,
				endAt: reader.getIndex(),
			},
		} satisfies ExportToken
	}
}
