# type++
An experimental language with a type system on steroids, inspired by TypeScript and Rust.
It will change how you code, maybe will create its own Programming paradigm

At first I was trying to make an LSP but that's hard this early, so just gonna make my own WebApp text editor IDE for the language. Easier than dealing with LSP

There is no code yet, just imaginary:
```
type NonZeroU8 = u8 & 1..255

func NonZeroU8(value: u8): NonZeroU8 | None {
    // return value // compile time error: u8 & 0..255 is not assignable to u8 & 1..255
    return value == 0 ? None : value 
}

var foo = NonZeroU8(5) // type u8 & 5, foo satisfies NonZeroU8
if (foo == 0) {} // grayed out unreachable code
foo = 0 // compile time error: u8 & 0 is not assignable to u8 & 1..255

var bar: u8 = NonZeroU8(5) // type u8 & 5, bar satisfies u8
if (bar == 4) {} // grayed out unreachable code 
bar = 0 // type u8 & 0, bar satisfies u8

// Don't even need NonZeroU8
func baz(non_zero_u8: u8 & 1..255) {}

var random_u8_value = random_u8() // type u8, random_u8_value satisfies u8
baz(random_u8_value) // compile time error: u8 & 0..255 is not assignable to u8 & 1..255

if (random_u8_value > 0) {
    random_u8_value // type u8 & 1..255, random_u8_value satisfies u8
    baz(random_u8_value)
}

// or 
func is_non_zero(value: number) {
    return value != 0
}

if (is_non_zero(random_u8_value)) {
    random_u8_value // type u8 & 1..255, random_u8_value satisfies u8
    baz(random_u8_value)
}
```
