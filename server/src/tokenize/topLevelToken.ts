import { Block } from "./blockToken"
import { ExportToken } from "./exportToken"
import { ScriptReader } from "./reader"
import { ReturnToken } from "./returnToken"
import { TypeDefinitionToken } from "./typeDefinitionToken"
import { TypeToken } from "./typeToken"
import { ValueToken } from "./valueToken"
import { VariableDefinition } from "./variableDefinitionToken"

export type TopLevelToken = Exclude<ReturnType<TopLevelToken.Token["expect"]>, null | ScriptReader.SyntaxError>
export namespace TopLevelToken {
	export const tokens = [Block, ReturnToken, ExportToken, VariableDefinition, TypeDefinitionToken, TypeToken, ValueToken] as const
	export type Token = (typeof tokens)[number]

	export function expect(reader: ScriptReader): TopLevelToken | ScriptReader.SyntaxError | null {
		const checkpoint = reader.checkpoint()
		for (const token of tokens) {
			checkpoint.restore()
			const resultToken = token.expect(reader)
			if (resultToken) {
				if (resultToken instanceof ScriptReader.SyntaxError) return resultToken
				return resultToken
			}
		}
		checkpoint.restore()
		return null
	}
}
