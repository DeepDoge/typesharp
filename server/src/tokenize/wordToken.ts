import type { Token } from "."

const tokenType = "word"
export type WordToken = Token<
	"word",
	{
		word: string
	}
>
export const WordToken: Token.BuilderNoError<WordToken> = {
	tokenType() {
		return tokenType
	},
	expect(reader) {
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
			tokenType: this.tokenType(),
			word,
			location: {
				startAt,
				endAt: reader.getIndex(),
			},
		}
	},
}
