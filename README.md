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
