import { ScriptReader } from "./reader"

export interface Token<TMeta extends object = {}> {
	type: string
	location: Token.Location
	meta: TMeta
}
export namespace Token {
	export function tokenizeScript(script: string) {
		const reader = ScriptReader.create(script)
		const result = Tokens.Multiline(Tokens.Root).expect(reader)
		if (!result) return []
		if (result instanceof ScriptReader.SyntaxError) return result
		const tokens = result.meta.tokens
		tokens.push({
			type: `end-of-script(${reader.peek()})`,
			location: {
				startAt: reader.getIndex(),
				endAt: reader.getIndex(),
			},
			meta: {},
		} as (typeof tokens)[number])
		return tokens
	}

	export type Location = {
		startAt: number
		endAt: number
	}
	export const SyntaxError = ScriptReader.SyntaxError
	export type SyntaxError = ScriptReader.SyntaxError

	export type Of<T extends Expector.Factory<Token> | Expector<Token>> = T extends Expector<infer U>
		? U
		: T extends Expector.Factory<infer U>
		? U
		: never

	const tokenWeakMap = new WeakMap<Token, unknown>()
	export function is<T extends Token = Token>(value: unknown, factory?: Expector.Factory<T>): value is T {
		return factory ? tokenWeakMap.get(value as Token) === factory : tokenWeakMap.has(value as Token)
	}

	export type Expector<T extends Token = Token> = {
		type: T["type"]
		expect: (reader: ScriptReader) => T | SyntaxError | null
	}
	export namespace Expector {
		export type Factory<T extends Token = Token> = (...args: any[]) => Expector<T>

		export function create<const T extends string, const TMeta extends object>(
			type: T,
			factory: unknown,
			build: (reader: ScriptReader) => TMeta | SyntaxError | null
		) {
			const selfExpector: Expector<Token<TMeta>> = {
				type,
				expect(reader) {
					try {
						const startAt = reader.getIndex()
						const checkPoint = reader.checkpoint()
						const result = build(reader)
						const endAt = reader.getIndex()
						if (!result) return checkPoint.restore(), null
						if (result instanceof SyntaxError) return result
						const selfToken: Token<TMeta> = {
							meta: result,
							type,
							location: {
								startAt,
								endAt,
							},
						}
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

	export namespace Tokens {
		function nullOrError(token: Token | SyntaxError | null): token is SyntaxError | null {
			return token instanceof SyntaxError || token === null
		}

		export function OneOf<const TExpector extends Token.Expector>(oneOfExpectors: readonly TExpector[]): TExpector {
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

		type ExpectorBuilderReturnType<T extends Token> = (T extends Token<infer U> ? U : never) | null | SyntaxError

		export type Whitespace = Token<{}>
		export function Whitespace<const T1 extends "inline" | "full">(mode1: T1) {
			return Token.Expector.create(`whitespace(${mode1})`, Whitespace, (reader): ExpectorBuilderReturnType<Whitespace> => {
				const whitespace = reader.expectWhitespace(mode1 === "inline")
				if (!whitespace) return null
				return {}
			})
		}

		export type EndOfLine = Token<{}>
		export function EndOfLine() {
			return Token.Expector.create("end-of-line", EndOfLine, (reader): ExpectorBuilderReturnType<EndOfLine> => {
				const endOfLine = reader.expectEndOfLine()
				if (!endOfLine) null
				return {}
			})
		}

		export type Word = Token<{
			value: string
		}> & {}
		export function Word() {
			return Token.Expector.create("word", Word, (reader): ExpectorBuilderReturnType<Word> => {
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
				}
			})
		}

		export type Keyword<TKeyword extends string> = Token<{
			value: TKeyword
		}>
		export function Keyword<const TKeyword extends string>(keyword: TKeyword) {
			return Token.Expector.create(`keyword(${keyword})`, Keyword, (reader): ExpectorBuilderReturnType<Keyword<TKeyword>> => {
				for (let i = 0; i < keyword.length; i++) {
					const char = reader.peek()
					if (!char) return null
					if (char !== keyword[i]) return null
					reader.next()
				}

				return {
					value: keyword,
				}
			})
		}

		export type Symbol<TSymbol extends string> = Token<{
			value: TSymbol
		}>
		export function Symbol<const TSymbol extends string>(symbol: TSymbol) {
			return Token.Expector.create(`symbol(${symbol})`, Symbol, (reader): ExpectorBuilderReturnType<Symbol<TSymbol>> => {
				for (let i = 0; i < symbol.length; i++) {
					const char = reader.peek()
					if (!char) return null
					if (char !== symbol[i]) return null
					reader.next()
				}

				return {
					value: symbol,
				}
			})
		}

		export type Operation<TOperator extends Token.Expector<Symbol<string>>, TRight extends Token.Expector> = Token<{
			operator: Token.Of<TOperator>
			right: Token.Of<TRight>
		}>
		export function Operation<const TOperator extends Token.Expector<Symbol<string>>, const TRight extends Token.Expector>(
			operatorExpector: TOperator,
			rightExpector: TRight
		) {
			return Token.Expector.create(
				`operation(${operatorExpector.type} ${rightExpector.type})`,
				Operation,
				(reader): ExpectorBuilderReturnType<Operation<TOperator, TRight>> => {
					const operator = operatorExpector.expect(reader)
					if (nullOrError(operator)) return operator

					Whitespace("full").expect(reader)

					const right = rightExpector.expect(reader)
					if (!right) return reader.syntaxError("Expected right operand")
					if (right instanceof SyntaxError) return right

					return {
						operator,
						right,
					} as never
				}
			)
		}

		export type NumberLiteral = Token<{
			value: number
		}>
		export function NumberLiteral() {
			return Token.Expector.create("number", NumberLiteral, (reader): ExpectorBuilderReturnType<NumberLiteral> => {
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
				}
			})
		}

		export type StringLiteral = Token<{
			value: string
		}>
		export function StringLiteral() {
			return Token.Expector.create("string", StringLiteral, (reader): ExpectorBuilderReturnType<StringLiteral> => {
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
				}
			})
		}

		export type BooleanLiteral = Token<{
			value: boolean
		}>
		export function BooleanLiteral() {
			return Token.Expector.create("boolean", BooleanLiteral, (reader): ExpectorBuilderReturnType<BooleanLiteral> => {
				const keyword = OneOf([Keyword("true"), Keyword("false")]).expect(reader)
				if (nullOrError(keyword)) return keyword
				return {
					value: keyword.meta.value === "true",
				}
			})
		}

		export type Tuple<T extends Token.Expector> = Token<{
			open: Symbol<"(">
			tokens: Token.Of<T>[]
			close: Symbol<")">
		}>
		export function Tuple<const T extends Token.Expector>(tupleExpector: T) {
			return Token.Expector.create(`tuple(${tupleExpector.type})`, Tuple, (reader): ExpectorBuilderReturnType<Tuple<T>> => {
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
				}
			})
		}

		export type Export<T extends Token.Expector> = Token<{
			keyword: Keyword<"pub">
			token: Token.Of<T>
		}>
		export function Export<const T extends Token.Expector>(exportExpector: T) {
			return Token.Expector.create(`export(${exportExpector.type})`, Export, (reader): ExpectorBuilderReturnType<Export<T>> => {
				const keyword = Keyword("pub").expect(reader)
				if (nullOrError(keyword)) return keyword

				if (!Whitespace("inline").expect(reader)) return reader.syntaxError(`Expected whitespace after ${keyword.type}`)

				const token = exportExpector.expect(reader)
				if (nullOrError(token)) return token

				return {
					keyword,
					token,
				} as never
			})
		}

		export type Name<T extends "type" | "value"> = Token<{
			type: T
			value: string
		}>
		export function Name<const T extends "type" | "value">(type: T) {
			return Token.Expector.create(`name(${type})`, Name, (reader): ExpectorBuilderReturnType<Name<T>> => {
				const word = Word().expect(reader)
				if (nullOrError(word)) return word
				return {
					type,
					value: word.meta.value,
				}
			})
		}

		export type Nothing = Token<{}>
		export function Nothing() {
			return Token.Expector.create(`nothing`, Nothing, (reader): ExpectorBuilderReturnType<Nothing> => {
				Whitespace("full").expect(reader)
				return {}
			})
		}

		export type ValueDefinition = Token<{
			keyword: Keyword<"var">
			name: Name<"value">
			type: Operation<Expector<Symbol<":">>, Expector<Type>> | null
			equals: Operation<Expector<Symbol<"=">>, Expector<Value>> | null
		}>
		export function ValueDefinition<T extends Token.Expector>() {
			return Token.Expector.create(`value-definition`, ValueDefinition, (reader): ExpectorBuilderReturnType<ValueDefinition> => {
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
				}
			})
		}

		export type TypeDefinition = Token<{
			keyword: Keyword<"type">
			name: Name<"type">
			type: Tuple<Expector<Type>>
		}>
		export function TypeDefinition() {
			return Token.Expector.create(`type-definition`, TypeDefinition, (reader): ExpectorBuilderReturnType<TypeDefinition> => {
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
				}
			})
		}

		export type TypeTrait = Token<{
			keyword: Keyword<"type trait">
			name: Name<"type">
			type: Block<Expector<Export<Expector<TypeDefinition | ValueDefinition>>>>
		}>
		export function TypeTrait() {
			return Token.Expector.create(`type-trait`, TypeTrait, (reader): ExpectorBuilderReturnType<TypeTrait> => {
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
				}
			})
		}

		export type Multiline<T extends Token.Expector> = Token<{
			tokens: Token.Of<T>[]
		}>
		export function Multiline<const T extends Token.Expector>(multilineExpector: T) {
			return Token.Expector.create(`multiline(${multilineExpector.type})`, Multiline, (reader): ExpectorBuilderReturnType<Multiline<T>> => {
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

				return { tokens }
			})
		}

		export type Block<T extends Token.Expector> = Token<{
			open: Symbol<"{">
			multiline: Multiline<T> | null
			close: Symbol<"}">
		}>
		export function Block<const T extends Token.Expector>(expector: T) {
			return Token.Expector.create(`block(${expector.type})`, Block, (reader): ExpectorBuilderReturnType<Block<T>> => {
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
				}
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

		declare const SELF: unique symbol
		type SELF = Token.Expector & [SELF]
		export function Recursive<T extends Token.Expector>(fn: (SELF: () => SELF) => T) {
			const stack: SELF[] = []
			function SELF() {
				const selfToken = {
					type: "...",
					expect(reader) {
						if (stack.at(-1) === selfToken) return null
						stack.push(selfToken)
						const token = self.expect(reader)
						stack.pop()
						return token
					},
				} as SELF
				return selfToken
			}

			const self = fn(SELF)
			type U = ReplaceRecursively<Token.Of<T>, SELF, [U]>
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
		export type Value = Token<{
			value: ValueBase
			type: Operation<Expector<Symbol<":">>, Expector<Type>> | null
			operation: Operation<Expector<Symbol<"+">>, Expector<Value>> | null
		}>
		export function Value() {
			return Token.Expector.create(`value`, Value, (reader): ExpectorBuilderReturnType<Value> => {
				const value = ValueBase.expect(reader)
				if (nullOrError(value)) return value

				Whitespace("inline").expect(reader)

				const type = Operation(Symbol(":"), Type()).expect(reader)
				if (type instanceof SyntaxError) return type

				Whitespace("inline").expect(reader)

				const operation = Operation(Symbol("+"), Value()).expect(reader)
				if (operation instanceof SyntaxError) return operation

				return {
					type,
					value,
					operation,
				}
			})
		}

		export type Root = Token.Of<typeof Root>
		export const Root = OneOf([Definition, Export(Definition), Value()])
	}
}
