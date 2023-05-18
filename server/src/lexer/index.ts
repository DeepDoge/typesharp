import type { BrandType } from "../utils/brand-type"
import type { Token } from "./tokens"

export type ValueType = {
	id: bigint
	name: ValueTypeName
}
export type ValueTypeName = BrandType<string, "ValueTypeName">
export namespace ValueTypeName {
	export function from(name: string): ValueTypeName {
		return name as ValueTypeName
	}
}

export type ValueDefinition = {
	type: ValueType
	name: string
}

export type Script = {
	definitions: Map<ValueTypeName, ValueDefinition>
	tokens: Token[]
}

export function createScript(script: string) {
	let index = 0
	const self: Script = {
		definitions: new Map(),
		tokens: [],
	}

	function nextWord() {
		const wordAccepts = new Set("qwertyuiopasdfghjklzxcvbnm1234567890QWERTYUIOPASDFGHJKLZXCVBNM.")
		let word: string | null = null
		for (; index < script.length; index++) {
			const char = script[index]

			if (!wordAccepts.has(char)) {
				if (word) break
				continue
			}

			word ??= ""
			word += char
		}

		return word
	}

	{
		let word: string | null
		while ((word = nextWord())) {
			switch (word) {
				case "var": {
					const name = nextWord()
				}
			}
		}
	}
}
