export const Token = Symbol()
export type Token = {
	[Token]: true
	start: number
	end: number
}
export function createToken(start: number, end: number): Token {
	return {
		[Token]: true,
		start,
		end,
	}
}
export function isToken(value: unknown): value is Token {
	return typeof value === "object" && value !== null && Token in value
}

export const DefineValueToken = Symbol()
export type DefineValueToken = Token & {
	[DefineValueToken]: true
	name: string
	type: string
}
export function createDefineValueToken(name: string, type: string, ...tokenParams: Parameters<typeof createToken>): DefineValueToken {
	return {
		...createToken(...tokenParams),
		[DefineValueToken]: true,
		name,
		type,
	}
}
export function isDefineValueToken(value: unknown): value is DefineValueToken {
	return isToken(value) && DefineValueToken in value
}
