# breeze-script

An exprimental, hobby, fun, scripting or programming language idk, that has a really interesting typing system and has no GC also with a stack first approach.<br/>
Aims to be readable by anyone, tries to combine `what typescript can be` and `some of rust but with better syntax by using already exiting concepts that does the same job instead of making up things`.<br/>

Can be compiled to any language like `C`, `C#`, idk anything.<br/>
At first I'm gonna make it compile to `C#` but without GC and reference types.<br/>
Later in the future maybe i can make it compile to `WASM` or `ASM` directly.<br/>
Tho compiling to `C` or `C#` is probably better since their compiling to `WASM` and `ASM` always gets improved.

It's really, really and really early in the development... There is nothing yet just stuff in my head that idk if works or not.

## TODO

-   [ ] Make a lexer
-   [ ] Make a parser
-   [ ] Make a compiler

-   [ ] Basic math operations
-   [ ] Variable declaration
-   [ ] Types/Structs
-   [ ] Unions and Intersections
-   [ ] Pointer keywords such as `ref` and `in`
-   [ ] Allocation keywords such as `malloc` and `stackalloc`, free is not needed since everything lives on the scope or idk
-   [ ] `if/else`, `for`, `while` etc. idk

## Rules

-   We shouldn't have any GC, everything should be stack allocated or manually allocated.
-   Types should get narrowed based on the code.
-   Unlike TS, no need for `asserts` keyword for functions.
-   No need for `as` keyword for casting, just use `()` like in rust.
-   No constructors, just use a function that returns the struct.
-   Structs should not have any methods.
-   Get `namespace` from `TS` but can be renamed. And a bit different, will show it in the examples.
-   Don't invent anything, use exisiting concepts that does the same job, like unions and intersections. etc.
-   You can define extension functions for types.

## Examples

```ts
var foo: ref i64 = malloc 10
foo = 20
// foo gets freed when it goes out of scope
```

```ts
type Number = i8 | i16 | i32 | i64 | u8 | u16 | u32 | u64 | f32 | f64

func add(a: T: Number, b: T): T {
  return a + b
}

// TS equivalent
function add<T extends Number>(a: T, b: T): T {
  return a + b
}
```

```ts
type Monster = {
    name: ref Span<char> // idk
}
var Monster = block { // similar to namespace in TS
    export func create(name: ref Span<char>) {
        return Monster {
            name: name
        }
    }
}

type Killable = {
    health: i32
}

type KillableMonster = Monster & Killable
var KillableMonster = block {
    export func create(name: ref Span<char>, health: i32) {
        return KillableMonster {
            ...Monster.create(name),
            health: health
        }
    }
}

var monster = KillableMonster.create("Monster", 100)

if (monster is Killable) // true
if (monster is Monster) // true
if (monster is KillableMonster) // true

type Killable2 = {
    health: i32
}

if (monster is Killable2) // false
var monster2 = monster as Killable2 // error
var monster2 = monster as Killable2 & Monster // ok
// btw this wasn't a copy or anything runtime, shouldn't be idk
if (monster2 is Killable2) // true
// Maybe ifs like these should be able to be checked at compile time
```

```ts
type FooOrBar = Foo | Bar // should get the size of the biggest one
```

```ts
type OptionalFoo = Foo | null // should get the size of Foo
// or
type OptionalFoo = Foo | None // should get the size of Foo

// Maybe None shouldn't be a language keyword, maybe it should be a type in stdlib
type None = i8(0)
```

Every type should be a brand type

Every type should be updated based on runtime logic.

In TS return type of a function is determined while parsing the function.<br/>
But return type of function is only needed when we call that function.<br/>
So return type should be determined while calling the function.<br/>
This way based on input parameters we can determine the return type.<br/>

Try to design the language in a way that we don't need type checks at runtime.

Functions can have 2 different keywords for references `ref` and `in`.<br/>
`ref` means the function can mutate the value.<br/>
`in` means the function can't mutate the value.<br/>

If you use `ref` keyword for a function, you have to mutate the value otherwise it's a compile time error.<br/>
So when we see a `ref` keyword we know that the value can be mutated for sure.<br/>
And we make sure people don't use `ref` for every reference type.<br/>
But maybe i make it `ref` and `mut ref` idk.<br/>

```ts
func foo(a: ref i32) {
    a = 10 // ok
}

func foo(a: in i32) {
    a = 10 // error
}
```
