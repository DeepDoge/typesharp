import type { Token } from "."
import type { ScriptReader } from "./reader"

export type WordToken = Token<
	"word",
	{
		word: string
	}
>
export namespace WordToken {
	export function expect(reader: ScriptReader): WordToken | null {
		const startAt = reader.getIndex()

		const char = reader.peek()
		if (!char) return null
		if (!/^[a-zA-Z_$]$/.test(char)) return null
		let word = ""
		while (true) {
			const char = reader.peek()
			if (!char) break
			if (!/^[a-zA-Z0-9_$]$/.test(char)) break
			word += reader.next()
		}

		return {
			tokenType: "word",
			word,
			location: {
				startAt,
				endAt: reader.getIndex(),
			},
		} satisfies WordToken
	}
}
