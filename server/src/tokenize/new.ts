import { ScriptReader } from "./reader"

export interface Token<TMeta extends object = {}> {
	type: string
	location: Token.Location
	meta: TMeta
}
export namespace Token {
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
	export function is<T extends Token>(token: Token, builderOrFactory: Expector<T> | Expector.Factory<T>): token is T {
		if (typeof builderOrFactory === "function") return tokenWeakMap.get(token) === builderOrFactory
		return token.type === builderOrFactory.type
	}

	export type Expector<T extends Token = Token> = {
		type: T["type"]
		expect: (reader: ScriptReader) => T | SyntaxError | null
	}
	export namespace Expector {
		export type Factory<T extends Token> = (...args: any[]) => Expector<T>

		export function create<const T extends string, const TMeta extends object>(
			type: T,
			key: unknown,
			build: (reader: ScriptReader) => TMeta | SyntaxError | null
		) {
			const selfExpector: Expector<Token<TMeta>> = {
				type,
				expect(reader) {
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
					tokenWeakMap.set(selfToken, key)
					return selfToken
				},
			}

			return selfExpector
		}
	}

	export namespace Tokens {
		function nullOrError(token: Token | SyntaxError | null): token is SyntaxError | null {
			return token instanceof SyntaxError || token === null
		}
		export function OneOf<const TExpector extends Token.Expector>(expectors: readonly TExpector[]): TExpector {
			const selfExpector: Token.Expector = {
				type: expectors.map((expector) => expector.type).join(" | "),
				expect(reader: ScriptReader) {
					for (const expector of expectors) {
						const self = expector.expect(reader)
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
				const word = Word().expect(reader)
				if (nullOrError(word)) return word
				if (word.meta.value !== keyword) return null

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
				const word = Word().expect(reader)
				if (nullOrError(word)) return word
				if (word.meta.value !== symbol) return null

				return {
					value: symbol,
				}
			})
		}

		export type Operation<TLeft extends Token.Expector, TOperator extends string, TRight extends Token.Expector> = Token<{
			left: TLeft
			operator: Symbol<TOperator>
			right: TRight
		}>
		export function Operation<const TLeft extends Token.Expector<any>, const TOperator extends string, const TRight extends Token.Expector<any>>(
			leftExpector: TLeft,
			operatorString: TOperator,
			rightExpector: TRight
		) {
			return Token.Expector.create(
				`operation(${leftExpector.type} ${operatorString} ${rightExpector.type})`,
				Operation,
				(reader): ExpectorBuilderReturnType<Operation<TLeft, TOperator, TRight>> => {
					const left = leftExpector.expect(reader)
					if (nullOrError(left)) return left

					Whitespace("full").expect(reader)

					const operator = Symbol(operatorString).expect(reader)
					if (nullOrError(operator)) return operator

					Whitespace("full").expect(reader)

					const right = rightExpector.expect(reader)
					if (!right) return reader.syntaxError("Expected right operand")
					if (right instanceof SyntaxError) return right

					return {
						left,
						operator,
						right,
					}
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
		export function Tuple<const T extends Token.Expector>(expector: T) {
			return Token.Expector.create(`tuple(${expector.type})`, Tuple, (reader): ExpectorBuilderReturnType<Tuple<T>> => {
				const open = Symbol("(").expect(reader)
				if (nullOrError(open)) return open

				const tokens: Token.Of<T>[] = []
				while (true) {
					const token = expector.expect(reader)
					if (!token) break
					if (token instanceof SyntaxError) return token
					tokens.push(token as Token.Of<T>)
					const comma = Symbol(",").expect(reader)
					if (!comma) break
					if (comma instanceof SyntaxError) return comma
					Whitespace("full").expect(reader)
				}

				const close = Symbol(")").expect(reader)
				if (!close) return reader.syntaxError("Expected closing parenthesis")
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
		export function Export<const T extends Token.Expector<any>>(expector: T) {
			return Token.Expector.create(`export(${expector.type})`, Export, (reader): ExpectorBuilderReturnType<Export<T>> => {
				const keyword = Keyword("pub").expect(reader)
				if (nullOrError(keyword)) return keyword

				if (!Whitespace("inline").expect(reader)) return reader.syntaxError(`Expected whitespace after ${keyword.type}`)

				const token = expector.expect(reader)
				if (nullOrError(token)) return token

				return {
					keyword,
					token,
				}
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
			name: Name<"value"> | Operation<Expector<Name<"value">>, ":", typeof Type>
			equals: Operation<Token.Expector<Whitespace>, "=", typeof Value> | null
		}>
		export function ValueDefinition<T extends Token.Expector>() {
			return Token.Expector.create(`value-definition`, ValueDefinition, (reader): ExpectorBuilderReturnType<ValueDefinition> => {
				const keyword = Keyword("var").expect(reader)
				if (nullOrError(keyword)) return keyword

				if (!Whitespace("inline").expect(reader)) return reader.syntaxError(`Expected whitespace after ${keyword.type}`)

				const name = OneOf([Operation(Name("value"), ":", Type), Name("value")]).expect(reader)
				if (nullOrError(name)) return name

				const equals = Operation(Whitespace("inline"), "=", Value).expect(reader)
				if (equals instanceof SyntaxError) return equals

				return {
					keyword,
					name,
					equals,
				}
			})
		}

		export type TypeDefinition = Token<{
			keyword: Keyword<"type">
			name: Name<"type">
			type: Tuple<typeof Type>
		}>
		export function TypeDefinition() {
			return Token.Expector.create(`type-definition`, TypeDefinition, (reader): ExpectorBuilderReturnType<TypeDefinition> => {
				const keyword = Keyword("type").expect(reader)
				if (nullOrError(keyword)) return keyword

				if (!Whitespace("inline").expect(reader)) return reader.syntaxError(`Expected whitespace after ${keyword.type}`)

				const name = Name("type").expect(reader)
				if (nullOrError(name)) return name

				if (!Whitespace("inline").expect(reader)) return reader.syntaxError(`Expected whitespace after ${name.type}`)

				const type = OneOf([Tuple(Type)]).expect(reader)
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
		export function Multiline<const T extends Token.Expector>(expector: T) {
			return Token.Expector.create(`multiline(${expector.type})`, Multiline, (reader): ExpectorBuilderReturnType<Multiline<T>> => {
				const tokens: Token.Of<T>[] = []
				while (true) {
					Whitespace("full").expect(reader)
					const token = expector.expect(reader)
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
				if (!close) return reader.syntaxError("Expected closing brace")
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

		function replaceRecursivelyInplace(value: unknown, find: unknown, replace: unknown): unknown {
			if (value === find) return replace
			if (typeof value !== "object") return value
			if (value === null) return value
			if (Array.isArray(value)) for (let i = 0; i < value.length; i++) value[i] = replaceRecursivelyInplace(value[i], find, replace)
			else for (const key in value) (value as any)[key] = replaceRecursivelyInplace((value as any)[key], find, replace)
			return value
		}
		const SELF = { type: "..." } as Token.Expector
		type SELF = typeof SELF
		export function Recursive<T extends Token.Expector>(fn: (SELF: SELF) => T) {
			const result = fn(SELF)
			replaceRecursivelyInplace(result, SELF, result)
			type U = ReplaceRecursively<Token.Of<T>, SELF, [U]>
			return result as unknown as Token.Expector<U>
		}

		export const Literal = OneOf([NumberLiteral(), StringLiteral(), BooleanLiteral()])
		export const Type = Recursive((SELF) =>
			OneOf([Literal, Name("type"), Tuple(SELF), Block(OneOf([SELF, TypeDefinition(), Export(TypeDefinition())]))])
		)
		export const Value = Recursive((SELF) =>
			OneOf([Literal, Name("value"), Tuple(SELF), Block(OneOf([SELF, ValueDefinition(), TypeDefinition(), Export(ValueDefinition())]))])
		)
		export const Root = OneOf([Value, ValueDefinition(), TypeDefinition(), Export(OneOf([ValueDefinition(), TypeDefinition()]))])
	}
}
