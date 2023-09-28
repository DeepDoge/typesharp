import { ScriptReader } from "./reader"

export const SyntaxError = ScriptReader.SyntaxError
export type SyntaxError = ScriptReader.SyntaxError

export type Token<T extends string = string, TMeta extends object = {}> = {
	type: T | `${T}(${string})`
	location: Token.Location
	meta: TMeta
} & {}
export namespace Token {
	export function tokenizeScript(script: string) {
		const reader = ScriptReader.create(script)
		const root = Tokens.Root.expect(reader)
		if (!root) return null
		if (root instanceof SyntaxError) return root
		Tokens.Whitespace("full").expect(reader)
		if (reader.peek() !== null) return reader.syntaxError(`Expected end of script, got "${reader.peek()}"`)
		return root
	}

	export type Location = {
		startAt: number
		endAt: number
	}

	export type Of<T extends Expector | Expector.Factory> = T extends Expector.Factory<infer U> ? U : T extends Expector<infer U> ? U : never

	const tokenWeakMap = new WeakMap<Token, unknown>()

	export const is = ((factory: Expector.Factory) => (value: Token) => {
		return factory ? tokenWeakMap.get(value as Token) === factory : tokenWeakMap.has(value as Token)
	}) as unknown as {
		<T extends Token, U extends Token>(factory: Expector.Factory<T>, value: U): value is U extends T
			? U & { type: T["type"] }
			: T extends U
			? T
			: never
		(value: unknown): value is Token
	}

	export type Expector<T extends Token = Token> = {
		type: T["type"]
		expect(reader: ScriptReader): T | SyntaxError | null
	}
	export namespace Expector {
		export type Factory<T extends Token = Token> = (...args: any[]) => Expector<T>

		export function create<T extends Token>(type: T["type"], factory: Expector.Factory<T>, build: (reader: ScriptReader) => any): Expector<T> {
			const selfExpector: Expector<T> = {
				type,
				expect(reader) {
					try {
						const startAt = reader.getIndex()
						const checkPoint = reader.checkpoint()
						const result = build(reader)
						const endAt = reader.getIndex()
						if (!result) return checkPoint.restore(), null
						if (result instanceof SyntaxError) return result
						const selfToken = {
							meta: result,
							type,
							location: {
								startAt,
								endAt,
							},
						} as T
						tokenWeakMap.set(selfToken, factory)
						return selfToken
					} catch (error) {
						return reader.syntaxError(String(error))
					}
				},
			}

			return selfExpector
		}
	}
}

export namespace Tokens {
	function nullOrError(token: Token | SyntaxError | null): token is SyntaxError | null {
		return token instanceof SyntaxError || token === null
	}

	export function OneOf<const TExpectors extends readonly Token.Expector[]>(
		oneOfExpectors: TExpectors
	): Token.Expector<Token.Of<TExpectors[number]>> {
		const selfExpector: Token.Expector = {
			type: oneOfExpectors.map((expector) => expector.type).join(" | "),
			expect(reader: ScriptReader) {
				for (const oneOfExpector of oneOfExpectors) {
					const self = oneOfExpector.expect(reader)
					if (self) return self
				}
				return null
			},
		}
		return selfExpector as never
	}

	export type Whitespace = Token<"whitespace", {}>
	export function Whitespace<const T1 extends "inline" | "full">(mode1: T1): Token.Expector<Whitespace> {
		return Token.Expector.create(`whitespace(${mode1})`, Whitespace, (reader) => {
			const whitespace = reader.expectWhitespace(mode1 === "inline")
			if (!whitespace) return null
			return {} satisfies Whitespace["meta"]
		})
	}

	export type EndOfLine = Token<"end-of-line", {}>
	export function EndOfLine(): Token.Expector<EndOfLine> {
		return Token.Expector.create("end-of-line", EndOfLine, (reader) => {
			const endOfLine = reader.expectEndOfLine()
			if (!endOfLine) null
			return {} satisfies EndOfLine["meta"]
		})
	}

	export type Word = Token<
		"word",
		{
			value: string
		}
	>
	export function Word(): Token.Expector<Word> {
		return Token.Expector.create("word", Word, (reader) => {
			const firstChar = reader.peek()
			if (!firstChar) return null
			if (/[0-9]/.test(firstChar)) return null

			let value = ""
			while (true) {
				const char = reader.peek()
				if (!char) break
				if (!/[0-9a-zA-Z_$]/.test(char)) break
				value += char
				reader.next()
			}
			if (!value) return null
			return {
				value,
			} satisfies Word["meta"]
		})
	}

	export type Keyword<TKeyword extends string> = Token<
		"keyword",
		{
			value: TKeyword
		}
	>
	export function Keyword<const TKeyword extends string>(keyword: TKeyword): Token.Expector<Keyword<TKeyword>> {
		return Token.Expector.create(`keyword(${keyword})`, Keyword, (reader) => {
			for (let i = 0; i < keyword.length; i++) {
				const char = reader.peek()
				if (!char) return null
				if (char !== keyword[i]) return null
				reader.next()
			}

			return {
				value: keyword,
			} satisfies Keyword<TKeyword>["meta"]
		})
	}

	export type Symbol<TSymbol extends string> = Token<
		"symbol",
		{
			value: TSymbol
		}
	>
	export function Symbol<const TSymbol extends string>(symbol: TSymbol): Token.Expector<Symbol<TSymbol>> {
		return Token.Expector.create(`symbol(${symbol})`, Symbol, (reader) => {
			for (let i = 0; i < symbol.length; i++) {
				const char = reader.peek()
				if (!char) return null
				if (char !== symbol[i]) return null
				reader.next()
			}

			return {
				value: symbol,
			} satisfies Symbol<TSymbol>["meta"]
		})
	}

	export type Operation<TOperator extends Token.Expector<Symbol<string>>, TRight extends Token.Expector> = Token<
		"operation",
		{
			operator: Token.Of<TOperator>
			right: Token.Of<TRight>
		}
	>
	export function Operation<TOperator extends Token.Expector<Symbol<string>>, TRight extends Token.Expector>(
		operatorExpector: TOperator,
		rightExpector: TRight
	): Token.Expector<Operation<TOperator, TRight>> {
		return Token.Expector.create(`operation(${operatorExpector.type} ${rightExpector.type})`, Operation, (reader) => {
			const operator = operatorExpector.expect(reader)
			if (nullOrError(operator)) return operator

			Whitespace("full").expect(reader)

			const right = rightExpector.expect(reader)
			if (!right) return reader.syntaxError("Expected right operand")
			if (right instanceof SyntaxError) return right

			return {
				operator,
				right,
			} as never satisfies Operation<TOperator, TRight>["meta"]
		})
	}

	export type NumberLiteral = Token<
		"number",
		{
			value: number
		}
	>
	export function NumberLiteral(): Token.Expector<NumberLiteral> {
		return Token.Expector.create("number", NumberLiteral, (reader) => {
			const firstChar = reader.peek()
			if (!firstChar) return null
			if (!/[0-9]/.test(firstChar)) return null

			let value = ""
			while (true) {
				const char = reader.peek()
				if (!char) break
				if (!/[0-9]/.test(char)) break
				value += char
				reader.next()
			}
			if (!value) return null
			return {
				value: Number(value),
			} satisfies NumberLiteral["meta"]
		})
	}

	export type StringLiteral = Token<
		"string",
		{
			value: string
		}
	>
	export function StringLiteral(): Token.Expector<StringLiteral> {
		return Token.Expector.create("string", StringLiteral, (reader) => {
			const firstChar = reader.peek()
			if (!firstChar) return null
			if (firstChar !== '"') return null

			let value = ""
			reader.next()
			let escape = false
			while (true) {
				const char = reader.next()
				if (!char) return reader.syntaxError("Expected closing quote")
				if (escape) {
					value += JSON.parse(`"\\${char}"`)
					escape = false
					continue
				}
				if (char === '"') break
				if (char === "\\") {
					escape = true
					continue
				}
				value += char
			}
			return {
				value,
			} satisfies StringLiteral["meta"]
		})
	}

	export type BooleanLiteral = Token<
		"boolean",
		{
			value: boolean
		}
	>
	export function BooleanLiteral(): Token.Expector<BooleanLiteral> {
		return Token.Expector.create("boolean", BooleanLiteral, (reader) => {
			const keyword = OneOf([Keyword("true"), Keyword("false")]).expect(reader)
			if (nullOrError(keyword)) return keyword
			return {
				value: keyword.meta.value === "true",
			} satisfies BooleanLiteral["meta"]
		})
	}

	export type Tuple<T extends Token.Expector> = Token<
		"tuple",
		{
			open: Symbol<"(">
			tokens: Token.Of<T>[]
			close: Symbol<")">
		}
	>
	export function Tuple<T extends Token.Expector>(tupleExpector: T): Token.Expector<Tuple<T>> {
		return Token.Expector.create(`tuple(${tupleExpector.type})`, Tuple, (reader) => {
			const open = Symbol("(").expect(reader)
			if (nullOrError(open)) return open

			Whitespace("full").expect(reader)

			const tokens: Token.Of<T>[] = []
			while (true) {
				const token = tupleExpector.expect(reader)
				if (!token) break
				if (token instanceof SyntaxError) return token
				tokens.push(token as Token.Of<T>)
				const comma = Symbol(",").expect(reader)
				if (!comma) break
				if (comma instanceof SyntaxError) return comma
				Whitespace("full").expect(reader)
			}

			Whitespace("full").expect(reader)

			const close = Symbol(")").expect(reader)
			if (!close) return reader.syntaxError(`Expected closing parenthesis after ${tokens.at(-1)?.type ?? open.type}`)
			if (close instanceof SyntaxError) return close

			return {
				open,
				tokens,
				close,
			} satisfies Tuple<T>["meta"]
		})
	}

	export type Export<T extends Token.Expector> = Token<
		"export",
		{
			keyword: Keyword<"pub">
			token: Token.Of<T>
		}
	>
	export function Export<T extends Token.Expector>(exportExpector: T): Token.Expector<Export<T>> {
		return Token.Expector.create(`export(${exportExpector.type})`, Export, (reader) => {
			const keyword = Keyword("pub").expect(reader)
			if (nullOrError(keyword)) return keyword

			if (!Whitespace("inline").expect(reader)) return reader.syntaxError(`Expected whitespace after ${keyword.type}`)

			const token = exportExpector.expect(reader)
			if (nullOrError(token)) return token

			return {
				keyword,
				token,
			} as never satisfies Export<T>["meta"]
		})
	}

	export type Name<T extends "type" | "value"> = Token<
		"name",
		{
			type: T
			value: string
		}
	>
	export function Name<const T extends "type" | "value">(type: T): Token.Expector<Name<T>> {
		return Token.Expector.create(`name(${type})`, Name, (reader) => {
			const word = Word().expect(reader)
			if (nullOrError(word)) return word
			return {
				type,
				value: word.meta.value,
			} satisfies Name<T>["meta"]
		})
	}

	export type ValueDefinition = Token<
		"value-definition",
		{
			keyword: Keyword<"var">
			name: Name<"value">
			type: Operation<Token.Expector<Symbol<":">>, Token.Expector<Type>> | null
			equals: Operation<Token.Expector<Symbol<"=">>, Token.Expector<Value>> | null
		}
	>
	export function ValueDefinition(): Token.Expector<ValueDefinition> {
		return Token.Expector.create(`value-definition`, ValueDefinition, (reader) => {
			const keyword = Keyword("var").expect(reader)
			if (nullOrError(keyword)) return keyword

			if (!Whitespace("inline").expect(reader)) return reader.syntaxError(`Expected whitespace after ${keyword.type}`)

			const name = Name("value").expect(reader)
			if (nullOrError(name)) return name

			Whitespace("inline").expect(reader)

			const type = Operation(Symbol(":"), Type()).expect(reader)
			if (type instanceof SyntaxError) return type

			Whitespace("inline").expect(reader)

			const equals = Operation(Symbol("="), Value()).expect(reader)
			if (equals instanceof SyntaxError) return equals

			return {
				keyword,
				name,
				type,
				equals,
			} satisfies ValueDefinition["meta"]
		})
	}

	export type TypeDefinition = Token<
		"type-definition",
		{
			keyword: Keyword<"type">
			name: Name<"type">
			type: Tuple<Token.Expector<Type>>
		}
	>
	export function TypeDefinition(): Token.Expector<TypeDefinition> {
		return Token.Expector.create(`type-definition`, TypeDefinition, (reader) => {
			const keyword = Keyword("type").expect(reader)
			if (nullOrError(keyword)) return keyword

			if (!Whitespace("inline").expect(reader)) return reader.syntaxError(`Expected whitespace after ${keyword.type}`)

			const name = Name("type").expect(reader)
			if (nullOrError(name)) return name

			if (!Whitespace("inline").expect(reader)) return reader.syntaxError(`Expected whitespace after ${name.type}`)

			var expects = Tuple(Type())
			const type = expects.expect(reader)
			if (!type) return reader.syntaxError(`Expected ${expects.type} after ${name.type}`)
			if (type instanceof SyntaxError) return type

			return {
				keyword,
				name,
				type,
			} satisfies TypeDefinition["meta"]
		})
	}

	export type TypeTrait = Token<
		"type-trait",
		{
			keyword: Keyword<"type trait">
			name: Name<"type">
			type: Block<Token.Expector<Export<Token.Expector<TypeDefinition | ValueDefinition>>>>
		}
	>
	export function TypeTrait(): Token.Expector<TypeTrait> {
		return Token.Expector.create(`type-trait`, TypeTrait, (reader) => {
			const keyword = Keyword("type trait").expect(reader)
			if (nullOrError(keyword)) return keyword

			if (!Whitespace("inline").expect(reader)) return reader.syntaxError(`Expected whitespace after ${keyword.type}`)

			const name = Name("type").expect(reader)
			if (nullOrError(name)) return name

			Whitespace("inline").expect(reader)

			const type = Block(Export(OneOf([TypeDefinition(), ValueDefinition()]))).expect(reader)
			if (nullOrError(type)) return type

			return {
				keyword,
				name,
				type,
			} satisfies TypeTrait["meta"]
		})
	}

	export type Multiline<T extends Token.Expector> = Token<
		"multiline",
		{
			tokens: Token.Of<T>[]
		}
	>
	export function Multiline<T extends Token.Expector>(multilineExpector: T): Token.Expector<Multiline<T>> {
		return Token.Expector.create(`multiline(${multilineExpector.type})`, Multiline, (reader) => {
			const tokens: Token.Of<T>[] = []
			while (true) {
				Whitespace("full").expect(reader)
				const token = multilineExpector.expect(reader)
				if (!token) break
				if (token instanceof SyntaxError) return token
				tokens.push(token as Token.Of<T>)
				const endOfLine = EndOfLine().expect(reader)
				if (nullOrError(endOfLine)) return reader.syntaxError(`Expected end of line after ${token.type}`)
			}

			return { tokens } satisfies Multiline<T>["meta"]
		})
	}

	export type Block<T extends Token.Expector> = Token<
		"block",
		{
			open: Symbol<"{">
			multiline: Multiline<T> | null
			close: Symbol<"}">
		}
	>
	export function Block<T extends Token.Expector>(expector: T): Token.Expector<Block<T>> {
		return Token.Expector.create(`block(${expector.type})`, Block, (reader) => {
			const open = Symbol("{").expect(reader)
			if (nullOrError(open)) return open

			const multiline = Multiline(expector).expect(reader)
			if (multiline instanceof SyntaxError) return multiline

			const close = Symbol("}").expect(reader)
			if (!close) return reader.syntaxError(`Expected closing brace after ${multiline?.meta.tokens.at(-1)?.type ?? open.type}`)
			if (close instanceof SyntaxError) return close

			return {
				open,
				multiline,
				close,
			} satisfies Block<T>["meta"]
		})
	}

	type ReplaceTupleRecursively<T, TFind, TReplace> = T extends readonly [infer U, ...infer V]
		? readonly [ReplaceRecursively<U, TFind, [TReplace]>, ...ReplaceTupleRecursively<V, TFind, TReplace>]
		: T extends readonly (infer U)[]
		? readonly ReplaceRecursively<U, TFind, [TReplace]>[]
		: T

	type ReplaceRecursively<T, TFind, TReplace extends [unknown]> = T extends TFind
		? TReplace[0]
		: T extends object
		? { [K in keyof T]: ReplaceRecursively<T[K], TFind, TReplace> }
		: T extends any[] | readonly any[]
		? ReplaceTupleRecursively<T, TFind, TReplace[0]>
		: T

	type SELF = Token<"...", {}>
	export function Recursive<const T extends Token>(fn: (SELF: () => Token.Expector<SELF>) => Token.Expector<T>) {
		const stack: Token.Expector<SELF>[] = []
		function SELF() {
			const selfExpector = {
				type: "...",
				expect(reader) {
					if (stack.at(-1) === selfExpector) return null
					stack.push(selfExpector)
					const token = self.expect(reader)
					stack.pop()
					return token
				},
			} as Token.Expector<SELF>
			return selfExpector
		}

		const self = fn(SELF)
		type U = ReplaceRecursively<T, SELF, [U]>
		return () => SELF() as Token.Expector<U>
	}

	export type Literal = Token.Of<typeof Literal>
	export const Literal = OneOf([NumberLiteral(), StringLiteral(), BooleanLiteral()])
	export type Definition = Token.Of<typeof Definition>
	export const Definition = OneOf([ValueDefinition(), TypeTrait(), TypeDefinition()])

	export type Type = Token.Of<typeof Type>
	export const Type = Recursive((SELF) =>
		OneOf([Tuple(SELF()), Block(OneOf([Definition, Export(OneOf([TypeDefinition(), ValueDefinition()]))])), Literal, Name("type")])
	)

	type ValueBase = Token.Of<typeof ValueBase>
	const ValueBase = OneOf([Tuple(Value()), Block(OneOf([Definition, Export(ValueDefinition()), Value()])), Literal, Name("value")])

	export type Value = Token<
		"value",
		{
			value: ValueBase
			type: Operation<Token.Expector<Symbol<":">>, Token.Expector<Type>> | null
			operation: Operation<Token.Expector<Symbol<"+">>, Token.Expector<Value>> | null
		}
	>
	export function Value(): Token.Expector<Value> {
		return Token.Expector.create(`value`, Value, (reader) => {
			const value = ValueBase.expect(reader)
			if (nullOrError(value)) return value

			Whitespace("inline").expect(reader)

			const type = Operation(Symbol(":"), Type()).expect(reader)
			if (type instanceof SyntaxError) return type

			Whitespace("inline").expect(reader)

			const operation = Operation(Symbol("+"), Value()).expect(reader)
			if (operation instanceof SyntaxError) return operation

			return {
				value,
				type,
				operation,
			} satisfies Value["meta"]
		})
	}

	type RootMember = Token.Of<typeof RootMember>
	const RootMember = OneOf([Definition, Export(Definition), Value()])
	export type Root = Token.Of<typeof Root>
	export const Root = Tokens.Multiline(RootMember)
}
