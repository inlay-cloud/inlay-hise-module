# Scripting

**Scripting**
provides the glue with which you can access each Module and UIComponent in a Script Processor
and mold together more advanced interactions with your instrument.

- The Scripting in HISE chapter introduces you to the basics, and explains the design decisions that led to some Additions to HISEs JavaScript implementation.

- If you need a refresher in basic JavaScript take a look at the HISE JavaScript Tutorial which is adapted to the scope of scripting in **HISE**.

- The Scripting API is the backbone of **HISE** s powerful scripting capabilities. You can access and modify almost every aspect of your virtual instrument with its 200+ inbuilt functions.

If you are interested in the dirty details; please consider watching Christophs talk: Javascript for DSP prototyping
to learn more about the technical implementation.

Here are some of the most useful purposes of scripting in HISE:

- Access Module parameters/attributes and change their values (eg. the frequency of the pitch LFO) with script logic.
- Use the MIDI Callbacks (`onNoteOn`, `onNoteOff`, `onController` ) to customize the behaviour of your instrument regarding incoming MIDI Messages.
- Access the UIComponents and change/trigger their properties to create a dynamic interface experience.
- Implement custom GUI interactions for your instrument (Page handling, Film Strips, ScriptPanels) that react to User Input.

### **Performance**

Compared to compiled C++ code, a Javascript engine is rather slow. But for occasional event handling like incoming MIDI data or a timer every 50 milliseconds the JS-engine is absolutely fit for the purpose. This is completely sufficent for the most use cases of audio plugins and virtual instruments. If you don't want to relinquish the performance gains of a native C++ implementation please consider taking a look at C++ API.

## Scripting in HISE

### **Basics**

#### **Create Script References**

One crucial paradigm in **HISE**
is that you have to create a **script reference**
to HISE Modules
and UI Components
before you can manipulate them with scripting. The best place to declare this references is the Script Processors
`onInit`
-Tab.

After you have referenced the element you can access its attributes/parameters,properties and API methods
and change the values with script logic.

#### **Module References**

```
// A script reference to a SineWaveGenerator Module
const var SineWaveGenerator1 = Synth.getChildSynth("Sine Wave Generator1");
```

The quickest way to create a script reference to a Module is to take a built-in shortcut. When you **right-click**
on the header-bar of a Module in the Main-Workspace, a little context menu will pop up with the option: **Create generic script reference**.
This will copy a const var
script variable definition of the Module to your clipboard. You can now directly paste this reference to your `onInit`
-script and compile the script with [F5]. The Module is now accessible with this variable.

Take notice that the Module is identified by its **Processor ID**
name and that the variable automatically adopts this naming.

Now that we have created a reference to the Module we can access all its methods and attributes/parameters directly via script.

Start to type `SineW...`
in the `onInit`
-script and hit [Escape]. Select the full variable-name `SineWaveGenerator1`
with the [Down Arrow] and [Enter] or click. When you now append a `.`
(dot) and hit [Escape] again, you'll see a list of all available API methods and attributes/parameters of the Module in the Autocomplete Popup.

Let's try out the `getAttribute()`
and `setAttribute()`
methods to get a grip of the parameters of the Module. The parameter is accessed with the reference variable + `.`
followed by the parameters name.

```
// Get and print the current SaturationAmount
Console.print("Saturation Amount: " + SineWaveGenerator1.getAttribute(SineWaveGenerator1.SaturationAmount));

// Set the SaturationAmount of the SineWaveGenerator to 17%
SineWaveGenerator1.setAttribute(SineWaveGenerator1.SaturationAmount, 0.17);
```

In this way you can get and set the attributes/parameters of every Module. You can take a look at the parameters of each Module in the HISE Modules
chapter.

#### **UIComponent References**

```
// A script reference to a Slider UI Component
const var Knob1 = Content.getComponent("Knob1");
```

Referencing UI Components works in the same way as with Modules. Select a newly created UI Component in the Interface Designers Canvas
in **edit mode**
or in the Component List
and **right-click**
on it. Select **create script reference for selection**
and paste the code in your `onInit`
script.

In a bigger project, you will most likely want to use multiple references. If you select many components and create a **script reference**
it will store them in an Array
that you can iterate over.

Now you can directly `set()`
and `get()`
the properties of the component in your script, which will show up in the Property Editor
as "Overwritten by script".

```
// set and get a UI Components property
Knob1.set("text", "Saturation");
Console.print("text property: " + Knob1.get("text"));
```

The `getValue()`
method will return the current "value" of the UIComponent. It depends on the kind of component which value it returns. Have a look at the UI Components
section for more details.

E.g: a 0-1 value range for Sliders, boolean 0/1 for Buttons, Array-indexes for each ComboBox item, an Array for the SliderPack and a 0-127 range for a Table.

```
// Prints the current value of the UI Component to the Console
Console.print(Knob1.getValue());
```

#### **Create Custom-onControl-Callbacks**

While the above scripts are evaluated only once on initialising the `onInit`
[F5], we may want to use the live values of the UI Components to interact with our plugin/instrument. This is the task of an **onControl Callback**.

It "fires" every time a UI Components value changes on the interface.

**Right-click**
on an UI Component and select **Create custom callback for selection**. Now you can paste the autogenerated code into the `onInit`
Tab. It automatically names the callback function after the Components ID and registers it as a ControlCallback.

```
// Turn the Slider to print its value to the Console
inline function onKnob1Control(component, value)
{
	Console.print(value);
};

Content.getComponent("Knob1").setControlCallback(onKnob1Control);
```

A very common use case for this functionality would be to connect a Slider or Button to a HISE Modules attribute/parameter:

```
// Connect a Slider to the SineWaveGenerators SaturationAmount
inline function onKnob1Control(component, value)
{ SineWaveGenerator1.setAttribute(SineWaveGenerator1.SaturationAmount, value);
};

Content.getComponent("Knob1").setControlCallback(onKnob1Control);
```

But because this behaviour is needed very frequently, theres an extra shortcut for this connection. You can directly link a UI Components value to a Module attribute/parameter with the Components `processorId`
and `parameterId`
properties in the Property Editor.

Nevertheless, the full power of the ControlCallback lies in its scripting flexibility to customize your instruments behaviour regarding incoming values:

```
inline function onKnob1Control(component, value)
{ if (value < 0.5) { Console.print("Value smaller than 0.5: " + value); } else if (value == 1){ Console.print("Ditz!" + value + "!!"); } else { Console.print("Value bigger than 0.5: " + value); }
};

Content.getComponent("Knob1").setControlCallback(onKnob1Control);
```

### HISE Additions

The scripting language of **HISE**
is in fact not Javascript. It has its origin in the non-standard implementation of JUCEs codebase and was extended and customized to fit the requirements of scripting in **HISE**.

This may lead to a few irritations for people who already know Javascript and expect to directly apply their knowledge, acquired from writing.js for the web, to HISE.

You might get some head start compared to novices for sure; but there are a few things that you need to know - and more annoying: **many things you need to forget**.

This chapter provides an overview over every single customisation added to the scripting engine in **HISE**. From now on, the scripting language in **HISE**
will be referred to as **HiseScript**
as opposed to standard **Javascript**. We will take a look at the concepts that have been stripped from Javascript first and then go through the additions.

#### **Object-oriented programming**

**Javascript**
acquired its popularity in the web development ecosystem because it allows powerful data processing using a lean syntax. Yet it was never designed to be a real object-oriented language - it happened to grow and people were doing more and more complex applications so the language reacted and
object-oriented things were added over the time.

If you have used a proper object oriented language like Java or C++ before, everything related to object-oriented programming in Javascript looks a bit quirky.

The desire for object-oriented language features grows with the complexity of the app because it reduces the complexity and redundance. Proper encapsulation ensures the maintainability of the code.

This is only partly true for **HiseScript**, though: the tree structure of **HISE**
already breaks down the complexity into **one script for each task**
and the UI data model tries to keep the code free from declarative boilerplate code as much as possible. More importantly, there are almost no scenarios in **HISE**
where dynamically creating objects is desired:

- UI elements and references to HISE modules have to be created upfront at initialisation.
- You can't allocate in realtime callbacks. Creating objects is out of the question here.

Therefore, most of the language concepts associated with object orientated programming have been removed and replaced with paradigms that suit the two restrictions mentioned above.

#### **No** **new** **operator**

The `new`
operator, which clones an object using the prototype has been removed. This code:

```
function Car(make, model, year)
{ this.make = make; this.model = model; this.year = year;
}

var car1 = new Car('Eagle', 'Talon TSi', 1993);

Console.print(car1.make);
// expected output: "Eagle"
```

will not compile in HISE. Instead, you'll need to create an object wrapped in a function, do something with it and return it:

```
function Car(make, model, year)
{ var obj = {};        // Create an object obj.make = make;     // Set the object properties obj.model = model; obj.year = year;
 return obj;          // return the object.
}

var car1 = Car('Eagle', 'Talon TSi', 1993);

Console.print(car1.make);
// expected output: "Eagle"
```

This concept is known as **Object Factory**. In this example, the code looks more verbose, but it has a big advantage: **You can use existing objects and turn them into the thing you want**. If you take a look at the ScriptPanel documentation, you'll notice that every single code example uses this form:

```
function createFunkyPanel(name, x, y)
{ var p = Content.getComponent(name);   // grab a reference to the panel p.set("something", 5.0);              // do something with it return p;
}

var myPanel = createFunkyPanel("MyPanel", 0, 0);
```

#### **No anonymous variable definitions**

This code is valid Javascript:

```
var MyDatabaseEntry = "Hello";

// 500.000 lines later

MyDataBaseEntry = "Hello again";

// Another 500.000 lines later

if(MyDatabaseEntry == "Hello again")
{ somethingReallyImportant();
}
```

but `somethingReallyImportant()`
will not be executed despite its self-explanatory name. The reason was the typo that defined a new variable `MyDataBaseEntry`
(with a capital `B`
) thus leaving the original variable in its previous state.

Debugging this kind of error is one of the most frustrating experiences, so this code will not compile in **HiseScript**, but throw an error at the line where you want to define `MyDataBaseEntry`. The solution is simple: If you want to create a new variable, use `var`
- or even better, one of the custom variable types like `reg`, `local`
or `const var`, which will be explained later.

There is only one exception to this rule: if you use a `for`
loop, you may declare the counter variable without the `var`
keyword:

```
for(i = 0; i < length; i++) doSomething(i);
```

This is just for convenience and if you're using `i`
as global variable for anything meaningful, you most certainly will have other things to bother about.

#### **Additions**

Reading this page until now might have been a little bit frustrating, but it will get better from now on, because now we will take a look at all the additions that have been added to **HiseScript**. If you have some experience in *C++*, you might recognize some of them, as I have taken a few concepts that I like and transferred it to **HiseScript**.

Most of them are implemented deeply inside the Javascript Parser (or compiler) and offer performance improvements because they can be resolved at compile time.

#### **Custom variable types / function calls**

The default `var`
variable will allocate a new variable in the current scope and is therefore not recommended to use in a realtime environment. However in UI code (or data processing) where you don't have these hard realtime requirements, it is a useful tool and things like recursive function calls or the above mentioned factory function would not be possible otherwise.

Another problem is the standard function call in Javascript which creates a new scope that can be filled with variables. If you read carefully until now, you should know by now that this is a deal-breaker in the audio thread.

In order to make **HiseScript**
realtime-safe, a few new variable types and a new function type were added. If you are going to write code that will end up running in the audio thread, you definitely need to be aware of these concepts and use them over the standard **Javascript**
options:

If you read this inside the HISE documentation window, the following code examples can be executed to show the performance gains. In this case, just comment out the other function and run the script again.

#### **inline functions**

Since the `function`
in Javascript isn't realtime safe but we need the flexibility of it in other areas, a new function type has been introduced: the **inline function**. There are some limitations for the usage of inline functions:

- no constructor (if your function definition is a prototype)
- no recursion
- no more than 5 parameters

If this is the case (which should actually be with 99% of all functions you write in scripts, prepend the function definition with `inline`
and it will be faster (and more predictable):

```
var a = 0;
var b = 1;

function slowFunction(param1, param2)
{
	var sum = param1 + param2;
	return sum;
}

inline function fastFunction(param1, param2)
{
	local sum = param1 + param2;
	return sum;
}

Console.start();
while(a < 200000) a = slowFunction(a, b); // 140 ms
//while(a < 200000) a = fastFunction(a, b); // 45 ms
Console.stop();
```

Inline functions can't be members of Objects, so it might clutter your global scope if you overdo it. You can use them inside namespaces though.

If you read the code example above, you might stumble over the `local`
keyword. This indicates a local variable definition (which can be used in inline functions as well as callbacks). Since it preallocates the storage, it will not affect realtime performance - however this is obviously only true as long as you use primitive types.

#### **Explicit capturing of locally scoped variables**

There are many occasions where you will assign callbacks to certain events in HiseScript and in some cases this will happen inside a function. However if you want to use either a parameter from the outside function or a locally defined variable, the inner function will fail to resolve that variable:

```
inline function someFunction(input)
{
	Engine.showYesNoWindow("Title", "Message", function(ok)
	{
		Console.print(input);
	});
};

someFunction(90);
```

It doesn't matter whether you're using an inline function or a normal function here - the inline function will throw a compile error though so that's a bit clearier than the `undefined`
value that will be used in the standard JS function call...

The solution is again borrowed from C++ (and namely from C++11 lambdas that allow capturing of local variables). The syntax is pretty simple: just put every variable or parameter reference that you want to access in the inner function in a bracket list between the `function`
keyword and the parameter list:

```
inline function someFunction(input)
{
	//                                 This right here: <----->
	Engine.showYesNoWindow("Title", "Message", function [input](ok)
	{
		Console.print(input);
	});
};

someFunction(90);
```

#### **const** **variables**

Prepending `const`
to a variable declaration tells the interpreter that this variable will not be changed and will throw a compile error if you try to do so:

```
const var v = 2; // declare a constant integer value
v = 7;           // ERROR: will not compile
```

It differs from the `const`
keyword in C++ in the way that it doesn't make the variable immutable, but just the reference so you can't reassign it to something else. However this means you can still change properties of objects and pass it to functions that change something:

```
const var a = []; // Declares a const reference
a[0] = 12;        // Stores something in the array
```

Beside the advantages regarding maintainability (you don't have to watch out to not accidently overwrite these variables), using `const`
in conjunction with API calls yields a huge performance boost. This is because it can resolve the function call on compile time:

```
const var Knob = Content.addKnob("Knob", 0, 0);
var slowKnob = Knob;
var i = 0;

Console.start();
while(++i < 200000)
{
	// Knob.getValue();
	slowKnob.getValue();
}
Console.stop();
```

So to sum it up: there is absolutely no reason to not declare UI widgets, references to modules (via `Synth.getModulator()`
etc.) not as `const`, so I strongly recommend you make this your habit.

And if you use magic numbers in your code, declare them as const variables at the beginning, it has literally no performance overhead compared to using literal values:

```
const var MY_MAGIC_NUMBER = 42;

if(MY_MAGIC_NUMBER == 42)
{ //...
}
```

#### **reg** **variables**

If you use globally allocated `var`
variables inside a realtime function, you won't get any problems regarding runtime predictability. However the interpreter has to resolve the variable at runtime, which comes with a little performance overhead. The solution is to use `reg`
instead of `var`
when declaring temporary variables which are accessed in the MIDI (or audio) callbacks. It tells the interpreter to store this in a fixed size container with faster access times:

```
var f1 = 120000;
var i1 = 0;

reg f2 = 120000;
reg i2 = 0;

Console.start();
while(i1 < f1) i1 = i1 + 1;
//while(i2 < f2) i2 = i2 + 1;
Console.stop();
```

If you have a script with lots of variables, the interpreter must search the entire array for every variable access (so the `23 - 40 ms`
are depending on how many other variables are defined in the script while the access time to `reg`
slots stay the same).

You only have **32**
reg storage slots in the global namespace, but it should be enough for most tasks. If you need more, you get additional 32 slots inside each namespace you declare.

#### **Globals.x** **variables**

The Globals object does not contain any methods but acts as preset wide value container for cross-script communication.

```
// In Script Processor 1
Globals.x = 5.72; // Define this in one script

// In Script Processor 2
Console.print(Globals.x) // 5.72
```

This does exactly the same as using the `global`
keyword for variable definition, so you can use whatever syntax you prefer.

#### **Namespaces**

In a ideal world, scripts are little code snippets that fulfill a single purpose and the design of HISE tries to enforce this paradigm as much as possible. However this isn't always the case, especially interface scripts tend to grow pretty quickly and reach a size where you have to think about organizing the structure of your code. A solution for this task in C++ are namespaces which can be used to avoid naming conflicts and to group things that belong together.

In Javascript there is nothing like a namespace concept. Instead you need to create a Object and fill its properties:

```
var MyStuff = {};

MyStuff.property1 =  2;
MyStuff.function1 = function(){ return 2;};

Console.print(MyStuff.property1); // 2
Console.print(MyStuff.function1()); // 2
```

However this has some performance implications (every access needs to resolve the Object name first) as well as some limitations: almost every custom enhancement I added to the scripting engine of HISE like inline functions or `const`
variables can't be members of objects and must be cranked into the global namespace.

In my spirit of taking things from C++ that I like and port it to Javascript, I decided to add the namespace concept to the scripting engine. It is a valuable addition because you get a way of grouping functions and variables without any performance penalty like you do when using objects for it (the parser resolves the namespaces at compile time):

```
const var property1 = 5;

namespace MyStuff
{ const var property1 = 2;
 inline function function1() { return property1; //within namespaces you can either use the prefix or not) };
}

namespace Other
{
	const var property1 = Mystuff.function1(); // works between namespaces
}

MyStuff.function1(); // 2
```

You can see how not having to resolve the object property at runtime affects the performance:

```
namespace MyNamespace
{ reg x = 5;
}

var MyObject =
{ "x": 5
};

reg a = 0;

Console.start();
while(a++ < 200000)
{ //MyNamespace.x = 2; MyObject.a = 2;
}
Console.stop();
```

So far so good. However there are a few things to consider which might seem a bit unintuitive if you're familiar with C++ namespaces.

###### **Leaking of global namespace**

Every namespace is a superset of the global namespace. That means that you can access global variables through the namespace prefix even if it is not defined within the global namespace:

```
reg property1 = 5;

namespace Empty
{

}

Console.print(Empty.property1); // 5
```

This is a side effect of allowing the access to the variable within its namespace with the namespace prefix as well as without (the autocomplete will always spit out the full namespace so it would be pretty stupid to autocomplete faulty stuff).

###### **No nesting of namespaces**

You can't nest namespaces (define namespaces within other namespaces). One level of grouping should be enough even for complex scripts.

###### **No standard** **var** **definitions within namespace**

Namespaces currently work only for `const var`
and `reg`
variables (you'll get another 32 `reg`
slots with every namespace) as well as `inline`
functions. The standard `var`
type implementation doesn't allow the namespace concept so for compatibility reasons it was removed from the namespace parser:

```
namespace Problem
{ var property1 = 5;
}

Console.print(Problem.property1); // 5 (is actual a side effect of the leaking described above)
Console.print(property1); // 5 (should be undefined)
```

###### **No namespace wrapping of** **include()**

A common (but not really recommended) practice in C++ is to wrap `#include`
statements into a namespace definition (this way you don't need to define the namespace in every header file). However this isn't supported in HISE so this won't work:

```
// External File (externalFile.js)
const var property1 = 2;

// Script
namespace External
{ include("externalFile.js");
}

Console.print(External.property1); // undefined
```

Of course you can use namespaces in external files (it would pretty much defeat the purpose of the whole thing if this wasn't possible).

###### **No extension of namespace**

Every namespace must be defined once. In C++ you can take up existing namespaces and add your variables to it, but this isn't supported in **HISE**.

#### **Scoped Statements**

One of the most powerful concepts of C++ is RAII
which means that you have precise control over a lifetime of an object. This is used in various situations to ensure that state changes are always being reverted, even if you forget a branch or the execution throws an error. Let's take a look at this code and how the utilisation of the scoped statement concept will increase both the safety as well as clarity of the code:

```
reg someWorkIsBeingDone = false;

inline function doSomeWork()
{ someWorkIsBeingDone = true;

	if(Engine.getDate().isMonday())
		return;

	if(Engine.getDate().isThursday())
		Console.print(undefined);

	someWorkIsBeingDone = false;
}

inline function someOtherFunction()
{
	while(someWorkIsBeingDone); // do nothing, busywait
}
```

We have a function `doSomeWork()`
and another function `someOtherFunction()`
which is executed on a different thread and must ensure that it's never being executed while `doSomeWork`
is running. Now there are two severe problems with `doSomeWork()`:

1. If you call that function on a Monday, it will return early and forget to set that variable back to `false` so that `someOtherFunction` can resume its task.
2. If you call that function on a Thursday, it will throw a script error leaving the variable `someWorkIsBeingDone` in the `true` state.

Now solving problem 1 can just be solved by not being sloppy and forget to clean up the variable at each branch, however with more complex functions this might be very easy to overlook and also increase the amount of useless boilerplate code because we have to sprinkle that `someWorkIsBeingDone = false;`
line before every return or break statement. Problem 2 is even harder to solve as you somehow have to guarantee that everything always works perfectly and will never cause an issue, which is a bold claim to make.

This is precisely where the scoped statements come in handy as they guarantee a "cleanup" operation whenever the scope (aka `{}`
brackets) is finished. The cause of the cleanup doesn't matter, so a compile error will still perform the cleanup as well as any kind of `return`
or `break`
/ `continue`
statement - and even a compile error in the cleanup stage will resume the cleanup of other statements giving you the absolute guarantee that you'll never leave anything in a intermediate state which is essential for any kind of thread synchronization (and thread synchronization is the main driver behind why I've implemented this concept at all).

##### **General Syntax**

This is a non-standard language addition, so I came up with these syntax rules for a scoped statement. First of all let's define scope as a list of statements that are executed serially. In HiseScript they are easy to spot: whenever you see brackets, you see a scope with the sole exception of brackets defining a JSON object:

```
inline function dudel()
{ // SCOPE!
	if(x == 0)
	{ // SCOPE!
		for(i = 0; i < 1290; i++)
		{ // SCOPE!
		}
	}

	if(x == 90)
		Console.print(x); // NOT A SCOPE, no brackets!

	{// SCOPE!
		{ // SCOPE!
		}
	}
}

namespace dudel
{ // SCOPE!
}

{ // SCOPE!
	const var obj =
	{ // NOT A SCOPE !!!!
		"myValue": 12
	};
}
```

Now we can define the syntax of a scoped statement

1. Scoped statements must be the first statements of a scope. If you add a scoped statement after you've added a normal statement (anything else except for comments and preprocessor conditions), it will throw an error.
2. A scoped statement is preceded by a dot followed by the statement name and its arguments: `.statement(args...)`. The statement name must be one of the inbuilt statement types which are listed below.
3. Scoped statements can be chained together to combine multiple scoped statements in one scope: `.statement1(args).statement2(args)` Important: the cleanup phase will be executed in reverse, so the last scoped statement will be cleaned up first
4. A semicolon must be put at the end of a scoped statement chain (or even a single statement) to tell the parser to stop parsing scoped statements: `.statement1(args).statement2(args);`
5. A scoped statement can be excecuted conditionally by using the `if(condition):statement(args)` syntax. The condition is a usual HiseScript expression and the operation as well as the cleanup phase will only be executed if the expression is true.

Here are a few example use cases of these rules:

```
// Hello world:
{.print("hello";
	Console.print("world");
}
// => Output: enter hello, world, exit hello

// Inverse order at cleanup:
{.print("hello").print("world";
}
// => Output: enter hello, enter world, exit world, exit hello

// Conditional execution
{.if(Math.random() > 0.5):print("50% chance that this happens");
}
// => Output (maybe): enter 50% chance that this happens exit 50% chance that this happens

/* Illegal syntax:
{.print("wrong")
	Console.print("forgot a semicolon");
}

{
	Console.print("wrong order");.print("must come before the other statement"
}
*/
```

Now before we take a look at all the available statements, let's go back to that example from the start. What we want to achieve is to make sure that the `isWorkBeingDone`
variable is guaranteed to be set back to false, no matter how we leave that function. For this we use the `set`
statement, which takes two arguments, a variable and a value which will be set temporarily. When the scope is finished, it will be set back to whatever value was before (this allows you to chain different set statements and make sure that at the end it will be in the original state:

```
inline function doSomeWork()
{.set(someWorkIsBeingDone, true);

	if(Engine.getDate().isMonday())
		return;

	if(Engine.getDate().isThursday())
		Console.print(undefined);
}

inline function someOtherFunction()
{
	while(someWorkIsBeingDone); // do nothing, busywait
}
```

As you can see, the function code is both clearer (because we can omit the last line) and 100% more safe, which is a double win for the scoped statements. I've also went the extra mile of indicating any scope with scoped statements in the code editor fold display (so the foldable ranges of a scoped statement will be coloured as well as the background of a scoped statement) which you will see if you paste these example into the HISE code editor.

##### **List of scoped statements**

Now that we've defined the general syntax and purpose, let's take a look at the list of all available scoped statements. In general there are two different types of statements: debug statements and logic statements. Debug statements will perform a task that is usually used during development: measuring the time, logging something or dumping a value of some variables. These statements will be **removed**
in the exported plugin (same as with all `Console.xxx()`
calls). Logic statements will have a real impact on the program logic and thus will be executed in both cases.

###### **Debug statements**

**Statement** | **Arguments** | **Description** || `.print` | `(expression)` | Prints `enter expression` and `exit expression` when entering and leaving the scope. |
| `.profile` | `(ID)` | Starts a profiling session (if `HISE_INCLUDE_PROFILING_TOOLKIT` is enabled) of the scope including all child statements. |
| `.trace` | `(ID)` | Creates a named item for the given scope when profiling. Use this to quickly find the code in a complex profiling session. |
| `.dump` | `(e1, e2,...)` | Dumps whatever variables you put in there at the beginning and the end of the scope. |
| `.count` | `(ID)` | Counts the number of times that this scope is executed (reset at compilation). |
| `.before` | `(actual, expected)` | Checks the equality of the two expressions **at the beginning of the scope** and throws a compile error if they don't match. |
| `.after` | `(actual, expected)` | Checks the equality of the two expressions **at the end of the scope** and throws a compile error if they don't match. |

In general, all these statements do not bring something revolutionary new to the table (with the exception of `.trace()`, which is a unique feature that only makes sense with a scoped statement), but can rather be considered as quality of live improvements over their `Console.xxx()`
counterparts that makes coding in HISE a little bit more pleasant. Some remarks:

- most of the statements produce a console output that includes a gibberish string containing an encoded location, so you can double click on it and it will take you directly to the statement that caused the console output. The days of searching leftover Console.print() statements which clog up the console are finally over...
- the `dump` method manages to resolve the variable names (without the namespace) if you put in an expression that resolves to a single variable, which is nice so you don't have to do weird string concatenations to get a meaningful console output. Also it dumps every argument on a single line which looks a bit nicer than the `trace()` function.
- the `before` and `after` statements can be used to make fixed assumptions of what the function is supposed to do and can act as both documentation and error check at once.

```
//! DUMP EXAMPLE ============================================

var x = 125;
var obj = { "id": 12 };

{.dump(x, obj);
	x = 900;
	obj.id = "funky";

	// this would be the equivalent which is much more annoying to type
	Console.print("obj: " + trace(obj) + "x: " + trace(x));
}

/* Console Output:

// 			       double click here to get to the code
// 									|
//									V
Interface: dump before: {SW50ZXJmYWNlfHw5M3wxNXw3}
> x = 125
> obj = {"id": 12}

Interface: dump after: {SW50ZXJmYWNlfHw5M3wxNXw3}
> x = 900
> obj = {"id": "funky"}
*/

//! BEFORE / AFTER EXAMPLE ==================================

// If this condition isn't true, the function will
// throw an error
reg someCondition = true;
reg someOtherCondition = false;

inline function getDoubleValue(x)
{
	// these statements at the top tell us exactly.before(someCondition, true) // what the function is expecting and.after(someOtherCondition, true); // what the function is supposed to do

	// If you fail to set the other condition in the
	// function (which you can simulate by commenting
	// out that line, it will throw an error).
	someOtherCondition = true;

	return x * 2;
}
```

###### **Logic statements**

Now we get to the real juicy stuff. The guaranteed cleanup operation gives us the ability to add some powerful functions to HiseScript which I was a bit hesitant to offer before because the consequences of forgetting the cleanup would be too severe including dead locks and UI freezes. The functionality basically boils down to two reasons:

1. Controlling the event notification system
2. Synchronizing the data access between threads

**Statement** | **Arguments** | **Description** || `.set` | `(variable, tempValue)` | temporarily sets the given variable to the temp value and resets it after the scope. |
| `.call` | `(callable, args...)` | calls the given object (either function or broadcaster) with the given arguments at the beginning and end of the scope. |
| `.lock` | `(Threads.XXX)` | Locks the given thread for the duration of the scope. This performs additional safe checks to avoid common mistakes that lead to deadlocks. |
| `.defer` | `("path")` | This suspends all notifications for the given path until the scope is done. |
| `.bypass` | `(broadcaster, send)` | temporarily deactivates the given broadcaster and sends a message after the scope when `send` is true. |

We already know our little buddy `set`
in our example, however in a real world project we wouldn't roll our own solution for multithreaded synchronisation but rather rely on its powerful friend, the `lock`
statement. Since this is a language guide, describing the concepts behind `lock`
and `defer`
is out of the scope of this document (hihihi), so if you want to know more about that, keep reading here:

- Read up on the Threads API class for a detailed explanation of the threading model in HISE and how to apply it.
- Read up on the `Event Notification` chapter of the HISE documentation (tbd) for a detailed description of the `defer` statement.

#### **Type safety**

Javascript (and therefore HiseScript) is a so-called dynamic language. This means that variables can change their type during the lifetime of the program:

```
var x = "I'm a string";
x = ["Now", "I'm", "a", "Array"];
x = { "Did": "somebody", "say": "JSON????" };
x = 42;
```

This flexibility makes it extremely easy to write programs because you even don't need to know what types are in order to create the logic you're after. It also removes a lot of boilerplate code of converting the types to match the expected type.

However there are also a few examples of how the automatic type conversion produces glitches and issues (eg. seen here
)

I'm not onto a revolutionary new approach to programming here - there is actually a typesafe variant of Javascript around called TypeScript - but I thought a bit about how to add some optional type-safety to HiseScript. So I've made a few additions to the HiseScript language which are completely optional and backwards compatible.

In fact there is one breaking change, but this is because I realized that under certain circumstances (calling a API call on an object that is stored in a list) the check for undefined parameters for the function call was bypassed, so if you're scripts stop compiling or throw an error during runtime, you'll most likely had a undetected undefined parameter in a function call.

The type-safety is applied to these concepts:

- API calls so you can't call `Message.setNoteNumber()` with a String or a JSON object (implenting this for the full HISE API will be a longer process because it requires to change all wrapper code definitions so I'll add the type safety over time)
- `reg` variables.
- `const var` variables do not need to be type-safe as they are already typesafe because they are initialised with a fixed type.
- `inline functions` can have a return type and a well-defined type for each parameter. These types will be then evaluated during runtime (only in HISE, there is not a single CPU cycle overhead in your compiled project)

For the syntax of defining types, I've tried to stick as much as possible to the type script syntax (with the exception of defining return types of inline functions).

```
// a reg variable that must always be an integer
reg:int myVariable = 90;
h
myVariable = 125; // OK
myVariable = "Didn't get the memo"; // Will not compile
myVariable = undefined; // this will compile as special case
						// to allow resetting values

// making a function parameter typesafe by prepending a type token
// You can only declare selected parameters as typesafe
inline function doSomething(x: int, unsafe)
{
	Console.print(typeof(unsafe)); // this can be anything
}

doSomething(90, 1); // OK
doSomething(90, [1, 2, 3]); // Still OK
//doSomething("Didn't get the memo", [1, 2, 3]); // Will not compile

// Define a static return type by adding a type token before the function name
inline function: int getSomeInteger()
{
	return 124; // OK
	//return "Didn't get the memo"; // Will not compile
}
```

Below is a list of all available type identifiers you can use. There are two types of type IDs: elementary types and composite types which define a combination of elementary types so that you can allow multiple types to be passed into the function.

**ID** | **Type** | **Description** || `int` | elementary | an integer number |
| `double` | elementary | a floating point number |
| `string` | elementary | a string variable |
| `Array` | elementary | the Javascript array |
| `Buffer` | elementary | The inbuilt float array type in HISE to represent audio signals |
| `ObjectWithLength` | composite | Anything that has the `length` property (So a string, an array or a buffer) |
| `JSON` | elementary | a JSON object |
| `ScriptObject` | elementary | a object that was created with the API to interact with HISE (eg. the TransportHandler or a File object) |
| `Function` | elementary | A callable object (either a function or a broadcaster) |
| `number` | composite | either a int or a double number. Note: it's highly advised to use this over the elementary types because of the very loose type | `object` | composite | either a JSON object or a ScriptObject |
| `Colour` | composite | either a string ("0xFFRRRGGBB") oder a integer number (0xFFRRGGBB). It's called Colour because the most likely use case for this will be colour variables but you can use it whenever you need either a number or a string. |
| `ComplexType` | composite | Anything that is not a number |
| `NotUndefined` | composite | Anything but not undefined |

If the mixing of uppercase and CamelCase triggers your OCD, rest assured that this is not a case of me being sloppy but trying to use the existing type IDs from Java/Typescript (eg `number`
) but for the complex types like `Array`
and `Buffer`
I have to stick to the existing HiseScript identifiers.

#### **C Preprocessor**

All C-based languages have a preprocessor that will process the code files before they are send to the compiler. They are usually performing simple replace operations and conditional compilation of files.

Adding this concept to HiseScript gives a few advantages:

- you can "physically" exclude scripting code from being included in the plugin (eg. if you have a plugin with some kind of demo functionality and want to avoid unlocking the demo by changing a simple flag in the embedded scripting code)
- you can define global constants which will be replaced in every script
- you can query the extra definitions that are passed to the C++ compiler on export and modify your scripts
- you can quickly deactivate parts of the code without resorting to commenting out the code
- the code editor in HISE will grey out code that will not be compiled which is pretty helpful

The preprocessor implementation in HISE is not fully standard compliant and these directives are not supported:

```
#ifdef
#undef
#pragma
#include
```

so that leaves these directives that are implemented:

```
#if
#elif
#else
#endif
#define
#error
```

There is plenty of documentation available on how to use preprocessors, but a good overview is available here:

https://www.tutorialspoint.com/cprogramming/c\_preprocessors.htm

#### **Using the preprocessor**

By default the preprocessor is disabled. This is because there is a slight overhead in compilation time so unless you really want to use it there's no need to add this overhead. In order to activate the preprocessor, you have two options:

1. Set the **EnableGlobalPreprocessor** flag in the Project Settings. This will enable the preprocessor for all scripts in the project
2. Add the custom directive `#on` at the beginning of each file that you want to process.

If you haven't activated the preprocessor, you're most likely will get an error message like `Found '#' when expecting a statement`.

#### **How the preprocessor is used in HISE**

It's important to know when and how the preprocessor in HISE is used in order to take full advantage over the system. There are two important rules here:

1. Just like SNEX and FAUST, the preprocessor will never have to work in the exported plugin. During development it will be evaluated each time you recompile the script, but if you export the plugin, the preprocessor will process the script code that is about to be embedded in the binary **so that the processed code is embedded** with the current preprocessor definitions.

1. The preprocessor is global so any `#define` directive will be available in all other scripts. You can also use all preprocessor directives that you've added to the **ExtraDefinition** field (and also all compiler flags you pass in as command line argument `-D:NAME=VALUE` when you export a plugin from the command-line

### HISE Javascript Tutorial

To make **HISE Scripting**
perform well in a Audio-DSP context, a few major adaptations had to be made to it's JavaScript-Engine Implementation. It does'nt include the latest [ES6] specifications and had also to be stripped of a few known JS paradigms and is therefore not fully standard compliant. Take a look at HISE Additions
for the main differences between a standard JavaScript and the HiseScript implementation.

This Tutorial builds upon the A re-introduction to JavaScript
Tutorial, reduced to the scope of Scripting in **HISE**.

##### **Overview**

JavaScript is an object oriented dynamic language with types and operators, standard built-in objects, and methods. Its syntax is derived from the Java and C languages so many structures from those languages apply to JavaScript as well.

One of the key differences is that JavaScript does not have classes. Instead, the class functionality is accomplished by object prototypes. The other main difference is that functions are objects, giving functions the capacity to hold executable code and be passed around like any other object.

#### **Data Types**

Let's start off by looking at the building block of any language: the types. JavaScript programs manipulate values, and those values all belong to a type. JavaScript's types are:

- `Number`
- `String`
- `Boolean`
- `Object`
- `Array`
- `Function`

Arrays and Functions are special kinds of Objects.... oh, and `undefined`
and `null`, which are... slightly odd.

##### **Numbers**

Numbers in JavaScript are "double-precision 64-bit format IEEE 754 values", according to the spec. This has some interesting consequences. There's no such thing as an integer in JavaScript, so you have to be a little careful with your arithmetic if you're used to math in C or Java. Watch out for stuff like:

```
0.1 + 0.2 == 0.30000000000000004
```

In practice, integer values are treated as 32-bit ints (and are stored that way in some browser implementations), which can be important for bit-wise operations.

The standard arithmetic operators are supported, including addition, subtraction, modulus (or remainder) arithmetic and so forth. There's also a built-in object that I forgot to mention earlier called Math
if you want to perform more advanced mathematical functions and constants:

```
var r = Math.sin(3.5);
var circumference = Math.PI * (r + r);
```

You can convert a string to an integer using the built-in parseInt() function. This takes the base for the conversion as an optional second argument, which you should always provide:

```
parseInt("123", 10); // 123
parseInt("010", 10); // 10
```

If you don't provide the base, you can get surprising results:

```
parseInt("010"); // 8
```

That happened because the parseInt() function decided to treat the string as octal due to the leading 0.

JavaScript has the special values Infinity and -Infinity:

```
1 / 0; //  Infinity
-1 / 0; // -Infinity
```

The parseInt() and parseFloat() functions parse a string until they reach a character that isn't valid for the specified number format, then return the number parsed up to that point. However the "+" operator simply converts the string to NaN if there is any invalid character in it. Just try parsing the string "10.2abc" with each method by yourself in the console and you'll understand the differences better.

##### **Strings**

Strings in JavaScript are sequences of characters. More accurately, they are sequences of Unicode characters, with each character represented by a 16-bit number.

```
"hello"
```

To find the length of a string, access its length property:

```
"hello".length; // 5
```

There's our first brush with JavaScript objects! Did I mention that you can use strings like objects too? They have methods as well that allow you to manipulate the string and access information about the string:

```
"hello".charAt(0); // "h"
"hello, world".replace("hello", "goodbye"); // "goodbye, world"
"hello".toUpperCase(); // "HELLO"
```

String API

##### **Boolean**

JavaScript has a boolean type, with two possible values `true`
and `false`
(both of which are keywords). Any value can be converted to a boolean according to the following rules:

1. `false`, `0`, the empty string `("")`, `NaN`, `null`, and undefined all become `false`.
2. all other values become `true`.

However, conversion is rarely necessary, as JavaScript will silently perform this conversion when it expects a boolean, such as in an if statement
For this reason, we sometimes speak simply of "true values" and "false values," meaning values that become true and false, respectively, when converted to booleans. Alternatively, such values can be called "truthy" and "falsy".

Boolean operations
such as `&&`
(logical and), `||`
(logical or), and `!`
(logical not) are supported.

##### **null / undefined**

JavaScript distinguishes between `null`, which is a value that indicates a deliberate non-value (and is only accessible through the null keyword), and `undefined`, which is a value of type `undefined`
that indicates an uninitialized value — that is, a value hasn't even been assigned yet. In JavaScript it is possible to declare a variable without assigning a value to it. If you do this, the variable's type is undefined. `undefined`
is actually a constant.

#### **Variables**

New variables in JavaScript are declared using the var keyword:

```
var a;
var name = "simon";
```

**HISE Advice:**
Because of the real-time-safe requirements of **HISE**
the declaring of `var`
variables is discouraged in all audio related callbacks since it will result in unpredictable performance with drop outs & stuff. Best practice is to declare all variables in the `onInit()`
callback and assign values to the variable in the other callbacks.

HiseScript also features four other ways of declaring variables:

- const variables
- reg variables
- global variables
- local variables

Please have a look at the HISE Additions Chapter
to learn more about custom variables and scopes in **HISE**.

An important difference from other languages like Java is that in JavaScript, blocks do not have scope; only functions have scope. So if a variable is defined using `var`
in a compound statement (for example inside an if control structure), it will be visible to the entire function.

#### **Operators**

JavaScript's numeric operators are `+`, `-`, `*`, `/`
and `%`
- which is the remainder operator. Values are assigned using  `=`, and there are also compound assignment statements such as `+=`
and `-=`. These extend out to `x = x  y`.

```
x += 5
x = x + 5
```

You can use `++`
and `--`
to increment and decrement respectively. These can be used as prefix or postfix operators.

The `+`
operator also does string concatenation:

```
"hello" + " world"; // "hello world"
```

If you add a string to a number (or other value) everything is converted in to a string first. This might catch you up:

```
"3" + 4 + 5;  // "345"
 3 + 4 + "5"; // "75"
```

Adding an empty string to something is a useful way of converting it.

Comparisons in JavaScript can be made using `<`, `>`, `<=`
and `>=`. These work for both strings and numbers. Equality is a little less straightforward. The double-equals operator performs type coercion if you give it different types, with sometimes interesting results:

```
"dog" == "dog"; // true
1 == true; // true
```

To avoid type coercion, use the triple-equals operator:

```
1 === true;    // false
true === true; // true
```

There are also `!=`
and `!==`
operators.

JavaScript also has bitwise operations. If you want to use them, they're there.

#### **Control structures**

JavaScript has a similar set of control structures to other languages in the C family. Conditional statements are supported by **if**
and **else**; you can chain them together if you like:

##### **If / else**

```
var name = "kittens";
if (name == "puppies") { name += "!";
} else if (name == "kittens") { name += "!!";
} else { name = "!" + name;
}
name == "kittens!!"
```

##### **For loop**

JavaScript's **for loop**
is the same as that in C and Java: it lets you provide the control information for your loop in a single line.

```
for (var i = 0; i < 5; i++)
{ // Will execute 5 times
}
```

This variant with a pre-defined `reg`
variable is a bit faster though.

```
reg i = 0;
for (i; i < 5; i++)
{ // Will execute 5 times
}
```

You can loop through an array with the `for (i in array)`
syntax.

```
const var array = [1,2,3,4]
for (i in array)
{ Console.print(i);
}
```

**IMPORTANT:**
Go easy on the loops in the MIDI callbacks.

##### **While loops**

JavaScript has **while loops**
and **do-while loops**. The first is good for basic looping; the second for loops where you wish to ensure that the body of the loop is executed at least once:

```
while (true) { // an infinite loop!
}

var input;
do { input = get_input();
} while (inputIsNotValid(input))
```

##### **AND / OR operators**

The `&&`
(AND) and `||`
(OR) operators use short-circuit logic, which means whether they will execute their second operand is dependent on the first. This is useful for checking for null objects before accessing their attributes:

```
var name = o && o.getName();
```

Or for setting default values:

```
var name = otherName || "default";
```

##### **Ternary operator**

JavaScript has a **ternary operator**
for conditional expressions:

```
var allowed = (age > 18) ? "yes": "no";
// if (condition == true) ?(become) "yes":(else) "no";
```

##### **Switch statement**

The **switch statement**
can be used for multiple branches based on a number or string:

```
switch(action) { case 'draw': drawIt(); break; case 'eat': eatIt(); break; default: doNothing();
}
```

If you don't add a break statement, execution will "fall through" to the next level. This is very rarely what you want — in fact it's worth specifically labeling deliberate fallthrough with a comment if you really meant it to aid debugging:

```
switch(a) { case 1: // fallthrough case 2: eatIt(); break; default: doNothing();
}
```

#### **Objects**

JavaScript objects can be thought of as simple collections of "name-value pairs". As such, they are similar to:

- Dictionaries in Python
- Hash tables in C and C++
- HashMaps in Java
- Associative arrays in PHP

The fact that this data structure is so widely used is a testament to its versatility. Since everything (bar core types) in JavaScript is an object, any JavaScript program naturally involves a great deal of hash table lookups. It's a good thing they're so fast!

The "name" part is a JavaScript string, while the value can be any JavaScript value — including more objects. This allows you to build data structures of arbitrary complexity.

There is only one way to create an a plain object. (The new operator
is not supported in **HISE**
)

```
var obj = {};
```

This is called the \_object literal syntax\_, and is more convenient. This syntax is also the core of the `JSON`
format and should be preferred at all times.

Object literal syntax can be used to initialize an object in its entirety:

```
var obj = { name: "Carrot", "for": "Max", details: { color: "orange", size: 12 }
};
```

Attribute access can be chained together:

```
obj.details.color; // orange
obj["details"]["size"]; // 12
```

#### **Arrays**

Arrays in JavaScript are actually a special type of object. They work very much like regular objects (numerical properties can naturally be accessed using [] syntax) but they have one magic property called 'length'. This is always one more than the highest index in the array.

One way of creating arrays is as follows:

```
var a = [];
a[0] = "dog";
a[1] = "cat";
a[2] = "hen";
a.length; // 3
```

**HISE**
does not support the `var a = new Array()`
definition style.

A more convenient notation is to use an array literal:

```
var a = ["dog", "cat", "hen"];
a.length; // 3
```

Note that array.length isn't necessarily the number of items in the array. Consider the following:

```
var a = ["dog", "cat", "hen"];
a[100] = "fox";
a.length; // 101
```

Remember — an array index starts with `0`. The length of the array is therefore one more than its highest index.

If you query a non-existent array index, you get `undefined`:

```
typeof a[90]; // undefined
```

If you take the above into account, you can iterate over an array using the following:

```
for (var i = 0; i < a.length; i++) { // Do something with a[i]
}
```

This is slightly inefficient as you are looking up the length property once every loop. An improvement is to declare the array-length variable up-front

```
const var len = a.length;
for (var i = 0, i < len; i++) { // Do something with a[i]
}
```

You can iterate over an array using a for...in loop.

```
for (value in a) { Console.print(value);
}
```

If you want to append an item to an array simply do it like this:

```
a.push(item);
```

Arrays come with a number of methods. See the full API documentation for Array
methods.

Array API

#### **Functions**

Along with objects, functions are the core component in understanding JavaScript. The most basic function couldn't be much simpler:

```
function add(x, y) { var total = x + y; return total;
}
Console.print(add(2,3));
```

This demonstrates a basic function. A JavaScript function can take 0 or more named parameters. The function body can contain as many statements as you like, and can declare its own variables which are local to that function. The return statement can be used to return a value at any time, terminating the function. If no return statement is used (or an empty return with no value), JavaScript returns undefined.

The named parameters turn out to be more like guidelines than anything else. You can call a function without passing the parameters it expects, in which case they will be set to undefined.

```
add(); // NaN
// You can't perform addition on undefined
```

You can also pass in more arguments than the function is expecting:

```
add(2, 3, 4); // 5
// added the first two; 4 was ignored
```

Note that JavaScript functions are themselves objects and you can add or change properties on them just like on objects we've seen in the Objects section.

Take a look at inline functions
for function with scope.

### HiseScript Coding Standards

#### **Introduction**

The goal of this document is to provide a set of rules that can be followed to produce clean and readable HISE script. Through the use of such a framework developers can share code and have a high level of confidence that others will be able to read, understand, modify, and maintain it without too much difficulty. Although some elements of this guide aim to encourage better coding practices, following these guidelines will not guarantee that your code is bug free or efficient, but it will be readable.

HISE script is born from a mixture of Javascript and C++; This guide tries to follow pre-existing conventions for those languages with particular inspiration taken from the JUCE Coding Standards, LLVM Coding Standards, and the Airbnb Javascript style guide. Other elements, unique to HISE, are based upon Christoph's blogs, documentation, and forum posts, and the default behaviour of the HISE script editor when possible.

#### **General Formatting**

##### **Source Headers**

At the top of every source file there should be a header section that includes a copyright notice and the license under which the source code is published. This is especially important when using a free license such as the GNU GPL or MIT.

```
/*
- --------------------------------------------------------------------------
*
- Copyright

- Permission is hereby granted, free of charge, to any person obtaining a copy of
- this software and associated documentation files (the "Software"), to deal in
- the Software without restriction, including without limitation the rights to
- use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies
- of the Software, and to permit persons to whom the Software is furnished to do
- so, subject to the following conditions...
*
- --------------------------------------------------------------------------
*/
```

##### **Comments**

- Source code should generally be self documenting through the use of meaningful variable and function names. However it can be helpful to include comments to improve readability and maintainability. Use comments to describe what a section of code does rather than how it does it.
- Comments up to a few lines in length should use `//` rather than `/**/`. This makes it easier to comment out larger blocks when debugging.
- For large sections of comment you should use `/**/`
- Multiline comments should be vertically aligned to the left.

```
// Bad
/*
 */

// Good
/*
*/
```

- Always leave a space before the text of a comment, e.g. `// Foobar`
- Code that is commented out during development and testing should be uncommented or removed before release.
- Using comments like `// FIXME:` or `// TODO:` to indicate problems or needed revisions is fine, but it's better to fix the problem or implement the revision instead.

##### **Line length**

- The usual practice is to limit lines to 80 columns, however this is unnecessarily restrictive on modern large screens. Keep lines as short as possible but, for the sake of readability, favour a longer line over a single command spanning multiple lines. If the line is really long it might be better to break it up into multiple shorter lines.
- When splitting expressions containing operators across multiple lines each new line should begin with the operator symbol.

```
const x = 1 + 12 * 100 - 50;
```

##### **White space**

- Remove trailing white space from the ends of lines.
- Never put a space before a comma.
- Always put a space after a comma in single line statements.
- Leave a blank line before if statements, loops, and function declarations.
- Leave a blank line between blocks.
- Don't pad blocks with unnecessary blank lines.

```
//Bad
inline function doSomething()
{
 Console.print("FooBar");

}

//Good
inline function doSomething()
{ Console.print("FooBar");
}
```

- Put a space before the open parentheses of control flow statements (if, for, switch, etc.).

```
// Bad
if(x == 1)

// Good
if (x == 1)
```

- Don't add extra spaces inside parentheses, braces, or brackets.

```
// Bad
const fish = [ "Shark", "Gold", "Trout", "Salmon" ];

// Good
const fish = ["Shark", "Gold", "Trout", "Salmon"];
```

#### **Statements**

- Curly braces should use Allman style indentation.

```
function myFunction()
{
}
```

- Omit curly braces for if statements and loops that only contain one line.

```
// Bad
if (x == 1)
{ doSomething();
}

// Good
if (x == 1) doSomething();
```

##### **If**

- In an if-else statement where there is more than one branch, all branches should be formatted the same way.

Either all of them use braces, or none of them use braces.

- Do not write if statements all-on-one-line unless it's a set of similar consecutive statements, and by aligning them it makes it clear to see the pattern of similarities and differences.

```
if (x == 1) return "one";
if (x == 2) return "two";
if (x == 3) return "three";
```

##### **Ternary**

- Ternaries should not be nested and should be written on a single line.

If it spreads over multiple lines use an `if-else`
instead.

- Avoid unneeded ternary statements.

```
// Bad
const foo = a ? false: true;

// Good
const foo = !a;
```

##### **Switch**

- Leave an empty line between each case.
- `break` statements should be indented one level more than their case statement.

```
switch (value)
{ case 0: doSomething(); break;
}
```

- There is no need to use braces for each case but if you do it for one case you should do it for all cases.

```
switch (value)
{ case 0: { doSomething(); break; }
 case 1: { doSomethingElse(); break; }
}
```

- Don't declare variables within a case statement.

Cases don't have their own scope. If you declare a variable within a case statement and that case is reached, the variable will be available outside of the switch statement too. Declare the variable outside of the switch statement so its scope is clear from the start.

```
// Bad
const c = 1;

switch (c)
{ case 1: var pizza = "Cheese"; Console.print(pizza); break;
}

Console.print(pizza);

// Good
const c = 1;
const pizza = "Cheese";

switch (c)
{ case 1: Console.print(pizza); break;
}

Console.print(pizza);
```

- Not every case needs a break statement. If no break is present the program flow will fall through subsequent cases until a break is reached.

```
const c = 1;

switch (c)
{ case 1: Console.print("Hello");
 case c > 0: Console.print(" World"); break;
}
```

- When used, the `default` case should be the last case of the switch statement. It doesn't need to be followed by a `break`.

```
const c = 10;

switch (c)
{ case 1: Console.print("First Case"); break;
 default: Console.print("Default!!!");
}
```

##### **Loops**

- Prefer `for... in` over regular `for` loops.

Use `for`
loops when you need access to the current iteration, e.g. `i`.

- Inline functions that contain `for` loops, and will be called by other `for` loops, should have their iterators declared as `local`.

This is because by default iterators exists in the global scope, declaring the function's iterator as `local`
prevents it conflicting with the global version.

```
for (i = 0; i < 10; i++) Console.print(i + getSecondValue());

inline function getSecondValue()
{ local i;
 for (i = 10; i < 20; i++) return i;
}
```

- With `for...in` loops use either `x` or the first letter of the object as the variable name.

When using nested `for...in`
loops use appropriate variable names based on the names of the objects being looped, following the rule above when possible.

```
for (x in modulators) return x.get("id");

// Or
for (m in modulators) return m.get("id");
```

#### **Variables**

- All constant references (components, modules, etc.) should be declared upfront in the `on init` callback before they are used in other parts of the script.
- If you're declaring and initializing a group of related variables you can wrap them inside an inline function.

- Declare multiple short variables on the same line when they are related. e.g. `reg a = 0, b = 1, c = 2;`.

> When there are many variables or they have longer names it is better to use a namespace or object.

##### **Naming**

- Variable names should be written in camel-case, e.g. `theCamelsHump`.
- Fixed constants, with a value that will never change, should be declared in all caps with underscores between each word. The declarations should be placed near the top of the script or namespace, e.g. `NUMBER_OF_BUTTONS=10`.

This improves readability as such variables will clearly standout.

- Global variable names should be prefixed with `g_`.

```
// Bad
global myVariable = 1;
global myGlobalVariable = 2;

// Good
global g_myVariable = 1;
```

- Variable names should be meaningful and will generally be nouns.

```
// Bad
const j = "Luke";

// Good
const jedi = "Luke";
```

- It's okay to use single char variables as loop variables/iterators or as arguments to simple functions.

```
function divider(a, b)
{ return a / b;
}
```

- Variable names should not include the type of value the variable contains (aka Hungarian Notation ).

```
// Bad
var boolIsActive = true;

// Good
var isActive = true;
```

- Acronyms and initialisms should always be all uppercased or all lowercased.

- There is a Javascript convention of prefixing private variables with an underscore but this should be avoided.

This is because there is no such thing as private variables in Javascript or HISE script. Indicating that these fully public variables are private could mislead a developer into thinking a change won't affect another part of the program.

```
// Bad
namespace Clown
{ const _Bozo = "Twister"; const _balloonAnimals = ["Cat", "Dingo", "Robert Frost"];
}
```

##### **Types**

###### **var**

- Declare variables as `var` within paint routines, mouse callbacks, regular functions, and custom timer callbacks.

> var may occasionally be needed in other parts of your script but avoid using it if there is an alternative.

- Don't declare `var` variables directly inside a namespace. Use `reg` instead.

> The scope of a var is not limited to the namespace in which it is declared.

```
// Bad
namespace MyNamespace
{ var aVariable = 10;
}

Console.print(aVariable); // 10

// Good
namespace MyNamespace
{ reg aVariable = 10;
}

Console.print(aVariable); // undefined
Console.print(MyNamespace.aVariable); // 10
```

###### **const**

- Declare variables as `const` for all fixed values in the `on init` callback.

- Use `const` instead of `const var`

> There is no functional difference between the two so the var is unnecessary.

- Always use `const` for MIDI lists.

- Arrays should be declared as `const` unless it is being populated directly from another array.

###### **reg**

- Use `reg` when declaring temporary variables which are accessed in the audio callbacks.
- Don't declare `reg` variables inside inline functions.
- Use `reg` variables in namespaces for all non `const` declarations. If you exceed the 32 `reg` limit you should try to make your code more modular by creating additional namespaces.

###### **local**

- Declare variables as `local` within inline functions and callbacks.

###### **global**

- Try to avoid using global variables as much as possible.

They impact portability, complicate maintenance, obscure program flow, and reduce readability.

- Global variables should be declared using the `global` keyword rather than as direct properties of the `Globals` object.

This is because the HISE editor will highlight the `global`
keyword, improving readability.

```
// Bad
Globals.g_myGlobalVariable = 50;

// Good
global g_myGlobalVariable = 50;
```

- For larger projects it's a good idea to declare all global variables in an external script file called `Globals.js` and include it at the top of your interface script.

- The scope of global variables is across all execution instances until you quit HISE.

If your programme sets a global variable, the next time you run (compile) your programme, that variable will have the value set during the previous execution instance.

##### **Numbers**

- Floating point numbers should have at least one digit before and after the dot.

```
// Bad
const foo =.1;

// Good
const foo = 0.1;
```

- Hexedecimal numbers should be lowercase, e.g. `0xff45abcd`.
- Prefer defined constants over hex values when possible.

You can use built-in constants, define consts, or use an enum.

```
// Bad
g.fillAll(0xffff0000);

// Good
g.fillAll(Colours.red);
```

- When possible, use the colour properties of components rather than hex values or colour constants.

##### **Strings**

- Use double quotes around string values.
- Avoid dynamic string manipulations in the audio callbacks.

##### **Objects and Arrays**

- Never declare objects or arrays inside the audio callbacks.
- When working with simple data types (numbers, strings, bools, etc.) you are working directly on the variable's value. With complex data types (arrays, objects) you are working on a reference to the value.
- Prefer namespaces to objects when appropriate.
- Prefer `Array.push()` over direct assignment to an index.
- Call reserve() before pushing large amounts of data to an array:

```
const NUM_ELEMENTS = 100000;
const badList = [];
const goodList = [];

// Bad
Console.start();

for (i = 0; i < NUM_ELEMENTS; i++) badList.push(i);

Console.stop(); // ~41ms

//Good
Console.start();

goodList.reserve(NUM_ELEMENTS);

for (i = 0; i < NUM_ELEMENTS; i++) goodList.push(i);

Console.stop(); // ~39ms
```

- Place the opening brace on the same line as the object name.

```
const myObject = {a: 1, b: 2, c: 3};
const myArray = [ 1, 2, 3, 4
];
```

- Place a space after the colon between an object's property and its value.

```
const theFellowship = { Wizard: "Gandalf", Dwarf: "Gimli", Elf: "Legolas", Hobbit: "Frodo"
 };
```

- Short declarations can be written on a single line, e.g.

```
const animals = {dog: "woof", cat: "meow", fox: "?"};
const notes = ["a", "a#", "b", "c", "c#", "d", "d#"];
```

- Longer declarations should be spread over multiple lines, e.g.

```
const dogs = { Larry: "Mr White", Freddy: "Mr Orange", Vic: "Mr Blonde", Quentin: "Mr Brown", Chris: "Eddie"
};
```

- For multiline declarations place the closing bracket at the start of a new line.
- Use dot notation to access properties, e.g. `myObject.property;`
- When accessing properties using variables or invalid identifiers use brackets `[]`, e.g. `myObject["foo-bar"];`
- Only quote properties that are invalid identifiers, e.g.

```
const myObject = { property1: "value1", property2: 123, "foo-bar": "Hello World"
};
```

- Always end object and array definitions with a semi-colon.
- Do not add a comma after an object's last property/value pair.
- Prefer MIDI Lists over arrays when possible, especially for storing polyphonic data.

#### **UI Components**

- Component references will usually be defined as a section of code grouping the reference variable, property assignments, paint routines, mouse callbacks, custom callback functions, and callback assignments, etc. Place a comment containing the name of the component above such sections.

If components are defined by themselves in a namespace, init, or factory function then such a comment may not be necessary.

```
// btnEQBypass - EQ bypass toggle button
const btnEQBypass = Content.getComponent("btnEQBypass");
btnEQBypass.set("saveInPreset", false);
btnEQBypass.set("text", "EQ Bypass");
btnEQBypass.setControlCallback(onbtnEQBypassControl);

inline function onbtnEQBypassControl(component, value)
{ doSomething();
}
```

- Always use `const` for component references.
- Component references should be prefixed with a lowercase abbreviation of the component type. Since knobs and sliders are both represented by the same component type stick with one abbreviation for all of them regardless of their appearance; either `knb` or `sli`.

It's not necessary to use the abbreviation in the name of the component as the component type is shown in the component list, however it can be helpful to do so.

```
// Bad
const expression = Content.addKnob("Expression");
const expressionKnob = Content.addKnob("Expression");

// Good
const knbExpression = Content.addKnob("knbExpression");
```

- It is a good idea to store component references in an array when they share a common control callback function or properties.

This makes it possible to manipulate multiple components at once using loops.

```
const knbADSR = [];
knbADSR[0] = Content.getComponent("knbAttack");
knbADSR[1] = Content.getComponent("knbRelease");

for (x in knbADSR) x.setControlCallback(onknbADSRControl);
```

- Use HISE's default callback declaration/assignment format when a component requires a custom callback function but a reference to the component is not required elsewhere in the script.

This is provided by right-clicking a component in the component list and selecting "Create custom callback definition".

```
// pnlMain - Main content panel
inline function onpnlMainControl(component, value)
{
	//Add your custom logic here...
};

Content.getComponent("pnlMain").setControlCallback(onpnlMainControl);
```

- If a component requires a custom callback, and a reference to the component is needed elsewhere in the script, you should store a reference to the component, followed by property assignments, then the assignment of the callback function, and finally declare the callback function. e.g.

```
// pnlMain - Main contents panel
const pnlMain = Content.getComponent("pnlMain");
pnlMain.set("saveInPreset", false);
pnlMain.setControlCallback(onpnlMainControl);

inline function onpnlMainControl(component, value)
{
}
```

- Custom callback names should be in the following format: on[\*component name\*]Control.

This follows the default HISE naming convention.

```
inline function onbtnEQBypassControl(component, value)
{
}
```

- Single use Paint Routines and Mouse Callbacks should be declared when they are assigned.

```
pnlMain.setPaintRoutine(function(g)
{
});
```

- If a Paint Routine or Mouse Callback is to be used by multiple panels they should be declared as `const` before they are assigned. The functions should be given a meaningful name followed by either `PaintRoutine` or `MouseCallback` as appropriate.

```
const tabbarPaintRoutine = function(g)
{ g.fillAll(Colours.red);
}

pnlTab1.setPaintRoutine(tabbarPaintRoutine);
pnlTab2.setPaintRoutine(tabbarPaintRoutine);
```

- Other than in the main interface script it is often better to declare UI components and their properties in code rather than using the interface designer.

This makes the script more shareable with other people and projects as both the UI layout and logic will be contained within a single file.

```
// Bad
const btnPresetBrowser = Content.getComponent("btnPresetBrowser");

// Good
const btnPresetBrowser = Content.addButton("btnPresetBrowser", 0, 10);
```

#### **Operators**

- When mixing operators, enclose them in parentheses. The only exception is the `+` and `-` operators since their precedence is broadly understood.

This improves readability and clarifies the developer’s intention.

```
// Bad
const bar = a + b / c * d;

// Good
const bar = a + (b / c) * d;
```

- Always put a space before and after operators.

```
// Bad
const x = 1+y - 2*(z / 3);

// Good
const x = 1 + y - 2 * (z / 3);
```

#### **Functions**

- Function names should concisely explain what the function does.

```
function addNumbers(a, b)
{ return a + b;
}
```

- Function names should be in camel-case.
- Aim to have each function perform a single task.
- Favour inline functions whenever possible.
- Function arguments should be passed individually rather than as a single object.
- Never put an else statement after a return.

```
// Bad
if (x == 1) return "foo";
else myFunction();

// Good
if (x == 1) return "foo";

myFunction();
```

- Don't reassign parameters. Create a local copy inside the function instead.
- Don't call regular functions from the audio callbacks, use inline functions instead.
- With the exception of getters/setters, functions should never be written on a single line.

#### **Namespaces**

- There is no performance penalty for using namespaces.
- Namespaces should be written in Pascal case.
- If the namespace resides in a dedicated external file the file should have the same name as the namespace, e.g. `PageHandler.js`.
- Namespaces cannot be nested.
- Don't declare `var` variables inside a namespace. Use `reg` instead.
- Each namespace can have up to 32 `reg` variables

#### **SVG Paths**

- Create all of your SVG paths in a separate file called `Paths.js` with its own namespace. This will help to keep your paths organised in a single location and prevent large data arrays from clogging up your scripts.

- Group related paths inside an object. You can access them from your script with a simple reference, for example `Paths.fontAwesome["trash-icon"];`.

A single variable can be reused to declare all svg data arrays before they are converted to paths.

```
namespace Paths
{ reg svgData;
 // My logo svgData = [110,109,51,179,243]; const logo = Content.createPath(); logo.loadFromData(svgData);
 // My heading svgData = [113,10,0,0,25]; const myHeading = Content.createPath(); heading.loadFromData(svgData);
}

pnlLogo.setPaintRoutine(function(g))
{ g.setColour(Colours.blue); g.fillPath(Paths.logo, [x, y, w, h]);
}
```

#### **Enumeration**

- Don't use "magic numbers" to refer to module parameters. Use the pre-defined enums listed in the module browser.
- For custom attributes you can leverage namespaces to create your own enums. Enum variables should always be `const` and written in Pascal case.

```
namespace Articulations { const Sustain = 0; const Staccato = 1; const Spiccato = 2; const FastAttack = 3; }
```

#### **Custom HISE Additions**

- If your project makes use of custom additions to the HISE codebase these should be clearly indicated with a comment when they are referenced. If possible the comment should provide a link to a public git repository along with a commit hash of the addition in question. If the project can function without the additional feature this should also be noted in the comment and if possible the feature should be placed in a separate script to ease decoupling.

### Script Panel

```
const var panel = Content.addPanel("Panel", 0, 0);
```

**HISE**
offers the most important user interface objects (sliders, buttons, text input labels) as ready-made modules for scripted interfaces. However as soon as you need a special type of UI widget or are not satisfied with the built in modules, you can roll your own type by using the generic **ScriptPanel**.

This guide will contain three chapters:

1. An in-depth explanation of the ScriptPanel
2. A few best practices
3. Some examples to show off what the ScriptPanel can do.

The script panel started out as background panel in order to optically group other UI elements. However it got more and more powerful over the time and evolved to the most complex UI type. If you create a ScriptPanel, you'll still see the original appearance, but the true power of the widget will be unleashed by using three functions:

1. the **Paint Routine** that draws the graphics
2. the **Mouse Event Callback** that reacts to mouse input
3. the **Timer Callback** that is called periodically to implement animations.

They strongly mimic the JUCE API so for people who are familiar with it, adapting it will be pretty straightforward.

#### **The Paint Routine**

This is the place where you customize the appearance of the ScriptPanel. You can tell the ScriptPanel to use a custom paint routine by giving it a function with one argument:

```
Panel.setPaintRoutine(function(g)
{

});
```

The autocomplete popup should create this function stup automatically. Whenever the Panel needs to be redrawn - which is at compilation and if you call `Panel.repaint()`
explicitely - it will perform this function to draw on a canvas with the size of the panel.

Calling `Panel.repaint()`
doesn't execute the function immediately, but just sets a flag that causes the paint routine to be executed asynchronously. This means you can call `Panel.repaint()`
in the MIDI callbacks without having to bother about performance.

The parameter `g`
is the Graphics object which will perform the rendering operation you tell it. It is strongly connected to the JUCE internal Graphics object
and provides wrappers for its most important methods:

```
const var Panel = Content.addPanel("Panel", 0, 0);

Panel.setPaintRoutine(function(g)
{ g.fillAll(Colours.white); // fills the panel with the colour white) g.setColour(Colours.withAlpha(0xffff0000, 0.5)); // Sets the current brush to half transparent red g.fillRect([0, 0, this.getWidth(), this.getHeight() / 2]); // fills the upper half of the object with the current brush
});
```

The best way to learn how to use this function is to grep through the autocomplete popup (type `g.`
and press enter) and check out what every method does. There are some things to consider:

##### **Colours**

Colours are 32bit integer numbers best written in hexadecimal form `0xAARRGGBB`. There is also the colour object with a bunch of constants for some colours and the `withAlpha(Colour, alphaValue)`
method, which allows to change the transparency of a given colour easily.

##### **Areas / Rectangles**

Whenever you need to specifiy an area (eg. for drawing a rectangle or specifying the position of a image), you'll need to pass an array of four values `[x, y, width, height]`. These are pixel positions, but you can use a relative positioning by using the dimensions of the panel by multiplying the values with `this.getWidth()`
and `this.getHeight()`.

Be aware that when you change the size of the panel, it will not be rerendered, but the current canvas will be stretched (until you call `Panel.repaint()`
)

##### **Images**

You can use external images to render your ScriptPanel. In order to do this, you'll need to load it as resource during construction and access it in the paint routine using its "pretty name":

```
// loads the image from the project's Image folder
Panel.loadImage("{PROJECT_FOLDER}sunset.png", "sunset");

Panel.setPaintRoutine(function(g)
{ g.fillAll(Colours.white); g.drawImage("sunset", [0, 0, 200, 200], 0, 0); g.drawImage("sunset", [200, 0, 300, 200], 0, 0);
});
```

It's strongly recommended to put every image in the `Images`
subfolder and access it through the `{PROJECT_FOLDER}`
wildcard.

**Result:**

**Important**: The images will scaled down to *fit the width*
of the area passed in (notice how both calls to draw image have the same `height`
value but they end up in different sizes. This little trick allows to things:

1. **Using retina images:**
 use a image with the double resolution and draw it to a rectangle with half the size. On normal displays it will be downscaled but on retina displays it will use the original resolution.
2. **Using images as filmstrips:** If you want to animate something, make a **vertically stitched** filmstrip and use the `y-offset` parameter to clip the painted area to the current animation state.

Of course the downside of this is that you can't change the aspect ratio of the image - but I can't think of a real world usage scenario where this is really required.

Images will share a reference between multiple Panels, so you don't have more memory consumption if you duplicate Panels.

##### **Fonts**

You can load custom fonts to draw any text (all TrueType fonts should be supported). If you want to use non standard fonts, you'll need to copy the font into the Image folder of your project and load the font before you use it like this:

```
// looks in the subdirectory Fonts of the Image folder
Engine.loadFont("{PROJECT_FOLDER}Fonts/Comic Sans MS.ttf");

const var Panel = Content.addPanel("Panel", 0, 0);

Panel.setPaintRoutine(function(g)
{ g.fillAll(Colours.blanchedalmond); g.setColour(Colours.blue); g.setFont("Comic Sans MS", 50.0); g.drawText("Best font EVER!!", [0, 0, 400, 50]);
});
```

**Result:**

When using **HISE**
it will look for the system fonts (it assumes that you've installed the font you want to use), but compiled plugins will embed that font from the image directory and load it from there (you can't expect every user to have Comic Sans MS).

The string passed in as into the `g.setFont()`
method must match the exact font name (this is not necessarily the file name and this name might be even different between Windows and OSX). A neat trick is to create a dummy label, select the font in the interface designer for the label (as soon as you loaded the font, it should be globally available in the drop down list) and copy the string from the JSON:

```
const var Label = Content.addLabel("Label", 0, 0);
// [JSON Label]
Content.setPropertiesFromJSON("Label", { "fontName": "Trebuchet MS", // use this String to load "multiline": false
});
// [/JSON Label]
```

For fonts that use a different name on OSX and Windows, you can use the `Engine.getOS()`
command:

```
inline function getGlobalFontName()
{ if(Engine.getOS() == "WIN") { return "WindowsFontID"; } else { return "OSXFontID"; }
};
```

In order to use a different font style by appending either  `Bold`
or  `Italic`
(or both) after the font ID:

```
g.setFont("Trebuchet MS Bold")
```

Please make sure that you own the full rights to embed fonts into an application as most font licenses handle that case specificly (as far as I am aware, Google Fonts are allowed to be embedded)

###### **Paths**

Paths are monochromatic shapes that can be used to build vector-based interfaces. You can either create the Path directly or import an SVG image that was converted using the amazing Projucer's "SVG Path helper".

Paths are designated objects that must be created outside the actual paint function. It can then either be filled or drawn with a given stroke thickness.

```
const var Panel = Content.addPanel("Panel", 0, 0);

const var p = Content.createPath();

p.startNewSubPath(0.0, 0.0); // start at origin (top-left)
p.lineTo(0.0, 1.0); // add a vertical line
p.quadraticTo(1.0, 1.0, 1.0, 0.0); // add a quadratic curve
p.closeSubPath(); // go back to the origin

Panel.setPaintRoutine(function(g)
{ g.setColour(Colours.white);
 // draw the path with 10px thickness // (make sure it is not clipped by the panels bounds) g.drawPath(p, [5, 5, this.getWidth()-10, this.getHeight()-10], 10.0);
});
```

Paths will be scaled to the given area so it's recommended to use the normalized range `0.0... 1.0`
for each axis during path creation. You can then use it's `getBounds()`
method and supply a scale factor to set it to its correct size (take a look at the vector knob example below).

```
const var Panel = Content.addPanel("Panel", 0, 0);

const var p = Content.createPath();

// pass an array with numbers to load SVG images
p.loadFromData([110,109,0,245,207,67,128,217,36,67,108,0,236,189,67,128,89,69,67,108,0, 245,207,67,128,217,101,67,108,192,212,207,67,128,53,81,67,98,217,93,211, 67,51,180,80,67,123,228,219,67,2,123,91,67,128,144,224,67,0,149,101,67, 98,39,209,224,67,29,247,89,67,79,60,223,67,36,224,61,67,0,245,207,67,0, 12,54,67,108,0,245,207,67,128,217,36,67,99,109,128,33,193,67,0,168,88, 67,108,0,66,193,67,0,76,109,67,98,231,184,189,67,77,205,109,67,69,50, 181,67,126,6,99,67,64,134,176,67,128,236,88,67,98,154,69,176,67,99,138, 100,67,49,218,177,67,174,80,128,67,128,33,193,67,192,58,132,67,108,128, 33,193,67,0,212,140,67,108,192,42,211,67,0,40,121,67,108,128,33,193,67, 0,168,88,67,99,101,0,0]);

Panel.setPaintRoutine(function(g)
{ g.setColour(Colours.white); g.fillPath(p, [0, 0, 50, 50]);
});
```

This should cover you the most important tools for drawing graphics (for more real world examples keep on reading until the example section). However the panels we created are pretty, but static images. So in order to make them actual UI controls, we need to add logic that reacts on mouse events.

#### **The MouseEvent callback**

This can be achieved by passing a mouse callback function to the panel. Again, the autocomplete popup will fill this out for us:

```
Panel.setMouseCallback(function(event)
{

});
```

##### **Callback Levels**

For every mouse event that is passed to the Panel, this function will be executed with the event parameters as properties of the `event`
argument object. As you can imagine, there is quite some activity when moving a mouse, so **HISE**
offers the ability to define different "Callback Levels", which limit the callback execution to only the desired events.

By default, this is deactivated, so in order to use the mouse event callback, you need to set the `allowCallbacks`
property to one of the following values (the values are actual Strings as shown in the table)

**Callback Level** | **Events that will trigger the callback** || `"No Callbacks"` | Nothing |
| `"Context Menu"` | Nothing (instead it will show a popup menu) |
| `"Clicks Only"` | Mouse clicks and releases on the Panel |
| `"Clicks & Hover"` | Mouse clicks and entering / leaving the panel (hovering) |
| `"Clicks, Hover & Dragging"` | Mouse clicks, entering and leaving (hovering) as well as dragging (= moving the mouse with the left button down) |
| `"All Callbacks"` | Mouse clicks, entering and leaving (hovering), dragging and moving the mouse inside the panel |

The recommended way is to limit the event firing to the minimal level that still allows you to implement the desired behaviour (eg. for a simple toggle button that changes its appearance, you only need `"Clicks & Hover"`. Not only does it improve the performance, but it also simplifies the code because you don't need to if-out every other event.

##### **Callback Event Properties**

Now that we specify **when**
we want to use the callback, we can use the event properties to figure out **what**
we want to do. You can use the autocomplete popup to get a overview of all properties or take a look at this overview:

**Property** | **Availability** | **Description** | **Values** || `event.result` | `"Context Menu"` and above | the index of the selected popup menu item | a number starting from `1` or `0` if the popupmenu was discarded |
| `event.itemText` | `"Context Menu"` and above | the name of the currently selected popup menu item | a String |
| `event.mouseDownX` | `"Clicks Only"` and above | The position in the panel where the mouse was pressed | the x-coordinate relative to the panel's space |
| `event.mouseDownY` | `"Clicks Only"` and above | The position in the panel where the mouse was pressed | the y-coordinate relative to the panel's space |
| `event.clicked` | `"Clicks Only"` and above | indicates if this is a mouse click event | `1` if click event (left or right click), `0` if otherwise (eg. movement or dragging) |
| `event.doubleClick` | `"Clicks Only"` and above | indicates if this is a mouse double click event | `1` if double click event, `0` if otherwise (eg. standard click, movement or dragging) |
| `event.rightClick` | `"Clicks Only"` and above | indicates if this is a right mouse click event | `1` if right click event, `0` if otherwise (eg. movement or dragging) |
| `event.mouseUp` | `"Clicks Only"` and above | indicates if this is a mouse up | `1` if mouse up event (left or right mouse button), `0` if otherwise (eg. click, movement or dragging) |
| `event.hover` | `"Clicks & Hover"` and above | indicates if the mouse enters or exits the panel | `1` if enter, `0` if exit. Clicks and all other events will be `1` so you might want to handle them separately. |
| `event.drag` | `"Clicks, Hover & Dragging"` and above | indicates if this is a drag event. The drag start will not be a drag event, but a `clicked` event | `1` if drag event, `0` if otherwise |
| `event.dragX` | `"Clicks, Hover & Dragging"` and above | the distance from the drag start | x-delta in pixels |
| `event.dragY` | `"Clicks, Hover & Dragging"` and above | the distance from the drag start | y-delta in pixels |
| `event.x` | `"All Callbacks"` | the current mouse position | pixel position relative to the panel space |
| `event.y` | `"All Callbacks"` | the current mouse position | pixel position relative to the panel space |

In addition to these properties, you'll also get the current modifier keys that are pressed for the given event:

**Modifier Keys:**

**Property** | **Key on Windows** | **Key on OSX** || `event.shiftDown` | Shift | Shift |
| `event.cmdDown` | Ctrl | Cmd |
| `event.ctrlDown` | Ctrl | Ctrl |
| `event.altDown` | Alt | Apple Key |

You can now implement the logic by using conditions to match the desired event and store data or call other functions for the Panel (the Example section will give you some usage scenarios).

#### **Context Menus**

If your UI widgets needs to display a context menu on eg. right click, you don't need to build this by yourself. Instead, you can enable it using the callback level `"Context Menu"`
(or above) and specify the items with the `popupMenuItems"`
property (best use the text editor in the interface designer for this).

In order to customize the appearance of the context menu (adding headers, grouping things into submenus, deactivating items), you can use a weird Frankenstein "language"" between C++ and Markdown:

```
Item 1                        | Normal Item (clickable)
**Header**                    | Section Title (not clickable)
___ (three underscores)       | Separator (not clickable)
~~Deactivated Item~~          | Disabled Item (not clickable)#
MySubMenu::First SubItem      | Item in submenu (clickable)
MySubMenu::**Sub Header**     | Header in submenu (not clickable)
MySubMenu::~~Second SubItem~~ | Disabled item in submenu (not clickable)
```

This example will produce the following context menu:

You can align the popup menu to the panel width and bottom by setting `"popupMenuAlign"`

to true (it will otherwise popup at the mouse down position with the minimal width needed to display all text)

The **Mouse Event Callback**
will then contain the index (one-based, zero means the user clicked somewhere else) as well as the item text so you can implement the logic accordingly.
One thing to keep in mind though that it will count up the integer index only for clickable items and skipping all unclickable items. In the example above, this would mean that since only the `Item 1`
and the `First SubItem`
are clickable, `Item1`
would be associated with the index 1 and `First SubItem`
would be the index 2 (and not 5 as its index within the full list).

The feature of building customized context menus using this syntax is also available in the Broadcaster.attachToContextMenu()
function as well as if you use a ComboBox with its `useCustomPopup`
property which will cause the combobox items to be processed with the same logic.

#### **The Timer callback**

If you want to animate or delay something, you'll need to give the Panel a timer function:

```
Panel.setTimerCallback(function()
{ // Implement the periodic timer callback here...
});
```

and then call `Panel.startTimer(interval)`
which will periodicall call the event until you call `Panel.stopTimer()`. It's perfectly safe to stop the timer from within the callback (actually this is how most of the animations will work)

**Important:**
the `startTimer()`
argument is in **milliseconds**
(as opposed to `Synth.startTimer()`, which is in seconds. Don't ask why:)

#### **Storing Data**

In order to make the ScriptPanel a real UI widget, you need the possibility to store data in between the three main function calls. Basically any data that is stored into a panel can be separated into two types:

1. **UI Data**: non persistent data that is used internally to render the graphics or save timer states. Ideally, you would never need to access externally when using the UI widget.
2. **Control Data**: persistent data that will be stored and recalled when the script is recompiled (or the preset is loaded). This data will be used by the script for any other purpose (controlling parameters etc.) This will also be passed to the `onControl` callback as `value` argument.

For example, a slider with a filmstrip has one **Control Data**
value (the actual value as double number) and some few other **UI Data**
values (eg. current y-offset, alpha value, fine-control mode eg.).

##### **UI Data**

Every panel has an object property called `data`
which can be populated with any values that need to be stored inside the panel. Using it is pretty straightforward, however there is one important rule: **Don't access the data via the variable name but through the**
**this**
 **keyword**:

```
inline function createPanel(name, x, y)
{ local widget = Content.addPanel(name, x, y); widget.data.alphaValue = 1.0;
 widget.setPaintRoutine(function(g) { g.fillAll(Colours.withAlpha(Colours.white, this.data.alphaValue)); });
 return widget;
};

// Create the first panel
const var Panel = createPanel("Panel", 0, 0);

// Set the first alphaValue to 20%
Panel.data.alphaValue = 0.2;

// Create the second panel
const var Panel2 = createPanel("Panel2", 150, 0);
```

The `this`
keyword is only meaningful inside the three callbacks, but it allows a totally encapsulated widget.

Values stored in `data`
are always non-persistent even if the panel has `saveInPreset`
set to true.

It's heavily recommended to store a simple number whenever possible, but you can choose to use more complex types if your widget demands it (we'll cover this case in a example later on). Even then it might be more efficient to store the possible values as an array in the `data`
object, and use the **Control Value**
as an index:

```
// Not very efficient
this.data.setValue("First Item");

// Better, as it doesn't need to create the string each time
this.data.values = ["First Item", "Second Item", "Third Item"];
this.data.setValue(0);
```

##### **Control Data**

In other UI controls, the control data is the data that actually represents the current value of the widget, which can be set and accessed with the `getValue()`
and `setValue()`
methods:

- `1` / `0` for toggle buttons
- `double` numbers for slider types
- `int` numbers for discrete widgets like combobox selectors.

Panels also support storing and getting their value with `setValue(value)`
/ `getValue()`, but as a panel is a generic control, this will not be reflected in any way on the UI. Also, panels have `saveInPreset`
set to false by default. Enabling `saveInPreset`
on a panel makes it useful as a place to persistently store objects, numbers, or booleans. Strings cannot be saved to Control Data, but can be encapsulated inside an object if circumstances require saving a persistent string.

Snippet demonstrating making a value persistent using a panel:

```
HiseSnippet 1233.3ocsVs0aiTCE1SaGXSfshUhmQVyKjVhZSBYaK6BhcaZKa.ZaDoag2V43wSGSmXOx1oYip5+Y9G.GamIYRZJKphcdHJ9b86bwmi6ojTlVKUnfpWLImgB97v9SDlzNoDt.08HTvlgmRzFlB6Ic3jbhVyhQAAq+SVBAU1.499qe7PRFQPYyIgPWJ4T1uxGxMyo16U+BOK6DRL6B9vRR29UcoRQGYlbDfm0CafxIzqIWwNiXEasPzaH5TTv1gwMa2L4.JYuCZ1tEk15f8a8c6SYjjD1dMe99sOHocBg1nEJ3SNNlajp9FhgoQAabnLdR+T4Xg2AWx07AYL6gln9fm8jOQlEaCQKUTmTdVbuhDkFAVo27z159z1WFdJOlOi97z2W3XfmqQ4DXvZKBu0W.dMKCuFkf2JfTPIHsgGROKrOUwyMy4XwymE1U.USH8vV.JdYQqsYXXGIHgvryPx0rSTvgYZTqUiF0wMazXqWVEjRKyX6PyXDUMf.T6zFbNQvxv+.tvHj33dVR0hbbhpiAKzXl3CFYLRwhxeniVsHOun5MpumUgpNCrilYpEoI2v5J5oXvon5F0HFHfW9UIPBISCRf2c2KRYE9jRxxF.MXXcpbTVLVJxlfS3JFdbJCXmwoWyhqVUwtBmyTZt1BvKIJ.sQQVi86fnDgAaR4Z7MDEm.EKrQhGvJoQ0R.yFkJYVmottlmy4hozgffKx3BFNYjfZ3.JWRhZT4vbo.LacviYPbea0JPXwduABHgPZrNWC8TrXKRbxTGqkXt4q03wJRdNvgKvDAVN3OYTS0J.v5UJ.AMpcqAr3KhdCKKSBwGCxJtef.UKGxvwDCI5N.u2U8dPdElaJTgbFXQH0LSXK3O2l3Akr9wCXrLwcvWwwuF.w34DlW4f.btd9z+NUqLqOorueYAcZJQbEKtlqcnCYjloe.Sa6Erw2L6sb0ywnbwa2cOjQslDWt+ykzrvDxjJa0XlSrdPCMd3LIIFz9LoA5eRI9PZIw1lj.WC2FDuqfCk+wobZJdHiHzKjAvWwLfQugoFq3FnFf4I3IxQfymTjw3FaKf2R2q9sXXsxNtkuO3X.o3hgB4Jt.tEZY5X8BbD9a..Xmgrfta4agl4aovlCNWTaqpfa.V3kYkjrRdSQaFSsR11MMp+MEqIFMb.SUDiEBBSSWbDc3COht7FDpebVIA8I6yyYhGZuBZ5LP637onBD03Fl+zhg41ZChCir+zPWcB4vKJ3qB+49me1sQ16sQP59Lo6Np6VazcHza6dDbrvzfW.OCUBC2FTAGwtA1S62aTI7Hl9ZiLGV41on1CA9GBHuGjIvtGeRweJeIvRyQ79lbyolzO22YymD5m6sjQ+9UXT+SJt21OXuqLdTFwr3xX6SVlx.J+KrAztkSn4lIkeRy+aan+uBwmE1ianoqFiqsBLBkzOFXb56ZdZ3wvipnl4.bivS9iONOhA8axQFt3pSIFE2V3Oazv9vaAoLv6BnEyd8KXMaOj+bih5eelH1c3uguoLaVzwYY1rfIZHgpjui5udYe4zSbT.LIbuxrB7bW3LtYwEq444gvC4dGktnotmhsdrJ9sOVEa+XU74OVE26wp39OVEO3Cqn8c1udjQNzesAgNs2wtYdAAGKrKFccqn+gNTucw
```

Calling `setValue(value)`
does not execute the `onControl`
callback (for safety reasons). Instead you need to explicitely tell the engine to fire the control callback using the method `Panel.changed()`

##### **Performance Tricks**

As long as you don't do anything super complex, the performance should be fine for a fluid UI (and if you don't do anything stupid, it won't affect the audio performance at all). However, there are a few tricks that speed up the graphic rendering that are worth considering:

##### **Deactivate transparency if not needed**

By default, the panel is rendered transparently over its parent. However this implicates that the parent must be rerendered too if the panel changes. If you don't have a transparent UI widget, you might want to consider changing the `opaque`
property to `false`
which gives the engine the hint that the parent must not be repainted because the child is not transparent. Keep in mind that when you do this on transparent widgets, it will cause graphic glitches.

##### **Limit the repaint rate**

If you use a timer for animations, a refresh rate of 30 - 50 ms is enough in most cases (this equals 20 - 30 fps). Increasing the timer rate will not make things more fluid, but just clog the internal message event system.

##### **Use repaintImmediately() for synchronous repainting**

If you want to repaint the panel from either its timer callback or a event callback, you might want to use `this.repaintImmediately()`
instead of `this.repaint()`
in order to get more fluid animations. This bypasses the internal event queue and directly executes the paint function.

Do not call this method from the MIDI callbacks (or even the onControl callback) as it will cause drop outs...

#### **Use the "Create UI Factory method" tool**

If you need to create a UI widget that will be used multiple times, you definitely don't need to write all the code every time you need a new Panel. Instead, you can write a function that creates the Panel, sets the data and callbacks and returns the panel. This function is called **Factory Method**
and is a common paradigm in UI design.

The example shown above already illustrates this design:

```
// A factory method with the UI ID and the initial position as argument.
inline function createPanel(name, x, y)
{ // Create a panel and store it as local variable // It just passes the function arguments to the actual create method local widget = Content.addPanel(name, x, y);
 widget.data.alphaValue = 1.0;
 widget.setPaintRoutine(function(g) { g.fillAll(Colours.withAlpha(Colours.white, this.data.alphaValue)); });
 // return the local object. This will transfer the "ownership" to the left side of the equation return widget;
};

// Create the panel with the factory method
const var Panel = createPanel("Panel", 0, 0);

const var PanelArray = [];

for(i = 0; i < 7; i++)
{ // Use the factory method in a loop to create a bunch of vertically aligned panels PanelArray[i] = createPanel("Panel"+i, 0, i*50);
}
```

Fortunately, **HISE**
can automatically create UI factory functions from Panel definitions. In order to use this feature, just create a panel the usual way and after you are finished, select everything related to the panel, right click and choose **Create UI Factory method from selection**. This transforms something like this:

```
const var Panel = Content.addPanel("Panel", 125, 12);

Panel.data.bgColour = 0xFF229955;

Panel.setPaintRoutine(function(g)
{ g.fillAll(this.data.bgColour);
});
```

to this:

```
inline function createMonochromaticPanel(name, x, y)
{ local widget = Content.addPanel(name, x, y);
 widget.data.bgColour = 0xFF229955;
 widget.setPaintRoutine(function(g) { g.fillAll(this.data.bgColour); }); return widget;
};

const var Panel = createMonochromaticPanel("Panel", 125, 12);
```

It's heavily recommended to use the syntax `createXXX`
for the **UI Factory method**. This allows the interface designer to drag around the panel just like any other inbuilt widget (however changing the size is not supported, but in most cases you just want to move the widget to the right position). Just test it with the example above, selecting and moving the panel should magically update the arguments to the function call:)

#### **Use namespaces and wrapper functions to hide the internals**

In order to make encapsulated widgets, it's recommended to put each widget in its own namespace. Also you might want to create functions that are one abstraction layer above the internal stuff so when you use the widget you don't have to bother how it is implemented.

It is useful to provide at least two functions for the two most important times when you have to interact with the panel: at creation and when handling a control change:

```
namespace MyFunkyPanel
{ inline function createMyFunkyPanel(name, x, y) {... };
 inline function handleUpdate(panel, newValue) { panel.setValue(newValue); panel.startTimer(50); panel.repaint(); };
};

function onControl(number, value)
{ // Don't need to know what the panel is doing internally here... MyFunkyPanel.handleUpdate(number, value);
}
```

Another nice trick is to use a leading underscore to indicate "private" methods and properties of a namespace. While Javascript does not have a strong concept of data encapsulation, this might at least give the user a hint that this functions is not supposed to be used outside the internals.

For a full encapsulation and reusablility experience, you might also want to move the code to an external file and include it in multiple scripts.

The following examples should demonstrate how to use the ScriptPanel for actual UI widgets. All those examples were actual user requests.

#### **A six state button**

The button in HISE can be filmstripped, but just uses two states. Since I am rather lazy about updating the in built widgets, I'd rather use this as an example how to build a really simple UI widget that is virtually indistinguishable from a hardcoded one.

This is the "filmstrip" we'll be using:

It uses the same order as KONTAKT expects, so we can reuse those images here - thanks Dorian for the explanation:)

##### **Creating the Panel and set its properties**

We need the Panel to be 200 pixels wide, store its value persistently, be non transparent and have a stepsize of 1 (this is important for host automation). Use the interface designer to set its properties and you should end up with a JSON property list like this:

```
// [JSON Panel]
Content.setPropertiesFromJSON("Panel", { "width": 200, "allowCallbacks": "Clicks & Hover", "saveInPreset": true, "opaque": true, "stepSize": "1"
});
// [/JSON Panel]
```

##### **The data**

Now let's take a look what data we need. The UI data will store the current states (hover and down) as well as the height per filmstrip seperately (so we can use other images). The **Control Value**
will store the "on" and "off" state and will be either 1 or 0.

Whenever we change the button value (either when we click on it or when it gets restored from the preset, we'll be calling the `setButtonValue`
method to encapsulate the inner behaviour.

```
Panel.data.down = 0;
Panel.data.hover = 0;
Panel.data.heightPerFilmStrip = 50; // this will be changed when we use another image

inline function setButtonValue(p, value)
{ p.setValue(value); p.repaint();
}
```

Loading the filmstrip image will be wrapped into a function so it can be easily replaced later:

```
inline function loadFilmStrip(p, image, heightPerFilmstrip)
{ p.loadImage(image, "filmstrip"); p.data.heightPerFilmstrip = heightPerFilmstrip;
};

loadFilmStrip(Panel, "{PROJECT_FOLDER}SixStateButton.png", 50);
```

##### **Paint Routine**

Drawing this panel is pretty easy: just calculate the offset and draw the image:

```
Panel.setPaintRoutine(function(g)
{ var offset = this.data.heightPerFilmStrip * this.data.yOffset; g.drawImage("filmstrip",[0, 0, this.getWidth(), this.getHeight()], 0, offset);
});
```

##### **The mouse event callback**

We told the panel to fire the callback on click and hover events. In the callback we need to distinguish between those two events and handle them accoringly. We'll be changing the value at the mouse release (this makes the example a bit more readable)

```
Panel.setMouseCallback(function(event)
{ if(event.clicked) // Handle mouse clicks { // set the `down` flag and repaint this.data.down = true; this.repaint(); } else if(event.mouseUp) // Change the value on mouse up { // set the `down` flag, change the value and call the onControl callback this.data.down = false; setButtonValue(this, 1 - this.getValue()); this.changed(); } else // Handle the hovering { // set the `hover` flag and repaint this.data.hover = event.hover; this.repaint(); }
});
```

##### **Final Code**

That's it. We now have a six state button that we can use. This is the complete code wrapped into a namespace and with some helper methods and example usage:

```
namespace SixStateButton
{ inline function createWidget(name, x, y) { local widget = Content.addPanel(name, x, y);
 Content.setPropertiesFromJSON(name, { "width": 200, "saveInPreset": 1, "allowCallbacks": "Clicks & Hover", "opaque": 1, "stepSize": "1" });
 widget.data.hover = 0; widget.data.on = 0; widget.data.down = 0; widget.data.heightPerFilmStrip = 50;
 widget.setPaintRoutine(function(g) { var offset = this.getValue() ? 1: 0; if(this.data.down) offset += 2; else if(this.data.hover) offset += 4;
 g.drawImage("filmstrip",[0, 0, this.getWidth(), this.getHeight()], 0, offset * this.data.heightPerFilmstrip); });
 widget.setMouseCallback(function(event) { if(event.clicked) {
 this.data.down = true; this.repaint(); } else if(event.mouseUp) { this.data.down = false; setButtonValue(this, 1 - this.getValue()); this.changed(); } else { this.data.hover = event.hover; this.repaint(); } });
 return widget; };
 inline function loadFilmStrip(p, image, heightPerFilmstrip) { p.loadImage(image, "filmstrip"); p.data.heightPerFilmstrip = heightPerFilmstrip; };
 inline function update(p, value) { p.setValue(value); p.changed(); p.repaint(); }
 inline function setButtonValue(p, value) { p.setValue(value); p.repaint(); }
};

// Create two buttons
const var b1 = SixStateButton.createWidget("b1", 0, 0);
const var b2 = SixStateButton.createWidget("b2", 300, 0);

// Load the image file
SixStateButton.loadFilmStrip(b1, "{PROJECT_FOLDER}SixStateButton.png", 50);
SixStateButton.loadFilmStrip(b2, "{PROJECT_FOLDER}SixStateButton.png", 50);

function onNoteOn(){}
function onNoteOff(){}
function onController(){}
function onTimer(){}

function onControl(number, value)
{ // Update the buttons in the onControl callback SixStateButton.update(number, value);
}
```

#### **A ButtonPack**

There is the SliderPack widget for an array of sliders that can represent a lookup table, but what if we need an array of buttons that can be changed by dragging the mouse over them? Setting the SliderPack range to 0...1 does not work to our full satisfaction. Again, it's ScriptPanel time.

We'll be starting with the most naive implementation of this widget and change it until it meets our UX expectations.

We'll keep an array of `N`
bool values that contains each button state. Then we'll vertically divide the ButtonPack into `N`
equal rectangles (the buttons) and draw them according to their state Whenever we drag the mouse over the area of a button, we'll be toggling the array and update everything. We don't need any filmstrips, instead we render the whole thing completely scalable.

##### **Creating the Panel and its Properties**

```
const var Panel = Content.addPanel("Panel", 0, 0);
// [JSON Panel]
Content.setPropertiesFromJSON("Panel", { "width": 380, "height": 50, "allowCallbacks": "Clicks, Hover & Dragging", "opaque": true
});
// [/JSON Panel]

this.data.bgColour = Colours.white;
this.data.offColour = Colours.black;
this.data.onColour = Colours.red;

inline function setNumButtons(p, numButtons)
{ // Reset the array p.data.buttonValues = [];
 for(i = 0; i < numButtons; i++) { // Fill the button values randomly for starters p.data.buttonValues[i] = Math.randInt(0, 2); }
}

setNumButtons(Panel, 16);
```

We also made a function that allows changing the number of buttons. Notice how we don't define the array outside of the function: the array will created only when calling this function (before it's `undefined`
)

We also filled the button states with random values in order to have something for the paint routine. This will be of coursed replaced by zeroing the array later...

##### **ButtonPack Paint Routine**

This is the most simple implementation of our ButtonPack's paint function:

```
Panel.setPaintRoutine(function(g)
{ var numButtons = this.data.buttonValues.length; var buttonWidth = (this.getWidth()-1) / numButtons;
 g.fillAll(this.data.bgColour);
 for(i = 0; i < numButtons; i++) { g.setColour(this.data.buttonValues[i] ? this.data.onColour: this.data.offColour);
 // We'll need to subtract 1 on each side to have a "border" g.fillRect([1 + i*(buttonWidth), 1, buttonWidth-1, this.getHeight()-2]); }
});
```

There is a little issue with this paint routine: the borders get blurred. This is caused by having non-integer button widths which cause some lines to be between two pixels and get antialiased. There are two solutions to the problem:

1. Change the paint routine to round the button widths. This will lead to empty space at the right side of the button pack if you don't use a matching width.
2. Expect the user to use a width that doesn't create blurred lines (in this case, the width must be `x*16 + 1` (eg. 65, 129, 513...)

Solution 1 would not be hard to implement, but it will make the code less readable so for the sake of this tutorial, we'll go with number 2.

##### **3.2.3 The Mouse Event callback**

This time we chose the `"Click, Drag & Hover"`
callback level because we want to allow dragging over the ButtonPack and allow multiple buttons to be toggled without clicking each time (this is the whole reason for this widget, otherwise we could just have created an array of buttons).

First we'll create a bunch of helper functions that we need later on:

```
// Returns the button index for the given x position.
inline function getButton(p, x)
{ // Calculate the proportion of the x position local xNormalized = x / p.getWidth();
 // Calculate the array index by rounding it down. local index = Math.floor(p.data.buttonValues.length * xNormalized); return index;
}

// Inverts the button with the given index
inline function toggleButton(p, index)
{ this.data.buttonValues[index] = 1 - this.data.buttonValues[index]; handleUpdate(p); this.changed();
}

// Sets the array as Control Value and repaints the panel
inline function handleUpdate(p)
{ this.setValue(this.data.buttonValues); this.repaint();
}
```

Now we can write the event callback:

```
Panel.setMouseCallback(function(event)
{ if(event.clicked) { // Toggle the button on mouse click toggleButton(this, getButton(this, event.mouseDownX)); } else if(event.drag) { // You'll need to calculate the current position var x = event.mouseDownX + event.dragX; toggleButton(this, getButton(this, x)); }
});
```

Now there is one serious problem: the buttons are flickering when you drag the mouse. This is because it toggles the button everytime a mouse drag event is received. In order to fix this behaviour, we'll need to keep track of the most recently changed button and prevent toggling until a new button is used:

```
Panel.data.lastDraggedIndex = -1;

Panel.setMouseCallback(function(event)
{ if(event.clicked) { this.data.lastDraggedIndex = getButton(this, event.mouseDownX); toggleButton(this, this.data.lastDraggedIndex); } else if(event.drag) { var x = event.mouseDownX + event.dragX; var newDraggedIndex = getButton(this, x);
 if(newDraggedIndex != this.data.lastDraggedIndex) { this.data.lastDraggedIndex = newDraggedIndex; toggleButton(this, this.data.lastDraggedIndex); } }
});
```

That's better. We can now drag the mouse to change multiple buttons at once. However the toggle behaviour is a bit irritating, we'd rather want to use the value of the clicked button for all other button values. In order to do this, we'll add another helper function that allows us to set the button value directly and add a `downValue`
property to the data object to store the value of the first button:

```
inline function setButtonValue(p, index, value)
{ p.data.buttonValues[index] = value; handleUpdate(p);
}

Panel.data.downValue = 0;

Panel.setMouseCallback(function(event)
{ if(event.clicked) { this.data.lastDraggedIndex = _getButton(this, event.mouseDownX);
 toggleButton(this, this.data.lastDraggedIndex); this.data.downValue = this.data.buttonValues[this.data.lastDraggedIndex]; } else if(event.drag) { var newDraggedIndex = _getButton(this, event.mouseDownX + event.dragX);
 if(newDraggedIndex >= this.data.buttonValues.length) return;
 if(newDraggedIndex != this.data.lastDraggedIndex) { this.data.lastDraggedIndex = newDraggedIndex; setButtonValue(this, this.data.lastDraggedIndex, this.data.downValue); } }
});
```

Now we are almost finished. The last thing we want to add is the ability to enable / disable all buttons at once by shift clicking on a button:

```
// Sets all buttons to the given value
inline function setAllButtonValues(p, value)
{ for(i = 0; i < p.data.buttonValues.length; i++) { p.data.buttonValues[i] = newValueForAll; }
 updateInternal(p);
}

// MouseEvent callback:
if(event.clicked)
{ this.data.lastDraggedIndex = getButton(this, event.mouseDownX);
 if(event.shiftDown) { var newValueForAll = 1 - this.data.buttonValues[this.data.lastDraggedIndex];
 setAllButtonValues(this, newValueForAll); this.data.downValue = newValueForAll; } else { toggleButton(this, this.data.lastDraggedIndex); this.data.downValue = this.data.buttonValues[this.data.lastDraggedIndex]; }
}
```

##### **Handling the Control Data**

The **Control Data**
must be the whole value array in order to allow correct restoring of presets. This makes things a bit more complicated than just using a simple number, but with a little caretaking, this should be no problem.

So whenever we change the button values, we call `setValue()`
with the `data.buttonValues`
array as argument. Luckily, Javascript doesn't clone the array, but only passes in a reference to the `buttonValue`
array, so our update function can do just opposite and store the `value`
from the onControl callback in the `data.buttonValue`
property.

Remember that the restoring of UI controls in HISE works by calling the `onControl`
callback of every widget that has its `saveInPreset`
property enabled just after compiling or preset load.

However there is one case where it gets complicated and this is when the length of the both arrays don't match which happens at first initialisation:

1. You create a Panel
2. You sets its button amount to eg. 16 which causes the `data.buttonValues` array to grow to 16.
3. After the `onInit` callback, the Panel gets an empty array as `value` from the onControl callback
4. The array gets copied over to the `data.buttonValue` property effectively rendering the `setNumButtons` call useless.

In order to fix this, we'll need to specificly handle this case and copy the values manually when the sizes don't match:

```
/** Call this from the onControl callback. */
inline function update(p)
{ if(p.getValue().length == p.data.buttonValues.length) { // Just copy the reference if the sizes match p.data.buttonValues = p.getValue(); } else { // Only copy as much values as the smallest array's size local numToCopy = Math.min(p.getValue().length, this.data.buttonValues.length);
 for(i = 0; i < numToCopy; i++) p.data.buttonValues[i] = p.getValue()[i]; }
 p.repaint();
}
```

##### **Final Code**

This is the complete code for the ButtonPack. Feel free to use, modify and distribute as you like:

```
/** The ButtonPack is a set of horizontally aligned buttons which
-   can be toggled by dragging over them.
*
-   Usage:
*
-   1. Create the ButtonPack using ButtonPack.createButtonPack(name, x, y);
-   2. Set the number of buttons
-      (For a optimal appearance, use a width of `numButtons*N + 1`)
-   4. Set the colours using ButtonPack.setColour() and the given colour IDs
-   5. In the onControlCallback, call ButtonPack.update(panelToUpdate) to refresh the
-      display
-   6. The onControl callback will contain the button states as array.
*/
namespace ButtonPack
{ // Colour IDs:
 const var BackgroundColourId = 0; const var ButtonOnColourId = 1; const var ButtonOffColourId = 2;
 /** Creates a ButtonPack. */ inline function createButtonPack(name, x, y) { local widget = Content.addPanel(name, x, y);
 Content.setPropertiesFromJSON(name, { "width": 513, "height": 32, "allowCallbacks": "Clicks, Hover & Dragging", "saveInPreset": true, "opaque": 1 });
 widget.data.lastDraggedIndex = -1; widget.data.downValue = 0;
 widget.setPaintRoutine(function(g) { var numButtons = this.data.buttonValues.length; var buttonWidth = (this.getWidth()-1) / numButtons;
 g.fillAll(Colours.white);
 for(i = 0; i < numButtons; i++) { g.setColour(this.data.buttonValues[i] ? Colours.red: Colours.black); g.fillRect([1 + i*(buttonWidth), 1, buttonWidth-1, this.getHeight()-2]); }
 g.setColour(Colours.withAlpha(0xFFFFFFFF, 0.1)); g.fillRect([1 + this.data.hoverIndex*(buttonWidth), 1, buttonWidth-1, this.getHeight()-2]); });
 widget.setMouseCallback(function(event) { if(event.clicked) { this.data.lastDraggedIndex = _getButton(this, event.mouseDownX);
 if(event.shiftDown) { var newValueForAll = 1 - this.data.buttonValues[this.data.lastDraggedIndex];
 _setAllButtonValues(this, newValueForAll); this.data.downValue = newValueForAll; } else { _toggleButton(this, this.data.lastDraggedIndex); this.data.downValue = this.data.buttonValues[this.data.lastDraggedIndex]; } } else if(event.drag) { var newDraggedIndex = _getButton(this, event.mouseDownX + event.dragX);
 if(newDraggedIndex >= this.data.buttonValues.length) return;
 if(newDraggedIndex != this.data.lastDraggedIndex) { this.data.lastDraggedIndex = newDraggedIndex; _setButtonValue(this, this.data.lastDraggedIndex, this.data.downValue); } } });
 return widget; };
 /** Sets the amount of buttons. */ inline function setNumButtons(p, numButtons) { // Reset the array p.data.buttonValues = [];
 for(i = 0; i < numButtons; i++) p.data.buttonValues[i] = 0; }
 /** Call this from the onControl callback. */ inline function update(p) { if(p.getValue().length == p.data.buttonValues.length) { p.data.buttonValues = p.getValue(); } else { local numToCopy = Math.min(p.getValue().length, this.data.buttonValues.length);
 for(i = 0; i < numToCopy; i++) p.data.buttonValues[i] = p.getValue()[i]; }
 p.repaint(); }
 // Changes the colour for the buttons inline function setColour(p, colourId, colour) { switch(colourId) { case ButtonPack.BackgroundColourId: p.data.bgColour = colour; break; case ButtonPack.ButtonOnColourId: p.data.onColour = colour; break; case ButtonPack.ButtonOffColourId: p.data.offColour = colour; break; } }
 // Sets the array as Control Value and repaints the panel inline function _updateInternal(p) { p.setValue(p.data.buttonValues); p.repaint(); p.changed(); }
 // @internal inline function _toggleButton(p, index) { p.data.buttonValues[index] = 1 - p.data.buttonValues[index]; _updateInternal(p); }
 // @internal inline function _setButtonValue(p, index, value) { p.data.buttonValues[index] = value; _updateInternal(p); }
 // @internal inline function _setAllButtonValues(p, value) { for(i = 0; i < p.data.buttonValues.length; i++) p.data.buttonValues[i] = newValueForAll;
 _updateInternal(p); }
 // @internal inline function _getButton(p, x) { local xNormalized = x / p.getWidth(); local index = Math.floor(p.data.buttonValues.length * xNormalized); return index; }
};
```

#### **A infinitely rotatable head**

A slider has a fixed range but what if you want to implement an infinitely rotatable head? After the last example, this is a rather easy exercise for us, so I'll skip to the final code with some comments where applicable:

```
/** Creates a inifinitely rotatable head. */
inline function createHeadSprite(name, x, y)
{ local widget = Content.addPanel(name, x, y);
 Content.setPropertiesFromJSON(name, { "width": 200, "height": 200, "saveInPreset": true, "allowCallbacks": "Clicks, Hover & Dragging" });
 // Kindly provided by Elan Hickler:) widget.loadImage("{PROJECT_FOLDER}headsprite.png", "filmstrip");
 widget.setPaintRoutine(function(g) { // Calculate the index (the filmstrip has 100 slices, each 200px high var index = parseInt(this.getValue()*100.0);
 g.drawImage("filmstrip", [0, 0, this.getWidth(), this.getHeight()], 0, index * 200); });
 // This is the sensitivity of the rotation widget.data.sensitivity = 300;
 // Save the down value as reference for all drag deltas widget.data.downValue = 0.0;
 widget.setMouseCallback(function(event) { if(event.clicked) { // Store the current value for reference when dragging widget.data.downValue = this.getValue(); }
 if(event.drag) { // Use both axis to allow diagonal drag behaviour var delta = event.dragX + -1.0 * event.dragY;
 // normalize the delta using the given sensitivity var deltaNormalized = delta / this.data.sensitivity;
 // Calculate the new value and truncate it to 0...1 var newValue = this.data.downValue + deltaNormalized; newValue = newValue - Math.floor(newValue);
 // Update the panel this.setValue(newValue); this.changed(); this.repaint(); } });
 return widget;
};
```

#### **A vectorized knob**

Using the ScriptPanel with a Path and its new `addArc`
method, you can create fully resizable knobs using only vector graphics.

```
inline function createVectorKnob(name, x, y)
{ local widget = Content.addPanel(name, x, y);
 Content.setPropertiesFromJSON(name, { "width": 50, "height": 50, "saveInPreset": 1, "allowCallbacks": "Clicks, Hover & Dragging", "enableMidiLearn": true });
 widget.data.p = Content.createPath();
 widget.setPaintRoutine(function(g) { // this is the start radian var startOffset = 2.5;
 var arcThickness = 0.15; var arcWidth = 1.0 - 2.0 * arcThickness;
 // Make sure you reset the path! this.data.p.clear();
 g.setColour(Colours.white);
 // Draw the inner circle g.fillEllipse([0.3*this.getWidth(), 0.3*this.getWidth(), 0.4*this.getWidth(), 0.4*this.getWidth()]);
 // Calculate the normalized value (in case the range is different from 0...1) var min = this.get("min"); var max = this.get("max"); var normalizedValue = (this.getValue() - min) / (max - min);
 // calculate the end radian from the current value var endOffset = -startOffset + 2.0 * startOffset * normalizedValue;
 // make sure the zero value draws a tiny fraction of the arc endOffset = Math.max(endOffset, -startOffset + 0.1);
 // Add the arc with the given area and its offsets in radian (0... 2*PI) this.data.p.addArc([arcThickness, arcThickness, arcWidth, arcWidth], -startOffset, endOffset); g.setColour(Colours.white);
 // this new method returns the scaled bounds with the correct ratio var pathArea = this.data.p.getBounds(this.getWidth());
 // draws the arc (use the area from above to avoid weird rescaling) g.drawPath(this.data.p, pathArea, this.getWidth() * arcThickness); });
 widget.setMouseCallback(function(event) { if(event.clicked) { // save the value from the mouse click this.data.downValue = this.getValue(); } if(event.drag) { // Calculate the distance using diagonal drag support var dragDistance = event.dragX + -1.0 * event.dragY;
 // Calculate the sensitivity value based on the value range var dragSensitivity = 200 / (this.get("max") - this.get("min"));
 var normalizedDistance = dragDistance / dragSensitivity;
 // Calculate the new value (limit it to the given range) var newValue = Math.range(this.data.downValue + normalizedDistance, this.get("min"), this.get("max"));
 // Ignore the mouse events above the limits if(newValue != this.getValue()) { // Change the value this.setValue(newValue);
 // Call the paint method // unlike repaint, this is a bit faster, but call this only // in either the mouse callback or the timer callback of the panel this.repaintImmediately();
 // this method triggers the control callback this.changed(); } } });
 return widget;
};

// Usage:
const var Panel = createVectorKnob("Panel", 0, 0);
```

## Scripting API

### **Scripting API**

**HISE**
provides a API with over 200 functions which allow interaction between the core engine and the script processor. There is a complete list of all API calls in the API Collection, but you can also use the Autocomplete Popup
in the Script Editor to quickly browse through all available functions.

### Array

The array is the default container type in HiseScript for holding multiple elements that can be accessed by their index. There are a few other container types which are better suited for particular workflows (see the section about Alternatives below), but for general data processing this is one of the most important concepts to know about.

#### **Basic usage**

```
const var a = [];         // Declare an array
a[0] = 12;                // Set the element at position 0 to 12
a[1] = "Hello";           // Set the element at position 1 to "Hello"
Console.print(a.length);  // Print the length (in this case 2)
a.clear();                // Deletes all items from the array
```

If you have used another programming language before, this might look pretty familiar. Be aware that you can add / delete items from the array despite having it declared as `const var`. The "constness" just refers to the assignment, so you can't reassign this variable to another value.

#### **Iterating over an array**

Basically there are two ways of iterating (= going over each element in the array):

**Range-based Loop** | **Index-based Loop** || `for(element in array)` | `for(i = 0; i < array.length; i++)` |
| This is the preferred method, because it has a clearer syntax (and is faster). As long as you don't need to know the index of the element, it's recommended to use this method. | If you need the index of the current item in the loop (eg. because you iterate over multiple arrays at once), use this loop. |

The index based loop construct is the only place where you can define anonymous variables (so that `for(i = 0...`
doesn't throw a compile error).

#### **Ownership & lifetime**

An array is reference counted, which means that if you assign an array to another variable, it will use the same array.

```
const var a = [1, 5, 6];
const var b = a;

a[0] = 10;           // set the first element of a
Console.print(b[0]); // the first element of b will also be 10
```

#### **Alternatives**

The Array is a very dynamic container type and can be resized at any time to make room for more elements. For UI and data processing this is an incredibly useful feature. However this flexibility makes it a very poor choice for whenever you want to do some MIDI processing logic which usually runs in the audio callback where allocating new memory is a no go.

In order to mitigate this problem, there are a bunch of other container types similar to the stock Array but with an emphasis on certain tasks within the realtime callback:

- Buffer is a densely packed, floating point array that represents audio signals
- MidiList is a object that holds 128 integer numbers and is particularly useful for holding MIDI information (eg. note numbers)
- FixObjectArray is a preallocated list of elements with a predefined memory structure and can be the most efficient solution for many tasks
- Unorderedstack is a stack that offers fast insertion / removal by ignoring the order of elements and is particularly useful for storing the information about currently played notes (where the order doesn't matter).

If you don't want to use those containers, you can of course use the Array in the MIDI processing context as long as you don't resize the container (which is why the Array.reserve()
function is so importanta).

#### **clear**

Clears the array.

```
Array.clear()
```

This is a quick operation (the allocated storage space will not be freed), so you can use it in a realtime callback.

```
const var arr = []; // Declare an array

// preallocate 10 elements, do this if you
// know how many elements you are about to insert
arr.reserve(10);

for(i = 0; i < 10; i++)
{
	// Add an element to the end of the array
	arr.push(Math.randInt(0, 1000);
}

Console.print(trace(arr)); // [ 523, 5, 76, 345, 765, 45, 977, 223, 44, 54]

arr.clear();

Console.print(trace(arr)); // []
```

#### **clone**

Creates a deep copy of the array.

```
Array.clone()
```

If you assign an array object
reference to another constant or variable, you're only setting the reference. Making any changes to the array B by referencing it will also make changes to array A. If you need a separate set of data to work on, you need to clone it.

```
const arr1 = [0, 1];

var arr2 = arr1;

// Changing any element in arr2 will also change it in arr1
arr2[0] = 22;
Console.print(trace(arr1)); // [22, 1]

// Reset the element 0 back to 0
arr1[0] = 0;

// Cloning the array creates a new dataset in memory, separate from the original array
arr2 = arr1.clone();
Console.print(trace(arr1)); [0, 1]
arr2[0] = 22;
Console.print(trace(arr2)); [22, 1]
```

Because arrays in HISE are effectively objects (which is hinted at by them having a bunch of class methods we're looking at here), this method will also work with any other object, including JSON objects, component references etc.

#### **concat**

Concatenates (joins) two or more arrays

```
Array.concat(var argumentList)
```

This method combines two or more arrays. You can pass in any number of arrays which will be put at the end of the array. It ignores non-array argument elements.

```
const var arr1 = [0, 1, [2, 3, 4]];

// note how the array in the array is counted as a single element
Console.print(arr1.length); // 3

const var arr2 = [5, 6, 7];
const var arr3 = [8, 9, 10];

arr1.concat(arr2);
Console.print(trace(arr1)); // [0, 1, [2, 3, 4], 5, 6, 7]

arr1.concat(arr3);

// the arr1 already contains arr2
Console.print(trace(arr1)); // [0, 1, [2, 3, 4], 5, 6, 7, 8, 9, 10]

// set type to array
const var arr4 = [];
arr4.concat(arr2, arr3, 8726, [11, 12, 13]);

// non-array arguments get ignored // arguments can be arrays themselves
Console.print(trace(arr4)); // [5, 6, 7, 8, 9, 10, 11, 12, 13]
```

#### **contains**

Searches for the element in the array.

```
Array.contains(var elementToLookFor)
```

The `Array.contains`
method checks if an array includes a certain element. If the array contains the specified element, it returns `true`,
otherwise it returns `false`.
`elementToLookFor`
is the element to search for within the array.

###### **Example**

```
const var fruits = ["apple", "banana", "mango", "orange"];

Console.print(fruits.contains("banana")); // true
Console.print(fruits.contains("grape"));  // false
```

#### **every**

Checks if all array elements pass a function test. Edit on GitHub

```
Array.every(var testFunction, var optionalThisObject)
```

#### **filter**

Creates a new array filled with elements that pass the function test. Edit on GitHub

```
Array.filter(var testFunction, var optionalThisObject)
```

#### **find**

Returns the value of the first element that passes the function test.

```
Array.find(var testFunction, var optionalThisObject)
```

The test function you pass in can have up to 3 parameters:

- the first parameter will be the element you need to perform the check on
- the second parameter will be the index
- the third parameter will be the array itself

```
const var list = [ "Hello", "world", "HISE", "rules" ];

Console.print(list.find(function(element){ return element.contains("H");})); // Hello
Console.print(list.find(function(element){ return element.contains("HI");})); // HISE
```

Using this function can vastly decrease the amount of code you need to write. This is the same logic of the first call with a loop and a custom function to achieve the same thing.

```
const var list = [ "Hello", "world", "HISE", "rules" ];

function findH()
{
	for(element in list)
	{
		if(element.contains("H"))
			return element;
	}

	return undefined;
}

Console.print(findH()); // Hello
```

#### **findIndex**

Returns the index of the first element that passes the function test. Edit on GitHub

```
Array.findIndex(var testFunction, var optionalThisObject)
```

#### **forEach**

Calls a function for each element. Edit on GitHub

```
Array.forEach(var testFunction, var optionalThisObject)
```

#### **indexOf**

Searches the array and returns the first index.

```
Array.indexOf(var elementToLookFor, int startOffset, int typeStrictness)
```

Return the index of the first occurence or `-1`
if the item can't be found.

```
const var a = [1, 5, 5];
a.indexOf(5); // will return 1
a.indexOf("5"); // will also return 1, the search is not type-strict.
```

#### **insert**

Inserts the given arguments at the firstIndex.

```
Array.insert(int firstIndex, var argumentList)
```

The `Array.insert`
method allows you to add an element at a specified `firstIndex`
in the array. It modifies the original array and shifts the elements after the specified index to the right allowing for greater control over the array's structure than using Array.push
or setting the element using the `[]`
-operator.

Note that if you pass in an Array as new element, it will add the element as an array and not the individual elements, so you'll end up with an Array within an Array.

###### **Example**

```
const var numbers = [1, 2, 3, 4, 5];

numbers.insert(2, 10);
Console.print(trace(numbers)); // [1, 2, 10, 3, 4, 5]

numbers.insert(0, 20);
Console.print(trace(numbers)); // [20, 1, 2, 10, 3, 4, 5]

numbers.insert(numbers.length, 30);
Console.print(trace(numbers)); // [20, 1, 2, 10, 3, 4, 5, 30]

numbers.insert(3, [101, 102, 103]);
Console.print(trace(numbers));
```

#### **isArray**

Checks if the given variable is an array.

```
Array.isArray(var variableToTest)
```

A simple bool check whether the argument variable is an Array. **Note that this function is not a method that you call on the object itself (because calling it on a non-array would not find the function).**
Instead you'll call it with the generic syntax `Array.isArray()`

```
const var trustMeIAmAnArray = 0;
const var notAnArrayTooButNiceTryString = "[1, 2, 3, 4, 5]";
const var list = [1, 2, 3, 4];

Console.print(Array.isArray(notAnArrayTooButNiceTryString)); // false;
Console.print(Array.isArray(trustMeIAmAnArray)); // false
Console.print(Array.isArray(list)); // true (finally)
```

#### **join**

Joins the array into a string with the given separator.

```
Array.join(var separatorString)
```

This method is useful when you want to change the item list of some UI controls, for example a Combobox.

```
const var list = ["item1", "item2", "item3"];     // Creates a list of all available samplemaps
const var box = Content.addComboBox("box", 0, 0); // Creates a combobox
box.set("items", list.join("\n"));                // sets the list as items
```

The opposite of this method is String.split()

#### **map**

Creates a new array from calling a function for every array element.

```
Array.map(var testFunction, var optionalThisObject)
```

This is useful if you want to perform an operation for every single element of an array by passing in a premade function. An alternative would be to use a `for(x in array)`
loop, but the map method allows for cleaner multidimensional processing.

You need to pass in a function to be executed on each element of the array and an (optional) object that will be used as `this`
in the function call.

The function can have up to three parameters:

1. the element
2. the index of the element
3. the full array

and is supposed to return a value that will be added to the newly created array that is returned by the function:

```
function(element, index, array)
{
	return someValue;
}
```

But you can omit the second and third parameter if you don't need it.

```
const arr1 = ["hello", 2, 3];

arr1.map(function(element, index)
{
	Console.print(index + ": " + element);
});

// Output:
// Interface: 0: hello
// Interface: 1: 2
// Interface: 2: 3
```

The method returns an array of individual function returns. If no return exists, the element will be undefined/null.

```
const arr1 = [0, 1];

const arr2 = arr1.map(function(element)
{
	return element + 10;
});

Console.print(trace(arr2)); // [10, 11]
```

In order to supply a object that you can reference through `this`
in the function call, use the second argument:

```
const test = 10;
const arr1 = [0, 1];

arr1.map(function(element)
{
	Console.print(test); // 10
}, test);
```

#### **pop**

Removes and returns the last element.

```
Array.pop()
```

This is useful for managing sequential input that you're keeping track of: history of played notes, velocities, custom undo history etc.

You might want to use it in conjunction with Array.push()
in order to implement a stack logic with the array.

Note that there's a special container type
if you need a stack that doesn't care about the order of elements.

```
const arr1 = [1, 2, 3];
arr1[4] = 5;

Console.print(arr1.pop()); // 5

// we didn't set the 4th element (index 3) so it'll be undefined
Console.print(arr1.pop()); // error: API call with undefined parameter

arr1[3] = 22;
Console.print(trace(arr1)); // [1, 2, 3, 22]

// we can check ourselves for errors in our logic in this case
if (isDefined(arr1.pop()
{ // do stuff
}
```

#### **push**

Adds the given element at the end and returns the size.

```
Array.push(var elementToInsert)
```

If you know that you are going to add multiple elements, you can call Array.reserve()
to preallocate the amount of elements and improve performance:

```
const var a = [];

// Uncomment this to see the performance improvement:
//a.reserve(100);

Console.start();
for(i = 0; i < 100; i++)
{ a.push(5);
}
Console.stop()
```

#### **pushIfNotAlreadyThere**

Adds the given element at the end and returns the size.

```
Array.pushIfNotAlreadyThere(var elementToInsert)
```

The method will not add an element to an array if a matching element already exists inside the array.
If the argument is an element that already exists, the return will still be the first index beyond the end of an array (not an index of a first/any matching element).

It is basically a short version of typing:

```
if(myArray.indexOf(someElement) == -1)
	myArray.push(someElement);
```

```
const arr1 = [0, 1];

arr1.pushIfNotAlreadyThere(2);
Console.print(trace(arr1)); // [0, 1, 2]

// It won't add an element if it already exists in the array
arr1.pushIfNotAlreadyThere(2);
Console.print(trace(arr1)); // [0, 1, 2]

arr1.pushIfNotAlreadyThere(1);
Console.print(trace(arr1)); // [0, 1, 2]

Console.print(arr1.pushIfNotAlreadyThere(1)); // 3
```

#### **remove**

Removes all instances of the given element.

```
Array.remove(var elementToRemove)
```

Note that this will search and remove the value you pass in as argument - if you want to remove an element at a certain index, use Array.removeElement()
instead.

```
const var arr1 = [1, 2, 3, 4, 2, 5,];
arr1.remove(2);

Console.print(trace(arr1)); // [1, 3, 4, 5]
```

#### **removeElement**

Removes the element at the given position.

```
Array.removeElement(int index)
```

Note that the argument you pass into this function is supposed to be the (zero-based) index in the array, in order to remove a(ll) element(s) by value, use Array.remove()
instead

```
const var arr1 = [1, 5, 3];
Console.print(arr1[1]); // 5

arr1.removeElement(1);
Console.print(arr1[1]); // 3
```

#### **reserve**

Reserves the space needed for the given amount of elements.

```
Array.reserve(int numElements)
```

If you are going to populate this array in a realtime callback, you need to make sure that there is enough storage allocated in order to avoid reallocation. This method can be used to preallocate slots that can be filled later.

Be aware that this method will not change the `Array.length`
property:

```
const var array = [];       // create a new array
array.reserve(128);         // allocate 128 items
Console.print(array.length) // will output 0;
array[64] = 190;            // this will not allocate
Console.print(array.length) // will print 65
```

This method will allocate enough memory to hold primitive values, but if you are going to store complex objects (arrays or objects), calling `Array.reserve()`
will not prevent reallocation.

#### **reverse**

Reverses the order of the elements in the array.

```
Array.reverse()
```

`javascriptconst var arr1 = [1, 2, 3];arr1.reverse();Console.print(trace(arr1)); // [3, 2, 1]`

#### **shift**

Removes and returns the first element. Edit on GitHub

```
Array.shift()
```

#### **some**

Checks if any array elements pass a function test. Edit on GitHub

```
Array.some(var testFunction, var optionalThisObject)
```

#### **sort**

Sorts the array.

```
Array.sort()
```

This will sort the array using a sensible sort algorithm:

- Numbers will be sorted naturally,
- Strings will be sorted alphabetically
- Objects and arrays will not be sorted.

```
const var a = [1, 6, 4, 2, 1];
a.sort();

for(i in a) Console.print(i);

// Result: 1, 1, 2, 4, 6
```

You can also customize the sorting by supplying a custom sort function with Engine.sortWithFunction().

#### **sortNatural**

Sorts array of numbers, objects, or strings with "number in string" priority. Can also sort a combination of all types

```
Array.sortNatural()
```

It puts arrays first in index order (doesn't sort them), followed by a mix of int, double and string variables. If a string starts with a number, it'll get thrown in the mix.

JSON objects go last.

```
const var arr1 = [5.2, 3, "1", "17",
				  [4, 2], [1, 12],
				  "word", "with2", "3LittlePigs",
				  {"prop1": 12, "prop2": 55}];

arr1.sortNatural();

// [[4, 2], [1, 12], "1", 3,
// "3LittlePigs", 5.2, "17",
// {"prop1": 12, "prop2": 55} ]
Console.print(trace(arr1));
```

You can also customize the sorting by supplying a custom sort function with Engine.sortWithFunction().

### AudioFile

The `Audiofile`
object is a data slot for loading sample files - not to be confused with the File
object which represents an actual file on your disk.

##### **Creating an Audiofile object**

It is one of the 5 complex data types and can be created using

- Engine.createAndRegisterAudioFile() - creates a new slot that can hold an audio file
- AudioSampleProcessor.getAudioFile() - returns a reference to an audio file slot of another module
- ScriptAudioWaveform.registerAtParent() - registers the content of a UI waveform display at the script processor and returns the reference to the content as AudioFile object

You can also attach a broadcaster to a data slot to get notified about event changes. Broadcaster.attachToComplexData()

All the examples in this documentation require a audio file slot that is loaded with an actual audio file to operate on. The easiest way of getting there is to just load the example assets of the snippet browser (once you have downloaded them):

```
// Load the example assets
FileSystem.loadExampleAssets();

// Grab whatever asset is first
const var firstAsset = Engine.loadAudioFilesIntoPool()[0];
Console.print(firstAsset); // {PROJECT_FOLDER}breakbeat_44k.wav

// Create a audio file slot
const var audioFile = Engine.createAndRegisterAudioFile(0);

// load the first asset
audioFile.loadFile(firstAsset);

// paste in all other code examples now...
```

#### **getContent**

Returns the current audio data as array of channels.

```
AudioFile.getContent()
```

The `getContent`
method retrieves the current audio data from the audio file and returns it as an array of channels. Each channel is represented as a Buffer
object, which is a special float array type in HISE. This method is useful for accessing and manipulating the raw audio data for processing or analysis.

```
// Assume 'audioFile' is a valid AudioFile object

// Retrieve the current audio content
var audioContent = audioFile.getContent();

// Print the number of channels in the audio file
Console.print("Number of channels: " + audioContent.length);

// Iterate over each channel
for (var i = 0; i < audioContent.length; i++)
{ var channel = audioContent[i];
 // Print the first 10 samples of each channel for inspection Console.print("Channel " + (i + 1) + " first 10 samples:"); for (var j = 0; j < 10; j++) { Console.print(channel[j]); }
}

// Example of processing: Normalize the first channel
var firstChannel = audioContent[0];
var numSamples = firstChannel.length;
var maxSample = 0.0;

// Find the maximum sample value
for (var i = 0; i < numSamples; i++)
{ if (Math.abs(firstChannel[i]) > maxSample) { maxSample = Math.abs(firstChannel[i]); }
}

// Normalize the first channel
if (maxSample > 0)
{ for (var i = 0; i < numSamples; i++) { firstChannel[i] /= maxSample; } Console.print("First channel has been normalized.");
}
else
{ Console.print("No need to normalize, max sample is zero.");
}
```

#### **getCurrentlyDisplayedIndex**

Returns the current sample position (from 0 to numSamples).

```
AudioFile.getCurrentlyDisplayedIndex()
```

The `getCurrentlyDisplayedIndex`
method retrieves the current sample position within the audio file. This position is represented as an integer ranging from 0 to the total number of samples in the file (`numSamples`
). It is useful for tracking the playback or editing position within the audio file.

Note that for a live update of the playback position it might be more efficient to register a broadcaster to the complex data event using the `AudioFile.DisplayIndex`
mode

**Related Methods:**

- AudioFile.getNumSamples: Retrieves the total number of samples in the audio file.

**Example Usage:**

```
// Assume 'audioFile' is a valid AudioFile object

// Retrieve the current sample position
var currentPosition = audioFile.getCurrentlyDisplayedIndex();

// Retrieve the total number of samples in the audio file
var totalSamples = audioFile.getNumSamples();

// Calculate the normalized position (between 0.0 and 1.0)
var normalizedPosition = currentPosition / totalSamples;

const var slider = Content.getComponent("Knob1");

// Set the slider value based on the normalized position
slider.setValue(normalizedPosition);

// Print the current sample position and normalized slider value to the console
Console.print("Current sample position: " + currentPosition);
Console.print("Normalized slider value: " + normalizedPosition);
```

#### **getCurrentlyLoadedFile**

Returns the reference string for the currently loaded file.

```
AudioFile.getCurrentlyLoadedFile()
```

The `getCurrentlyLoadedFile`
method returns the reference string for the currently loaded audio file. This reference string indicates the file path or name of the audio file that is currently in use. If the file is located in the **AudioFiles**
folder of your project, the path up to the **AudioFiles**
folder will be represented by the `{$PROJECT_FOLDER}`
placeholder. Otherwise this will return the system-specific absolute path to the audio file that was loaded into the audio file slot.

This is particularly useful for ensuring that file references remain consistent regardless of the actual location of the project on your file system.

If you want to get the actual file object from the return value of this method, it's recommended to use the FileSystem.fromReferenceString()
method which takes in either an absolute path or a reference string and hence is the perfect match for the return value.

```
// Retrieve the reference string for the currently loaded file
const var refString = audioFile.getCurrentlyLoadedFile();

const var actualFile = FileSystem.fromReferenceString(refString, FileSystem.AudioFiles);
```

#### **getNumSamples**

returns the amount of samples.

```
AudioFile.getNumSamples()
```

The `getNumSamples`
method returns the total number of samples in the audio file. This is an integer value representing the length of the audio file in terms of the number of discrete audio samples it contains. It is useful for understanding the size of the audio data and for performing operations that depend on the total sample count.

**Related Methods:**

- AudioFile.getSampleRate: Retrieves the sample rate of the audio file, which is the number of samples per second.

```
// Assume 'audioFile' is a valid AudioFile object

// Retrieve the total number of samples in the audio file
const var numSamples = audioFile.getNumSamples();

// Retrieve the sample rate of the audio file
const var sampleRate = audioFile.getSampleRate();

// Calculate the duration of the audio file in seconds
const var durationInSeconds = numSamples / sampleRate;

// Print the total number of samples and the duration to the console
Console.print("Total number of samples: " + numSamples);
Console.print("Sample rate: " + sampleRate + " Hz");
Console.print("Duration of the audio file: " + durationInSeconds + " seconds");

// Further usage: Check if the audio file is longer than a specific duration
const var thresholdDuration = 60; // 60 seconds
if (durationInSeconds > thresholdDuration)
{ Console.print("The audio file is longer than " + thresholdDuration + " seconds.");
}
else
{ Console.print("The audio file is not longer than " + thresholdDuration + " seconds.");
}
```

#### **getSampleRate**

Returns the samplerate of the audio file.

```
AudioFile.getSampleRate()
```

The `getSampleRate`
method returns the sample rate of the audio file. The sample rate is the number of samples per second and is typically measured in Hertz (Hz). This value is crucial for accurately interpreting the timing and pitch of the audio data.

**Difference between**
**AudioFile.getSampleRate**
 **and**
**Engine.getSampleRate**
**:**

- `AudioFile.getSampleRate` returns the sample rate of the specific audio file that is currently loaded. This sample rate is determined by how the audio file was recorded or converted and can vary between different audio files.
- Engine.getSampleRate() returns the sample rate of the audio engine that is specified by the audio driver (or the DAW that the plugin is running in).

**Related Methods:**

- AudioFile.getNumSamples: Retrieves the total number of samples in the audio file.

```
// Assume 'audioFile' is a valid AudioFile object

// Retrieve the sample rate of the audio file
var fileSampleRate = audioFile.getSampleRate();
Console.print("Audio file sample rate: " + fileSampleRate + " Hz");

// Retrieve the sample rate of the audio engine
var engineSampleRate = Engine.getSampleRate();
Console.print("Audio engine sample rate: " + engineSampleRate + " Hz");

// This would be the playback speed that is required to play back
// the file in the original speed (most things in HISE that play
// back samples will do this for you).
var playbackRatio = fileSampleRate / engineSampleRate;
```

#### **linkTo**

Links this audio file to the other Edit on GitHub

```
AudioFile.linkTo(var other)
```

#### **loadBuffer**

Loads a buffer into the audio sample slot. Edit on GitHub

```
AudioFile.loadBuffer(var bufferData, double sampleRate, var loopRange)
```

#### **loadFile**

Loads an audio file from the given reference. Edit on GitHub

```
AudioFile.loadFile( String filePath)
```

#### **setContentCallback**

Sets a callback that is being executed when a new file is loaded (or the sample range changed).

```
AudioFile.setContentCallback(var contentFunction)
```

The `setContentCallback`
method sets a callback function that is executed whenever a new file is loaded or the sample range changes within the audio file. This callback can be used to perform custom actions or updates in response to these events. The method takes one parameter, `contentFunction`, which is the function to be called. The function should not take any parameters but will have its `this`
object pointed to the audio file that has changed.

```
// Assume 'audioFile' is a valid AudioFile object
// Clear the file slot (so that the content callback fires
// if you recompile after loading it the first time)
audioFile.loadFile("");

// Set the callback
audioFile.setContentCallback(function()
{
	// print out some properties (the this object of the
	// function will point to the audio file)...
	Console.print(this.getCurrentlyLoadedFile()); // {PROJECT_FOLDER}breakbeat_44k.wav
	Console.print(this.getSampleRate()); // 44100.0
	Console.print(this.getNumSamples()); // 830117
});

// load the first asset
audioFile.loadFile(firstAsset);
```

#### **setDisplayCallback**

Sets a callback that is being executed when the playback position changes.

```
AudioFile.setDisplayCallback(var displayFunction)
```

The `setDisplayCallback`
method sets a callback function that is executed whenever the playback position changes within the audio file. This can be useful for updating UI elements or performing other actions in response to changes in the playback position. The method takes one parameter, `displayFunction`, which is the function to be called. The function will have its `this`
object assigned to the audio file and needs to have a single parameter that will provide the playback position as sample index.

**Related Methods:**

- AudioFile.getCurrentlyDisplayedIndex: Retrieves the current sample position within the audio file.
- AudioFile.getNumSamples: Retrieves the total number of samples in the audio file.

**Example Usage:**

```
// Grab a reference to a looper that is loaded with a sound
// (we need it to actually play the sample for this example)
const var AudioLoopPlayer1 = Synth.getAudioSampleProcessor("Audio Loop Player1");

// Grab a reference to the loop audio file slot
const var audioFile = AudioLoopPlayer1.getAudioFile(0);

// register a function to be called whenever the playback position changes
audioFile.setDisplayCallback(function(displayValue)
{
	// Print the normalised position using the sample length
	Console.print(displayValue / this.getNumSamples());
});
```

#### **setRange**

Sets a new sample range.

```
AudioFile.setRange(int min, int max)
```

The `setRange`
method sets a new sample range for the audio file. This range is defined by the `min`
and `max`
sample positions, effectively selecting a subset of the audio data. This method provides a scripting option for changing the sample range, which can also be done interactively by dragging the sample area in the Audio Waveform.

**Example Usage:**

```
// Paste in the code to load the asset from above...

// clear the audio file (so that it loads the full file again
// when you recompile)
audioFile.loadFile("");

// load the first asset (again)
audioFile.loadFile(firstAsset);

// Define the new sample range
var minSample = 1000;
var maxSample = 5000;

// Grab the full sample data
var fullSample = audioFile.getContent();

Console.print(fullSample[0].length); // 830117

// Set the new sample range using the setRange method
audioFile.setRange(minSample, maxSample);

// Now the getContent() method will only return the slice
// from 1000 to 5000
var slice = audioFile.getContent();

Console.print(slice[0].length); // 4000
```

#### **update**

Sends an update message to all registered listeners.

```
AudioFile.update()
```

There are a number of occasions where you want to manually cause a listener callback to be fired again.

This function will send the content change message to all listeners (so if you have assigned a callback using Audiofile, this will call it again even if the content hasn't changed).

```
audioFile.loadFile("");

var counter = 0;

// Set the callback
audioFile.setContentCallback(function()
{
	Console.print(++counter);
});

// load the first asset
audioFile.loadFile(firstAsset);

// The content callback is asynchronous
// so the counter is still 0
Console.print(counter); // 0

// Send the listener again
audioFile.update();

// still zero
Console.print(counter); // 0

// The full console output will show that
// the content callback has been executed twice:
// Interface: 0
// Interface: 0
// Interface: 1
// Interface: 2
```

### AudioSampleProcessor

An `AudioSampleProcessor`
object is a reference to a HISE module that can load audio files (eg. the Audio Loop Player
or the Convolution Reverb
). The associated project folder is AudioFiles.

There are API calls that can load different audio files from the AudioFilePool, change the range within the audio file.

Normally you create an object of this type using Synth.getAudioSampleProcessor()
and then call one of its methods.

#### **exists**

Checks if the Object exists and prints a error message on the console if not. Edit on GitHub

```
AudioSampleProcessor.exists()
```

#### **getAttribute**

Returns the attribute with the given index. Edit on GitHub

```
AudioSampleProcessor.getAttribute(int index)
```

#### **getAttributeId**

Returns the attribute with the given index. Edit on GitHub

```
AudioSampleProcessor.getAttributeId(int index)
```

#### **getAttributeIndex**

Returns the index of the attribute with the given ID. Edit on GitHub

```
AudioSampleProcessor.getAttributeIndex(String id)
```

#### **getAudioFile**

Creates a ScriptAudioFile reference to the given index. Edit on GitHub

```
AudioSampleProcessor.getAudioFile(int slotIndex)
```

#### **getFilename**

Returns the filename (including wildcard) for the currently loaded file. Edit on GitHub

```
AudioSampleProcessor.getFilename()
```

#### **getNumAttributes**

Returns the number of attributes. Edit on GitHub

```
AudioSampleProcessor.getNumAttributes()
```

#### **getSampleLength**

Returns the length of the current sample selection in samples. Edit on GitHub

```
AudioSampleProcessor.getSampleLength()
```

#### **getSampleStart**

Returns the samplerange in the form [start, end]. Edit on GitHub

```
AudioSampleProcessor.getSampleStart()
```

#### **isBypassed**

Checks if the audio sample player is bypassed. Edit on GitHub

```
AudioSampleProcessor.isBypassed()
```

#### **setAttribute**

Changes one of the Parameter. Look in the manual for the index numbers of each effect. Edit on GitHub

```
AudioSampleProcessor.setAttribute(int parameterIndex, float newValue)
```

#### **setBypassed**

Bypasses the audio sample player. Edit on GitHub

```
AudioSampleProcessor.setBypassed(bool shouldBeBypassed)
```

#### **setFile**

loads the file. You can use the wildcard {PROJECT\_FOLDER} to get the audio file folder for the current project. Edit on GitHub

```
AudioSampleProcessor.setFile(String fileName)
```

#### **setSampleRange**

Sets the length of the current sample selection in samples. Edit on GitHub

```
AudioSampleProcessor.setSampleRange(int startSample, int endSample)
```

### BackgroundTask

Every callback that you define in HiseScript is being serialised and called on a single thread in order to avoid synchronisation issues and race conditions (a situation where two threads try to access the same resource). There is a priority system in place which makes sure that certain tasks cannot block other tasks (so eg. a control callback will be executed before a paint routine and if you recompile a script it will discard all pending callbacks for this script processor).

A notable exception is of course the realtime callbacks which are executed directly in the audio thread but since you should not allocate anything in there anyways, any possible race conditions between the scripting thread and the audio thread are not super critical.

However there are a few occasions where this model creates unwanted side effects: a really complex task that will take a lot of time might clog this system and prevent user interaction. In order to solve this, you can use this object to offload a heavyweight function to a separate thread while the scripting thread remains idle and responsive.

Be aware that at this point it is a highly experimental function and I would not advise using this without extensive testing of your use case as there might be many subtle issues that come from the multithreading of the function executions.

The prime use case for this object is when you are working with samples to create custom workflow tools.

In order to use it, create an object with Engine.createBackgroundTask(), and then give it a function to execute with `callOnBackgroundThread()`.

#### **callOnBackgroundThread**

Call a function on the background thread.

```
BackgroundTask.callOnBackgroundThread(var backgroundTaskFunction)
```

This will start a new thread and call the function that you've passed in. The function must have a single parameter which will contain a reference to this object that you can use for status reporting / thread control.

#### **getProgress**

Get the progress for this task. Edit on GitHub

```
BackgroundTask.getProgress()
```

#### **getProperty**

Retrieve a property through a thread safe container. Edit on GitHub

```
BackgroundTask.getProperty(String id)
```

#### **getStatusMessage**

Returns the current status message. Edit on GitHub

```
BackgroundTask.getStatusMessage()
```

#### **killVoicesAndCall**

Kills all voices and calls the given function on the sample loading thread. Edit on GitHub

```
BackgroundTask.killVoicesAndCall(var loadingFunction)
```

#### **runProcess**

Spawns a OS process and executes it with the given command line arguments.

```
BackgroundTask.runProcess(var command, var args, var logFunction)
```

This function will use a child process to run any command line application on this background thread. Just pass in the command you want to execute, the command line arguments (either as an array of strings or as a single string which will be split up at unquoted whitespace characters) and a logger function that will periodically read the programs output and called whenever a new line was printed to the standard output. The function needs to have three arguments which will contain:

1. A reference to the background task object (so you can set the progress)
2. a `bool` value that is true when the program has finished
3. An integer containing the exit code (if the program has finished and the second argument is `true` ) or a string for each line from the program output.

Be aware that in order to allow a graceful exit, you have to set the timeout of this background task to be higher than the longest interval between the output of your program, otherwise the thread might be killed with undefined behaviour.

This example here uses CURL to download a 100MB test file and put it on the Desktop. It should work on both macOS and Windows (10).

```
// Create a background task and give it a name that's descriptive
const var b = Engine.createBackgroundTask("DownloadTest");

// Let's forward the status and progress to the official HISE progress system
// (this will show the status in the main top bar in HISE and you can hook up
//  Panels to a preload callback on your UI)
b.setForwardStatusToLoadingThread(true);

// CURL will spit out a new line roughly every second, so setting the timeout to 2 seconds will ensure
// that it can be cancelled gracefully.
b.setTimeOut(2000);

// We can use the finish callback to show / hide some elements
b.setFinishCallback(function(isFinished, wasCancelled)
{
	b.setProgress(0.0);

	Console.print("Finished: " + isFinished);
	Console.print("Cancelled: " + wasCancelled);
});

function downloadLogger(thread, isFinished, data)
{
	if(isFinished)
		return;

	// Now let's hack around and format the CURL output to something
	// that we can show in HISE

	// Begin of nasty hacking procedure...
	var v = data.split(" ");
	for (i = 0; i < v.length; i++)
	{
	    if (v[i].length == 0)
	        v.removeElement(i--);
	}

	var progress = parseInt(v[0]) / 100.0;
	var m = "Downloading " + v[3] + "B of " + v[1] + "B";

	if (progress < 0.01)
		m = "Start Downloading...";
	//...End of nasty hacking procedure

	thread.setProgress(progress);
	thread.setStatusMessage(m);
}

// This button will just start and cancel the download
const var button = Content.addButton("Run", 0, 0);
button.set("saveInPreset", false);

inline function onButton(component, value)
{
	if(value)
	{
		local f = FileSystem.getFolder(FileSystem.Desktop).getChildFile("testfile.dat");

		// Use CURL to download a test file of 100MB
		b.runProcess("curl", ["https://speed.hetzner.de/100MB.bin",
							  "--output",
							  f.toString(0)],
							  downloadLogger);
	}
	else
	{
		// This should gracefully cancel the download
		b.sendAbortSignal(false);
	}
};

Content.getComponent("Run").setControlCallback(onButton);
```

#### **sendAbortSignal**

Signal that this thread should exit.

```
BackgroundTask.sendAbortSignal(bool blockUntilStopped)
```

If the task is running, this will send a abort signal so that the next time you call shouldAbort()
it will return false and gives you the option to cancel the task gracefully.

This can be called from any thread (but the most useful application is a control callback obviously). if `blockUntilStopped`
is true, the function will wait until the thread has been stopped (in case you require that the thread has been terminated before proceeding).

#### **setFinishCallback**

Set a function that will be called when the task has started / stopped.

```
BackgroundTask.setFinishCallback(var newFinishCallback)
```

You can pass a function with two parameters here that will be executed when the thread starts and when it stops. This might be useful for notifying your UI that the task is in progress. Be aware that this function will be called on the scripting thread and might be executed at the same time as the actual task!

#### **setForwardStatusToLoadingThread**

Forward the state of this thread to the sample loading thread notification system.

```
BackgroundTask.setForwardStatusToLoadingThread(bool shouldForward)
```

There is another background thread in HISE that is used for preset / sample loading as well as for other heavyweight tasks. This offers a convenient notification system that you might already use in your project. In this case you can call this method with `true`
and it will forward any status changes of this task. This includes:

- ScriptPanel.setLoadingCallback(): will be called when the task starts / stops
- Engine.getPreloadMessage(): will return the message passed in with `setStatusMessage()`
- Engine.getPreloadProgress(): will return the task's progress

Be aware that this only captures the notification system for the time the task is active but does not lock the real loading thread so if you spawn a task on the main loading thread (eg. loading a samplemap) while your custom task is active, it might create glitches and inconsistent notifications.

#### **setProgress**

Set a progress for this task. Edit on GitHub

```
BackgroundTask.setProgress(double p)
```

#### **setProperty**

Set a property to a thread safe container. Edit on GitHub

```
BackgroundTask.setProperty(String id, var value)
```

#### **setStatusMessage**

Sets a status message. Edit on GitHub

```
BackgroundTask.setStatusMessage(String m)
```

#### **setTimeOut**

Set timeout.

```
BackgroundTask.setTimeOut(int ms)
```

You can set a custom timeout period that the thread will wait until it will force-kill the task (which might leave things in a bad place). The default time is 500 milliseconds, but you can change this value if you need. The best way to get an estimate for how long you need the timeout is the period between calls to `shouldAbort()`. So if you have a task like this:

```
function myTask(thread)
{
	for(i = 0; i < 1000000; i++)
	{
		if(thread.shouldAbort())
			break;

		subFunctionThatTakes900MillisecondsPerRun();
	}
}
```

you should set the timeout to something like 1000ish milliseconds - including some headroom for computers that are slower obviously and I would rather suggest to break down the function in the loop into multiple parts and call `shouldAbort()`
more often to avoid any freezing.

#### **shouldAbort**

Checks whether the task should be aborted (either because of recompilation or when you called abort().

```
BackgroundTask.shouldAbort()
```

This function should be called as often as possible to figure out whether the thread needs to be cancelled, which might happen because of two reasons:

1. You have called `sendAbortSignal()`
2. This object is being deleted (either because your app is terminated or the script is recompiled inside HISE)

If you're doing things in a loop it's highly advised to call it once per loop and the time between two calls to `shouldAbort()`
must never exceed the thread timeout (in fact the execution will time out if you fail to do so which is a safe check that should prevent you from forgetting to call this).

### BeatportManager

A wrapper around the Beatport API to manage the licensing of Beatport access.

https://forum.hise.audio/topic/10464/what-is-a-beatport-manager?\_=1730723304163

#### **isBeatportAccess**

Checks if the beatport access is valid. Edit on GitHub

```
BeatportManager.isBeatportAccess()
```

#### **setProductId**

Sets the product ID dynamically. Edit on GitHub

```
BeatportManager.setProductId( String productId)
```

#### **validate**

Requests DRM validation and returns a JSON object with the validation result. Edit on GitHub

```
BeatportManager.validate()
```

### Broadcaster

The Observer Pattern
is a very common software pattern and is used throughout most of the codebase in JUCE and HISE. It allows you to register objects that will be notified when anything changes and is super helpful for organising bigger projects.

##### **Definition**

In HiseScript you can implement the pattern manually by having an array that stores functions like this:

```
// Internal:
var registeredFunctions = [];
var currentValue = 0;

// register a function with a single argument
function addListener(lf)
{
	registeredFunctions.push(lf);

	// We call it once at registration, so it's up to date...
	lf(currentValue);
}

function sendMessage(value)
{
	// We only call the listener if the value has actually changed
	if(value != currentValue)
	{
		currentValue = value;

		for(f in registeredFunctions)
			f(value);
	}
}

// Usage:
addListener(function(newValue)
{
	Console.print(newValue);
});

sendMessage(90);
```

#### **Use cases of the Observer pattern**

This pattern is mostly useful in GUI logic coding, eg. page-handling or displaying any information at multiple places (eg. which user preset is loaded). The advantage of this is that you can implement localised tasks at very narrow scope which are then automatically executed when the global state changes. Let's take a look at the previously mentioned example: page handling. Without the observer pattern, you would normally do it like this:

```
const var buttons = [Content.getComponent("Page1Button"), Content.getComponent("Page2Button"), Content.getComponent("Page3Button")];

const var pages =   [Content.getComponent("Page1"), Content.getComponent("Page2"), Content.getComponent("Page3")];

inline function onPageButton(button, value)
{
	local idx = buttons.indexOf(button);

	for(p in pages)
		p.set("visible", pages.indexOf(p) == idx);
}

for(b in buttons)
	b.setControlCallback(onPageButton);
```

which is super slick and concise in this minimal example, but it quickly gets messy in real world projects, where you want additional tasks being performed when the page changes, eg:

- changing colours of other elements
- updating some UI elements
- hiding popup panels from that page that would otherwise leak into the other page

All these functionality has to be tucked into the poor little button callback which now gets super convoluted. With the observer pattern, the example looks like this:

```
// here is the observer code from the definition above...
var registeredFunctions = [];
var currentValue = [];
function addListener(f) {... }
function sendMessage(value) {... };

const var buttons = [Content.getComponent("Page1Button"), Content.getComponent("Page2Button"), Content.getComponent("Page3Button")];

const var pages =   [Content.getComponent("Page1"), Content.getComponent("Page2"), Content.getComponent("Page3")];

inline function onPageButton(button, value)
{
	local idx = buttons.indexOf(button);
	sendMessage(idx);
}

for(b in buttons)
	b.setControlCallback(onPageButton);

addListener(function(idx)
{
	for(p in pages)
		p.set("visible", pages.indexOf(p) == idx);
});
```

On first sight it looks more verbose than the previous example (and if it's as simple as that then it's a good example of overengineering), but this solution scales much better in real world projects, because now you can attach new listeners whenever you implement something at the very location you want:

```
//... deep in some other namespace

// Now if you want to perform more tasks, you can leave the button callback alone and
// add it at the very scope you're working on.
addListener(function(idx)
{
	local colours = [Colours.red, Colours.blue, Colours.green];
	doSomethingWithColours(colours[idx]);
})
```

However, with the stock HiseScript solutions there are a few disadvantages:

- too much boilerplate. You have to write these logic functions (addListener, sendMessage) for every observer you need and keep the function array and the currentValue variable around
- hard to debug, easy to lose track of what calls what and what reacts to it.
- no support for async callback handling (would be possible to implement using a timer, but then it will be even more boilerplate)
- easy to mess up the argument amount of the registered functions

The Broadcaster object tries to address these issues by giving you (basically) the same functionality as shown in the script above, but with a clean interface, async callback support.

In order to use it, call Engine.createBroadcaster
with the default values and then use one of its methods to implement the observer pattern:

```
// If you pass in a JSON object into the constructor, you can
// access the properties later using the standard dot operator.
const var bc = Engine.createBroadcaster({"myProperty": 12});

bc.addListener("testFunction", function(index)
{
	Console.print(index);
});

// Access the property as if the broadcaster would be a generic JSON object:
Console.print(bc.myProperty);

// Setting the property sends a (synchronous) message to the listeners
bc.myProperty = 90;

// This line does the same as the one above...
bc.sendMessage([90], false);
```

However, calling `sendMessage()`
or assigning properties manually from your code is just one of the ways that this class can be used: you can also register it to any callback or even attach it to internal event sources that weren't accessible before.

##### **Compatibility with callback slots**

In HiseScript, there are many callback slots that can be registered with a function (or inline function), eg:

- ErrorHandler.setErrorCallback()
- MIDIPlayer.setPlaybackCallback()
- ScriptPanel.setFileDropCallback()

However instead of a reference to a function, you can also pass in a `Broadcaster`
object, and it will then call its listeners (asynchronously) everytime the callback happens.

Be aware that in this case the parameter amount defined by the argument in `Engine.createBroadcaster()`
must match the expected argument amount.

##### **Attachable Event Sources**

Another feature that vastly increases the usefulness of this object is the ability to register it to internal event types that were not accessible in HISE before:

###### **Value changes**

On the first look this doesn't sound particularly interesting because the value callback was already accessible through `setControlCallback()`, however if you're using `processorId`
/ `parameterId`
properties it will not fire so this gives you the chance to add additional, "non-exclusive" callbacks for UI things

See: attachToComponentValue()

###### **Property changes**

This is super helpful if you want to react on changing properties (eg. the `visible`
flag) of certain components.

See: attachToComponentProperties()

###### **Mouse events**

This gives you the ability to attach custom mouse callbacks to **ANY**
component using the same interface as ScriptPanel.setMouseCallback()
This will not override the default mouse behaviour but rather give you the option to customize the user interface and eg. show certain things while a slider is being dragged.

See: attachToComponentMouseEvents()

#### **Metadata**

There is another concept of the broadcaster system which is tightly coupled with the visualisation of the broadcaster connections and this is the **Metadata**. Almost all methods which will generate an item on the BroadcasterMap (so the broadcaster itself but also all listeners and event sources) have a metadata parameter in their function signature that needs to be populated with a description of what this item is doing. This enforces self-documenting code on the coding level, which is fine but also heavily increases the usability of the broadcaster map which will help tremendously at keeping the overview over large projects.

A metadata object can be a simple string that only contains a description of the item, but for more information you can use a JSON object containing these properties:

**Property** | **Type** | **Description** || `id` | String | a (unique) String that is used as name for the item. This doesn't need to be a variable name so you can use any human-readable title here. If you don't supply a JSON object but a simple string, this string will be used as `id` (making this the only non-optional property in this list). |
| `comment` | String | A markdown formatted string which will be shown on the broadcaster map. There is one little magic trick applied here and that is that if you comment the function call or object definition with a `/**` comment (instead of the default `/*` one), it will parse the comment from the code and write it into the metadata as `comment` property. |
| `colour` | int | A colour value that is used for the item drawing. You can supply a colour value using the `0xAARRGGBB` notation, or just enter `-1`, then it will create a random colour from the ID hash, which is a quick way to colour an item. |
| `tags` | Array of strings | You can attach tags to any item and then filter the broadcaster map to only display the items you want. This helps navigating around big projects. |
| `priority` | int | This property is only valid when used with a listener item and defines the order of how the listeners are called. By default they are called by the order of the `addListener` call, but if that is not what you want, you can shuffle around the listeners by supplying a priority (higher priority values means that the items are moved up the list and the default value is `0` ). |
| `args` | Array of strings | This is only valid for broadcaster definitions and contains a list of strings describing the arguments of this broadcaster. |

For an example usage take a look at the various API calls.

#### **Queuing**

By default, messages from broadcasters are not queued; if they take too long, they are cancelled. To engage a system-wide queue (ensuring all messages are delivered), call `setEnableQueue()`.

#### **addComponentPropertyListener**

Adds a listener that sets the properties of the given components when the broadcaster receives a message.

```
Broadcaster.addComponentPropertyListener(var object, var propertyList, var metadata, var optionalFunction)
```

This function will change component properties (like `visible`, `enabled`, `itemColour2`
etc.) when the broadcaster sends a message. It basically is the same as adding a function call with `addListener()`
and changing the properties inside this call, however there are a few advantages over this approach:

- the broadcaster map will display the actual property in a meaningful way (eg. colours are rendered as colours and not as `124A438990` ).
- the amount of code you need to write is much less and if you only want to forward a property to other components you don't need to write any function at all
- the ability of customizing the value you'll send through a custom function allows a very concise function definition.

```
Content.addKnob("Knob1", 0, 0);
Content.addKnob("Knob2", 0, 50);
Content.addKnob("Knob3", 0, 100);
Content.addKnob("Knob4", 0, 150);

/** Create a broadcaster. We need 3 arguments to attach it to component properties. */
const var pb = Engine.createBroadcaster({
	"id": "Property Syncer",
	"colour": -1,
	"args": ["component", "property", "value"]
});

/** Attach it to react on changes of the `x` property of `Knob1`. */
pb.attachToComponentProperties("Knob1", "x", "X-Position Watcher");

/** This function just syncs the `x` property by returning the value but you could calculate any custom value if you need to. */
inline function updateFunction(indexInList, component, property, value)
{
	Console.print(trace({
		"indexInList": indexInList,
		"component": component.get("id"),
		"property": property,
		"value": value
	}));

	// something to play around with...
	//return value * (indexInList + 2);

	return value;
};

/** You could also just pass in this instead of the updateFunction, then it will use the "default" behaviour. */
const var defaultUpdateFunction = 0;

/* Add a listener that changes properties when the broadcaster sends out a message. */
pb.addComponentPropertyListener(["Knob2", "Knob3", "Knob4"], // The array of knobs that should be synced "x",                         // the properties that you want to sync "update X position", updateFunction);

/* this will do the same thing but not as elegant. */
pb.addListener([Content.getComponent("Knob2"),
				Content.getComponent("Knob3"),
				Content.getComponent("Knob4")],
				"update X position manually",
function(component, property, value)
{
	//for(c in this)
	//	c.set(property, value);
});
```

This is the visualisation of the code above. You can see that the context awareness of the first listener item yields much more information to be displayed which gives you a quick way to ensure the correct functionality:

This will add a target to the broadcaster that will change component properties when the broadcaster receives a message. It can be used for synchronising properties, changing multiple properties of a list of components with all the benefits of the broadcaster system. The function expects these arguments:

**Argument** | **Type** | **Description** || object | Single value or list of strings (component IDs) or script references | the target components which properties are supposed to be changed. |
| propertyList | Single value or list of property IDs | the target properties that are supposed to be changed. |
| metadata | String or JSON object | a metadata object that contains some information for the broadcaster map. |
| optionalFunction | Callable object | An optional function that determines the value that should be sent to each component property (see below). If this argument is not a function, the broadcaster needs to have three properties (component, property, value) and will just send out the incoming value to the targets (which is an easy way of synchronizing properties. |

##### **The optional function**

If you supply a function as last argument, it will be called for every target component and property to figure out which value to send. The function signature needs to have all parameters of the broadcaster and a integer index at the first position that will contain the index of the component in the list that was passed in.

```
const var bc = Engine.createBroadcaster({
	"id": "MyBroadcaster",
	"args": { "firstArg": undefined, "secondArg": undefined, "thirdArg": undefined }
});

// This function needs to have an index parameter and then as much parameters as
// the broadcaster is using (in our case three).
// It will then be called for each property and component with the knobIndex argument
// containing the index of the component to change. The function's return value will
// be sent as property.
inline function setKnobColours(knobIndex, a1, a2, a3)
{
	if(knobIndex == 0)
	{
		return calculateTheColourForTheFirstKnob();
	}
	if(knobIndex == 1)
	{
		return calculateTheColourForTheSecondKnob();
	}
	//...
}

bc.addComponentPropertyListener(["Knob1", "Knob2", "Knob3"],      // targets
								["itemColour", "itemColour2"],    // properties
								{ "id": "set both itemColours"}), // metadata
								setKnobColours);				  // optionalFunction
```

Be aware that the value returned by the function will be sent to all properties but if you want to send different values to different properties, you can call this function again with another function for each property.

#### **addComponentRefreshListener**

Adds a listener that will cause a refresh message (eg. repaint(), changed()) to be send out to the given components.

```
Broadcaster.addComponentRefreshListener(var componentIds, String refreshType, var metadata)
```

This function adds a listener to the broadcaster that will send a refresh message of the given type to all components defined by `componentId`
parameter. The `refreshType`
parameter defines the type and must be one of the following strings:

- `repaint`: sends a repaint message and will also cause any ScriptPanel to run its paint routine
- `changed`: causes the control callback to fire with the last value again
- `updateValueFromProcessorConnection`: if the control is connected to a processor attribute using `processorId` and `parameterId`, it will update the value of the control to reflect the module's parameter state
- `loseFocus`: if the component is currently focused, it will make it lose its focus
- `resetToDefault`: will cause the control to be resetted to its `defaultValue` (just like double clicking on it)

This function is more or less equivalent to something like

```
bc.addListener(componentList, "repaint components", function(index)
{
	for(c in this)
		c.sendRepaintMessage();
});
```

but is less to type, a bit faster (because it doesn't have to evaluate the script function) and more versatile. And you get a nice visualisation in the Broadcaster map that blinks everytime the refresh messages are sent.

##### **Example**

This example will send a message when you click a button and causes a list of Panels to repaint themselves.

```
const var button = Content.addButton("Button1", 0, 0);

const var PanelArray = [Content.addPanel("Panel4", 0, 50), Content.addPanel("Panel3", 100, 50), Content.addPanel("Panel2", 200, 50), Content.addPanel("Panel1", 300, 50)];

for(p in PanelArray)
{
	p.setPaintRoutine(function(g)
	{
		g.setColour(Colours.withAlpha(Colours.white, Math.random()));
		g.fillRect(this.getLocalBounds(0));

	});
}

const var bc = Engine.createBroadcaster({
	"id": "RepaintBroadcaster",
	"colour": -1,
	"args": ["index"]
});

bc.addComponentRefreshListener(PanelArray, "repaint", "Repaint Panels");

inline function onButton(component, value)
{
	// just send out any value to trigger the broadcaster
	bc.index = Math.random();
}

button.setControlCallback(onButton);
```

#### **addComponentValueListener**

Adds a listener that sets the value of the given components when the broadcaster receives a message.

```
Broadcaster.addComponentValueListener(var object, var metadata, var optionalFunction)
```

This call sets the value (and causes `changed()`
to be called) whenever a broadcaster message is sent. The syntax is pretty similiar to the `addComponentPropertyListener`
function (without the `property`
argument, which isn't required obviously).

#### **addDelayedListener**

Adds a listener that will be executed with a delay.

```
Broadcaster.addDelayedListener(int delayInMilliSeconds, var obj, var metadata, var function)
```

This function is very similar to the normal addListener function, but you can supply a millisecond value that will be used to delay the function.

Be aware that the execution of this function is not queued, so whenever you send a new message in the interval, it will just reset the timer and discard the pending function call.

#### **addListener**

Adds a listener that is notified when a message is send. The object can be either a JSON object, a script object or a simple string.

```
Broadcaster.addListener(var object, var metadata, var function)
```

This registers a listener to the broadcaster which will be notified whenever the broadcaster's state changes.

The function expects three parameters. The second parameter needs to be either a function (or inline function) with the exact same amount of parameters as the broadcaster's default value amount (defined by the constructor).

The first parameter can be one of three things:

- a string (for simple identification)
- an JSON object
- a script object

the second parameter is a metadata parameter that is used to display the target and set other properties (eg. priority)

This will be used in order to identifiy the listener (so if you want to remove it, you need to use the same value).

As an additional feature, it will be also accessible using `this`
in the function callback:

```
const var b = Engine.createBroadcaster({
	"id": "My Broadcaster",
	"args": ["index", "isTrue"]
});

b.addListener({"id": "MY_ID"}, "some description about the target",
function(index, isTrue)
{
	Console.print(this.id); // "MY_ID"
});

b.addListener("funky_time", "some other target",
function(index, isTrue)
{
	Console.print(this); // "funky_time";
});

const var Knob = Content.addKnob("Knob1", 0, 0);

/** Here we are using a JSON object instead of a metadata string
	to set the priority. Note how the listener is at the top of the list
	despite being added as last target.
*/
b.addListener(
Knob,
{ "id": "Print the knob value", "colour": 0xFF3388AA, "priority": 10
},
function(index, isTrue)
{
	Console.print(this.getValue());
});
```

Note that the function will be called (synchronously) when you register it so that the listener is updated to the current value.

#### **addModuleParameterSyncer**

Adds a listener that will sync module parameters from the attached module parameter source. Edit on GitHub

```
Broadcaster.addModuleParameterSyncer(String moduleId, var parameterIndex, var metadata)
```

#### **attachToComplexData**

Registers this broadcaster to be notified when a complex data object changes.

```
Broadcaster.attachToComplexData(String dataTypeAndEvent, var moduleIds, var dataIndexes, var optionalMetadata)
```

If you want the broadcaster to be notified whenever an event occurs with a complex data type (SliderPacks, Tables or AudioFiles), you can use this method to attach the broadcaster to one or more data objects.

In order to attach a broadcaster to a complex data object using this method, it needs to have exactly 3 arguments defined in its `args`
metadata property.

The first arguments `dataTypeAndEvent`
is a String that describes the event type and datatype you want to listen to. The syntax for the string is `DataType.EventType`
with the following options for the `DataType`
part:

- `SliderPack`
- `Table`
- `AudioFile`

and the following options for the `EventType`
part:

- `Display`: changes to the "displayed index": the ruler in the table / playback position in the audio file / the last active slider in the slider pack
- `Content`: changes to the content: adding / removing table points, editing slider values, loading new audio files / changing the playback range

The `moduleIds`
argument is either a String or an Array of Strings with the processor IDs that are holding the data types.
The `dataIndexes`
argument is either an integer index (zero based) or an array of zero based integers for each data type.

This means that the amount of data types that you attach the broadcaster to is defined by
 `NumberOfModules * NumberOfIndexes`.

`optionalMetadata`
is a metadata object used by the broadcaster map.

```
// You need three arguments
const var bc = Engine.createBroadcaster({
	"id": "Complex Data Listener",
	"colour": -1,
	"args": ["processorId", "dataIndex", "value"]
});

bc.attachToComplexData("Table.Display",
					   ["LFO Modulator1", "LFO Modulator2"],
					   0,
					   "Connect to 2 LFO table rulers");

bc.attachToComplexData("SliderPack.Content",
					   "Arpeggiator1",
					   [0, 1, 2],
					   "Connect to changes for every slider pack of an arp");

bc.attachToComplexData("Table.Content",
					   ["Table Envelope1", "Table Envelope2"],
					   [0, 1],
					   "Connect to table edits for every table
					   (attack & release) for two table envelopes");
```

Once you've attached a broadcaster to a complex data object, it will call the registered listeners once the event happens. The three arguments will contain these values:

- `processor`: the processor ID as a string that holds the complex data object that caused the event
- `index`: the index within the processor (!= the registered index!) of the object that caused the event
- `value`: depending on the event type, either the display value as normalised double number (0...1) or a string representation of the data (eg. Base64 representation of the table data).

#### **attachToComponentMouseEvents**

Registers this broadcaster to be notified for mouse events for the given components.

```
Broadcaster.attachToComponentMouseEvents(var componentIds, var callbackLevel, var optionalMetadata)
```

This registers the broadcaster to a list of components that will send out a message whenever the mouse callback is being triggered.

- `componentList` can be either a single string (component name), reference to the component (`Content.getComponent(name)` or an array of those values.
- `callbackLevel` must be one of the strings known from the `ScriptPanel` property `allowCallbacks`.

After you've defined this method, all functions must have the prototype

```
function mouseCallback(component, event)
{

}
```

where `component`
is a reference to the actual script component object that triggered the mouse callback and `event`
is a JSON object that is identical to the one you know and love from `ScriptPanel.setMouseCallback()`.

#### **attachToComponentProperties**

Registers this broadcaster to be called when one of the properties of the given components change.

```
Broadcaster.attachToComponentProperties(var componentIds, var propertyIds, var optionalMetadata)
```

Calling this function will attach the broadcaster to a list of components and properties and will notify its listeners everytime that one of the properties change.

- `componentList` can be either a single string (component name), reference to the component (`Content.getComponent(name)` or an array of those values.
- `propertyIds` must be a list of property ids (or a single string if you only want to listen to a single property). Be aware that every component you pass into the first argument needs to have this property, which prevents you from registering eg. a ScriptPanel to a `viewPositionX` property).

After you've defined this method, all functions must have the prototype

```
function propertyCallback(component, id, value)
{

}
```

where `component`
is a reference to the actual script component object that triggered the mouse callback, `id`
is the property string and `value`
the updated value.

#### **attachToComponentValue**

Registers this broadcaster to be called when the value of the given components change.

```
Broadcaster.attachToComponentValue(var componentIds, var optionalMetadata)
```

Calling this function will attach the broadcaster to a list of components and properties and will notify its listeners everytime that one of the properties change.

- `componentList` can be either a single string (component name), reference to the component (`Content.getComponent(name)` or an array of those values.

After you've defined this method, all functions must have the prototype

```
function valueCallback(component, value)
{

}
```

where `component`
is a reference to the actual script component object that triggered the mouse callback, and `value`
the updated value.

Note how the function signature is identical to the function parameters you can pass into `setControlCallback()`
which makes it super easy to migrate from a normal control callback to a broadcaster based system.

#### **attachToComponentVisibility**

Registers this broadcaster to be called when the visibility of one of the components (or one of its parent component) changes.

```
Broadcaster.attachToComponentVisibility(var componentIds, var optionalMetadata)
```

This function is similar to `attachToComponentProperties`
used with the `visible`
property, but with the additional feature that it also takes the parent's visibility into account. So if you want to react on something being **actually shown**
on the interface it might be a more stable solution if you have a deep component hierarchy.

#### **attachToContextMenu**

Registers this broadcaster to be notified when a context menu item from the given components was selected.

```
Broadcaster.attachToContextMenu(var componentIds, var stateFunction, var itemList, var optionalMetadata, var useLeftClick)
```

This function can be used to attach the broadcaster to any component and show a context menu when the user clicks on it with the right button (or double-tap on the trackpad / Ctrl+Click on macOS). It expects these 4 parameters:

1. a single component or list of components (either a String with the component ID or existing script references)
2. An array with Strings containing the popup menu items with a pseudo markdown syntax and the `{DYNAMIC}` wildcard to create dynamic item texts
3. A state function that expects two arguments (`type`, `index` ) and allows changing the active state / disable items or use dynamic text values. The first argument is always one of three strings (`text`, `enabled` or `active` and indicates which state it wants to know). Be aware that this function is called synchronously on the UI thread for every item so keep it simple.
4. Optional metadata (either JSON or String).

This function does not override any existing behaviour for right clicks, so you might want to eg. disable MIDI learn for components that you attach to this broadcaster.

After you've attached the broadcaster to the context menu of a component, right clicking will create a popup menu (using the component's LookAndFeel Customization
) and then send a message to its registered listeners with the clicked component as argument and the selected index (zero based).

##### **Example**

This example snippet registers a context menu to a button and allows setting the value and toggling the width of the button using two popup menu items.

```
// We'll attach the context menu to this button
const var Button1 = Content.addButton("Button1", 0, 0);
Button1.set("enableMidiLearn", false); // we don't want this to popup too...

/** Let's define a broadcaster with two arguments. */
const var bc = Engine.createBroadcaster({
	"id": "ContextMenu Broadcaster",
	"args": ["component", "selectedIndex"]
});

/** This defines a few items using a markdown-like syntax. */
const var POPUP_MENU_ITEMS = [ "**Set Value / Properties**", // A header "Value is active",			// the first item "Set to {DYNAMIC}",			// the second item with a dynamic text "___",						// a horizontal separator "~~This is always off~~"		// an item that is always disabled
];

inline function popupStateFunction(type, index)
{
	// The this object of this function will always
	// point to the component that was clicked (in our
	// case it's always Button1).
	Console.assertEqual(this, Button1);

	local getEnableState = type == "enabled";
	local getTextValue = type == "text";
	local getActiveState = type == "active";

	if(getEnableState) // We don't want to disable any item
		return true; // so let's return true...

	if(getTextValue)
	{
		// This function is only called with items
		// that specify the `{DYNAMIC}` wildcard
		// in this case the second item with the index 1
		Console.assertEqual(value, 1);

		// Now we can return whatever text we want to show
		// and this is evaluated each time before the popup
		// is shown
		return this.get("width") > 150 ? "small": "wide";
	}

	if(getActiveState)
	{
		// Now we can decide whether the popup menu item
		// should be displayed as active or not

		// the first item checks whether the button is active
		if(index == 0)
			return this.getValue();

		// the second item checks whether its wide or not
		if(index == 1)
			return this.get("width") > 150;
	}
};

/** Now we can use the item list and the state function to attach the broadcaster to the context menu of the button (you can attach it to multiple components by passing in a list. */
bc.attachToContextMenu("Button1", popupStateFunction, POPUP_MENU_ITEMS, "Context Menu");

/** This callback will be executed whenever a popup menu item was selected. */
bc.addListener(Button1, "Menu callback", function(component, index)
{
	// the this object will point to the component
	Console.assertEqual(component, this);

	if(index == 0)
	{
		this.setValue(!component.getValue());
		this.changed();
	}
	if(index == 1)
	{
		this.set("width", component.get("width") > 150 ? 100: 200);
	}
});
```

#### **attachToEqEvents**

Registers this broadcaster to be notified about changes to the EQ (adding / removing / selecting filter bands).

```
Broadcaster.attachToEqEvents(var moduleIds, var eventTypes, var optionalMetadata)
```

The parametric EQ
in HISE has a dynamic amount of EQ bands which can be addressed using the math formula

```
attributeIndex = attributeType + bandIndex * bandOffset
```

Adding & Removing bands however cannot be queried by the standard HISE parameter system, but you can use this attachment type to be notified whenever a Band is added / removed.

- `moduleIds` must be either a single string with the EQ ID or a list of strings for multiple EQs
- `eventType` must be one or multiple strings from this selection: `["BandAdded", "BandRemoved", "BandSelected", "FFTEnabled"]`

Once a broadcaster is attached to EQ events, it will fire its callbacks with three parameters:

```
function(eventType, value)
{ // eventType is one of the strings that define the event // value is a context dependent value (eg. the band index at selection)...
}
```

#### **attachToInterfaceSize**

Registers the broadcaster to be notified when the interface size changes.

```
Broadcaster.attachToInterfaceSize(var optionalMetadata)
```

This will call registered functions when you change the interface size using `Content.setHeight()`
or `Content.setWidth()`
(and once with the initial value from `Content.makeFrontInterface()`
).

Note that this will not be triggered when the scale factor of the UI changes.

#### **attachToModuleParameter**

Registers this broadcaster to be notified when a module parameter changes. Edit on GitHub

```
Broadcaster.attachToModuleParameter(var moduleIds, var parameterIds, var optionalMetadata)
```

#### **attachToNonRealtimeChange**

Attaches this broadcaster to receive realtime / nonrealtime render change events. Edit on GitHub

```
Broadcaster.attachToNonRealtimeChange(var optionalMetadata)
```

#### **attachToOtherBroadcaster**

Attaches this broadcaster to another broadcaster(s) to forward the messages. Edit on GitHub

```
Broadcaster.attachToOtherBroadcaster(var otherBroadcaster, var argTransformFunction, bool async, var optionalMetadata)
```

#### **attachToProcessingSpecs**

Attaches this broadcaster to changes of the audio processing specs (samplerate / buffer size). Edit on GitHub

```
Broadcaster.attachToProcessingSpecs(var optionalMetadata)
```

#### **attachToRadioGroup**

Registers this broadcaster to be notified when a button of a radio group is clicked.

```
Broadcaster.attachToRadioGroup(int radioGroupIndex, var optionalMetadata)
```

If you want the broadcaster to listen to a list of buttons that are grouped into a exclusive radio group, you can use this method. The `radioGroupIndex`
must be the integer value that you've assigned as `radioGroup`
property to the buttons.

It will automatically scan all components and find the ones that are using this group index and then send out a message to all listeners when one of the buttons is clicked.

In order for this to work, the Broadcaster needs to have a single argument defined as `args`
property which will contain the index of the clicked button.

```
const var bc = Engine.createBroadcaster({
	"id": "My Radio Watcher",
	"colour": -1,
	"args": ["buttonIndex"]
});
```

Be aware that this index is using the same order as the component list shows.

Also this attached mode is the only mode that is using a "bidirectional" communication. This means that if you send a broadcaster message using `sendMessage()`
or the assignment operator, it will also change the currently active button in the radio group.

##### **Example: Page Handling**

One of the most practical use cases for this function is the page handling logic which will show and hide panels when you click on the corresponding buttons

Please note how the entire logic and functionality is represented in the broadcaster map from the state of the buttons to the `visible`
property of the panels.

```
const var bc = Engine.createBroadcaster({
	"id": "My Page Handler",
	"colour": -1,
	"comment": "This broadcaster will handle the page logic",
	"args": ["pageIndex"]
});

// Just a dummy function that
inline function addRadioButton(i)
{
	local b = Content.addButton("RadioButton " + (i+1), 0, i * 30);
	b.set("radioGroup", 90);
	b.set("saveInPreset", false);

	local p = Content.addPanel("Page" + (i+1), 150 + i* 100, 0);
	p.set("visible", false);
	return p;
}

// This array will hold 4 panels
const var Pages = [];

// Create 4 radio buttons and 4 panels
for(i = 0; i < 4; i++)
	Pages.push(addRadioButton(i));

bc.attachToRadioGroup(90, "Button Group");

const var PageList = []; //

bc.addComponentPropertyListener(Pages, "visible", "Show Panels", function(indexInList, buttonIndex)
{
	return indexInList == buttonIndex;
});

// Show the first page
bc.pageIndex = 0;
```

#### **attachToRoutingMatrix**

Attaches this broadcaster to a routing matrix and listens for changes.

```
Broadcaster.attachToRoutingMatrix(var moduleIds, var optionalMetadata)
```

This function attaches the broadcaster to a routing matrix of one or more processors to be notified whenever the routing changes (so either the channel configuration or the amount of channels). In order to use this function, the broadcaster must have two arguments, the first will be the processor ID and the second one a Routingmatrix
object that you can query in your callback.

Be aware that you must not call any functions in a listener callback that itself causes the routing matrix to change or you will end up with an infinite loop!

```
const var bc = Engine.createBroadcaster({
	"id": "router",
	"args": ["id", "matrix"]
});

bc.attachToRoutingMatrix("Sine Wave Generator1", "script matrix");

bc.addListener("", "dudel", function(id, matrix)
{
	// this just prints out where the sine wave generator is mapped
	Console.print(trace(matrix.getDestinationChannelForSource([0, 1])));
});
```

#### **attachToSampleMap**

Attaches the broadcaster to events of a samplemap (loading, changing, adding samples).

```
Broadcaster.attachToSampleMap(var samplerIds, var eventTypes, var optionalMetadata)
```

This will register the broadcaster to be notified whenever a sample map is changed. There are three event types that can be selected. A broadcaster that is supposed to be attached to sample maps needs 3 arguments and will fire callbacks with these arguments:

- `eventType` - the event type string (see below)
- `samplerId` - the ID of the sampler that caused the event
- `data` - a event-specific data argument (see below)

```
const var b = Engine.createBroadcaster({
	id: "sampleListener",
	args: ["eventType", "samplerId", "data"]
});

b.attachToSampleMap("Sampler1", "SampleMapChanged", "");

b.addListener("", "funky", function(eventType, samplerId, data)
{
	Console.print(data);
});
```

Note that using a broadcaster for listening to sample map changes is the best practice going forward and replaces the usage of the ScriptPanel.setLoadingCallback()
function for this task.

These are the different event types:

**Type** | **Description** | **data argument** || `SampleMapLoaded` | Whenever a sample map is loaded (or cleared). | the reference string as it goes into Sampler.loadSampleMap() |
| `SamplesAddedOrRemoved` | Whenever a sample was added to (or removed from) the current samplemap | the current number of samples. |
| `SampleChanged` | Whenever a sample property has changed | A JSON object with the sample information (see below). |

The `eventTypes`
argument will expect either the `Type`
string or an array with multiple type strings from the table above with all event types that the broadcaster should listen to.

The `samplerIds`
argument should be either a String of the sampler ID (or an array of strings for every sampler)
that you want to listen to.

##### **Sample changes**

If you want to listen to sample property changes (like changing the sample start or the low velocity), the values that you should pass into the `eventTypes`
argument is not the `"SamplesChanged"`
string, but one of the constants of the Sampler
API object.

In this mode, the `data`
argument will be a JSON object with these properties:

- a `sound` property that holds a reference to a Sample object.
- an `id` property that holds the magic number of the property (query this against the Sampler constants).
- a `value` property that will contain the value of the property change.

```
b.attachToSampleMap("Sampler1", [ Sampler.LoKey, Sampler.HiKey ], "");

b.addListener("", "funky", function(eventType, samplerId, data)
{
	if(data.id == Sampler.LoKey)
	{
		Console.print("Changed low key to " + data.value);
	}
	if(data.id == Sampler.HiKey)
	{
		Console.print("Changed high key to " + data.value);
	}
});
```

#### **callWithDelay**

Calls a function after a short period of time. This is exclusive, so if you pass in a new function while another is pending, the first will be replaced. Edit on GitHub

```
Broadcaster.callWithDelay(int delayInMilliseconds, var argArray, var function)
```

#### **isBypassed**

Checks if the broadcaster is bypassed. Edit on GitHub

```
Broadcaster.isBypassed()
```

#### **refreshContextMenuState**

If this broadcaster is attached to a context menu, calling this method will update the states for the menu items. Edit on GitHub

```
Broadcaster.refreshContextMenuState()
```

#### **removeAllListeners**

Removes all listeners. Edit on GitHub

```
Broadcaster.removeAllListeners()
```

#### **removeAllSources**

Removes all sources. Edit on GitHub

```
Broadcaster.removeAllSources()
```

#### **removeListener**

Removes the listener that was assigned with the given object.

```
Broadcaster.removeListener(var idFromMetadata)
```

This removes the listener from the list so that it will not be notified anymore. The parameter must be the exact same thing you've used in the addListener() function, so if you're using a JSON object, you need to use the exact same object (and not a clone with the same properties).

If you just want to temporarily deactivate a listener, you can do so by pressing the bypass button in the Broadcaster Controller. This is helpful for debugging

#### **removeSource**

Removes the source with the given metadata. Edit on GitHub

```
Broadcaster.removeSource(var metadata)
```

#### **resendLastMessage**

Resends the current state. Edit on GitHub

```
Broadcaster.resendLastMessage(var isSync)
```

#### **reset**

Resets the state.

```
Broadcaster.reset()
```

This resets the value to the default values passed into the constructor and sends a message to all listeners.

#### **sendAsyncMessage**

Sends an asynchronous message to all listeners. the length of args must match the default value list. Edit on GitHub

```
Broadcaster.sendAsyncMessage(var args)
```

#### **sendMessage**

deprecated function (use sendSyncMessage / sendAsyncMessage instead).

```
Broadcaster.sendMessage(var args, bool isSync)
```

This sends a message to all registered (and enabled) listeners. The first argument must be either

1. An array, if the listener functions have multiple parameters. Then it will distribute the array elements to the function parameters.
2. A single value if the registered functions and the default values have only one parameter.

The second parameter will control whether the message is being sent out synchronously or if it should be deferred and called a little bit later. This might be helpful if you want to coallascate calls to sendMessage so that it doesn't hammer the queue.

Be aware that it only sends the message to the listeners if any of the values is different than before.

Note: this function is deprecated and replaced by two other functions, `sendAsyncMessage()`
and `sendSyncMessage()`. The rationale behind this is that the boolean parameter wasn't clear enough to indicate whether a message is being sent out synchronously or not (`true`
means sync or async?). So using this message will write an error message to the console but the functionality keeps working so you can migrate it more easily.

#### **sendMessageWithDelay**

Sends a message to all listeners with a delay.

```
Broadcaster.sendMessageWithDelay(var args, int delayInMilliseconds)
```

This will send out a message after a certain delay so it might come in handy in scenarios where you previously had to drag a timer around.

Be aware that if you call this method while a callback is pending, it will override the value to be send out and restart the timer, so the first message might get lost.

#### **sendSyncMessage**

Sends a synchronous message to all listeners (same as the dot assignment operator). the length of args must match the default value list. Edit on GitHub

```
Broadcaster.sendSyncMessage(var args)
```

#### **setBypassed**

Deactivates the broadcaster so that it will not send messages. If sendMessageIfEnabled is true, it will send the last value when unbypassed. Edit on GitHub

```
Broadcaster.setBypassed(bool shouldBeBypassed, bool sendMessageIfEnabled, bool async)
```

#### **setEnableQueue**

If this is enabled, the broadcaster will keep an internal queue of all messages and will guarantee to send them all.

```
Broadcaster.setEnableQueue(bool shouldUseQueue)
```

When the broadcaster is used asynchronously, it will always just send a message for the latest state, so

```
bc.sendMessage(0, false);
bc.sendMessage(1, false);
```

in this example the message with the value `0`
will never reach its listeners. This is the default value in order to avoid unnecessary calls to the listeners, however there are a few occasions where you need to guarantee that **every**
message gets sent to the listeners. By enabling the queue, it will keep a list of all pending messages and sends out every value to its listeners.

If you attach certain event sources to a broadcaster, they will automatically switch to queue mode (eg. complex data events).

You can check the state of this value by the icon on the broadcaster map. If this icon appears:

the broadcaster is running in queued mode.

#### **setForceSynchronousExecution**

Forces every message to be sent synchronously.

```
Broadcaster.setForceSynchronousExecution(bool shouldExecuteSynchronously)
```

This function will enforce synchronous execution of its callback independently of which function is called.

#### **setRealtimeMode**

Guarantees that the synchronous execution of the listener callbacks can be called from the audio thread. Edit on GitHub

```
Broadcaster.setRealtimeMode(bool enableRealTimeMode)
```

#### **setReplaceThisReference**

This will control whether the `this`
reference for the listener function will be replaced with the object passed into `addListener`. Edit on GitHub

```
Broadcaster.setReplaceThisReference(bool shouldReplaceThisReference)
```

#### **setSendMessageForUndefinedArgs**

Forces the broadcaster to also send a message when a parameter is undefined.

```
Broadcaster.setSendMessageForUndefinedArgs(bool shouldSendWhenUndefined)
```

By default, the broadcaster will not send a message when one or more arguments are undefined. This prevents wrong initialisation calls and script errors when the arguments are passed into function calls.

If you want to disable that function and also send messages for undefined arguments, call this function to change that behaviour (but in that case make sure to check `isDefined()`
before passing the parameters into function calls to avoid script errors).

If you create a broadcaster, all the arguments will have an `undefined`
state until you send the first message.

### Buffer

This class is a one dimensional array with a fixed type of a single precision float number which is usually used to represent an audio signal.

Multi channel signals are usually represented with an Array of Buffer objects. Besides the usage as an audio signal there are some API methods which will just leverage the fixed type structure for a better communication with the C++ layer (eg. you can get all slider pack values as a Buffer object using SliderPack.getDataAsBuffer()
) or shovel value arrays over to the GPU as OpenGL uniform data.

The type strictness allows some significant performance increases which makes it a suitable candidate for audio processing (of course HiseScript is still orders of magnitudes slower than C++ / SNEX, but if you need to do some stuff in here, it's the fastest option).

Its prime use case and reason of existence (doing realtime audio stuff in HiseScript) is deprecated with the introduction of scriptnode, but it still remains a versatile and powerful tool for any kind of non-performance critical audio processing.

##### **Creating Buffers**

In order to create a buffer object, you can either use the inbuilt function `Buffer.create(numSamples)`
or use `Buffer.referTo()`
to make a reference to another buffer.

```
// Create a buffer with 512 samples
const var b = Buffer.create(512);;

// Create a buffer that references the first buffer
// with the offset 128 and the length 80
const var b2 = Buffer.referTo(b, 128, 80);

Console.print(b.length); // 512
Console.print(b2.length); // 80

// set the value of the first sample in the second buffer
b2[0] = 90.0;

// since we're referencing the original buffer, this is
// the 128th element of the first buffer
Console.print(b[128]); // 90.0
```

You can also create buffers from an audio file like this:

```
// Load the example assets from the snippet browser
FileSystem.loadExampleAssets();

// grab whatever asset is first
const var firstAudioFile = Engine.loadAudioFilesIntoPool()[0];

// load it using the reference string format
const var af = FileSystem.fromReferenceString(firstAudioFile, FileSystem.AudioFiles);

// should be 1
Console.assertTrue(af.isFile());

const var channels = af.loadAsAudioFile();

Console.print(channels[0].length);
```

##### **Working with Buffers**

The Buffer object type is deeply integrated into HiseScript and can be considered as native object type next to an Array or a JSON object. In fact, the interaction with a Buffer object is almost indistinguishable from working with a stock JS-Array:

```
const var b = Buffer.create(128);

// element assignment and access using the []-operator
b[0] = 0.5;
Console.print(b[0]);

// buffer length using the length property (same as Array.length)
Console.print(b.length);

// range based for loop iterates all samples in the buffer
for(s in b)
{
	s = Math.random();
}

// call special methods on the Buffer object
b.detectPitch(44100.0);
```

###### **Vectorized math operations**

In addition to this Array-like interface, the Buffer object contains some handy overload operators that will perform basic math operations. Since the datatype is a single precision float that is tightly packed, we can leverage SIMD instructions to heavily speed up those calculations (in fact we're reaching almost C++ level performance with those as the overhead of calling the methods is neglible for larger buffers)

```
b * 2.0			    // Applies the gain factor to all samples in the buffer
b * otherBuffer	    // Multiplies the values of the buffers and store them into 'b'
b + 2.0			    // adds 2.0f to all samples
b + otherBuffer		// adds the other buffer
```

Important: Because all operations are inplace, these statements are aquivalent:

```
(b = b * 2.0) == (b *= 2.0) == (b * 2.0);
```

For copying and filling buffers, the '<<' and '>>' operators are used.

```
0.5 >> b			// fills the buffer with 0.5f (shovels 0.5f into the buffer...)
b << 0.5			// same as 0.5f >> b
a >> b				// copies the buffer a into b;
a << b				// copies the buffer b into a;
```

##### **Special functions**

The Buffer object has a few special methods that are related to audio processing (eg. find the magnitude / peak of a Buffer or detect the pitch). One thing that is a bit different to most other functions in HISE is that they have a varying amount of parameters so you can call it with an optional range limitation for the offset and number of samples.

```
// Create a Buffer and fill it with a ramp for clarity
const var b = Buffer.create(8);

b[0] = 0.0; b[1] = 1.0; b[2] = 2.0; b[3] = 3.0;
b[4] = 4.0; b[5] = 5.0; b[6] = 6.0; b[7] = 7.0;

// Let's take the getMagnitude() function as an example
// but this is the same for any method with a startSample
// and numSamples parameter

// without parameters, it checks the whole buffer
Console.print(b.getMagnitude()); // 8

// A single parameter sets the offset so that it
// checks from this offset to the end
Console.print(b.getMagnitude(4)); // 8, same value, bad example...

// Using two parameters defines a range where to look
// in this case from [2... 3]
Console.print(b.getMagnitude(2, 2)); // 3
```

#### **applyMedianFilter**

Applies a median filter with zero padding to the buffer and returns the filtered median values. Edit on GitHub

```
Buffer.applyMedianFilter(int windowSize)
```

#### **decompose**

Analyses the sample and splits it into sinusoidal, transient & residual noise components. Edit on GitHub

```
Buffer.decompose(double sampleRate, var configData)
```

#### **detectPitch**

Detects the pitch of the given buffer. Edit on GitHub

```
Buffer.detectPitch(double sampleRate, int startSample, int numSamples)
```

#### **fromBase64**

Loads the content from the Base64 string (and resizes the buffer if necessary). Edit on GitHub

```
Buffer.fromBase64(String b64String)
```

#### **getMagnitude**

Returns the magnitude in the given range. Edit on GitHub

```
Buffer.getMagnitude(int startSample, int numSamples)
```

#### **getNextZeroCrossing**

Returns the next zero crossing at the position. Edit on GitHub

```
Buffer.getNextZeroCrossing(int index)
```

#### **getPeakRange**

Returns an array with the min and max value in the given range. Edit on GitHub

```
Buffer.getPeakRange(int startSample, int numSamples)
```

#### **getRMSLevel**

Returns the RMS value in the given range. Edit on GitHub

```
Buffer.getRMSLevel(int startSample, int numSamples)
```

#### **getSlice**

Returns a new buffer that contains a reference to a slice of this buffer. Edit on GitHub

```
Buffer.getSlice(int offsetInBuffer, int numSamples)
```

#### **indexOfPeak**

Returns the sample index with the highest peak. Edit on GitHub

```
Buffer.indexOfPeak(int startSample, int numSamples)
```

#### **normalise**

Normalises the buffer to the given decibel value. Edit on GitHub

```
Buffer.normalise(float gainInDecibels)
```

#### **resample**

Returns a resampled buffer using the given resample ratio and interpolation type. Edit on GitHub

```
Buffer.resample(double ratio, String interpolationType, bool wrapAround)
```

#### **toBase64**

Converts a buffer with up to 44100 samples to a Base64 string. Edit on GitHub

```
Buffer.toBase64()
```

#### **toCharString**

Returns a char from 0 to 255 with the given length and input range. Edit on GitHub

```
Buffer.toCharString(int numChars, var range)
```

#### **trim**

Trims a buffer at the start and end and returns a copy of it. Edit on GitHub

```
Buffer.trim(int trimFromStart, int trimFromEnd)
```

### Builder

This class is a helper tool that lets you create the module tree programatically. This is useful if you have a rather complex signal architecture with lots of repetition and want to minimize the user error (eg. typos or inconsistent hierarchies).

Example: You have a project with 5 samplers, each having a custom sript processor, an AHDSR as gain modulator, and a simple gain module. Usually you would create all modules by hand (and if you're smart and know what you want at the beginning you would create one sampler module with its child modules and then duplicate it). However if you later decide that you need an LFO in the pitch modulation chain, you would have to do this step manually 5 times. This doesn't sound like too much work, but it scales with the project size up to a point where simple additions / modifications take a lot of time and concentration to avoid making mistakes.

The Builder addresses the problem by allowing you to create all modules with API calls. Upon compilation, the entire module tree can be deleted (with the exception of the interface script that contains this Builder obviously) and then recreated. Every method that creates a module will return an integer index that can be used to reference the module later.

Let's take a look at the previous example and how to achieve it using the Builder:

```
const var builder = Synth.createBuilder();

// Remove all modules except for the interface to get
// a clean slate for the builder (if you omit this call, it
// will create 5 new samplers each time you compile)
builder.clear();

for(i = 0; i < 5; i++)
{
	// Create a sampler
	var sampler = builder.create(
	                builder.SoundGenerators.StreamingSampler, // the module type
	                "Sampler " + (i+1),                       // the ID
	                0,                                        // the parent (root)
	                builder.ChainIndexes.Direct);             // the slot type

	// Remove the simple envelope that is inserted by default
	builder.clearChildren(sampler, builder.ChainIndexes.Gain);

	// Add the AHDSR
	builder.create(builder.Modulators.AHDSR,    // the module type
	               "GainAHDSR " + (i+1),        // the ID
	               sampler,                     // the parent module
	               builder.ChainIndexes.Gain);  // the slot type

	// Add the simple gain module
	builder.create(builder.Effects.SimpleGain,
	               "Mixer " + (i+1),
	               sampler,
	               builder.ChainIndexes.FX);

}

// We need to call this so it sends an update message to the HISE UI
builder.flush();
```

Once you've created a script that creates your module tree from scratch everytime you compile, modifying or enhancing it is very straight forward: if we want to add a pitch modulation LFO, all we need to do is to add this single line:

```
builder.create(builder.Modulators.LFO, "Pitch LFO " + (i+1), sampler, builder.ChainIndexes.Pitch);
```

in the loop and it will create the 5 LFOs automatically.

#### **Workflow Tipps**

Here are a few practical considerations when using the Builder class:

##### **Make it conditional**

Make the module creation code conditional with a simple way of deactivating it. Usually you just want to run this code when you actually need to change the module structure. So either put everything into a function and only uncomment the function call when needed, or (which might be even better) write all the builder code into a separate external file
and comment / uncomment the include statement

If you don't do this, then it will rebuild the entire module tree each time you compile which has a huge performance impact (and possible stability implications)

##### **Don't expect it not to crash**

"HISE never crashes" is not something that I would put money down on a bet, but some operations of the builder class (especially those who clear and delete modules) are particularly prone to bringing your system down. This means that you should only run the builder methods

1. when necessary and
2. when you wouldn't loose any work if the compilation would cause a crash

So instead of complaining when it crashes (ocassionally), just be happy for the times it didn't crash. If it keeps crashing at a particular function call that you need it to go through, let me know.

##### **Never use this in a compiled plugin**

This is connected to the former point: never ever use calls to the Builder in a compiled plugin (in fact, they are deactivated in the compiled plugin so don't expect them to work). The Builder is a helper tool for development, not something that allows you to dynamically change the module tree and make this a core feature of your product.

#### **clear**

WARNING: Clears all child sound generators, effects and MIDI processor (except for this one obviously).

```
Builder.clear()
```

This removes the entire module structure (with the exception of the interface) so that you can build upon a clean slate.

Obviously that means that you cannot use this class in any other script processor than the main interface one, but I don't see any reason to do so.

#### **clearChildren**

Clears all child processors of the chain in the module with the given build index Edit on GitHub

```
Builder.clearChildren(int buildIndex, int chainIndex)
```

#### **connectToScript**

Connects the script processor to an external script.

```
Builder.connectToScript(int buildIndex, String relativePath)
```

If you add a script processor using the builder, you most likely give it some code to compile. The most straight forward solution to this is to use an external script for this:

1. Write a script in any Script processor
2. When you are done, right click in the script editor and choose "Save script to File". This will coallescate all callbacks and save it into one file.
3. In the builder, create a script processor, save it's index and then pass this index together with the file reference of the file you just saved into this method. The syntax for the reference string is exactly like what you put into include statements.

This will load the script content from the file into the given script processor and recompile it giving you the ability of using one script for multiple processors (which you might want to do anyway since you're using the Builder).

If you need to modify the script, just do so - the script processor should detect that it's connected to an external file and then update it accordingly if you make changes. Just be aware that in order to apply those changes to all script processors that might use the script, you have to recompile them (using the Recompile all scripts) function

#### **create**

Creates a module and returns the build index (0=master container). Edit on GitHub

```
Builder.create(var type, var id, int rootBuildIndex, int chainIndex)
```

#### **flush**

Sends a rebuild message. Call this after you've created all the processors to make sure that the patch browser is updated accordingly.

```
Builder.flush()
```

Once you're done with the builder, call this method so it will send out an UI update message to the HISE UI. You can omit this step, but then the Patch Browser will not show the new layout (and it might cause some issues with dangling UI elements), so there's no real reason to not call it.

#### **get**

Returns a typed reference for the module with the given build index.

```
Builder.get(int buildIndex, String interfaceType)
```

Sometimes you want to perform additional operations on the modules you created and for this you can use this method to get a script reference of a certain type that you can use. So if you have created a sampler that you then want to load a samplemap into, you can do it like this:

```
// create a typed reference from the build integer index
var asSampler = builder.get(sampler, builder.InterfaceTypes.Sampler)

asSampler.loadSampleMap("MySampleMap");
```

As you can see, we're using the contants found in the `InterfaceTypes`
object - it contains all available types (eg. MidiPlayer, TableProcessor, RoutingMatrix, etc).

#### **getExisting**

Adds the existing module to the internal list and returns the index for refering to it. Edit on GitHub

```
Builder.getExisting(String processorId)
```

#### **setAttributes**

Set multiple attributes for the given module at once using a JSON object.

```
Builder.setAttributes(int buildIndex, var attributeValues)
```

This function can be used to set module attributes using a JSON object that contains the attribute IDs as key and the float number as value.

```
// Add the AHDSR (we need to save the return value for the next call)
var ahdsr = builder.create(builder.Modulators.AHDSR,    // the module type
	               "GainAHDSR " + (i+1),        // the ID
	               sampler,                     // the parent module
	               builder.ChainIndexes.Gain);  // the slot type

builder.setAttributes(ahdsr, { "Attack": 8000, "Release": 100.0
});
```

You don't need to specify all parameters, just the ones that you want to be non-default.

### ChildSynth

With the `ChildSynth`
object you can refer to any Sound Generator
in the HISE audio hierarchy and modify its properties.

As in:

```
// Right click the top bar of a module and click "Create generic script reference" to auto-generate this line.
const var SineWaveGenerator1 = Synth.getChildSynth("Sine Wave Generator1");
```

#### **addGlobalModulator**

Adds a and connects a receiver modulator for the given global modulator. Edit on GitHub

```
ChildSynth.addGlobalModulator(var chainIndex, var globalMod, String modName)
```

#### **addModulator**

Adds a modulator to the given chain and returns a reference. Edit on GitHub

```
ChildSynth.addModulator(var chainIndex, var typeName, var modName)
```

#### **addStaticGlobalModulator**

Adds and connects a receiving static time variant modulator for the given global modulator. Edit on GitHub

```
ChildSynth.addStaticGlobalModulator(var chainIndex, var timeVariantMod, String modName)
```

#### **asSampler**

Returns a reference as Sampler or undefined if no Sampler. Edit on GitHub

```
ChildSynth.asSampler()
```

#### **exists**

Checks if the Object exists and prints a error message on the console if not. Edit on GitHub

```
ChildSynth.exists()
```

#### **exportState**

Exports the state as base64 string. Edit on GitHub

```
ChildSynth.exportState()
```

#### **getAttribute**

Returns the attribute with the given index. Edit on GitHub

```
ChildSynth.getAttribute(int index)
```

#### **getAttributeId**

Returns the attribute with the given index. Edit on GitHub

```
ChildSynth.getAttributeId(int index)
```

#### **getAttributeIndex**

Returns the index of the attribute with the given ID. Edit on GitHub

```
ChildSynth.getAttributeIndex(String id)
```

#### **getChildSynthByIndex**

Returns the child synth with the given index. Edit on GitHub

```
ChildSynth.getChildSynthByIndex(int index)
```

#### **getCurrentLevel**

Returns the current peak level for the given channel. Edit on GitHub

```
ChildSynth.getCurrentLevel(bool leftChannel)
```

#### **getId**

Returns the ID of the synth. Edit on GitHub

```
ChildSynth.getId()
```

#### **getModulatorChain**

Returns the modulator chain with the given index. Edit on GitHub

```
ChildSynth.getModulatorChain(var chainIndex)
```

#### **getNumAttributes**

Returns the number of attributes. Edit on GitHub

```
ChildSynth.getNumAttributes()
```

#### **getRoutingMatrix**

Returns a reference to the routing matrix object of the sound generator. Edit on GitHub

```
ChildSynth.getRoutingMatrix()
```

#### **isBypassed**

Checks if the synth is bypassed. Edit on GitHub

```
ChildSynth.isBypassed()
```

#### **restoreState**

Restores the state from a base64 string. Edit on GitHub

```
ChildSynth.restoreState(String base64State)
```

#### **setAttribute**

Changes one of the Parameter. Look in the manual for the index numbers of each effect. Edit on GitHub

```
ChildSynth.setAttribute(int parameterIndex, float newValue)
```

#### **setBypassed**

Bypasses the synth. Edit on GitHub

```
ChildSynth.setBypassed(bool shouldBeBypassed)
```

#### **setEffectChainOrder**

Changes the processing order of the effects of this sound generator. Edit on GitHub

```
ChildSynth.setEffectChainOrder(bool doPoly, var slotRange, var chainOrder)
```

#### **setModulationInitialValue**

Changes the initial modulation value for the given chain. Edit on GitHub

```
ChildSynth.setModulationInitialValue(int chainIndex, float initialValue)
```

### Colours

The `Colours`
keyword gives you access to predefined colour and functions to interpolate and modify colours in a ScriptPanels
g
context.

```
const var Panel1 = Content.getComponent("Panel1");

Panel1.setPaintRoutine(function(g)
{
	g.setColour(Colours.fromVec4([0.7,0,1,1])); // [r,g,b,a] float array.
	g.fillEllipse([0,0,50,50]);

	g.setColour(Colours.mix(Colours.blue, Colours.red, 0.7)); // interpolates between two colors
	g.fillEllipse([55,0,50,50]);

	g.setColour(Colours.withHue(Colours.saddlebrown, 0.1)); // interpolates through the whole hue cycle from 0-1
	g.fillEllipse([110,0,50,50]);

	g.setColour(Colours.withAlpha(0xAAAAAAAA, 0.2)); // sets the colours alpha transparency
	g.fillEllipse([0,55,50,50]);

	g.setColour(Colours.withBrightness(0xAAAAAAAA, 0.6)); // sets the brightness
	g.fillEllipse([55,55,50,50]);

	g.setColour(Colours.withSaturation(0xAAAAAAAA, 0.6)); // set the saturation
	g.fillEllipse([110,55,50,50]);

	g.setColour(Colours.withMultipliedAlpha(0xAAAAAAAA, 0.2)); // sets a multiplied alpha value
	g.fillEllipse([0,110,50,50]);

	g.setColour(Colours.withMultipliedBrightness(0xAAAAAAAA, 0.6)); // sets a multiplied brightness
	g.fillEllipse([55,110,50,50]);

	g.setColour(Colours.withMultipliedSaturation(0xAAAAAAAA, 0.6)); // sets a multiplied saturation.
	g.fillEllipse([110,110,50,50]);
});
```

#### **fromHsl**

Converts a colour from a [h, s, l, a] float array to a uint32 value. Edit on GitHub

```
Colours.fromHsl(var hsl)
```

#### **fromVec4**

Converts a colour from a [r, g, b, a] float array to a uint32 value.

```
Colours.fromVec4(var vec4)
```

The h, s, l, a values should be normalized, eg in the range 0.0 to 1.0.

#### **mix**

Linear interpolation between two colours. Edit on GitHub

```
Colours.mix(var colour1, var colour2, float alpha)
```

#### **toHsl**

Converts a colour to a [h, s, l, a] array. Edit on GitHub

```
Colours.toHsl(var colour)
```

#### **toVec4**

Converts a colour to a [r, g, b, a] array that can be passed to GLSL as vec4.

```
Colours.toVec4(var colour)
```

```
Console.print(trace(Colours.toVec4(Colours.saddlebrown)));
```

#### **withAlpha**

Returns a colour value with the specified alpha value. Edit on GitHub

```
Colours.withAlpha(var colour, float alpha)
```

#### **withBrightness**

Returns a colour with the specified brightness. Edit on GitHub

```
Colours.withBrightness(var colour, float brightness)
```

#### **withHue**

Returns a colour with the specified hue. Edit on GitHub

```
Colours.withHue(var colour, float hue)
```

#### **withMultipliedAlpha**

Returns a colour with a multiplied alpha value. Edit on GitHub

```
Colours.withMultipliedAlpha(var colour, float factor)
```

#### **withMultipliedBrightness**

Returns a colour with a multiplied brightness value. Edit on GitHub

```
Colours.withMultipliedBrightness(var colour, float factor)
```

#### **withMultipliedSaturation**

Returns a colour with a multiplied saturation value. Edit on GitHub

```
Colours.withMultipliedSaturation(var colour, float factor)
```

#### **withSaturation**

Returns a colour with the specified saturation. Edit on GitHub

```
Colours.withSaturation(var colour, float saturation)
```

### Connection

#### **disconnect**

Removes this connection. Edit on GitHub

```
Connection.disconnect()
```

#### **getConnectionType**

Returns the connection type. Edit on GitHub

```
Connection.getConnectionType()
```

#### **getSourceNode**

Returns the source node. If getSignalSource is true, it searches the node that creates the modulation signal. Edit on GitHub

```
Connection.getSourceNode(bool getSignalSource)
```

#### **getTarget**

Returns the target parameter of this connection. Edit on GitHub

```
Connection.getTarget()
```

#### **getUpdateRate**

Returns the update rate for the modulation connection. Edit on GitHub

```
Connection.getUpdateRate()
```

#### **isConnected**

Checks if the connection is still valid. Edit on GitHub

```
Connection.isConnected()
```

### Console

The `Console`
object allows you to print any value to the console of **HISE**.

```
Console.print("Hello World " + 3.4); // Prints "Hello World + 3.4 to the console.

Console.assertEqual(x, y); // You could write assertion tests to check your code.

Console.start(); // You can benchmark your scripts Compile-time with:
Console.stop(); // wrapping these two Console commands around your code.
```

There are reserved characters to alter the text's colour in a line. (Note that a colon character ends the formatting.)

- Exclaimation mark as first character: Red.
- Curley brackets (bounding): Light grey.
- Greater-Than: Blue.

#### **assertEqual**

Throws an error message if the values are not equal. Edit on GitHub

```
Console.assertEqual(var v1, var v2)
```

#### **assertIsDefined**

Throws an error message if the value is undefined. Edit on GitHub

```
Console.assertIsDefined(var value)
```

#### **assertIsObjectOrArray**

Throws an error message if the value is not an object or array. Edit on GitHub

```
Console.assertIsObjectOrArray(var value)
```

#### **assertLegalNumber**

Throws an error message if the value is not a legal number (eg. string or array or infinity or NaN). Edit on GitHub

```
Console.assertLegalNumber(var value)
```

#### **assertNoString**

Throws an error message if the value is a string. Edit on GitHub

```
Console.assertNoString(var value)
```

#### **assertTrue**

Throws an error message if the condition is not true. Edit on GitHub

```
Console.assertTrue(var condition)
```

#### **blink**

Sends a blink message to the current editor. Edit on GitHub

```
Console.blink()
```

#### **breakInDebugger**

Throws an assertion in the attached debugger. Edit on GitHub

```
Console.breakInDebugger()
```

#### **clear**

Clears the console. Edit on GitHub

```
Console.clear()
```

#### **print**

Prints a message to the console. Edit on GitHub

```
Console.print(var debug)
```

#### **sample**

Stores the current state of the given data into the current sampling session.

```
Console.sample( String label, var dataToSample)
```

This samples the given data point and stores it with the provided label. In order to use this, a sampling session must be active, which can be achieved with either Console
or the `.sample()`
scoped statement.

Once you've started a sampling session, you can call this method and it will create a copy of the provided data and lets you inspect the data by clicking on the item in the code editor next to this line.

```
{.sample("my session"); // starts a sampling session until the block is done

	var x = [1, 2, 3, 4, 5];

	// creates a snapshot of the array and stores it as the first label
	Console.sample("first", x);

	x[2] = 0;

	// creates a snapshot of the array and stores it under the second label
	Console.sample("second", x);
}
```

Note how th

#### **startBenchmark**

Starts the benchmark. You can give it a name that will be displayed with the result if desired. Edit on GitHub

```
Console.startBenchmark()
```

#### **startSampling**

Starts a sampling session with the given ID. Edit on GitHub

```
Console.startSampling( String sessionId)
```

#### **stop**

Causes the execution to stop(). Edit on GitHub

```
Console.stop(bool condition)
```

#### **stopBenchmark**

Stops the benchmark and prints the result. Edit on GitHub

```
Console.stopBenchmark()
```

### ContainerChild

#### **addChildComponent**

Adds a child component from the given JSON data. Edit on GitHub

```
ContainerChild.addChildComponent( var childData)
```

#### **addStateToUserPreset**

Stores / restores the values & components from this component in the user preset. Edit on GitHub

```
ContainerChild.addStateToUserPreset(bool shouldAdd)
```

#### **changed**

causes the control callback to fire. Edit on GitHub

```
ContainerChild.changed()
```

#### **fromBase64**

Restores this component and all its children with the given Base64 encoded state. Edit on GitHub

```
ContainerChild.fromBase64(String b64)
```

#### **get**

Returns the given property (or the default value for the property). Edit on GitHub

```
ContainerChild.get( String id)
```

#### **getAllComponents**

Recursively searches all child components and returns all matches. Edit on GitHub

```
ContainerChild.getAllComponents( String regex)
```

#### **getChildComponentIndex**

Returns the index of the child component (or ID). Edit on GitHub

```
ContainerChild.getChildComponentIndex( var childIdOrComponent)
```

#### **getComponent**

Recursively searches the child components and returns the first with the given ID. Edit on GitHub

```
ContainerChild.getComponent( String childId)
```

#### **getLocalBounds**

Returns the component bounds at the origin with the given margin. Edit on GitHub

```
ContainerChild.getLocalBounds(int margin)
```

#### **getNumChildComponents**

Returns the number of child components. Edit on GitHub

```
ContainerChild.getNumChildComponents()
```

#### **getParent**

Returns a reference object to the component's parent. Edit on GitHub

```
ContainerChild.getParent()
```

#### **getValue**

Returns the value of this component (or the defaultValue property if not initialised). Edit on GitHub

```
ContainerChild.getValue()
```

#### **isEqual**

Checks if the other object (either ID or child reference) points to the same component. Edit on GitHub

```
ContainerChild.isEqual( var other)
```

#### **isValid**

Checks whether this reference points to a valid component within the component tree. Edit on GitHub

```
ContainerChild.isValid()
```

#### **loseFocus**

Sends a message to the component to lose the keyboard focus. Edit on GitHub

```
ContainerChild.loseFocus(bool recursive)
```

#### **removeAllChildren**

Removes all child components. Edit on GitHub

```
ContainerChild.removeAllChildren()
```

#### **removeFromParent**

Removes the component. Edit on GitHub

```
ContainerChild.removeFromParent()
```

#### **resetValueToDefault**

Sends a message to the component to reset its value. Edit on GitHub

```
ContainerChild.resetValueToDefault(bool recursive)
```

#### **sendRepaintMessage**

Sends a repaint message to this component. Edit on GitHub

```
ContainerChild.sendRepaintMessage(bool recursive)
```

#### **set**

Sets the component property. Edit on GitHub

```
ContainerChild.set( String id,  var newValue)
```

#### **setBounds**

Sets the component bounds from the given rectangle. Edit on GitHub

```
ContainerChild.setBounds(var area)
```

#### **setChildCallback**

Attaches a callback that is executed whenever a child component is added / removed to this component. Edit on GitHub

```
ContainerChild.setChildCallback( var newChildCallback)
```

#### **setControlCallback**

Attaches a value callback to this child reference. Edit on GitHub

```
ContainerChild.setControlCallback(var controlCallback)
```

#### **setPaintRoutine**

Registers a paint routine that draws the panel's content. Edit on GitHub

```
ContainerChild.setPaintRoutine(var newPaintRoutine)
```

#### **setValue**

Sets the value of this component without causing a control callback. Edit on GitHub

```
ContainerChild.setValue(var newValue)
```

#### **setValueWithUndo**

Undoably sets the value of this component without causing a control callback. Edit on GitHub

```
ContainerChild.setValueWithUndo(var newValue)
```

#### **toBase64**

Returns a Base64 encoded state of this component and all of its children. Edit on GitHub

```
ContainerChild.toBase64(bool includeValue)
```

#### **updateValueFromProcessorConnection**

Causes a value update from the processor connection. Edit on GitHub

```
ContainerChild.updateValueFromProcessorConnection(bool recursive)
```

### Content

The `Content`
object contains all methods related to interface design.

```
Content.makeFrontInterface(600, 500); // creates the user interface

const var Knob1 = Content.getComponent("Knob1"); // Knob reference

Content.addButton("ButtonName", 0, 0) // Adds a button programmatically
```

#### **addAudioWaveform**

Adds a audio waveform display. Edit on GitHub

```
Content.addAudioWaveform(String audioWaveformName, int x, int y)
```

#### **addButton**

Adds a toggle button to the Content and returns the component index. Edit on GitHub

```
Content.addButton(String buttonName, int x, int y)
```

#### **addComboBox**

Adds a comboBox to the Content and returns the component index. Edit on GitHub

```
Content.addComboBox(String boxName, int x, int y)
```

#### **addDynamicContainer**

Adds a dynamic container component. Edit on GitHub

```
Content.addDynamicContainer(String containerId, int x, int y)
```

#### **addFloatingTile**

Adds a floating layout component. Edit on GitHub

```
Content.addFloatingTile(String floatingTileName, int x, int y)
```

#### **addImage**

Adds a image to the script interface. Edit on GitHub

```
Content.addImage(String imageName, int x, int y)
```

#### **addKnob**

Adds a knob to the Content and returns the component index. Edit on GitHub

```
Content.addKnob(String knobName, int x, int y)
```

#### **addLabel**

Adds a text input label. Edit on GitHub

```
Content.addLabel(String label, int x, int y)
```

#### **addMultipageDialog**

Adds a multipage dialog component. Edit on GitHub

```
Content.addMultipageDialog(String dialogId, int x, int y)
```

#### **addPanel**

Adds a panel (rectangle with border and gradient). Edit on GitHub

```
Content.addPanel(String panelName, int x, int y)
```

#### **addSliderPack**

Adds a slider pack. Edit on GitHub

```
Content.addSliderPack(String sliderPackName, int x, int y)
```

#### **addTable**

Adds a table editor to the Content and returns the component index. Edit on GitHub

```
Content.addTable(String tableName, int x, int y)
```

#### **addViewport**

Adds a viewport. Edit on GitHub

```
Content.addViewport(String viewportName, int x, int y)
```

#### **addVisualGuide**

Creates either a line or rectangle with the given colour.

```
Content.addVisualGuide(var guideData, var colour)
```

This function creates visual guide lines or rectangles that appear on the interface (not in the compiled plugin). They are useful for debugging or layout alignments.

It expects two arguments, the first must be an array with either two or four elements and the second must be a colour (it's recommended to use the `Colours`
constants for this).

If the array has two elements, it will add a horizontal or vertical line, depending on which element is non-zero. If the array has four elements it will be a rectangle (with the same format that you pass into eg. `Graphics.fillRect()`
).

Anything else will cause the visual guides to be cleared, so if you want to delete all lines, just pass in `0`.

```
Content.addVisualGuide([0, 200], Colours.white);       // adds a horizontal line at 200px
Content.addVisualGuide([100, 0], Colours.red);         // adds a vertical line at 100px
Content.addVisualGuide([10, 10, 100, 50], 0xFF00FF00); // adds a rectangle

Content.addVisualGuide(0, 0);                          // clears all visual guides
```

The lines will always be rendered on top of all UI elements so that they are always visible.

#### **addWebView**

Adds a web view. Edit on GitHub

```
Content.addWebView(String webviewName, int x, int y)
```

#### **callAfterDelay**

Calls a function after a delay. This is not accurate and only useful for UI purposes!. Edit on GitHub

```
Content.callAfterDelay(int milliSeconds, var function, var thisObject)
```

#### **componentExists**

Checks if the component exists. Edit on GitHub

```
Content.componentExists( String name)
```

#### **createLocalLookAndFeel**

Creates a look and feel that you can attach manually to certain components. Edit on GitHub

```
Content.createLocalLookAndFeel()
```

#### **createMarkdownRenderer**

Creates a MarkdownRenderer. Edit on GitHub

```
Content.createMarkdownRenderer()
```

#### **createPath**

Creates a Path that can be drawn to a ScriptPanel. Edit on GitHub

```
Content.createPath()
```

#### **createScreenshot**

Creates a screenshot of the area relative to the content's origin.

```
Content.createScreenshot(var area, var directory, String name)
```

This function can be used to create an image from a section of your interface and save it as PNG file. Just pass an array with 4 elements (`[x, y, w, h]`
), a File
object that points to a directory and a relative filename (without the file extension) and it will render the specified area into a PNG image.

```
// Save the image to C:\Users\UserName\Documents\myimage.png;
Content.createScreenShot([0, 0, 1024 768], FileSystem.getFolder(FileSystem.Documents), "myimage");
```

Be aware that this takes the current zoom factor into account, so if you have a UI Zoom Factor of 200%, the resulting image will be twice the size of the "default" interface dimensions. It will also hide any visual guides that you might have added so they don't clutter your exported image.

Also be aware that if you use OpenGL shaders, they will not be rendered to the image (because they are rendered directly to the screen). However there is a helper function
available to enable shaders to be rendered to a screenshot.

#### **createShader**

Creates an OpenGL framgent shader.

```
Content.createShader( String fileName)
```

If you want to create a ScriptShader, use this method and supply the filename as parameter (see ScriptShader.setFragmentShader()
for more information about including shaders).

#### **createSVG**

Creates an SVG object from the converted Base64 String. Edit on GitHub

```
Content.createSVG( String base64String)
```

#### **getAllComponents**

Returns an array of all components that match the given regex. Edit on GitHub

```
Content.getAllComponents(String regex)
```

#### **getComponent**

Returns the reference to the given component. Edit on GitHub

```
Content.getComponent(var name)
```

#### **getComponentUnderDrag**

Returns the ID of the component under the mouse. Edit on GitHub

```
Content.getComponentUnderDrag()
```

#### **getComponentUnderMouse**

Returns the name of the component that is currently hovered. Edit on GitHub

```
Content.getComponentUnderMouse()
```

#### **getCurrentTooltip**

Returns the current tooltip.

```
Content.getCurrentTooltip()
```

This can be used to create a custom tooltip implementation if the TooltipPanel does not suit your needs.

This will return the "raw" tooltip (as in the tooltip from the UI element where the mouse is hovering over). For most applications you might want to introduce a custom delay, so that if you move the mouse away from the element, it will "stick" a little bit longer.

This example will display the current tooltip on a label with a delay of a second.

```
const var t = Engine.createTimerObject();
const var Label1 = Content.getComponent("Label1");
reg isPending = false;

t.setTimerCallback(function()
{
	var tooltip = Content.getCurrentTooltip();

	if(tooltip == "")
	{
		// Now the mouse is over a component without a tooltip

		if(Label1.get("text") != "" && !isPending)
		{
			// The tooltip label was not empty so we set the isPending flag
			// and reset the internal counter of the timer object
			isPending = true;
			this.resetCounter(); // [1]
		}
		else if (this.getMilliSecondsSinceCounterReset() > 1000)
		{
			// Now a second has passed since [1] without a new tooltip being
			// set, so we clear the label and reset the isPending flag
			isPending = false;
			Label1.set("text", "");
		}
	}
	else
	{
		// We update the label with the new tooltip and
		// clear the isPending flag
		isPending = false;
		Label1.set("text", tooltip);
	}
});

// We don't need it to be super fast, so 100ms should be fine
t.startTimer(100);
```

#### **getInterfaceSize**

Returns an array containing the width and height of the interface. Edit on GitHub

```
Content.getInterfaceSize()
```

#### **getScreenBounds**

Returns the total bounds of the main display. Edit on GitHub

```
Content.getScreenBounds(bool getTotalArea)
```

#### **isCtrlDown**

Checks whether the CTRL key's flag is set. Edit on GitHub

```
Content.isCtrlDown()
```

#### **isMouseDown**

Returns 1 if the left mouse button is clicked somewhere on the interface and 2 if the right button is clicked. Edit on GitHub

```
Content.isMouseDown()
```

#### **makeFrontInterface**

Sets this script as main interface with the given size. Edit on GitHub

```
Content.makeFrontInterface(int width, int height)
```

#### **makeFullScreenInterface**

Sets this script as main interface with the given device resolution (only works with mobile devices). Edit on GitHub

```
Content.makeFullScreenInterface()
```

#### **refreshDragImage**

Calls the paint function of the drag operation again to refresh the image. Edit on GitHub

```
Content.refreshDragImage()
```

#### **restoreAllControlsFromPreset**

Restores all controls from a previously saved XML data file. Edit on GitHub

```
Content.restoreAllControlsFromPreset( String fileName)
```

#### **setColour**

Sets the colour for the panel. Edit on GitHub

```
Content.setColour(int red, int green, int blue)
```

#### **setContentTooltip**

sets the Tooltip that will be shown if the mouse hovers over the script's tab button. Edit on GitHub

```
Content.setContentTooltip( String tooltipToShow)
```

#### **setHeight**

Sets the height of the content.

```
Content.setHeight(int newHeight)
```

This can now also be called after the onInit callback to change the interface dimensions. And you can attach a broadcaster to be notified when the interface changes its size using Broadcaster.attachToInterfaceSize().

#### **setKeyPressCallback**

Adds a callback that will be performed asynchronously when the key is pressed. Edit on GitHub

```
Content.setKeyPressCallback( var keyPress, var keyPressCallback)
```

#### **setName**

Sets the name that will be displayed in big fat Impact. Edit on GitHub

```
Content.setName( String newName)
```

#### **setPropertiesFromJSON**

Restore the Component from a JSON object. Edit on GitHub

```
Content.setPropertiesFromJSON( String name,  var jsonData)
```

#### **setSuspendTimerCallback**

Sets a callback that will be notified whenever the UI timers are suspended.

```
Content.setSuspendTimerCallback(var suspendFunction)
```

HISE automatically detects when there is no interface of your plugin open and automatically suspends all Panel timer callbacks (as well as the deferred MIDI callbacks) in order to save CPU resources. However the timers created with Engine.createTimerObject()
will keep running. The rationale behind this difference is that in an usual project you have many panels with timer callbacks but just a few selected dedicated timer objects so the overhead is neglible, but if that is not the case for your project, you can use this method to attach a callback to the suspension event and then start and stop the timers yourself (along with other things that might be required).

The callback you pass in requires a single parameter, which will be **true**
if the plugin is supposed to be suspended (and **false**
if there is at least one plugin interface visible).

During development you cannot close and open plugin interfaces, so there is a new tool function in the interface designer which simulates the suspension process (the moon icon).

Check out the documentation of the Timer
class for an example of how to use this method. For complex projects it's highly recommended to attach a broadcaster to this callback slot and then attach all timer objects as listeners at their definition.

#### **setToolbarProperties**

Sets the main toolbar properties from a JSON object. Edit on GitHub

```
Content.setToolbarProperties( var toolbarProperties)
```

#### **setUseHighResolutionForPanels**

Set this to true to render all script panels with double resolution for retina or rescaling. Edit on GitHub

```
Content.setUseHighResolutionForPanels(bool shouldUseDoubleResolution)
```

#### **setValuePopupData**

sets the data for the value popups.

```
Content.setValuePopupData(var jsonData)
```

Examples:

```
Content.setValuePopupData({ "itemColour":   Colours.forestgreen,    // BG colour TOP "itemColour2":  Colours.firebrick, // BG colour BOTTOM "bgColour":     Colours.gainsboro,      // In fact the Border colour... "borderSize":   6.66, "textColour":   Colours.navajowhite, "fontSize":     66.6, "fontName":     "Comic Sans MS"
});
```

```
Content.setValuePopupData({ "fontName":"Comic Sans MS", "fontSize": 14, "borderSize": 1, "borderRadius": 1, "margin":0, "bgColour": 0xFF636363, "itemColour": 0xFF000000, "itemColour2": 0xFF000000, "textColour": 0xFF636363
});
```

#### **setWidth**

Sets the height of the content.

```
Content.setWidth(int newWidth)
```

This can now also be called after the onInit callback to change the interface dimensions. And you can attach a broadcaster to be notified when the interface changes its size using Broadcaster.attachToInterfaceSize().

#### **showModalTextInput**

Opens a text input box with the given properties and executes the callback when finished. Edit on GitHub

```
Content.showModalTextInput(var properties, var callback)
```

#### **storeAllControlsAsPreset**

Saves all controls that should be saved into a XML data file. Edit on GitHub

```
Content.storeAllControlsAsPreset( String fileName,  ValueTree automationData)
```

### Date

The `Date`
object gives you access to system time and conversion functions.

#### **getSystemTimeISO8601**

Returns a fully described string of this date and time in milliseconds or ISO-8601 format (using the local timezone) with or without divider characters. Edit on GitHub

```
Date.getSystemTimeISO8601(bool includeDividerCharacters)
```

#### **getSystemTimeMs**

Returns the system time in milliseconds. Edit on GitHub

```
Date.getSystemTimeMs()
```

#### **ISO8601ToMilliseconds**

Returns a date string to time in milliseconds. Edit on GitHub

```
Date.ISO8601ToMilliseconds(String iso8601)
```

#### **millisecondsToISO8601**

Returns a time in milliseconds to a date string. Edit on GitHub

```
Date.millisecondsToISO8601(int64 miliseconds, bool includeDividerCharacters)
```

### DisplayBuffer

There are a lot of nodes in scriptnode which offer some kind of visualisation data:

- oscillators have a waveform display
- peak modules have a modulation plotter
- envelopes have a envelope curve
- fft analysers have the frequency spectrum

By default, they are only visible inside the scriptnode editor, but you can choose to expose certain data sources to your UI.

##### **How to connect a DisplayBuffer**

1. Make sure to expose the display buffer of the node you want to visualise by assigning an **External Data slot** to it (click on the plot icon next to the display on the node editor and choose a free slot in the popup menu). Be aware that this system is using a single-writer rule, so you can't assign multiple nodes to the same external slot!
2. Generate a (typed) reference to a DisplayBufferSource by passing in the ID of the script module that hosts the network.
3. Call DisplayBufferSource.getDisplayBuffer() with the index of the data slot that you assigned in step 1

#### **copyReadBuffer**

Copies the read buffer into a preallocated target buffer. The target buffer must have the same size. Edit on GitHub

```
DisplayBuffer.copyReadBuffer(var targetBuffer)
```

#### **createPath**

Creates a path objects scaled to the given bounds and sourceRange

```
DisplayBuffer.createPath(var dstArea, var sourceRange, var normalisedStartValue)
```

If you want to draw a path using the buffer data (for oscilloscopes or plotters), this function will do the heavy lifting for you and supply you with a Path
object that you can directly draw on a ScriptPanel.

The parameters for this function allow a fine-grained control over the appearance of the path:

**Parameter** | **Type** | **Description** || `dstArea` | `[x, y, w, h]` | the target rectangle for the path (it will be scaled automatically to fit this rectangle). |
| `sourceRange` | `[x, y, w, h]` | a rectangle that will determine the "input scale". s[0] and s[1] are the min and max values that you want to draw and s[2] and s[3] define the index range if `s[3] == -1` then it will use the entire buffer. |
| `start` | `double` | the normalised start and end value that can be used to control the start and end points of the path. |

Here are a few example use cases:

```
// Oscilloscope:
d.createPath([0, 0, w, h],   // target rectangle [-1, 1, 0, -1], // samplerange 0 - numSamples, // valuerange: from -1 to 1 0.0);           // start at the center (bipolar)

// Plotter
d.createPath([0, 0, w, h],   // target rectangle [0, 1, 0, -1],  // samplerange 0 - numSamples, // valuerange: from 0 to 1 0.0);           // start at the bottom (unibipolar)

// Inverted Plotter
d.createPath([0, 0, w, h],   // target rectangle [0, 1, 0, -1],  // samplerange 0 - numSamples, // valuerange: from 0 to 1 1.0);           // start at the top (negative)
```

Be aware that the path that is created is not closed (so you need to call Path.closeSubPath()
manually if you need a closed path.

#### **fromBase64**

Restores the display buffer state from the base64 encoded string. Edit on GitHub

```
DisplayBuffer.fromBase64( String b64, bool useUndoManager)
```

#### **getReadBuffer**

Returns a reference to the internal read buffer.

```
DisplayBuffer.getReadBuffer()
```

This function returns the raw Buffer containing the visualisation data that you can use for implementing a custom visualisation.

This is the most low-level access to the data and the other methods available offer a more "refined" access.

#### **getResizedBuffer**

Resamples the buffer to a fixed size.

```
DisplayBuffer.getResizedBuffer(int numDestSamples, int resampleMode)
```

The size of the display buffer is not static and depends on the source signal. If your visualisation depends on a fixed buffer length, you can use this method to automatically rescale the buffer content.
This will create a copy of the buffer with the given sample amount and use a sensible default algorithm to do the resampling.

If you want to pass the buffer to a shader as uniform make sure to resample it to be below 1024.

#### **setActive**

Enables or disables the ring buffer. Edit on GitHub

```
DisplayBuffer.setActive(bool shouldBeActive)
```

#### **setRingBufferProperties**

Sets the ring buffer properties from an object (Use the JSON from the Edit Properties popup). Edit on GitHub

```
DisplayBuffer.setRingBufferProperties(var propertyData)
```

#### **toBase64**

Exports the display buffer state as base64 encoded string. Edit on GitHub

```
DisplayBuffer.toBase64()
```

### DisplayBufferSource

This object is a reference to a HISE module which has a display buffer attached to it. Some modules have a static display buffer (eg. the Analyser node), and all script modules can host multiple display buffers.

In order to create a object of this type, just call Synth.getDisplayBufferSource()
with the ID of the HISE module you want to reference (similar to getting other typed references).

#### **getDisplayBuffer**

Returns a reference to the display buffer at the given index.

```
DisplayBufferSource.getDisplayBuffer(int index)
```

This returns a reference to the DisplayBuffer
at the given index.

### Download

The `Download`
object can be used to control / monitor the download of resources. You can create them using Server.downloadFile(). The callback function you specify there will be executed with a reference of this type as `this`
object and you can use the following methods.

During development, you can use the ServerController
floating tile to inspect the downloads.

#### **abort**

Aborts the download and deletes the file that was downloaded. Edit on GitHub

```
Download.abort()
```

#### **getDownloadedTarget**

Returns the target file if the download has succeeded. Edit on GitHub

```
Download.getDownloadedTarget()
```

#### **getDownloadSize**

Returns the download size in bytes. Edit on GitHub

```
Download.getDownloadSize()
```

#### **getDownloadSpeed**

Returns the current download speed in bytes / second. Edit on GitHub

```
Download.getDownloadSpeed()
```

#### **getFullURL**

Returns the full URL of the download. Edit on GitHub

```
Download.getFullURL()
```

#### **getNumBytesDownloaded**

Returns the number of bytes downloaded. Edit on GitHub

```
Download.getNumBytesDownloaded()
```

#### **getProgress**

Returns the progress ratio from 0 to 1. Edit on GitHub

```
Download.getProgress()
```

#### **getStatusText**

Returns a descriptive text of the current download state (eg. "Downloading" or "Paused"). Edit on GitHub

```
Download.getStatusText()
```

#### **isRunning**

Checks if the download is currently active. Edit on GitHub

```
Download.isRunning()
```

#### **resume**

Resumes the download. Edit on GitHub

```
Download.resume()
```

#### **stop**

Stops the download. The target file will not be deleted and you can resume the download later. Edit on GitHub

```
Download.stop()
```

### DspModule

#### **DspInstance**

Creates a new instance from the given Factory with the supplied name. Edit on GitHub

```
DspModule.DspInstance( DspFactory *f,  String moduleName_)
```

#### **getConstant**

Returns the constant at the given index. Edit on GitHub

```
DspModule.getConstant(int index)
```

#### **getConstantId**

Returns the name of the constant. Edit on GitHub

```
DspModule.getConstantId(int index)
```

#### **getInfo**

Returns an informative String. Edit on GitHub

```
DspModule.getInfo()
```

#### **getNumConstants**

Returns the number of constants. Edit on GitHub

```
DspModule.getNumConstants()
```

#### **getNumParameters**

Returns the number of parameters. Edit on GitHub

```
DspModule.getNumParameters()
```

#### **getParameter**

Returns the parameter with the given index. Edit on GitHub

```
DspModule.getParameter(int index)
```

#### **getStringParameter**

Gets the string value. Edit on GitHub

```
DspModule.getStringParameter(int index)
```

#### **isBypassed**

Checks if the processing is enabled. Edit on GitHub

```
DspModule.isBypassed()
```

#### **operator >>**

Applies the module on the data. Edit on GitHub

```
DspModule.operator >>( var data)
```

#### **operator<<**

Applies the module on the data. Edit on GitHub

```
DspModule.operator<<( var data)
```

#### **prepareToPlay**

Calls the setup method of the external module. Edit on GitHub

```
DspModule.prepareToPlay(double sampleRate, int samplesPerBlock)
```

#### **processBlock**

Calls the processMethod of the external module. Edit on GitHub

```
DspModule.processBlock( var data)
```

#### **setBypassed**

Enables / Disables the processing. Edit on GitHub

```
DspModule.setBypassed(bool shouldBeBypassed)
```

#### **setParameter**

Sets the float parameter with the given index. Edit on GitHub

```
DspModule.setParameter(int index, float newValue)
```

#### **setStringParameter**

Sets a String value. Edit on GitHub

```
DspModule.setStringParameter(int index, String value)
```

### DspNetwork

The `DSPNetwork`
is a class with a collection of nodes
that can be arranged in multiple containers to build up a signal chain. It supercharges the script processor modules that already perform DSP operations with a graph-based audio development environment.

#### **Feature list**

- prototype effects, modulators and sound generators using a intuitive graph-based environment with a workflow similar to a modular synthesiser.
- completely scriptable and dynamic signal path using different types of containers.
- C++ code generator that creates nodes that perform 1:1 equivalent DSP processing.
- consistent workflow with the other HISE features (think of Interface Designer for DSP).
- inbuilt concept of polyphony
- a few core DSP classes, additional libraries will be wrapped soon (STK is the first).

For a full documentation about the scriptnode system, take a look at the dedicated documentation.

#### **clear**

Removes all nodes. Edit on GitHub

```
DspNetwork.clear(bool removeNodesFromSignalChain, bool removeUnusedNodes)
```

#### **create**

Creates and returns a node with the given path (`factory.node`
). If a node with the id already exists, it returns this node. Edit on GitHub

```
DspNetwork.create(String path, String id)
```

#### **createAndAdd**

Creates a node, names it automatically and adds it at the end of the given parent. Edit on GitHub

```
DspNetwork.createAndAdd(String path, String id, var parent)
```

#### **createFromJSON**

Creates multiple nodes from the given JSON object. Edit on GitHub

```
DspNetwork.createFromJSON(var jsonData, var parent)
```

#### **createTest**

Creates a test object for this network. Edit on GitHub

```
DspNetwork.createTest(var testData)
```

#### **deleteIfUnused**

Deletes the node if it is not in a signal path. Edit on GitHub

```
DspNetwork.deleteIfUnused(String id)
```

#### **get**

Returns a reference to the node with the given id. Edit on GitHub

```
DspNetwork.get(var id)
```

#### **prepareToPlay**

Initialise processing of all nodes. Edit on GitHub

```
DspNetwork.prepareToPlay(double sampleRate, double blockSize)
```

#### **processBlock**

Process the given channel array with the node network. Edit on GitHub

```
DspNetwork.processBlock(var data)
```

#### **setForwardControlsToParameters**

Defines whether the UI controls of this script control the parameters or regular script callbacks. Edit on GitHub

```
DspNetwork.setForwardControlsToParameters(bool shouldForward)
```

#### **setParameterDataFromJSON**

Sets the parameters of this node according to the JSON data. Edit on GitHub

```
DspNetwork.setParameterDataFromJSON(var jsonData)
```

#### **undo**

Undo the last action. Edit on GitHub

```
DspNetwork.undo()
```

### Effect

Get access to an Effect
's script functions with Synth.getEffect().

```
const var Delay1 = Synth.getEffect("Delay1");
```

#### **addGlobalModulator**

Adds a and connects a receiver modulator for the given global modulator. Edit on GitHub

```
Effect.addGlobalModulator(var chainIndex, var globalMod, String modName)
```

#### **addModulator**

Adds a modulator to the given chain and returns a reference. Edit on GitHub

```
Effect.addModulator(var chainIndex, var typeName, var modName)
```

#### **addStaticGlobalModulator**

Adds and connects a receiving static time variant modulator for the given global modulator. Edit on GitHub

```
Effect.addStaticGlobalModulator(var chainIndex, var timeVariantMod, String modName)
```

#### **exists**

Checks if the Object exists and prints a error message on the console if not. Edit on GitHub

```
Effect.exists()
```

#### **exportScriptControls**

Export the control values (without the script). Edit on GitHub

```
Effect.exportScriptControls()
```

#### **exportState**

Exports the state as base64 string. Edit on GitHub

```
Effect.exportState()
```

#### **getAttribute**

Returns the attribute with the given index. Edit on GitHub

```
Effect.getAttribute(int index)
```

#### **getAttributeId**

Returns the ID of the attribute with the given index. Edit on GitHub

```
Effect.getAttributeId(int index)
```

#### **getAttributeIndex**

Returns the index of the attribute with the given ID. Edit on GitHub

```
Effect.getAttributeIndex(String id)
```

#### **getCurrentLevel**

Returns the current peak level for the given channel. Edit on GitHub

```
Effect.getCurrentLevel(bool leftChannel)
```

#### **getDraggableFilterData**

Returns the draggable filter data object (if applicable).

```
Effect.getDraggableFilterData()
```

This returns a JSON with the current draggable filter data information. You can modify this JSON object and send it back to setDraggableFilterData()
to update the properties for the given effect.

#### **getId**

Returns the ID of the effect. Edit on GitHub

```
Effect.getId()
```

#### **getModulatorChain**

Returns the Modulator chain with the given index. Edit on GitHub

```
Effect.getModulatorChain(var chainIndex)
```

#### **getNumAttributes**

Returns the number of attributes. Edit on GitHub

```
Effect.getNumAttributes()
```

#### **isBypassed**

Checks if the effect is bypassed. Edit on GitHub

```
Effect.isBypassed()
```

#### **isSuspended**

Checks if the effect is currently suspended (= no audio running through it and suspension enabled). Edit on GitHub

```
Effect.isSuspended()
```

#### **restoreScriptControls**

Restores the control values for scripts (without recompiling). Edit on GitHub

```
Effect.restoreScriptControls(String base64Controls)
```

#### **restoreState**

Restores the state from a base64 string. Edit on GitHub

```
Effect.restoreState(String base64State)
```

#### **setAttribute**

Changes one of the Parameter. Look in the manual for the index numbers of each effect. Edit on GitHub

```
Effect.setAttribute(int parameterIndex, float newValue)
```

#### **setBypassed**

Bypasses the effect. Edit on GitHub

```
Effect.setBypassed(bool shouldBeBypassed)
```

#### **setDraggableFilterData**

Sets the draggable filter data object (if applicable).

```
Effect.setDraggableFilterData(var filterData)
```

Until HISE 5.0, the only way to use the DraggableFilterPanel
was by connecting it to a Parametric EQ
module.

This has changed now and the panel now supports connections to these types:

- Parametric EQ
- Filter
- Hardcoded Master FX
- HardcodedPolyphonicFX
- Script FX
- Polyphonic Script FX

However, these new connection types cannot deduce the parameter indexes for each filter band parameter automatically, so if you start dragging around the filter drag handles, HISE has no way of knowing whether to change the parameter index 5 or 17 or 2 accordingly - with the parametric EQ it can simply be calculated with the formula:

```
parameterIndex = 0 + bandIndex * BandOffset + bandParameterIndex
P			   = O + I         * N          + B
```

(we'll refer to the variable names `P, O, I, N and B`
down below). So for all the other module types, you will need to provide additional information about the properties of the filter module that will be picked up by the draggable filter panel to adjust it's behaviour.

Note that these properties are not persistently stored in the module tree, so you have to call this function in the onInit callback for each module.

These properties are available:

**Property** | **Type** | **Default** | **Description** || NumFilterBands | int | 1 | The fixed amount of filter bands of this module. Note that this is a hard limitation and the only module that allows a dynamic amount of filter bands remains the Parametric EQ. |
| FilterDataSlot | int | 0 | the slot of the filter coefficients. This defaults to zero and you can assign all your filter nodes to the same coefficient object, but if you have a more complex node where the filter is only a part of the signal chain, you can define which filter coefficient slot it should use for the draggable display. |
| FirstBandOffset | int | 0 | the parameterOffset for the first band (`O` in the formula above). This can be used if your filter module has parameters that come before the range of filter parameters and will be used as constant offset in the formula that calculates the filter band parameter (see below). |
| TypeList | Array | see below | This is a list of strings that define the type names as they will show up in the context menu when you right click on a filter drag handle. |
| ParameterOrder | Array | see below | This is a list of (predefined) string that will define in what order the filter parameters are defined. The length of this list will be `N` in the formula above and it will calculate the bandParameterIndex `B` from the index of the parameter name within that list. |
| FFTDisplayBufferIndex | int | -1 | This is the index of the display buffer that will be used to show the spectrum analyser. If you set this to anything other than -1, it must point to a external display buffer that is connected to a analyse.fft node. |
| DragActions | Array | see below | This is a list of predefined strings that define the mouse behaviour and what parameter you want to control. Eg, by default the y-axis is assigned to the gain parameter, but in a synth filter context you might want to reroute this to the resonance of the filter and this is the place to do so. |

If you define this JSON object and pass it to this method, HISE has all information it needs to calculate the band parameter index from the attribute index of the module parameter:

```
O = FirstBandOffset
N = TypeList.length
B = TypeList.indexOf(BAND_PARAMETER)

parameterIndex = FirstBandOffset + bandIndex * TypeList.length + TypeList.indexOf(BAND_PARAMETER)
```

Here is a list of all default values as JSON (that is also returned by Effect.getDraggableFilterData()
)

```
{ NumFilterBands: 1, FilterDataSlot: 0, FirstBandOffset: 0, TypeList: [ "Low Pass", "High Pass", "Low Shelf", "High Shelf", "Peak" ], ParameterOrder: [ "Gain", "Freq", "Q", "Enabled", "Type" ], FFTDisplayBufferIndex: -1, DragActions: { DragX: "Freq", DragY: "Gain", ShiftDrag: "Q", DoubleClick: "Enabled", RightClick: "" }
};
```

### Engine

The `Engine`
object contains a lot of functions related to global properties (like sample rate or host tempo) and object creation.

```
Engine.getSampleRate() // returns the current sample rate
Engine.sendAllNotesOff() // sends a all note off (MIDI Panic) message at the next audio buffer
```

#### **addModuleStateToUserPreset**

Adds an entire module to the user preset system.

```
Engine.addModuleStateToUserPreset(var moduleId)
```

This function can be used to add the entire state of a HISE module to the user preset. This function will create the same XML element for the given module as it is stored in the XML file of the project (or if you copy a module using Ctrl+C) and attach it to the user preset's xml data. `moduleId`
can be either the ID of the module that you want to attach to the user preset, or it can be a JSON object that provides additional functionality to remove properties and child elements.

Be aware that you can only use this method with HISE modules that do not have any child processors as this would cause a rearrangement of the signal tree with unexpected side effects!

Passing in a JSON object as parameter allows you to sanitize the XML element before it gets stored into the user preset XML tree. This has two benefits:

1. Cleaner output
2. Protection against weird side effects - eg. the user could manually edit the routing matrix and cause havoc.

**Property** | **Type** | **Description** || `ID` | String | the ID of the HISE module as seen in the Patch Browser (the string you would normally pass into this method). |
| `RemovedProperties` | Array | A list of all properties (as String) that you want to remove from the XML data before saving. Be aware that this only applies to the root XML element. |
| `RemovedChildElements` | Array | A list of all child elements (String of the XML tag) of the XML element that you want to remove before saving. |

If you remove child elements or properties with this method, HISE will create a copy of the data that is about to be deleted BEFORE loading a new preset and then attaches it to the XML data that was loaded to ensure that this data remains static.

#### **allNotesOff**

Sends an allNotesOff message at the next buffer. Edit on GitHub

```
Engine.allNotesOff()
```

#### **clearMidiFilePool**

Removes all entries from the MIDi file pool. Edit on GitHub

```
Engine.clearMidiFilePool()
```

#### **clearSampleMapPool**

Removes all entries from the samplemap pool Edit on GitHub

```
Engine.clearSampleMapPool()
```

#### **clearUndoHistory**

Clears the undo history. Edit on GitHub

```
Engine.clearUndoHistory()
```

#### **compressJSON**

Compresses a JSON object as Base64 string using zstd. Edit on GitHub

```
Engine.compressJSON(var object)
```

#### **copyToClipboard**

Copies the given text to the clipboard. Edit on GitHub

```
Engine.copyToClipboard(String textToCopy)
```

#### **createAndRegisterAudioFile**

Creates a audio file holder and registers it so you can access it from other modules. Edit on GitHub

```
Engine.createAndRegisterAudioFile(int index)
```

#### **createAndRegisterRingBuffer**

Creates a ring buffer and registers it so you can access it from other modules. Edit on GitHub

```
Engine.createAndRegisterRingBuffer(int index)
```

#### **createAndRegisterSliderPackData**

Creates a SliderPack Data object and registers it so you can access it from other modules. Edit on GitHub

```
Engine.createAndRegisterSliderPackData(int index)
```

#### **createAndRegisterTableData**

Creates a Table object and registers it so you can access it from other modules. Edit on GitHub

```
Engine.createAndRegisterTableData(int index)
```

#### **createBackgroundTask**

Creates a background task that can execute heavyweight functions. Edit on GitHub

```
Engine.createBackgroundTask(String name)
```

#### **createBeatportManager**

Creates a beatport manager object. Edit on GitHub

```
Engine.createBeatportManager()
```

#### **createBroadcaster**

Creates a broadcaster that can send messages to attached listeners.

```
Engine.createBroadcaster(var defaultValues)
```

This creates a Broadcaster
object that can listen to value changes. The argument you pass in here is a metadata object that describes the properties of the Broadcaster.

```
/** If you start a comment with `/**` it will get attached to the metadata objects as `comment` property. */
const var bc = Engine.createBroadcaster({
	"id": "My Broadcaster",              // give it a meaningful name
	"colour": -1,                        // assign a colour (-1 just creates a random colour from the ID hash)
	"tags": ["audio", "value-handling"], // assign some tags
	"args": ["myValue", "isPlaying"]
});
```

The information from the metadata will vastly help the broadcaster map appearance, so from the example code you'll get this beauty:

In addition to the usual properties you also need to supply an array of strings called `args`
which will define the argument amount and name. They will all be initialised to `undefined`
so that the callbacks only start happening when you assign a value to them (or the event source does this for you).

Be aware that every function you pass into `Broadcaster.addListener()`
will need to have as many parameters as you define with the `args`
property or it will cause an error message. Also if you are planning to attach the broadcaster to a predefined internal event (eg. component property changes), the numbers must also match the expected argument amount (in this particular case: 3)

#### **createBXLicenser**

Creates a BX Licenser object (requires the proprietary SDK). Edit on GitHub

```
Engine.createBXLicenser()
```

#### **createDspNetwork**

Creates a Dsp node network. Edit on GitHub

```
Engine.createDspNetwork(String id)
```

#### **createErrorHandler**

Creates an error handler that reacts on initialisation errors. Edit on GitHub

```
Engine.createErrorHandler()
```

#### **createExpansionHandler**

Creates (and activates) the expansion handler. Edit on GitHub

```
Engine.createExpansionHandler()
```

#### **createFFT**

Creates an FFT object. Edit on GitHub

```
Engine.createFFT()
```

#### **createFixObjectFactory**

Creates a fix object factory using the data layout. Edit on GitHub

```
Engine.createFixObjectFactory(var layoutDescription)
```

#### **createGlobalScriptLookAndFeel**

Creates a (or returns an existing ) script look and feel object. Edit on GitHub

```
Engine.createGlobalScriptLookAndFeel()
```

#### **createLicenseUnlocker**

Creates a reference to the script license manager. Edit on GitHub

```
Engine.createLicenseUnlocker()
```

#### **createMacroHandler**

Creates a macro handler that lets you programmatically change the macro connections. Edit on GitHub

```
Engine.createMacroHandler()
```

#### **createMessageHolder**

Creates a storage object for Message events. Edit on GitHub

```
Engine.createMessageHolder()
```

#### **createMidiAutomationHandler**

Creates a MIDI Automation handler. Edit on GitHub

```
Engine.createMidiAutomationHandler()
```

#### **createMidiList**

Creates a MIDI List object. Edit on GitHub

```
Engine.createMidiList()
```

#### **createModulationMatrix**

Creates a modulation matrix object that handles dynamic modulation using the given Global Modulator Container as source.

```
Engine.createModulationMatrix(String containerId)
```

This function can be used to create a ScriptModulationMatrix
object that encapsulates the management of dynamic modulation systems found in complex synths.

It expects a single argument with the ID of the Global Modulator Container that should be used as modulation source. It will then create and return an object that you can use to define your modulation system and it automatically creates a global cable for each global modulator that will (asynchronously) receive its modulation value.

#### **createNeuralNetwork**

Creates a neural network with the given ID. Edit on GitHub

```
Engine.createNeuralNetwork(String id)
```

#### **createNKSManager**

Creates a NKS manager object (requires the proprietary SDK). Edit on GitHub

```
Engine.createNKSManager()
```

#### **createThreadSafeStorage**

Creates a thread safe storage container. Edit on GitHub

```
Engine.createThreadSafeStorage()
```

#### **createTimerObject**

Creates a new timer object. Edit on GitHub

```
Engine.createTimerObject()
```

#### **createTransportHandler**

Creates an object that can listen to transport events. Edit on GitHub

```
Engine.createTransportHandler()
```

#### **createUnorderedStack**

Creates a unordered stack that can hold up to 128 float numbers. Edit on GitHub

```
Engine.createUnorderedStack()
```

#### **createUserPresetHandler**

Creates an user preset handler. Edit on GitHub

```
Engine.createUserPresetHandler()
```

#### **decodeBase64ValueTree**

Decodes an Base64 encrypted valuetree (eg. HiseSnippets). Edit on GitHub

```
Engine.decodeBase64ValueTree( String b64Data)
```

#### **doubleToString**

Returns a string of the value with the supplied number of digits. Edit on GitHub

```
Engine.doubleToString(double value, int digits)
```

#### **dumpAsJSON**

Exports an object as JSON. Edit on GitHub

```
Engine.dumpAsJSON(var object, String fileName)
```

#### **extendTimeOut**

Extends the compilation timeout. Use this if you have a long task that would get cancelled otherwise. This is doing nothing in compiled plugins. Edit on GitHub

```
Engine.extendTimeOut(int additionalMilliseconds)
```

#### **getBufferSize**

Returns the current maximum processing block size. Edit on GitHub

```
Engine.getBufferSize()
```

#### **getClipboardContent**

Returns the clipboard content. Edit on GitHub

```
Engine.getClipboardContent()
```

#### **getComplexDataReference**

Returns a reference to a complex data type from the given module. Edit on GitHub

```
Engine.getComplexDataReference(String dataType, String moduleId, int index)
```

#### **getControlRateDownsamplingFactor**

Returns the downsampling factor for the modulation signal (default is 8). Edit on GitHub

```
Engine.getControlRateDownsamplingFactor()
```

#### **getCpuUsage**

Returns the current CPU usage in percent (0... 100) Edit on GitHub

```
Engine.getCpuUsage()
```

#### **getCurrentUserPresetName**

Returns the currently loaded user preset (without extension). Edit on GitHub

```
Engine.getCurrentUserPresetName()
```

#### **getDecibelsForGainFactor**

Converts gain factor (0.0.. 1.0) to decibel (-100.0... 0). Edit on GitHub

```
Engine.getDecibelsForGainFactor(double gainFactor)
```

#### **getDeviceResolution**

Returns the full screen resolution for the current device. Edit on GitHub

```
Engine.getDeviceResolution()
```

#### **getDeviceType**

Returns the mobile device that this software is running on. Edit on GitHub

```
Engine.getDeviceType()
```

#### **getDspNetworkReference**

Creates a reference to the DSP network of another script processor. Edit on GitHub

```
Engine.getDspNetworkReference(String processorId, String id)
```

#### **getExpansionList**

Creates a list of all available expansions. Edit on GitHub

```
Engine.getExpansionList()
```

#### **getExtraDefinitionsInBackend**

Returns the platform specific extra definitions from the Project settings as JSON object. Edit on GitHub

```
Engine.getExtraDefinitionsInBackend()
```

#### **getFilterModeList**

Returns an object that contains all filter modes.

```
Engine.getFilterModeList()
```

You can use this object to create a list of filter modes you would like to add to your plugin.

###### **Example Code:**

```
// Create a filter effect
const var effect = Synth.addEffect("PolyphonicFilter", "filter", 0);

// Create a filter graph
const var display = Content.addFloatingTile("tile", 0, 0);
display.set("width", 200);
display.set("height", 50);
display.setContentData({"Type": "FilterDisplay", "ProcessorId": "filter"});

// Create a knob for the frequency
const var filterKnob = Content.addKnob("filterKnob", 250, 0);
filterKnob.set("mode", "Frequency");
inline function f(component, value){ effect.setAttribute(effect.Frequency, value); };
filterKnob.setControlCallback(f);

const var modeSelector = Content.addComboBox("modeSelector", 400, 10);

// Create the filter mode list object
const var filterList = Engine.getFilterModeList();

// Pick some values from the object and store it in an array
const var filterModes = [ filterList.StateVariableNotch, filterList.StateVariableLP ];

// Create an array with a name for each mode
const var filterNames = [ "Notch", "SVF Lowpass"];

// Use the filterNames list as combobox items
modeSelector.set("items", filterNames.join("\n"));

inline function modeCallback(component, value)
{ // combobox values are starting with 1 local index = value-1;
 if(index >= 0) { // use the index to get the actual number from the filterModes array. effect.setAttribute(effect.Mode, filterModes[index]); }
}

modeSelector.setControlCallback(modeCallback);
```

#### **getFrequencyForMidiNoteNumber**

Converts midi note number 0... 127 to Frequency 20... 20.000. Edit on GitHub

```
Engine.getFrequencyForMidiNoteNumber(int midiNumber)
```

#### **getGainFactorForDecibels**

Converts decibel (-100.0... 0.0) to gain factor (0.0... 1.0). Edit on GitHub

```
Engine.getGainFactorForDecibels(double decibels)
```

#### **getGlobalPitchFactor**

Returns the global pitch factor (in semitones). Edit on GitHub

```
Engine.getGlobalPitchFactor()
```

#### **getGlobalRoutingManager**

Returns a reference to the global routing manager. Edit on GitHub

```
Engine.getGlobalRoutingManager()
```

#### **getHostBpm**

Returns the Bpm of the host. Edit on GitHub

```
Engine.getHostBpm()
```

#### **getLatencySamples**

Returns the latency of the plugin as reported to the host. Default is 0. Edit on GitHub

```
Engine.getLatencySamples()
```

#### **getLorisManager**

Returns a reference to the global Loris manager. Edit on GitHub

```
Engine.getLorisManager()
```

#### **getMacroName**

Returns the name for the given macro index. Edit on GitHub

```
Engine.getMacroName(int index)
```

#### **getMasterPeakLevel**

Returns the current peak volume (0...1) for the given channel. Edit on GitHub

```
Engine.getMasterPeakLevel(int channel)
```

#### **getMemoryUsage**

Returns the current memory usage in MB.

```
Engine.getMemoryUsage()
```

This only takes the size of the preload buffers and streaming buffers of the samples into account - the actual memory consumption might be much higher if you are using lots of images.

#### **getMidiNoteFromName**

Converts MIDI note name to MIDI number ("C3" for middle C). Edit on GitHub

```
Engine.getMidiNoteFromName(String midiNoteName)
```

#### **getMidiNoteName**

Converts MIDI note number to Midi note name ("C3" for middle C). Edit on GitHub

```
Engine.getMidiNoteName(int midiNumber)
```

#### **getMilliSecondsForQuarterBeats**

Converts quarter beats to milliseconds using the current tempo. Edit on GitHub

```
Engine.getMilliSecondsForQuarterBeats(double quarterBeats)
```

#### **getMilliSecondsForQuarterBeatsWithTempo**

Converts quarter beats to milliseconds using the given tempo. Edit on GitHub

```
Engine.getMilliSecondsForQuarterBeatsWithTempo(double quarterBeats, double bpm)
```

#### **getMilliSecondsForSamples**

Converts samples to milli seconds. Edit on GitHub

```
Engine.getMilliSecondsForSamples(double samples)
```

#### **getMilliSecondsForTempo**

Returns the millisecond value for the supplied tempo (HINT: Use "TempoSync" mode from Slider!) Edit on GitHub

```
Engine.getMilliSecondsForTempo(int tempoIndex)
```

#### **getName**

Returns the product name (not the HISE name!). Edit on GitHub

```
Engine.getName()
```

#### **getNumPluginChannels**

Returns the amount of output channels. Edit on GitHub

```
Engine.getNumPluginChannels()
```

#### **getNumVoices**

Returns the amount of currently active voices. Edit on GitHub

```
Engine.getNumVoices()
```

#### **getOS**

Returns the current operating system ("OSX", "LINUX", or ("WIN").

```
Engine.getOS()
```

You can use this method to query the OS in order to implement some platform specific code. HISE tries to abstract as much OS specifics as possible,but especially when it comes to font loading, there are some subtle differences between the different operating systems.

```
Console.print(Engine.getOS());
```

#### **getPitchRatioFromSemitones**

Converts a semitone value to a pitch ratio (-12... 12) -> (0.5... 2.0) Edit on GitHub

```
Engine.getPitchRatioFromSemitones(double semiTones)
```

#### **getPlayHead**

Allows access to the data of the host (playing status, timeline, etc...). Edit on GitHub

```
Engine.getPlayHead()
```

#### **getPreloadMessage**

Returns the current preload message if there is one. Edit on GitHub

```
Engine.getPreloadMessage()
```

#### **getPreloadProgress**

Returns the preload progress from 0.0 to 1.0. Use this to display some kind of loading icon. Edit on GitHub

```
Engine.getPreloadProgress()
```

#### **getProjectInfo**

Returns project and company info from the Project's preferences. Edit on GitHub

```
Engine.getProjectInfo()
```

#### **getQuarterBeatsForMilliSeconds**

Converts milliseconds to quarter beats using the current tempo. Edit on GitHub

```
Engine.getQuarterBeatsForMilliSeconds(double milliSeconds)
```

#### **getQuarterBeatsForMilliSecondsWithTempo**

Converts milliseconds to quarter beats using the given tempo. Edit on GitHub

```
Engine.getQuarterBeatsForMilliSecondsWithTempo(double milliSeconds, double bpm)
```

#### **getQuarterBeatsForSamples**

Converts samples to quarter beats using the current tempo. Edit on GitHub

```
Engine.getQuarterBeatsForSamples(double samples)
```

#### **getQuarterBeatsForSamplesWithTempo**

Converts samples to quarter beats using the given tempo. Edit on GitHub

```
Engine.getQuarterBeatsForSamplesWithTempo(double samples, double bpm)
```

#### **getRegexMatches**

Returns an array with all matches. Edit on GitHub

```
Engine.getRegexMatches(String stringToMatch, String regex)
```

#### **getSampleFilesFromDirectory**

Iterates the given sub-directory of the Samples folder and returns a list with all references to audio files. Edit on GitHub

```
Engine.getSampleFilesFromDirectory( String relativePathFromSampleFolder, bool recursive)
```

#### **getSampleRate**

Returns the current sample rate. Edit on GitHub

```
Engine.getSampleRate()
```

#### **getSamplesForMilliSeconds**

Converts milli seconds to samples Edit on GitHub

```
Engine.getSamplesForMilliSeconds(double milliSeconds)
```

#### **getSamplesForQuarterBeats**

Converts quarter beats to samples using the current tempo. Edit on GitHub

```
Engine.getSamplesForQuarterBeats(double quarterBeats)
```

#### **getSamplesForQuarterBeatsWithTempo**

Converts quarter beats to samples using the given tempo. Edit on GitHub

```
Engine.getSamplesForQuarterBeatsWithTempo(double quarterBeats, double bpm)
```

#### **getSemitonesFromPitchRatio**

Converts a pitch ratio to semitones (0.5... 2.0) -> (-12... 12) Edit on GitHub

```
Engine.getSemitonesFromPitchRatio(double pitchRatio)
```

#### **getSettingsWindowObject**

Returns a object that contains the properties for the settings dialog. Edit on GitHub

```
Engine.getSettingsWindowObject()
```

#### **getStringWidth**

Returns the width of the string for the given font properties. Edit on GitHub

```
Engine.getStringWidth(String text, String fontName, float fontSize, float fontSpacing)
```

#### **getSystemStats**

Returns info about the current hardware and OS configuration. Edit on GitHub

```
Engine.getSystemStats()
```

#### **getSystemTime**

Returns a fully described string of this date and time in ISO-8601 format (using the local timezone) with or without divider characters. Edit on GitHub

```
Engine.getSystemTime(bool includeDividerCharacters)
```

#### **getTempoName**

Returns the tempo name for the given index Edit on GitHub

```
Engine.getTempoName(int tempoIndex)
```

#### **getTextForValue**

Uses one of the inbuilt text converters to prettify a numeric value. Edit on GitHub

```
Engine.getTextForValue(double value, String converterMode)
```

#### **getUptime**

Returns the uptime of the engine in seconds. Edit on GitHub

```
Engine.getUptime()
```

#### **getUserPresetList**

Returns a list of all available user presets as relative path. Edit on GitHub

```
Engine.getUserPresetList()
```

#### **getVersion**

Returns the product version (not the HISE version!). Edit on GitHub

```
Engine.getVersion()
```

#### **getWavetableList**

Returns the list of wavetables of the current expansion (or factory content). Edit on GitHub

```
Engine.getWavetableList()
```

#### **getZoomLevel**

Returns the current Zoom Level. Edit on GitHub

```
Engine.getZoomLevel()
```

#### **intToHexString**

Returns a number as string in hexadecimal format (0xFFFFFFFF). Edit on GitHub

```
Engine.intToHexString(int value)
```

#### **isControllerUsedByAutomation**

Checks if the given CC number (single number) or channel / CC number (JS Array: [channel, CC]) is used for parameter automation and returns the index of the control. Edit on GitHub

```
Engine.isControllerUsedByAutomation(var controllerNumber)
```

#### **isHISE**

Returns true if the project is running inside HISE. You can use this during development to simulate different environments. Edit on GitHub

```
Engine.isHISE()
```

#### **isMpeEnabled**

Checks if the global MPE mode is enabled. Edit on GitHub

```
Engine.isMpeEnabled()
```

#### **isPlugin**

Returns true if running as VST / AU / AAX plugin. Edit on GitHub

```
Engine.isPlugin()
```

#### **isUserPresetReadOnly**

Checks if the user preset is read only. Edit on GitHub

```
Engine.isUserPresetReadOnly(var optionalFile)
```

#### **loadAudioFileIntoBufferArray**

Loads a file and returns its content as array of Buffers. Edit on GitHub

```
Engine.loadAudioFileIntoBufferArray(String audioFileReference)
```

#### **loadAudioFilesIntoPool**

Calling this makes sure that all audio files are loaded into the pool and will be available in the compiled plugin. Returns a list of all references.

```
Engine.loadAudioFilesIntoPool()
```

This is for use with the Convolution Reverb
effect, Convolution
scriptnode module, or the Audio Loop Player.

#### **loadFont**

Loads a font file. This is deprecated, because it might result in different names on various OS. Use loadFontAs() instead. Edit on GitHub

```
Engine.loadFont( String fileName)
```

#### **loadFontAs**

Loads the font from the given file in the image folder and registers it under the fontId. This is platform agnostic.

```
Engine.loadFontAs(String fileName, String fontId)
```

This call pulls a font from the Images
folder and gives it a FontID (string) reference that you can use later on.

{PROJECT\_FOLDER} refers to the root of the projects **Images**
folder. Just put your font there, or in a subfolder like in this example (fonts/).

```
Engine.loadFontAs("{PROJECT_FOLDER}fonts/Nunito-Regular.ttf", "nunito");
```

#### **loadFromJSON**

Imports a JSON file as object. Edit on GitHub

```
Engine.loadFromJSON(String fileName)
```

#### **loadImageIntoPool**

Loads an image into the pool. You can use a wildcard to load multiple images at once. Edit on GitHub

```
Engine.loadImageIntoPool( String id)
```

#### **loadNextUserPreset**

Loads the next user preset. Edit on GitHub

```
Engine.loadNextUserPreset(bool stayInDirectory)
```

#### **loadPreviousUserPreset**

Loads the previous user preset. Edit on GitHub

```
Engine.loadPreviousUserPreset(bool stayInDirectory)
```

#### **loadUserPreset**

Loads a user preset with the given relative path (use `/`
for directory separation) or the given ScriptFile object. Edit on GitHub

```
Engine.loadUserPreset(var relativePathOrFileObject)
```

#### **logSettingWarning**

This warning will show up in the console so people can migrate in the next years... Edit on GitHub

```
Engine.logSettingWarning( String methodName)
```

#### **matchesRegex**

Matches the string against the regex token. Edit on GitHub

```
Engine.matchesRegex(String stringToMatch, String regex)
```

#### **openWebsite**

launches the given URL in the system's web browser. Edit on GitHub

```
Engine.openWebsite(String url)
```

#### **performUndoAction**

Performs an action that can be undone via Engine.undo().

```
Engine.performUndoAction(var thisObject, var undoAction)
```

This function will perform an undoable action that is defined by the function you pass in as second parameter. The function expects a single parameter that is either `true`
when the function should be undone or false if it needs to be performed (or "redone").

The first parameter will be used as `this`
object during the execution and can contain the information that the function needs in order to perform the action.

Calling this function will perform the action immediately and will add it to the undo manager that can be controlled with `Engine.undo()`, `Engine.redo()`.

This function can be used in order to implement more complex undoable actions than the native UI widgets provide.

###### **Example**

This example just operates on an array and changes the values inside an undoable operation.

```
const var myList = [1, 2, 3, 4, 5, 6];

Engine.performUndoAction({ "obj": myList,				// the object that will be modified "newValue": [3, 4, 5, 6, 7],  // the new state "oldValue": myList.clone()    // the old state (we need to clone it or it will not keep the old values)
}, function(isUndo)
{
	this.obj.clear();

	// pick the values from the old or new state
	for(v in isUndo ? this.oldValue: this.newValue)
		this.obj.push(v);
});

// new state
Console.print(trace(myList));

Engine.undo();

// old state
Console.print(trace(myList));

Engine.redo();

// new state
Console.print(trace(myList));
```

#### **playBuffer**

Previews a audio buffer with a callback indicating the state. Edit on GitHub

```
Engine.playBuffer(var bufferData, var callback, double fileSampleRate)
```

#### **quit**

Signals that the application should terminate. Edit on GitHub

```
Engine.quit()
```

#### **rebuildCachedPools**

Rebuilds the entries for all cached pools (MIDI files and samplemaps). Edit on GitHub

```
Engine.rebuildCachedPools()
```

#### **redo**

Redo the last controller change. Edit on GitHub

```
Engine.redo()
```

#### **reloadAllSamples**

Forces a full (asynchronous) reload of all samples (eg. after the sample directory has changed). Edit on GitHub

```
Engine.reloadAllSamples()
```

#### **renderAudio**

Renders a MIDI event list as audio data on a background thread and calls a function when it's ready. Edit on GitHub

```
Engine.renderAudio(var eventList, var finishCallback)
```

#### **saveUserPreset**

Asks for a preset name (if presetName is empty) and saves the current user preset. Edit on GitHub

```
Engine.saveUserPreset(var presetName)
```

#### **setAllowDuplicateSamples**

Sets whether the samples are allowed to be duplicated. Set this to false if you operate on the same samples differently. Edit on GitHub

```
Engine.setAllowDuplicateSamples(bool shouldAllow)
```

#### **setCurrentExpansion**

Sets the active expansion and updates the preset browser. Edit on GitHub

```
Engine.setCurrentExpansion( String expansionName)
```

#### **setDiskMode**

Sets the Streaming Mode (0 -> Fast-SSD, 1 -> Slow-HDD) Edit on GitHub

```
Engine.setDiskMode(int mode)
```

#### **setFrontendMacros**

Enables the macro system to be used by the end user.

```
Engine.setFrontendMacros(var nameList)
```

Pass it a list of names to name the macros

```
const var macroNames = ["Volume", "FilterFreq", "FilterQ", "Reverb"];

Engine.setFrontendMacros(macroNames);
```

#### **setGlobalFont**

Sets the font that will be used as default font for various things.

```
Engine.setGlobalFont(String fontName)
```

In order to do so, put them all in a `Fonts`
subdirectory of the Images
folder, and access it with

`javascriptEngine.loadFontAs("{PROJECT_FOLDER}Fonts/Heebo.ttf", "heebo");Engine.setGlobalFont("heebo");`

#### **setGlobalPitchFactor**

Sets the global pitch factor (in semitones). Edit on GitHub

```
Engine.setGlobalPitchFactor(double pitchFactorInSemitones)
```

#### **setHostBpm**

Overwrites the host BPM. Use -1 for sync to host. Edit on GitHub

```
Engine.setHostBpm(double newTempo)
```

#### **setKeyColour**

Sets a key of the global keyboard to the specified colour (using the form 0x00FF00 for eg. of the key to the specified colour.

```
Engine.setKeyColour(int keyNumber, int colourAsHex)
```

See Colours
and Keyboard.

#### **setLatencySamples**

sets the latency of the plugin as reported to the host. Default is 0. Edit on GitHub

```
Engine.setLatencySamples(int latency)
```

#### **setLowestKeyToDisplay**

Changes the lowest visible key on the on screen keyboard. Edit on GitHub

```
Engine.setLowestKeyToDisplay(int keyNumber)
```

#### **setMaximumBlockSize**

Sets the maximum buffer size that is processed at once. If the buffer size from the audio driver / host is bigger than this number, it will split up the incoming buffer and call process multiple times.

```
Engine.setMaximumBlockSize(int numSamplesPerBlock)
```

Depending on your project architecture, it might make sense to limit the maximum buffer size that will be processed by your DSP module tree.

This will not guarantee that the buffer size is always the same, but rather split up the incoming buffer into chunks of this size. So if you have a 512 audio buffer and call `Engine.setMaximumBlockSize(300)`, then you will process alternating audio buffers of 300 and 212 samples.

This is the "global" variant of the container.fix\_block
nodes that perform this operation locally within a DSP network.

Obviously this will come with a slightly higher CPU load, but the benefits of having a defined upper limit for the buffer allows you to implement a few cross-module modulation concepts that would not be possible otherwise (as the cross-module communication usually happens once per buffer size, an update rate of 11ms eg. might not be good enough for envelope modulation signals etc).

Usually you're best bet is to not use this function until you really need it for your project to work.

#### **setMinimumSampleRate**

Sets the minimum sample rate for the global processing (and adds oversampling if the current samplerate is lower). Edit on GitHub

```
Engine.setMinimumSampleRate(double minimumSampleRate)
```

#### **setPreloadMessage**

Sets the preload message. Edit on GitHub

```
Engine.setPreloadMessage(String message)
```

#### **setUserPresetTagList**

Sets the tags that appear in the user preset browser. Edit on GitHub

```
Engine.setUserPresetTagList(var listOfTags)
```

#### **setZoomLevel**

Sets the new zoom level (1.0 = 100%) Edit on GitHub

```
Engine.setZoomLevel(double newLevel)
```

#### **showErrorMessage**

Shows a error message on the compiled plugin (or prints it on the console). Use isCritical if you want to disable the "Ignore" Button. Edit on GitHub

```
Engine.showErrorMessage(String message, bool isCritical)
```

#### **showMessage**

Shows a message with an overlay on the compiled plugin with an "OK" button in order to notify the user about important events. Edit on GitHub

```
Engine.showMessage(String message)
```

#### **showMessageBox**

Shows a message box with an OK button and a icon defined by the type variable. Edit on GitHub

```
Engine.showMessageBox(String title, String markdownMessage, int type)
```

#### **showYesNoWindow**

Shows a message with a question and executes the function after the user has selected his choice. Edit on GitHub

```
Engine.showYesNoWindow(String title, String markdownMessage, var callback)
```

#### **sortWithFunction**

Sorts an array with a given comparison function. Edit on GitHub

```
Engine.sortWithFunction(var arrayToSort, var sortFunction)
```

#### **uncompressJSON**

Expands a compressed JSON object. Edit on GitHub

```
Engine.uncompressJSON( String b64)
```

#### **undo**

Reverts the last controller change. Edit on GitHub

```
Engine.undo()
```

### ErrorHandler

There are a few error messages in HISE that will usually show up a dark overlay with a (questionably worded) message and some buttons to react on it. Unfortunately, the amount of customizability is pretty low so this acts as a good way to detect whether a plugin was made with HISE or not.

Now you can completely deactivate the overlay using the preprocessor `HISE_DEACTIVATE_OVERLAY`
when compiling your plugin, but this is just shooting the messenger and will leave your user completely in the dark why there is no audio coming out of the plugin or which sample was not found.

This object offers a better solution with a customizable error callback that will be executed whenever the overlay would appear, so you can react on it in a way that is more consistent with your UI.

In order to use it, just call Engine.createErrorHandler()
and then use its methods to customize the way you want to react to HISE error events.

Be aware that as soon as you create this object, it will deactivate the standard overlay automatically (so it's basically the same as compiling with `HISE_DEACTIVATE_OVERLAY`
).

#### **clearAllErrors**

Clear all states.

```
ErrorHandler.clearAllErrors()
```

This will remove all error states (including the ones that are masked by the current error).

#### **clearErrorLevel**

Clears a state. If there is another error, it will send it again.

```
ErrorHandler.clearErrorLevel(int stateToClear)
```

Call this function if the user has resolved the error. It will then check for other errors and call the error callback again if there is another error pending.

The errors are prioritized automatically, so eg. an invalid license error will always supercede a missing samples error or a audio driver initialisation issue

#### **getCurrentErrorLevel**

Returns the current error level (and -1 if there is no error).

```
ErrorHandler.getCurrentErrorLevel()
```

Returns the current error level that the user should care about. This might not be the only error (and you can query the amount of pending issues with `getNumActiveErrors()`
). It will return an integer that you can compare against one of the constants of this class (all error states are available as constant, eg. `eh.LicenseNotFound`
).

#### **getErrorMessage**

Returns the current error message.

```
ErrorHandler.getErrorMessage()
```

This will return the message that should be displayed to the user. It is either a custom string from you calling `Engine.showErrorMessage()`
or one of the predefined error messages from HISE.

#### **getNumActiveErrors**

Returns the number of currently active errors. Edit on GitHub

```
ErrorHandler.getNumActiveErrors()
```

#### **setCustomMessageToShow**

Overrides the default HISE error messages with custom text.

```
ErrorHandler.setCustomMessageToShow(int state, String messageToShow)
```

If you don't like the wording of these messages, the days of messing around with the source code are finally over because you can use this method to override the default error messages for all error events.

#### **setErrorCallback**

Sets a function with two arguments (int state, String message) that will be notified at error events.

```
ErrorHandler.setErrorCallback(var errorCallback)
```

This method will register a callback that will be notified whenever an error event occurs. You can use this as starting point to setup your custom error handling that fits into your UI.

Be aware that this function is called only with the most important error and if you clear the error while an error with a lower priority is in the queue, it will fire that callback again.

#### **simulateErrorEvent**

Causes an error event to be sent through the system (for development purposes only).

```
ErrorHandler.simulateErrorEvent(int state)
```

If you're creating your custom error handling, the chances are great that you want to check how it behaves in a controlled environment so this method allows you to create artificial error events that you can then catch and handle gracefully. (In the compiled plugin this method will not do anything).

### Expansion

The `Expansion`
object can be used to query the properties of a given expansion and modify it. The creation of this object is usually done by the ExpansionHandler and its various calls.

Be aware that you don't need this class in order to load content from an expansion as it's already resolved through the Expansion wildcard

#### **getAudioFileList**

Returns a list of all available audio files in the expansion.

```
Expansion.getAudioFileList()
```

This returns a list of all audio files that are included in the given Expansion. Also it will load all audio files into the pool so they are available in the list.

#### **getDataFileList**

Returns a list of all available data files in the expansion. Edit on GitHub

```
Expansion.getDataFileList()
```

#### **getExpansionType**

returns the expansion type. Use the constants of ExpansionHandler to resolve the integer number. Edit on GitHub

```
Expansion.getExpansionType()
```

#### **getImageList**

Returns a list of all available images in the expansion. Edit on GitHub

```
Expansion.getImageList()
```

#### **getMidiFileList**

Returns a list of all available MIDI files in the expansion. Edit on GitHub

```
Expansion.getMidiFileList()
```

#### **getProperties**

Returns an object containing all properties of the expansion.

```
Expansion.getProperties()
```

This returns a JSON object with the properties of the Expansion pack. Be aware that this might be subject to change, but the current properties are:

- `Name`: the name of the expansion pack
- `Version`: the version number of the expansion pack
- `Blowfish-Key`: the key that is used to encode the expansion pack data.

Protip: You might not want to display the blowfish key somewhere on your interface...

#### **getRootFolder**

Returns the root folder for this expansion. Edit on GitHub

```
Expansion.getRootFolder()
```

#### **getSampleFolder**

Returns the folder where this expansion looks for samples.

```
Expansion.getSampleFolder()
```

This will return either the local Samples subfolder of the expansion folder or another one that was set with either Expansion.setSampleFolder()
or ExpansionHandler.installFromPackage()

#### **getSampleMapList**

Returns a list of all available sample maps in the expansion. Edit on GitHub

```
Expansion.getSampleMapList()
```

#### **getUserPresetList**

Returns a list of all available user presets in the expansion. Edit on GitHub

```
Expansion.getUserPresetList()
```

#### **getWildcardReference**

Returns a valid wildcard reference ((`{EXP::Name}relativePath`
) for the expansion. Edit on GitHub

```
Expansion.getWildcardReference(var relativePath)
```

#### **loadDataFile**

Attempts to parse a JSON file in the AdditionalSourceCode directory of the expansion.

```
Expansion.loadDataFile(var relativePath)
```

The `AdditionalSourceCode`
directory in the project folder of a HISE project is reserved for C++ files which will be compiled on plugin export.
In an expansion pack, this directory can be used for any arbtitrary kind of text content, however the most useful recommended format to use for this is JSON.

This method (and it's friend Expansion.writeDataFile()
can be used to fetch (and write) data to this directory.

#### **rebuildUserPresets**

Reextracts (and overrides) the user presets from the given expansion. Only works with intermediate / encrypted expansions.

```
Expansion.rebuildUserPresets()
```

If the expansion contains **User Presets**, they will be extracted automatically when you install the expansion the first time.
However if you update an existing expansion, the installation procedure will not override the user presets by default. If you want to ship new / modified user presets with your expansion update, you will need to call this manually after the installation of the expansion is finished.

The most convenient place for calling this method is the install callback that can be defined with Expansionhandler.setInstallCallback()

#### **setAllowDuplicateSamples**

Sets whether the samples are allowed to be duplicated for this expansion. Set this to false if you operate on the same samples differently. Edit on GitHub

```
Expansion.setAllowDuplicateSamples(bool shouldAllowDuplicates)
```

#### **setSampleFolder**

Changes the sample folder of that particular expansion.

```
Expansion.setSampleFolder(var newSampleFolder)
```

Be aware that this function will not move any samples to the new location, so the user has to do this step manually.
The most recommended way to choose a sample folder is during the installation from a package using the ExpansionHandler.installFromPackage()
call.
However this function let's you offer the user a way to fix a false sample path without having to hack around with a text editor.

It's also recommended to hint to the user that he might want to restart the plugin after changing this location in order to remove any chances that the old sample path is still being cached somewhere.

#### **unloadExpansion**

Unloads this expansion so it will not show up in the list of expansions until the next restart. Edit on GitHub

```
Expansion.unloadExpansion()
```

#### **writeDataFile**

Writes the given data into the file in the AdditionalSourceCode directory of the expansion. Edit on GitHub

```
Expansion.writeDataFile(var relativePath, var dataToWrite)
```

### ExpansionHandler

The `ExansionHandler`
class will offer functions to manage expansions. In order to use it, create one with the function Engine.createExpansionHandler().

In earlier versions of HISE, this class was globally available (like the `Message`
or `Server`
class). However for stability reasons the lifetime had to be limited so it's required to create an object in the `onInit`
callback.

#### **encodeWithCredentials**

Encrypts the given hxi file.

```
ExpansionHandler.encodeWithCredentials(var hxiFile)
```

This method takes the credentials object that was passed into Expansionhandler.setCredentials()
and embeds it into the given.hxi file, then copies this file as `info.hxp`
to the expansion folder.

The most basic example for how to use it would be to show a browser to the user,let it select a downloaded hxi file and then call this function in the file callback:

```
// Create a wrapper object around the expansion handler
const var expHandler = Engine.createExpansionHandler();

function installExp(hxiFile)
{ expHandler.encodeWithCredentials(hxiFile);
};

FileSystem.browse(FileSystem.Documents, false,   // read "*.hxi", // hxi installExp); // callback
```

But you can of course implement a more complex system using the Server download API.

#### **getCurrentExpansion**

Returns the currently active expansion (if there is one). Edit on GitHub

```
ExpansionHandler.getCurrentExpansion()
```

#### **getExpansion**

Returns the expansion with the given name Edit on GitHub

```
ExpansionHandler.getExpansion(var name)
```

#### **getExpansionForInstallPackage**

Checks if the expansion is already installed and returns a reference to the expansion if it exists. Edit on GitHub

```
ExpansionHandler.getExpansionForInstallPackage(var packageFile)
```

#### **getExpansionList**

Returns a list of all available expansions. Edit on GitHub

```
ExpansionHandler.getExpansionList()
```

#### **getUninitialisedExpansions**

Returns a list of all expansions that aren't loaded properly yet. Edit on GitHub

```
ExpansionHandler.getUninitialisedExpansions()
```

#### **installExpansionFromPackage**

Decompresses the samples and installs the.hxi /.hxp file.

```
ExpansionHandler.installExpansionFromPackage(var packageFile, var sampleDirectory)
```

If you have included the.hxi as metadata during the Sample export, you can use this function to automatically extract the samples, copy the expansion file (and encrypt it if you have user credentials available) and refresh the list.

This operation will be asynchronously executed on the sample loading thread, which means you can use the ScriptPanel.setLoadingCallback
function which will notify the user about the progress (extracting large sample sets might take a while so you most likely want some indication about the process).

If you want to do more specific tasks at the start and / or end of the installation routine, you can use the Expansionhandler.setInstallCallback()
function.

The function expects two parameters, the first must be a file object that points to the.hr1 file you want to install and the second parameter must be either a constant from the FileSystem class or a file object pointing to an (existing) folder:

**2nd Parameter** | **Effect** || `FileSystem.Expansions` | The samples will be copied to the expansion folder. This means they end up in the AppData directory of your system drive which is not the best idea if you have lots of samples |
| `FileSystem.Samples` | The samples will be copied to the global sample folder that you can specified with the CustomSettingsPanel(!LINK). It will create an symlink file in the Expansion's Sample folder to redirect anything to the global sample folder. |
| Custom folder object | This will create a symlink file in the Expansion's sample folder to point to any arbitrary location. You can use this to setup your own sample management system and allow the user to spread the samples across multiple locations. |

You can change / query the folder you specify later on using the Expansion.setSampleFolder()
and Expansion.getSampleFolder()
methods.

#### **refreshExpansions**

Call this to refresh the expansion list.

```
ExpansionHandler.refreshExpansions()
```

If the user has installed a new expansion, you will need to call this function in order to refresh the list of expansions and initialise new expansions.
The function will go through all the folders in the expansion root folder and tries to initialise any expansion that isn't loaded yet (either because it is new **or because it couldn't been initialised yet because of missing encryption information**
).
This step is only necessary when you implement a manual installation routine, but it will be called automatically at these events:

1. User enters license credentials (causes a reload of all encrypted expansions with the new user credentials)
2. User encodes a new Expansion with Expansionhandler.encodeWithCredentials() (will be called automatically afterwards).
3. User installs an expansion from a package with Expansionhandler.installExpansionFromPackage()

#### **setAllowedExpansionTypes**

Sets a list of allowed expansion types that can be loaded.

```
ExpansionHandler.setAllowedExpansionTypes(var typeList)
```

If you encrypt Expansions for your project, you most likely want to avoid that the user can just load in unencrypted expansions. In order to prevent this, you can specify the types that can be loaded using this method.

During development / debugging you will need to have all types enabled, but don't forget to change that before release.

The argument must be an array with numbers for the type that are available as constants of the ExpansionHandler class:

```
ExpansionHandler.FileBased
ExpansionHandler.Intermediate
ExpansionHandler.Encrypted
```

#### **setCredentials**

Set a credentials object that can be embedded into each expansion.

```
ExpansionHandler.setCredentials(var newCredentials)
```

If you have a licensing scheme that offers a unique identification for each user, you can use this object to pass it to the ExpansionHandler so it can encode this data into the expansions

#### **setCurrentExpansion**

Sets the current expansion as active expansion.

```
ExpansionHandler.setCurrentExpansion(var expansionName)
```

Be aware that while there is only one expansion that can be active at the same time, it does not mean that you can't load content from multiple expansions at once (and you don't need to call this function before you want to load some data from an expansion).
It is more an additional feature that allows you to eg. adapt the UI to the most recently loaded expansion.

Whenever you call this method, the function that was specified at Expansionhandler.setExpansionCallback()
is being executed with a reference to the active Expansion
object as parameter.

#### **setEncryptionKey**

Set a encryption key that will be used to encrypt the content (deprecated).

```
ExpansionHandler.setEncryptionKey(String newKey)
```

Call this function if you want to use the encrypted Expansion type in order to protect your expansions against unauthorized usage. The key you pass in must be a valid Blowfish key, so any String up to 72 characters is fine.

Be aware that you need to pass in the exact same key you specified in the Project Settings' **Expansion Key**
property.

As soon as you call this method, the expansion handler will reinitialise the expansions that are encrypted and try to decrypt them with the new key.

#### **setErrorFunction**

Sets a error function that will be executed.

```
ExpansionHandler.setErrorFunction(var newErrorFunction)
```

If something goes wrong with the initialisation of an expansion, you can specify a function that is called with an error message that you can show to the user somehow.

The function you pass as `newErrorFunction`
must have two parameters:

1. the error message
2. a flag indicating a critical error (a critical error will stop the plugin).

This function will be called by the expansion logic inside HISE, however you can also call it manually using the
Expansionhandler.setErrorMessage()
function

Be aware that the error function is owned by the wrapper object not the global expansion manager (so it goes out of scope as soon as the wrapper object is destructed).

#### **setErrorMessage**

Calls the error function specified with setErrorFunction. Edit on GitHub

```
ExpansionHandler.setErrorMessage(String errorMessage)
```

#### **setExpansionCallback**

Set a function that will be called whenever a expansion is being loaded.

```
ExpansionHandler.setExpansionCallback(var expansionLoadedCallback)
```

Whenever an expansion is switched, this function will be called so you can react on the event. This happens at these opportunities:

1. A preset from an expansion is loaded
2. Expansionhandler.setCurrentExpansion() was called
3. An expansion was selected in the dropdown list in the HISE Expansion Edit bar

Be aware that the expansion callback is owned by the wrapper object not the global expansion manager (so it goes out of scope as soon as the wrapper object is destructed).

#### **setInstallCallback**

Set a function that will be called during installation of a new expansion.

```
ExpansionHandler.setInstallCallback(var installationCallback)
```

This callback expects one argument that will contain an object with some information about the installation status.

**Property** | **Description** || `obj.Status` | A status code indicating the state of the installation: `0` before the extraction starts, `1` during the extraction and `2` if the extraction is finished. The callback is guaranteed to be executed with `2` at least once. |
| `obj.Expansion` | If the installation (and optional initialisation using the authentication credentials) suceeded, this will contain a reference to the expansion so you can do some post-installation tasks. |
| `obj.Progress` | This contains the extraction progress. It's basically the same as `Engine.getPreloadProgress`. |
| `obj.SourceFile` | The package file that is being extracted. |
| `obj.TargetFolder` | The directory where the expansion is being installed to. |
| `obj.SampleFolder` | The sample folder that is being used for the samples. |

You can use this callback for different tasks that might suit your handling of expansions:

- deleting the.hr1 file after a sucessful installation
- rebuilding user presets after an expansion update
- automatically switching to the installed expansion using `ExpansionHandler.setCurrentExpansion()`

```
const var t = FileSystem.getFolder(FileSystem.Desktop).getChildFile("test.hr1");
const var e = Engine.createExpansionHandler();

function installCallback(obj)
{ if(obj.Status == 2 && isDefined(obj.Expansion)) { // make sure the user presets are updated obj.Expansion.rebuildUserPresets();
 // ask the user if he wants to delete the archive file... Engine.showYesNoWindow("Installation sucessful", "Do you want to delete the archive file", function(ok) { if(ok) t.deleteFileOrDirectory(); }); }
};

e.setInstallCallback(installCallback);
e.installExpansionFromPackage(t, FileSystem.Expansions);
```

#### **setInstallFullDynamics**

Sets whether the installExpansionFromPackage function should install full dynamics. Edit on GitHub

```
ExpansionHandler.setInstallFullDynamics(bool shouldInstallFullDynamics)
```

### FFT

Create a `FFT`
Buffer with:

```
const var fft = Engine.createFFT();`.
```

See this forum thread
to learn more about it.

#### **getSpectrum2DParameters**

Returns the JSON data for the spectrum parameters. Edit on GitHub

```
FFT.getSpectrum2DParameters()
```

#### **prepare**

Allocates the buffers required for processing. Edit on GitHub

```
FFT.prepare(int powerOfTwoSize, int maxNumChannels)
```

#### **process**

Process the given data (either a buffer or a array of buffers. Edit on GitHub

```
FFT.process(var dataToProcess)
```

#### **setEnableInverseFFT**

This enables the inverse transform that will reconstruct the signal from the processed FFT. Edit on GitHub

```
FFT.setEnableInverseFFT(bool shouldApplyReverseTransformToInput)
```

#### **setEnableSpectrum2D**

Enables the creation of a 2D spectrograph image. Edit on GitHub

```
FFT.setEnableSpectrum2D(bool shouldBeEnabled)
```

#### **setMagnitudeFunction**

Sets a function that will be executed with the amplitude information of the FFT bins. Edit on GitHub

```
FFT.setMagnitudeFunction(var newMagnitudeFunction, bool convertToDecibels)
```

#### **setOverlap**

Sets an overlap (from 0...1) for the chunks. Edit on GitHub

```
FFT.setOverlap(double percentageOfOverlap)
```

#### **setPhaseFunction**

Sets a function that will be executed with the phase information of the FFT bins. Edit on GitHub

```
FFT.setPhaseFunction(var newPhaseFunction)
```

#### **setSpectrum2DParameters**

Sets the spectrum data from the JSON object. Edit on GitHub

```
FFT.setSpectrum2DParameters(var jsonData)
```

#### **setUseFallbackEngine**

This forces the FFT object to use the fallback engine. Edit on GitHub

```
FFT.setUseFallbackEngine(bool shouldUseFallback)
```

#### **setUseSpectrumList**

Flushes the given spectrum list to a file. Edit on GitHub

```
FFT.setUseSpectrumList(int numRows)
```

#### **setWindowType**

Sets a window function that will be applied to the data chunks before processing. Edit on GitHub

```
FFT.setWindowType(int windowType)
```

### File

The `File`
object refers to a file or directory on disk and can be used to navigate / access the file system.

In order to use it, call the Filesystem
API class to get a folder from where you navigate to the file you want to modify / load.

Be aware that there is no possibility of writing / loading files using absolute paths (eg. `C:\MyFolder`
) because it is not portable across operating systems (and even computers).

#### **copy**

Copies the file. The target isn't the directory to put it in, it's the actual file to create. Edit on GitHub

```
File.copy(var target)
```

#### **copyDirectory**

Recursively copies the directory. The target is the actual directory to create, not the directory into which the new one should be placed. Edit on GitHub

```
File.copyDirectory(var target)
```

#### **createDirectory**

Returns the new directory created at the file location, if directory doesn't already exist Edit on GitHub

```
File.createDirectory(String directoryName)
```

#### **deleteFileOrDirectory**

Deletes the file or directory WITHOUT confirmation. Edit on GitHub

```
File.deleteFileOrDirectory()
```

#### **extractZipFile**

Extracts the ZIP archive if this file is a.zip file.

```
File.extractZipFile(var targetDirectory, bool overwriteFiles, var callback)
```

This method will extract a standard ZIP file (without password protection) to the given target directory (which can be either a file path String or a File
object).

In order to extract to privileged locations on Windows, for example the user's VST3 folder, it is neccessary to enable the 'Admin Permissions' checkbox in your project's preferences. There isn't currently a way to do this on OSX.

The extraction process will be executed on the sample loading thread and you can assign a callback that is executed to track the extraction progress.

The callback expects a single parameter that will contain a JSON object with the following properties:

**Property** | **Type** | **Description** || `Cancel` | bool | Set to `false`. If you want to abort the extraction process, just set this flag to true. |
| `Target` | String | The target directory as file path. |
| `Error` | String | A error message if something went wrong during extracting. |
| `Progress` | double | the progress from 0.0 to 1.0. Be aware that this tracks only the number of files extracted vs. the total number of files, so if you have one big file inside the archive, it will not work. |
| `NumBytesWritten` | int | the number of bytes that have been extracted. |
| `CurrentFile` | String | the relative path of the file that is currently being extracted. |
| `Status` | int | a status flag indicating the state of the extraction: `0` at the beginning, `1` while extracting and `2` at the end. |

The callback will be executed at the beginning of the extraction (with the Status flag `0`
) and at the end (with the Status flag `2`
) as well as when an error occurs.

If you extract a small archive (less than ~400 files), the callback will also be executed for each file (this limit prevents the scripting queue to be clogged with huge archives).

#### **getBytesFreeOnVolume**

Returns the number of bytes free on the drive that this file lives on. Edit on GitHub

```
File.getBytesFreeOnVolume()
```

#### **getChildFile**

Returns a child file if this is a directory. Edit on GitHub

```
File.getChildFile(String childFileName)
```

#### **getHash**

Reads a file and generates the hash of its contents. Edit on GitHub

```
File.getHash()
```

#### **getNonExistentSibling**

Returns a sibling file that doesn't exist. Edit on GitHub

```
File.getNonExistentSibling()
```

#### **getNumZippedItems**

Returns the number of items in the zip file. Edit on GitHub

```
File.getNumZippedItems()
```

#### **getParentDirectory**

Returns the parent directory as File. Edit on GitHub

```
File.getParentDirectory()
```

#### **getRedirectedFolder**

If this file is a folder that contains a HISE redirection file (LinkWindows / LinkOSX file), then it will return the redirection target, otherwise it will return itself. Edit on GitHub

```
File.getRedirectedFolder()
```

#### **getRelativePathFrom**

Returns a relative path from the given other file. Edit on GitHub

```
File.getRelativePathFrom(var otherFile)
```

#### **getSize**

Returns the size of the file in bytes. Edit on GitHub

```
File.getSize()
```

#### **hasWriteAccess**

true if it's possible to create and write to this file. If the file doesn't already exist, this will check its parent directory to see if writing is allowed. Edit on GitHub

```
File.hasWriteAccess()
```

#### **isChildOf**

Checks if this file is a child file of the other file. Edit on GitHub

```
File.isChildOf(var otherFile, bool checkSubdirectories)
```

#### **isDirectory**

Checks if this file exists and is a directory. Edit on GitHub

```
File.isDirectory()
```

#### **isFile**

Checks if this file exists and is a file. Edit on GitHub

```
File.isFile()
```

#### **isSameFileAs**

Checks if the file matches the other file (the object comparison might not work reliably). Edit on GitHub

```
File.isSameFileAs(var otherFile)
```

#### **loadAsAudioFile**

Loads the given file as audio file. Edit on GitHub

```
File.loadAsAudioFile()
```

#### **loadAsBase64String**

Loads the binary file, compresses it with zstd and returns a Base64 string. Edit on GitHub

```
File.loadAsBase64String()
```

#### **loadAsMidiFile**

Loads the track (zero-based) of the MIDI file. If successful, it returns an object containing the time signature and a list of all events. Edit on GitHub

```
File.loadAsMidiFile(int trackIndex)
```

#### **loadAsObject**

Loads the given file as object.

```
File.loadAsObject()
```

This tries to parse the given file as JSON object and return it. If you are storing complex data, this will be the most convenient option.

#### **loadAsString**

Loads the given file as text. Edit on GitHub

```
File.loadAsString()
```

#### **loadAudioMetadata**

Tries to parse the metadata from the audio file (channel amount, length, samplerate, etc) and returns a JSON object if sucessful. Edit on GitHub

```
File.loadAudioMetadata()
```

#### **loadEncryptedObject**

Loads the encrypted object using the supplied RSA key pair.

```
File.loadEncryptedObject(String key)
```

This function will load a JSON object from a file that has been written with File.writeEncryptedObject()

The encryption uses Blowfish encryption, so it should be able to encrypt / decrypt pretty fast.

You can use these functions to create an authentification scheme that stores the license key in a file in order to bypass online activation.

#### **loadFromXmlFile**

Loads the XML file and tries to parse it as JSON object. Edit on GitHub

```
File.loadFromXmlFile()
```

#### **loadMidiMetadata**

Tries to parse the metadata of the MIDI file and returns a JSON object if successful. Edit on GitHub

```
File.loadMidiMetadata()
```

#### **move**

Moves the file. The target isn't the directory to put it in, it's the actual file to create. Edit on GitHub

```
File.move(var target)
```

#### **rename**

Renames the file. Edit on GitHub

```
File.rename(String newName)
```

#### **setExecutePermission**

Changes the execute-permissions of a file. Edit on GitHub

```
File.setExecutePermission(bool shouldBeExecutable)
```

#### **setReadOnly**

Changes the read/write permission for the given file. Edit on GitHub

```
File.setReadOnly(bool shouldBeReadOnly, bool applyRecursively)
```

#### **show**

Opens a Explorer / Finder window that points to the file.

```
File.show()
```

This opens a OS specific file browser that will reveal the file to the user.

#### **startAsProcess**

Launches the file as a process. Edit on GitHub

```
File.startAsProcess(String parameters)
```

#### **toReferenceString**

Returns a reference string with a wildcard.

```
File.toReferenceString(String folderType)
```

This function tries to parse this file as relative path string depending on the folder type. If you want to import a custom sample into a samplemap and want to make sure that it is as portable as possible you can use this:

```
inline function dropCallback(f)
{
	local samplePath = f.getReferenceString("Samples");

	Sampler.loadSampleMapFromJSON([
	{
		"FileName": samplePath
	}]);
};
```

If the file that was dropped was in the sample folder of the plugin, `samplePath`
will be `{PROJECT_FOLDER}MySample.wav`
(otherwise it will just be the absolute path). Having it as project reference will allow the user to port the data across systems which might be a bit more convenient.

#### **toString**

Returns a String representation of that file.

```
File.toString(int formatType)
```

You can use this to display the filename on your UI.

The `formatType`
argument is expected to be one of the constants supplied in the `File`
object:

The following table will show the formatting for the file `C:\MyFolder\Textfile.txt`

**Name** | **Example** || `FullPath` | `C:\MyFolder\Textfile.txt` |
| `NoExtension` | `Textfile` |
| `Extension` | `.txt` |
| `Filename` | `Textfile.txt` |

#### **writeAsXmlFile**

Replaces the XML file with the JSON content (needs to be convertible). Edit on GitHub

```
File.writeAsXmlFile(var jsonDataToBeXmled, String tagName)
```

#### **writeAudioFile**

Writes the given data (either a Buffer or Array of Buffers) to a audio file. Edit on GitHub

```
File.writeAudioFile(var audioData, double sampleRate, int bitDepth)
```

#### **writeEncryptedObject**

Encrypts an JSON object using the supplied key.

```
File.writeEncryptedObject(var jsonData, String key)
```

This function will encrypt the JSON object with the given key and write it to the specified file. The key can be up to 72 characters long.

In order to read the encrypted file, use File.loadEncryptedObject()
with the same key.

#### **writeMidiFile**

Writes the array of MessageHolders as MIDI file using the metadataObject to determine time signature, tempo, etc. Edit on GitHub

```
File.writeMidiFile(var eventList, var metadataObject)
```

#### **writeObject**

Replaces the file content with the JSON data. Edit on GitHub

```
File.writeObject(var jsonData)
```

#### **writeString**

Replaces the file content with the given text.

```
File.writeString(String text)
```

It will return `true`
if the file operation was completed successfully or `false`
if there was an error during the operation.

### FileSystem

The `FileSystem`
API class can be used for File I/O and to create File
objects that can be used to access files.

##### **Special Locations**

In order to access files, you will need to use the constants of the `FileSystem`
object in order to go to special locations.

**Location** | **Description** || AudioFiles | The audio file folder. In HISE it will be in the repo folder, but in the compiled project it will be a sub folder in the appdata folder. |
| Expansions | The expansion folder file folder. In HISE it will be in the repo folder, but in the compiled project it will be a sub folder in the appdata folder. |
| Samples | The sample folder as specified in the settings (or the subfolder of the HISE project during development). |
| AppData | The app data directory. This is the main directory for your project which will house the configuration files and user presets. |
| UserHome | The user home folder. | Documents | The user's Document folder. |
| Desktop | The user's desktop folder. |
| Downloads | The user's download folder. |

Please be aware that using any of the user's folder without a good reason is bad taste and should be avoided if possible.

#### **browse**

Opens a file browser to choose a file.

```
FileSystem.browse(var startFolder, bool forSaving, String wildcard, var callback)
```

This will create a file browser from the OS that let's the user choose a file for loading or saving (in case of saving it will confirm a overwrite).

- the `startFolder` parameter can be either a `File` object or one of the special location constants of the `FileSystem` API object. If you pass `undefined` it will choose a sensible default (most likely the most recent location).
- the `forSaving` parameter decides whether the file is supposed to be overwritten or just read from.
- the `wildcard` parameter is a file wildcard (like eg. `*.txt` for all text files) and can be used to filter the files being displayed. If the wildcard is an empty string, it will show all files.
- the `callback` parameter is a function with one parameter that will be executed when a file has been chosen.

If you call this function it will return immediately and open the file browser asynchronously (otherwise the script execution would time out during the selection).
Therefore you will need to pass in a function that will be executed as soon as the user has selected a file. It expects a function with a single parameter that will hold a File
object with the selected file:

```
FileSystem.browse(undefined, false, "*.txt", function(result)
{ // the parameter is a File object, so we just show it // in the OS' file browser. result.show();
});
```

#### **browseForDirectory**

Opens a file browser to choose a directory. Edit on GitHub

```
FileSystem.browseForDirectory(var startFolder, var callback)
```

#### **browseForMultipleDirectories**

Opens a file browser to select multiple directories. Edit on GitHub

```
FileSystem.browseForMultipleDirectories(var startFolder, var callback)
```

#### **browseForMultipleFiles**

Opens a file browser to select multiple files (to open). Edit on GitHub

```
FileSystem.browseForMultipleFiles(var startFolder, String wildcard, var callback)
```

#### **decryptWithRSA**

Decrypts the given string using a RSA public key. Edit on GitHub

```
FileSystem.decryptWithRSA( String dataToDecrypt,  String publicKey)
```

#### **descriptionOfSizeInBytes**

Convert a file size in bytes to a neat string description. Edit on GitHub

```
FileSystem.descriptionOfSizeInBytes(int64 bytes)
```

#### **encryptWithRSA**

Encrypts the given string using a RSA private key. Edit on GitHub

```
FileSystem.encryptWithRSA( String dataToEncrypt,  String privateKey)
```

#### **findFiles**

Returns a list of all child files of a directory that match the wildcard.

```
FileSystem.findFiles(var directory, String wildcard, bool recursive)
```

This will search a given directory and return an Array
that contains one File
object per child file.
You can use it to build up a file browser.

- the `directory` parameter will be the root folder that is going to be searched
- the `wildcard` parameter will filter out the files
- the `recursive` parameter will check whether it should search every sub-folder or just the direct children of this folder.

#### **findFileSystemRoots**

Returns a list of all root drives of the current computer. Edit on GitHub

```
FileSystem.findFileSystemRoots()
```

#### **fromAbsolutePath**

Returns a file object from an absolute path (eg. C:/Windows/MyProgram.exe). Edit on GitHub

```
FileSystem.fromAbsolutePath(String path)
```

#### **fromReferenceString**

Returns a file object for the given location type and the reference string which can either contain a wildcard like `{PROJECT_FOLDER}`
or a full file path. Edit on GitHub

```
FileSystem.fromReferenceString(String referenceStringOrFullPath, var locationType)
```

#### **getBytesFreeOnVolume**

Returns the number of free bytes on the volume of a given folder. Edit on GitHub

```
FileSystem.getBytesFreeOnVolume(var folder)
```

#### **getFolder**

Returns the current sample folder as File object.

```
FileSystem.getFolder(var locationType)
```

You can use this method to access files from one of the given locations (take a look at the Special Locations
above for a list of available folders).

You can navigate from that folder to the file you want with the File.getChildFile()
method.

To get files from the AudioFiles
folder of an exported project, eg. for use in a Convolution Reverb
or an Audio Loop Player, use Engine.loadAudioFilesIntoPool().

#### **getSystemId**

Returns a unique machine ID that can be used to identify the computer. Edit on GitHub

```
FileSystem.getSystemId()
```

#### **loadExampleAssets**

Loads a bunch of dummy assets (audio files, MIDI files, filmstrips) for use in snippets & examples. Edit on GitHub

```
FileSystem.loadExampleAssets()
```

### FixObjectArray

This container is created by a FixObjectFactory
and can be used like a ordinary Array. It allows subscript operations for inserting & fetching values and range-based for loops:

```
const var f1 = Engine.createFixObjectFactory({
	"value": 0
});

const var list = f1.createArray(128);

for(s in list)
{
	s.value = 90;
}

list[12].value = 20;

const var x = list[90].value;
```

There are also a few methods copied from the `Array`
class, however for dynamic insertion and removal (like with `push()`
or `removeElement()`
) it's highly recommended to use the FixObjectStack
class instead.

#### **clear**

Clears the array (resets all objects to their default.

```
FixObjectArray.clear()
```

This operation might be slower than `Array.clear()`
because it has to iterate all elements.

#### **contains**

checks if the array contains the object.

```
FixObjectArray.contains(var obj)
```

This will use the comparison function defined by FixObjectFactory.setCompareFunction()
in order to define equality of two elements.

#### **copy**

Copies the property from each element into a buffer (or array). Edit on GitHub

```
FixObjectArray.copy(String propertyName, var target)
```

#### **fill**

Fills the array with the given object. Edit on GitHub

```
FixObjectArray.fill(var obj)
```

#### **fromBase64**

Restores an array from a previously exported state. Edit on GitHub

```
FixObjectArray.fromBase64( String b64)
```

#### **indexOf**

Returns the index of the first element that matches the given object.

```
FixObjectArray.indexOf(var obj)
```

This will use the comparison function defined by FixObjectFactory.setCompareFunction()
in order to define equality of two elements.

#### **size**

Returns the size of the array.

```
FixObjectArray.size()
```

This will always return the size that was passed into the constructor (unlike the stack object which will return the number of used slots).

#### **sort**

Sorts the array with the given compare function.

```
FixObjectArray.sort()
```

This will use the comparison function defined by FixObjectFactory.setCompareFunction()
in order to define equality of two elements.

#### **toBase64**

Exports the memory region of the entire array as Base64 encoded string. Edit on GitHub

```
FixObjectArray.toBase64()
```

### FixObjectFactory

This class allows you to create a custom data structure that can be used to build different containers with a very dense data layout. This can be very useful in a MIDI processing context where you need to define a custom data model to fit your algorithm: In most scenarios that require a custom MIDI processing script, you will need to create a data container that stores varying kind of data. With this class you can tailor the memory layout to your exact requirement and then use one of the available data containers for a convenient implementation.

The data layout will be defined by a JSON prototype object that you need to pass into Engine.createFixObjectFactory(). This will return a factory object that can be used to instantiate containers or single objects.

A notable feature of this class is that you can supply a custom comparison function that will be used by the data containers for the `indexOf()`, `contains()`
methods.

#### **Advantages**

On the first look this doesn't look particularly interesting, as anything here can also be implemented *somehow*
using the stock data structures of HiseScript. Howewer there are a few advantages that make this a bit (or a lot) more convenient:

- you don't need to care about proper initialisation of default values, this will be done automatically by copying the values from the prototype JSON object. Also all the "clearing" functions will reset the object to this default state, if this is non-trivial (every = zero) this becomes be very convenient.
- you don't need to care about allocation & realtime safety: it's always preallocated.
- the ability of using the unordered stack data container can drastically simplify a lot of scripts.
- the data layout will be picked up by the IDE tools (scriptwatch table & autocomplete). There's also a handy StackViewer that shows the full data rangee in a table layout (Right-click on the entry of the stack in the ScriptWatchTable and choose **View in Popup** )
- the performance might be faster depending on your algorithm (because searching & indexing can be done on C++ level). The expected speedup is not always ground-breaking, but since the use case of this class is in the MIDI processing callback, every saved CPU cycle is a good CPU cycle.
- you can pass a fix object as a data structure to an eventnode network which will treat it as one item across the signal graph (spoiler alert 2024...)
- going forward there will be more and more applications with other scriping API calls that benefit from the fixed layout to improve the performance (eg. Math.from0to10() ).

#### **The Prototype**

The prototype JSON object will define the object data layout. Every property (key) you define here will create a "data member" of the fix object with the key as member identifier and the value as initial default value. However there are a few limitations for the layout and data:

- the only allowed data types are numbers. No strings, no nested JSON, no object references
- the only exception is that you can define arrays, but the array have to be one-dimensional and only contain numbers.

The fix object is typed, that means that if you pass in an integer value, it will create an integer member. If you pass in an array, it will use the first element to figure out what type to use.

The values of the property will be used as "default" values and every object will be initialised with these.

Here are a few (real world) examples of JSON objects that can be used as prototype:

```
// Use this to store the event IDs of a chord that is created
// from a single note
const var f1 = Engine.createFixObjectFactory({
	eventId: 0,
	chordIds: [0, 0, 0] // this assumes that the chord is a triad
});

// Use this to store the time and pitch factor of a note
const var f1 = Engine.createFixObjectFactory({
	eventId: 0,
	pitchFactor: 1.0,
	startUptime: 0.0
});

// Use this to store whether the note was played while a keyswitch
// was held down
const var f1 = Engine.createFixObjectFactory({
	eventId: 0,
	triggeredWithC1: false,
	triggeredWithD1: false
});
```

After you've created a factory, you can either create single instance objects or a data container with additional functionality.

#### **create**

Creates a single object from the prototype layout.

```
FixObjectFactory.create()
```

Calling this method will create a single object with the supplied data layout. The returned object is **NOT**
a JSON object, but a custom object type with these properties:

- predefined, typed and preallocated properties based on the JSON prototype of the factory
- no methods, just data

However from a workflow perspective, it behaves just like a JSON object:

- you can access (read & write) properties using the dot operator: `obj.key = value` and `value = obj.key`
- you can even call `trace()` to create a string representation that looks like it's JSON equivalent (useful for debugging)

You can of course put these objects into a JS array or JSON object, however it's highly recommended to use one of the special data containers instead. If you do so, you will most likely need to create a single object alongside the data container and then use this as "interface object" for shuffling data in and out of the container:

```
const var f1 = Engine.createFixObjectFactory({
	"myValue": 17,
	"someOtherValue": 42.0
});

// Creates a preallocated array with the given size
const var list = f1.createArray(64);

// Creates an object for interacting with the array above
const var obj = f1.create();

Console.print(trace(obj));

// Now we want to push an object with both values zero
// into the list.
obj.myValue = 0;
obj.someOtherValue = 0.0;

// This will not insert a reference into the array but copy the
// data values from the current state of obj
list.push(obj);

// You can also call trace with a FixObjectArray and it will dump it like a JSON
Console.print(trace(list));

// this function will perform a bitwise comparison of the data
const var idx = list.indexOf(obj);
Console.print(idx); // => 0

obj.myValue = 90;

// Now it won't find the element because we changed it.
// Note that that's different from the default JS behaviour
// because we are not storing a reference to the object in the
// array but a copy!
const var idx2 = list.indexOf(obj);

Console.print(idx2); // => -1
```

#### **createArray**

Creates a fixed size array with the given number of elements.

```
FixObjectFactory.createArray(int numElements)
```

This function will create and return a preallocated array using the prototype data layout. The returned object is a FixObjectArray
and shares a lot of methods with its default JS counterpart.

#### **createStack**

Creates an unordered stack.

```
FixObjectFactory.createStack(int numElements)
```

This function will create and return a unordered stack container with the maximum length specified by the parameter. The returned object is a FixObjectStack
and offers a few advantages over the default array.

#### **getTypeHash**

Returns the hash code for the memory layout which factors in member IDs, order and type. Edit on GitHub

```
FixObjectFactory.getTypeHash()
```

#### **setCompareFunction**

Registers a function that will be used for comparison. If you pass in a string it will only compare the given property.

```
FixObjectFactory.setCompareFunction(var newCompareFunction)
```

A lot of operations and methods of the data containers will require some kind of comparison operation: indexing, sorting, etc. all need to decide whether an element is supposed to be equal (or greater or less). The default comparison compares every single property of the object, but this might not what you need in your logic.

This is where this function comes in handy as it allows you to define different comparison functions. There are three options available:

1. Compare a single property. This can be achieved by passing in the ID of the property as a string into the function. It will then ignore all other properties and just factor in this property for sorting, indexing, etc.
2. Compare multiple properties. This can be achieved by passing up to 4 IDs separated by a comma. It will then compare all those the properties
3. Define a custom JS function by passing in a callable object into the method. The function you pass in needs to have two parameters and must return either `-1`, `1` or `0` depending on the relation between the two objects (this is similar to `Engine.sortWithFunction()` )

```
const var f1 = Engine.createFixObjectFactory({
	"eventId": 0,
	"noteNumber": 0
});

// This will make all indexing functions only look for the eventID
f1.setCompareFunction("eventId");
```

Be aware that using the third option has a noticeable performance impact so only use this as last resort.

### FixObjectStack

This data container in an enhancement of the FixObjectArray
and keeps track of the amount of "used" elements.

It's special behaviour is that it always guarantees a dense structure: removing elements will just move the last element into the empty position. This will destroy the "order" of elements, but for use cases where the elements are not directly related with each other, this is a good trade-off because it allows very fast insertions & removal operations.

```
// This is the init state of our stack
[0, 1, 2, 3];

// Insert X

[0, 1, 2, 3, X];

// Remove 2, move X into the gap

[0, 1, X, 3];

// Insert Y at the end

[0, 1, X, 3, Y]
```

#### **clear**

Clears the stack.

```
FixObjectStack.clear() override
```

Like FixObjectArray.clear(), this is a rather slow operation because it will iterate over the entire data range. If you want to "reset" the state in a realtime context, using `clearQuick()`
might be a better candidate.

#### **clearQuick**

Clears the stack by moving the end pointer to the start (leaving its elements in the same state). Edit on GitHub

```
FixObjectStack.clearQuick()
```

#### **contains**

checks if the array contains the object. Edit on GitHub

```
FixObjectStack.contains(var obj)
```

#### **copy**

Copies the property from each element into a buffer (or array). Edit on GitHub

```
FixObjectStack.copy(String propertyName, var target)
```

#### **fill**

Fills the array with the given object. Edit on GitHub

```
FixObjectStack.fill(var obj)
```

#### **fromBase64**

Restores an array from a previously exported state. Edit on GitHub

```
FixObjectStack.fromBase64( String b64)
```

#### **indexOf**

Returns the index of the first element that matches the given object. Edit on GitHub

```
FixObjectStack.indexOf(var obj)
```

#### **insert**

Inserts a element to the stack. Edit on GitHub

```
FixObjectStack.insert(var obj)
```

#### **isEmpty**

Checks whether the stack is empty. Edit on GitHub

```
FixObjectStack.isEmpty()
```

#### **remove**

Removes the element from the stack and fills up the gap. Edit on GitHub

```
FixObjectStack.remove(var obj)
```

#### **removeElement**

Removes the element at the given index and fills the gap. Edit on GitHub

```
FixObjectStack.removeElement(int index)
```

#### **set**

Replaces the object if it exists or inserts it at the end. Edit on GitHub

```
FixObjectStack.set(var obj)
```

#### **size**

Returns the number of used elements in the stack. Edit on GitHub

```
FixObjectStack.size()  override
```

#### **sort**

Sorts the array with the given compare function. Edit on GitHub

```
FixObjectStack.sort()
```

#### **toBase64**

Exports the memory region of the entire array as Base64 encoded string. Edit on GitHub

```
FixObjectStack.toBase64()
```

### GlobalCable

`Global Cables`
can be used in order to send values across HISE projects and even from / to OSC sources. If want to attach scripting callbacks to value changes of a global cable or send values from a script, this object will come in handy.

In order to use it, just create a reference to the global routing manager using `Engine.getGlobalRoutingManager()`, then call `GlobalRoutingManager.getCable(id)`
with a unique ID for the given cable. Then you can send values through it, attach synchronous and asynchronous callbacks, add some range conversion tools etc.

##### **Using a cable as OSC address**

If you want to use a cable as OSC address that can send and receive values from external applications, you just need to prepend `/`
before the id, so any cable that has an ID like this:

```
/some_osc_id
```

will automatically be used as OSC address as soon as you start using the global routing system as OSC server.

##### **External C++ communication**

The global cable is the preferred way of communicating values back from your C++ node. Take a look here
for a description on how to use it.

#### **connectToGlobalModulator**

Connects the cable to a global LFO modulation output as source. Edit on GitHub

```
GlobalCable.connectToGlobalModulator( String lfoId, bool addToMod)
```

#### **connectToMacroControl**

Connects the cable to a macro control.

```
GlobalCable.connectToMacroControl(int macroIndex, bool macroIsTarget, bool filterRepetitions)
```

This function connects the macro control system and the global routing system by letting you send / receive value changes from macro controls. In order to use it, just call this method to assign any cable to a macro index.

**Parameter** | **Values** | **Description** || `macroIndex` | int from 0 to 7 | the macro control that you want to connect to the global cable |
| `macroIsTarget` | bool | whether the macro control should control the global cable or vice versa (obviously this can't be bidirectional to prevent feedback loops) |
| `filterRepetitions` | bool | whether the cable should filter out repetitions of the same value. This might vastly decrease the CPU usage if you're modulating the cable value and don't want to send a new macro value each block. |

#### **connectToModuleParameter**

Connects the cable to a module parameter using a JSON object for defining the range. Edit on GitHub

```
GlobalCable.connectToModuleParameter( String processorId, var parameterIndexOrId, var targetObject)
```

#### **deregisterCallback**

Deregisteres a callback from the cable. Edit on GitHub

```
GlobalCable.deregisterCallback(var callbackFunction)
```

#### **getValue**

Returns the value (converted to the input range).

```
GlobalCable.getValue()
```

This function will return the current value of the cable after converting it using the range you defined with one of the range methods. If you need the normalised value, check out the `getValueNormalised()`
function.

#### **getValueNormalised**

Returns the normalised value between 0...1 Edit on GitHub

```
GlobalCable.getValueNormalised()
```

#### **registerCallback**

Registers a function that will be executed whenever a value is sent through the cable.

```
GlobalCable.registerCallback(var callbackFunction, var synchronous)
```

This function will register a callable object (either a inline function, a function or a broadcaster) to the cable. It expects a single argument that will contain the value of the cable. You can either register it as synchronous callback or as asynchronous callback (by using either the `SyncNotification`
or `AsyncNotification`
constants). The latter will filter out repetitions and will be called on the UI thread at the next timer interval:

Be aware that if you've set a range then the value that will be passed into the callback will be converted from the normalised 0...1 range to whatever range you need.

If you're using a synchronous callback then the function you pass in must be an inline function as this might be executed on the audio thread and normal functions are not realtime safe.

#### **registerDataCallback**

Registers a function that will be executed asynchronously when the data receives a JSON data chunk.

```
GlobalCable.registerDataCallback(var dataCallbackFunction)
```

This will register a callback that receives any data that was transmitted over this cable. It can come from two sources:

1. The scripting method Global Cable
2. A external C++ node using the C++ function

The function expects a callable object with a single parameter that will contain the data that is transmitted.

```
// Create a global routing manager
const var rm = Engine.getGlobalRoutingManager();

// Create the data cable
const var dataCable = rm.getCable("dataCable");

// Register the callback
dataCable.registerDataCallback(function(data)
{
	Console.print("DATA: " + trace(data));
});

// Create some arbitrary data
const var bf = Buffer.create(32);
bf[10] = 90.0;

// Send the data over (this will not fire the callback above
// but other targets)
dataCable.sendData([bf, 100, "a string"]);
```

The function is always being called synchronously and it creates a deep copy of the entire data for each target so this might be not the best solution in a scenario that requires fast communication (eg. UI updates of buffers etc).

#### **sendData**

Sends any type of data (JSON, string, buffers) to the target.

```
GlobalCable.sendData(var dataToSend)
```

This function can be used to send any kind of arbitrary data to the global cable targets. This can be used for safe communication between different scripts and even external C++ nodes. In order to use this method, just call it with any kind of data and it will be send to all targets that are registered to this cable.

```
const var rm = Engine.getGlobalRoutingManager();
const var c = rm.getCable("myDataCable");
c.sendData({ someJson: 1234, also: "strings are supported" });
c.sendData([ 1, 2, 3, 4, 5, 6]);
c.sendData(Buffer.create(128));
```

Note that there is not a data queue for the sender side of this protocol, which means that if you register a target after the data has been sent, it will not be "initialised" with the previously sent value. However if you're using the C++ API in your external node, it will queue the data that is about to be sent if the cable is not connected yet.

Also it will skip its own callbacks, so if you register a callback using Global Cable.registerDataCallback(), it will not be executed:

```
const var rm = Engine.getGlobalRoutingManager();

// Create a instance of a cable
const var c1 = rm.getCable("myDataCable");

// Create a duplicate instance
const var c2 = rm.getCable("myDataCable");

// Register two callbacks to both objects
c1.registerDataCallback(x => Console.print("C1 executed: " + trace(x)));
c2.registerDataCallback(x => Console.print("C2 executed: " + trace(x)));

Console.print("Send through cable 1");
c1.sendData("some data");

Console.print("Send through cable 2");
c2.sendData("some data");

// Output:
// Interface: Send through cable 1
// Interface: C2 executed: "some data"
// Interface: Send through cable 2
// Interface: C1 executed: "some data"
```

As you can see if you send a value through the first cable object it will skip the C1 callback and vice versa. This behaviour is also the same on the C++ side.

#### **setRange**

Set the input range using a min and max value (no steps / no skew factor).

```
GlobalCable.setRange(double min, double max)
```

This function can be used if you want to transmit more complex data than a single number - it accepts any kind of data object (JSON, array, Buffers, Strings) and sends the raw byte to all registered targets.

Note that this involves a deep copy creation for each listener so it might not be the fastest option (and is definitely not realtime safe), but if you want to communicate complex information across modules (and even into C++ nodes), this is the way to do it safely.

#### **setRangeWithSkew**

Set the input range using a min and max value and a mid point for skewing the range. Edit on GitHub

```
GlobalCable.setRangeWithSkew(double min, double max, double midPoint)
```

#### **setRangeWithStep**

Set the input range using a min and max value as well as a step size. Edit on GitHub

```
GlobalCable.setRangeWithStep(double min, double max, double stepSize)
```

#### **setValue**

Sends the value to all targets (after converting it from the input range.

```
GlobalCable.setValue(double inputWithinRange)
```

This will convert the value using the supplied range and send it through the cable.

Be aware that calling this method will not trigger any scripting callbacks attached to itself.

#### **setValueNormalised**

Sends the normalised value to all targets. Edit on GitHub

```
GlobalCable.setValueNormalised(double normalisedInput)
```

### GlobalRoutingManager

There are many concepts in HISE that allow you to control parameters and send values between different HISE modules:

1. the plain ol' parameter system using Attribute IDs (eg. SimpleEnvelope.Attack)
2. the macro control system that allows 8 controllers to control different modules with customizable ranges
3. grabbing references to scriptnode parameters and call `setValue()` using the scriptnode API
4. Using the `global` variable keyword (not the most recommended way to do things, but that's a comprehensive list right here...)

Depending on your project architecture and development preferences, one of the 4 ways usually get the job done. However there is another system that allows a rather enjoyable workflow with a unique feature set: The Global Routing system. It offers the following features:

- using named pipes that are unique for each HISE project and can send / receive values from / to scriptnode or other sources.
- tools for converting between ranges
- integrated IDE helpers (all global cables show up in the module tree with the possibility of navigating to each connection in the drop down menu).
- send audio signals between nodes (this is rather experimental and quickly leads to issues so use it carefully).
- OSC support

In order to use the global routing system, just use one of the global routing nodes (eg. `routing.global_cable`
) and / or call `Engine.getGlobalRoutingManager()`
to register scripted functions as callback when a value is sent through the cable.

The nodes can be either used as source by setting their `Value`
parameter, or can be used as target by connecting their modulation output to any other parameter in scriptnode.

The communication is supposed to work through normalised (double precision) float numbers (so 0...1), but the scripting API has builtin features to automatically scale, skew or step the incoming value (just like you can edit a parameter range in scriptnode).

As an additional feature, the Global Routing system can also be used to send and receive OSC messages using the `connectToOSC()`
method.

#### **addOSCCallback**

Register a scripting callback to be executed when a OSC message that matches the subAddress is received.

```
GlobalRoutingManager.addOSCCallback(String oscSubAddress, var callback)
```

In addition to OSC messages being piped into global cables, you can also register script callbacks that will react on incoming OSC messages. The first parameter should contain the subdomain of your OSC address and can contain OSC pattern wildcards to catch multiple OSC messages. The callback must be a callable object with 2 parameters, the first will contain the subdomain of the OSC address and the second one the value.

```
rm.connectToOSC({"Domain": "/myDomain"});

// React on /myDomain/fader1
rm.addOSCCallback("/fader1", function(id, value) {});

// Catch all - react on every OSC message that starts with /myDomain/
rm.addOSCCallback("/*", function(id, value) {});
```

Unlike global cables which are limited to single numbers, this system allows you to react on almost every OSC message type:

- floats
- integer values
- Strings
- multiple values (`value` will be an array of one of the types above).

However the parameter range that is defined in the `connectToOSC`
call is not applied to the incoming / outgoing values, so you will get the raw data.

#### **connectToOSC**

Allows the global routing manager to send and receive OSC messages through the cables.

```
GlobalRoutingManager.connectToOSC(var connectionData, var errorFunction)
```

The Global Routing Manager can also be set to send and receive OSC messages by calling this method. It expects two arguments, the first one is a JSON object containing the connection data. The second argument is a function with a single argument that will handle any OSC error messages.

The OSC support of this system is not fully standard compliant to OSC, but is limited to the scope of the Global Routing system:

- only single value OSC messages are allowed (anything else will throw a custom error)
- only bool, integer and float messages are allowed (the integer types are converted automatically)

However if you want to use more complex data types in OSC messages, you can send and receive them using scripting callbacks, which give you almost the full feature set of OSC (minus binary data blobs and colours).

##### **The connection data**

The JSON object that comes in as first argument describes the URLs and ports for receiving / sending OSC messages. There are sensible default values so you don't need to fill in all properties.

**Property** | **Description** | **Default** || `Domain` | The "root" URL for your application. Must start with a `/` and must not end with a `/` | `"/hise_osc_receiver"` |
| `SourceURL` | The IP address for the source URL. Can be left empty to use the local host. | "127.0.0.1" |
| `SourcePort` | The port number for listening to incoming OSC messages | 9000 |
| `TargetURL` | The IP address for the target URL. Can be left empty to use the local host. | "127.0.0.1" |
| `TargetPort` | The port number for outgoing OSC messages. If you omit this or set it to -1, it will deactivate OSC output. | -1 |
| `Parameters` | By default, HISE expects all incoming OSC messages to be within the 0...1 range. However if you can't control the output of your OSC source / target, you can provide a list of parameter ranges as a JSON object with the OSC subdomain as key and a JSON object with the scriptnode range properties as value. It will then transform incoming and outgoing values using the range (see the example below). | `{}` |

There is a new FloatingTile (the OSCLogger) which logs all incoming messages with filtering and cable based colour coding so make sure you use it during development / prototyping

##### **Example**

```
const var rm = Engine.getGlobalRoutingManager();

inline function printError(message)
{
	Console.print(error);
};

rm.connectToOSC({
	"Domain": "/myDomain",
	"SourcePort": 6666,
	"TargetPort": 6667,
	"Parameters":
	{
		"/fader1":
		{
			"MinValue": -1.0,
			"MaxValue": 1.0,
			"SkewFactor": 0.25
		}
	}
}, printError);

// Create a cable with a OSC subdomain
const var testCable = rm.getCable("/fader1");

// register an async callback that just prints the value
testCable.registerCallback(function(newValue)
{
	Console.print(newValue);
}, false);

// Now you can start sending OSC messages with the domain "/myDomain/fader1" to the port 6666 and
// it should show up in the HISE console...

// Let's add a knob and send its value through the cable
const var Knob1 = Content.addKnob("Knob1", 0, 0);

inline function onKnob1Control(component, value)
{
	// Changing the knob should now update your source OSC app
	// (if the port is set to 6667)
	testCable.setValue(value);
};

Knob1.setControlCallback(onKnob1Control);
```

#### **getCable**

Returns a scripted reference to the global cable (and creates a cable with this ID if it can't be found.

```
GlobalRoutingManager.getCable(String cableId)
```

This method will create a new Global Cable
or return a reference to an existing cable with the given ID.

#### **getEventData**

Returns the double value that is written to the data slot using setEventData. If the event ID wasn't written, it will return undefined. Edit on GitHub

```
GlobalRoutingManager.getEventData(int eventId, int dataSlot)
```

#### **removeOSCCallback**

Removes a OSC callback for the given address. Edit on GitHub

```
GlobalRoutingManager.removeOSCCallback(String oscSubAddress)
```

#### **sendOSCMessage**

Send an OSC message to the output port.

```
GlobalRoutingManager.sendOSCMessage(String oscSubAddress, var data)
```

This function lets you send out an OSC message if there is an `TargetPort`
specified in the `connectTOOSC()`
call. The first parameter must be the subdomain, which will be merged with the root domain to the full address and the second parameter must be a value that is convertible to a OSC message:

- float
- int
- String
- Array of the three types above

However the parameter range that is defined in the `connectToOSC`
call is not applied to the incoming / outgoing values, so you will get the raw data.

```
// Send a message to a fader
rm.sendOSCMessage("/fader1", 0.4);

// Send a message to a 2D XY Pad
rm.sendOSCMessage("xy1", [0.2, 0.3]);

// Send a message to an external display
rm.sendOSCMessage("/label", "Hello World");
```

#### **setEventData**

Writes a value into the given slot that can be retrieved using the event ID.

```
GlobalRoutingManager.setEventData(int eventId, int dataSlot, double value)
```

Using this method, you can attach more data to any event and fetch it later down the processing line. It doesn't directly attach the data to the event (as the size of the event is optimized down to the last bit without any overhead) but use a separate data model that allows the storage of up to 16 double precision numbers for each event.

Once you've written the data it can be retrieved by one of the following targets:

- the API call getEventData()
- the EventData Modulator
- the routing.event\_data\_reader node

Take a look at the series of examples in the snippet browser called `Custom Event Data...`
for an introduction use case of this concept.

### Graphics

The `Graphics`
API gives you access to the Panel Components
PaintRoutine. You can use it for the graphical drawing of a ScriptPanel.

Access it with the `g`
keyword inside the PaintRoutine function and start drawing.

```
const var Panel1 = Content.getComponent("Panel1");

Panel1.setPaintRoutine(function(g)
{
	g.setColour(Colours.white);
	g.drawRect([0,0,100,50], 2);
});
```

#### **addDropShadowFromAlpha**

Adds a drop shadow based on the alpha values of the current image.

```
Graphics.addDropShadowFromAlpha(var colour, int radius)
```

```
const var Panel1 = Content.getComponent("Panel1");

Panel1.loadImage("{PROJECT_FOLDER}image.png", "image");

Panel1.setPaintRoutine(function(g)
{
	g.drawImage("image", this.getLocalBounds(0), 0, 0);
	g.addDropShadowFromAlpha(Colours.black, 100); // borderShadow from 1 - 100
});
```

#### **addNoise**

Adds noise to the current layer.

```
Graphics.addNoise(var noiseAmount)
```

This adds pixelated noise to the current graphics layer. The parameter can either be a double number that will indicate the "gain" of the noise (= the transparency), or you can supply a JSON object that allows more fine grained control over the noise parameters.

**Property** | **Type** | **Description** || `alpha` | double | the transparency of the noise layer. |
| `monochromatic` | bool | whether the noise should be black & white only |
| `scaleFactor` | float | a scale factor that is applied to the noise. |
| `area` | `[x, y, w, h]` | the area that should be painted with the noise. |

HISE will cache internal images filled with the noise for performance reasons, however this means that using this method increases the memory usage (depending on the noise area size).

```
const var Panel1 = Content.getComponent("Panel1");

Panel1.setPaintRoutine(function(g)
{
	g.beginLayer(0);

	g.addNoise(0.07); // 0 -> 0.999

	g.endLayer();
});
```

#### **applyGamma**

Applies a gamma correction to the current layer.

```
Graphics.applyGamma(float gamma)
```

```
const var Panel1 = Content.getComponent("Panel1");

Panel1.setPaintRoutine(function(g)
{
	g.beginLayer(1);
	g.setGradientFill([Colours.black, 0, 0,
				   Colours.white, this.getWidth(), 0,
				   false]);
	g.fillRect(this.getLocalBounds(0));

	g.applyGamma(1.5); // baseline 1

	g.endLayer();
});
```

#### **applyGradientMap**

Applies a gradient map to the brightness level of the current layer.

```
Graphics.applyGradientMap(var darkColour, var brightColour)
```

```
const var Panel1 = Content.getComponent("Panel1");

Panel1.setPaintRoutine(function(g)
{
	g.beginLayer(1);

	g.setColour(Colours.grey);
	g.fillRect(this.getLocalBounds(0));
	g.applyGradientMap(Colours.withBrightness(Colours.blue, 0.5), Colours.withBrightness(Colours.red, 0.7));

	g.endLayer();

});
```

#### **applyHSL**

Applies a HSL grading on the current layer.

```
Graphics.applyHSL(float hue, float saturation, float lightness)
```

```
const var Panel1 = Content.getComponent("Panel1");
Panel1.loadImage("{PROJECT_FOLDER}image.png", "image");

Panel1.setPaintRoutine(function(g)
{
	g.beginLayer(1);
	g.drawImage("image", this.getLocalBounds(0),0,0);

	g.applyHSL(270, 100, 0); // Hue: 0 - 360, Saturation: 0 - 100: Lightness: 0 - 100

	g.endLayer();
});
```

See HSL on Wikipedia
for more about HSL.

#### **applyMask**

Applies a mask to the current layer.

```
Graphics.applyMask(var path, var area, bool invert)
```

```
const var Panel1 = Content.getComponent("Panel1");
Panel1.loadImage("{PROJECT_FOLDER}image.png", "image");

const var c = Content.createPath();

c.startNewSubPath(0.0, 0.0);
c.lineTo(1.0, 1.0);
c.lineTo(1.0, 0.0);

Panel1.setPaintRoutine(function(g)
{
	g.beginLayer(1);
	g.drawImage("image", this.getLocalBounds(0),0,0);

	g.applyMask(c, this.getLocalBounds(0), 0); // 1 to invert the mask.

	g.endLayer();

});
```

#### **applySepia**

Applies an oldschool sepia filter on the current layer.

```
Graphics.applySepia()
```

```
const var Panel1 = Content.getComponent("Panel1");
Panel1.loadImage("{PROJECT_FOLDER}image.png", "image");

Panel1.setPaintRoutine(function(g)
{
	g.beginLayer(0);

	g.drawImage("image", this.getLocalBounds(0),0,0);

	g.applySepia();

	g.endLayer();
});
```

#### **applyShader**

Applies an OpenGL shader to the panel. Returns false if the shader could not be compiled.

```
Graphics.applyShader(var shader, var area)
```

You can use this method in order to render the GLSL ScriptShader
object to the given area (relative to the ScriptPanel's boundaries).

```
const var Panel1 = Content.addPanel("Panel1", 0, 0);

const var sh = Content.createShader("GLSL/init.glsl");

PAnel1.setPaintRoutine(function(g)
{
	g.applyShader(sh, this.getLocalBounds(0));
});
```

#### **applySharpness**

Applies a sharpen / soften filter on the current layer.

```
Graphics.applySharpness(int delta)
```

```
const var Panel1 = Content.getComponent("Panel1");
Panel1.loadImage("{PROJECT_FOLDER}image.png", "image");

Panel1.setPaintRoutine(function(g)
{
	g.beginLayer(1);
	g.drawImage("image", this.getLocalBounds(0),0,0);

	g.applySharpness(1); // apply a sharpness filter

	g.endLayer();

});
```

#### **applyVignette**

Applies a vignette (dark corners on the current layer.

```
Graphics.applyVignette(float amount, float radius, float falloff)
```

```
const var Panel1 = Content.getComponent("Panel1");
Panel1.loadImage("{PROJECT_FOLDER}image.png", "image");

Panel1.setPaintRoutine(function(g)
{
	g.beginLayer(1);

	g.drawImage("image", this.getLocalBounds(0),0,0);

	g.applyVignette(10, 1, 0.5); //

	g.endLayer();

});
```

#### **beginBlendLayer**

Begins a new layer that will use the given blend effect.

```
Graphics.beginBlendLayer(String blendMode, float alpha)
```

```
const var Panel1 = Content.getComponent("Panel1");
Panel1.loadImage("{PROJECT_FOLDER}image.png", "image");

Panel1.setPaintRoutine(function(g)
{
	g.beginBlendLayer("Phoenix", 1);

	g.drawImage("image", this.getLocalBounds(0),0,0);

	g.endLayer();
});
```

#### **Modes**

- "Normal",
- "Lighten",
- "Darken",
- "Multiply",
- "Average",
- "Add",
- "Subtract",
- "Difference",
- "Negation",
- "Screen",
- "Exclusion",
- "Overlay",
- "SoftLight",
- "HardLight",
- "ColorDodge",
- "ColorBurn",
- "LinearDodge",
- "LinearBurn",
- "LinearLight",
- "VividLight",
- "PinLight",
- "HardMix",
- "Reflect",
- "Glow",
- "Phoenix"

#### **beginLayer**

Starts a new Layer.

```
Graphics.beginLayer(bool drawOnParent)
```

Create a new layer with beginLayer() and endLayer() and fill with the code in between.

```
const var Panel1 = Content.getComponent("Panel1");

Panel1.setPaintRoutine(function(g)
{
	g.beginLayer(true);

	g.endLayer();
});
```

#### **boxBlur**

Applies a box blur to the current layer.

```
Graphics.boxBlur(var blurAmount)
```

```
const var Panel1 = Content.getComponent("Panel1");

Panel1.loadImage("{PROJECT_FOLDER}image.png", "image");

Panel1.setPaintRoutine(function(g)
{
	g.beginLayer(1);
	g.drawImage("image", this.getLocalBounds(0),0,0);

	g.boxBlur(10); // apply box blur 0 - 100

	g.endLayer();
});
```

#### **desaturate**

Removes all colour from the current layer.

```
Graphics.desaturate()
```

Completely desaturates the image to grayscale.

```
const var Panel1 = Content.getComponent("Panel1");
Panel1.loadImage("{PROJECT_FOLDER}image.png", "image");

Panel1.setPaintRoutine(function(g)
{
	g.beginBlendLayer("Phoenix", 1);

	g.drawImage("image", this.getLocalBounds(0),0,0);

	g.desaturate();

	g.endLayer();
});
```

#### **drawAlignedText**

Draws a text with the given alignment (see the Label alignment property).

```
Graphics.drawAlignedText(String text, var area, String alignment)
```

```
Engine.loadFontAs("{PROJECT_FOLDER}fonts/Nunito-Regular.ttf", "nunito");

const var Panel1 = Content.getComponent("Panel1");

Panel1.setPaintRoutine(function(g)
{
	g.setFont("nunito", 32);
	g.setColour(Colours.white);
	g.drawAlignedText("Hello World", this.getLocalBounds(0), "top");

});
```

##### **Alignment positions**

- "left"
- "right"
- "top"
- "bottom"
- "centred"
- "centredTop"
- "centredBottom"
- "topLeft"
- "topRight"
- "bottomLeft"
- "bottomRight"

#### **drawAlignedTextShadow**

Renders a (blurred) shadow for the text.

```
Graphics.drawAlignedTextShadow(String text, var area, String alignment, var shadowData)
```

This method uses the awesome melatonin blur
library for a fast text shadow rendering. It has the similar parameters as the `drawAlignedText`
function, but expects a JSON object with the shadow parameters as additional last argument. The JSON object can have these properties that will define the appearance of the shadow:

**Property** | **Type** | **Description** || `Colour` | int or String or constant | the colour of the shadow. |
| `Offset` | `[x, y]` | A point array indicating the offset of the shadow. |
| `Radius` | int | the amount of blur in pixels. 0 means no blur at all. |
| `Spread` | int | the scaling of the shadow. Using positive values will make the shadow bigger. |
| `Inner` | bool | Whether to render a outer shadow (drop shadow) or an inner shadow (inner glow). |

Here's some funk for y'all:

```
const var Panel1 = Content.getComponent("Panel1");

Panel1.setPaintRoutine(function(g)
{
	g.setFontWithSpacing("Comic Sans MS", 40.0, 0.05);
	g.drawAlignedTextShadow("funky", this.getLocalBounds(0), "centred", { "Colour": Colours.red, "Offset": [0, 4], "Radius": 10});
	g.drawAlignedTextShadow("funky", this.getLocalBounds(0), "centred", { "Colour": Colours.green, "Offset": [2, 2], "Radius": 0});
	g.setColour(Colours.white);
	g.drawAlignedText("funky", this.getLocalBounds(0), "centred");
});
```

#### **drawDropShadow**

Draws a drop shadow around a rectangle.

```
Graphics.drawDropShadow(var area, var colour, int radius)
```

Paint routines can only draw within the area of the object they are applied to, so a drop shadow applied to an entire panel will not dispaly around the panel as expected.

In this example, the rectangle and drop shadow are being drawn to an area smaller than the panel they are painted on, using the reduceAmount paramtere of getLocalBounds().

```
const var Panel1 = Content.addPanel("Panel1",10,10);

Panel1.setPaintRoutine(function(g)
{
	g.drawDropShadow(this.getLocalBounds(12), Colours.black, 20);
	g.setColour(Colours.red);
	g.fillRect(this.getLocalBounds(12));
});
```

Additionally, `drawDropShadow()`
fills the area of the passed rectangle.

```
HiseSnippet 1125.3ocwW0saaaCElxIJnVacXAXO.b4loLj4Z457yPQwbhcxVvZRMh6JVuYszTTVDglTfhpNdCEXXOY8EYuC6MHiTxxlNwoc0YAwWDD9c9geejmC8wckBLIMUHANduXbBA374t8FyUwsiQTN33N.m0cSPbBKMFEJFoHoJvAiSPoojPfiyJ+nwMmpqBx+7O+vAHFhiIyf.fWJnXxynCopYnca8yTF6HTH4EzgVd2r0wXAusfIxzTZE25fDD9bz.xoHiaUbA+DJMF37stgAMCh1Ci1YuflMv3F6saiueWLAEEQ1IX6catWTyHDtdCfyZGFRUBYOERydfypGHBG2KVLhWrAujlR6yHlEAfd5ct.9HAKzHQCJncLkE1s7rJEnyR2YmbqTbx8UtmPCoSwmcB9k4Ffyhv9.zox7zak4nWfM8paQuEPIGKJsZAkV2sGVRSTyrX3ym4dLWQj5iGxbTovWPk+thaag1Ctp1Pz4jij5ESivem502Bp+ylOwy6QO5qgIblwasXIRO8kWpZNH3SgkIa.Q0VLLQv0K72v1oMrRVur9cMEbvuCdpPAwFcBKJAg8IXTVJAphQpuIEhXRBJbLDoAn7Ay18o4XtMeeFa59mlSfR+x2+HgD5eAjxsyvldUunVJQ0UyS0YhLklt9gRznoN7DupZpCOJiiUTMA7nbl1IXzD.ns29C1z6O7pxDXDSS6mZHdpgaOyfbfHiGl5GTOOoUGTyDZGoHoWdymOZKXQqQZsQTU79rjXjeIReltSYKX8Zau4VvxT7w2hTykhIC9k94uQ+AEParowqA0hz8pmYBjDdFAqP7ALhgLVQHjgD4YnPZVZdTuap7Eb80H44b+bk68NO3UMEEsPalaNofwHxEZ17vg7CEnOOaXehbK3aQrLxTG0MGy2w4dycb1OHfKJjrbTvOlSUOOgvuomI.Sp9z+2ubbGjBYZSmfo8KgHUTCEb5Pdq9Qxhl1ptcHomqDI49NodE37.Ut0GV1RaJm.Tci6W3Z2JAtv9s2w1KFQCUwSAd+e0JlPGDqrQnJxvxWeqtlPHtzXXFZCaXm0rnm2Gjdk0+0soWyVVzqSqDjTmIqTdEgMO8AzqR+Vu4Jz+R8mEP+R3xp7IXEY8SVQA1JheaTTqrqpn+L5VonKWNE03ltizz41dGA9s6CE83aRQ5i7OME8lKtlh32GJp4MU08d1stpC7p6CEsskhZ862l6nVj6j6nqOckdtNQXFColeXOyHwSLn+9n4lvxLEEOkpFaOx7+aS.9ekhq61kpvwKliUV.G0O0eWvwIyM+P2C0CsiUyH3ptG8q2MCICJFgavIHkjpK3bOMaXO8MMln2ctYFSMlSESAbw55l0lSfdDdX9BSAwDiAl0NSLFTZDLDgkhWiKlBwLY9CxQzbhm+qXp5dhYML.jOYh847P8OT30X77o5ZA1XYC7wKafMW1.2dYCbmkMvcW1.26iGn42wselRLrnsA.No6g4i043bHGoq.yqVA+KfJ1wUz
```

Another method is to use a transparent panel as a shadow catcher.

```
HiseSnippet 1080.3ocwW0raaaDDdoroQDaSQMPe.13KkBPUQxwNs.AAU1RVEBM1QvxMn2BVQthbgWtKwxkQVoH.E4PeX549.ji8knuC4MHcW9izpX4+HZg0AAMy7My9M6LC0vQBtGNIgK.V0OadLFX8k1imyjg8BQDFXXef011wHFllDh74yj3DI3v4wnjDrOvxZieRCyp9lfrOe7GODQQLO7RU.vq3DO7KHQD4Rsi59yDJc.xGeFIx.8dcG5wY83TdphRaX2FDi7NGEfOAogUyFXs0Q9DIWLVhTjQg4Pt+7wg7Yrb7uhjPlPwZgNfwp.kqFzKjP8GUltI.f0liVl7ajm7ei8wDexB8KuD95LCvkdXdGXU65nTm6.krLnzl4TZa6wdBRrboEMe9B6gLIVLEotpMoRNVPs+olcOtBAS1JBcNdfPIrvC2m1tcSn5qFOyw4wO9QvXFUiVkrXgi59OQthJ3ygkAK.K6wih4Lkf6Nlf1wHXiSmLR2y.+N3IbIzSmmv7tH3DrGJMACkgH42l.QTAF4OGhTJHrfkm9hXrxge.kt37SxHPItryeJW.cu.RXlQngS8KZkfkiT7TdJOUpnqqu.MaAfm4TWQc3fTlmjnHfCgQUffSKT.MQ6Fzv42bpS4dHph1OWS7DM2dgVyg7Tleham1YAsdPKsq8E73wYyOtnlv7t6jVyHxvCnwgH2RMSnpl8lv1s1uQSXYHt4iHQWTzQvsDm6NSBxUsSCMpfVSUiampcD6eJ1ShXATrlLFdvE9XwoHeRZRlWuaQ5yYpxH9kL2rL24cNvO2zzoq0ltxI3TJVrVy5Yew04nKKMZBVzD9FDMEu.nZ3X0ItstcSbd4MRF.4rgLh7kw3B4AbpudRR+6KOeBJ5DU+5WF1GIQ5Q1BcJbwXgjnoiUe7aTOyKe.ttcebx4RdbF1hdWf0CjYVeX43st0BPTG8WYaNVAtv7QoyMElQ7kgKT7g22MDSBBklZHRbT4CSquEmy+j1vRs6Zp1ZKC54bszqbVnsI81qqA852MFITQxHjeVhUPeaq+VAuj51VueEBp42mTeVCsKUW1oapCbmyjNlYBqhYxYVlYxec+jI6dU0jeeZUqIWb+jIO4pxjto29L4OVol7w6mLYuqp65Czp1c4e+jI6ajIceaEqI+I3+9Zxk2bRsyF2OkhjqtHmdi0BCp+qYksmzaHwRHx4lazdG1tq80tc2skhaaOhH8BWOGqsFNpdz8+GbrXm3GZezzopUFVRvMsG7qUcA3a33yWOK3XjTPTMZ1mjFMVUo8vpSmo2eT2vTS23lK2VKquAFiY9YB5FhBiczxVEF6TZDDg7D7W6kuggdq6GjoQwIV1KYT29XsLrCHaqCy64H0KA7ZOuUC0kbb2p53Sppi6UUG2upN9zp532WUG+ga1Q86ncPpjGkO1..GO5nr0zrrNhgTcfYcqf+EsW3jJ
```

#### **drawDropShadowFromPath**

Draws a drop shadow from a path using melatonin blur.

```
Graphics.drawDropShadowFromPath(var path, var area, var colour, int radius, var offset)
```

This will draw a blurred version of the path that you can use to create a drop shadow effect.

```
const var Panel = Content.addPanel("Panel", 0, 0);

const var p = Content.createPath();

// pass an array with numbers to load SVG images
p.loadFromData([110,109,0,245,207,67,128,217,36,67,108,0,236,189,67,128,89,69,67,108,0, 245,207,67,128,217,101,67,108,192,212,207,67,128,53,81,67,98,217,93,211, 67,51,180,80,67,123,228,219,67,2,123,91,67,128,144,224,67,0,149,101,67, 98,39,209,224,67,29,247,89,67,79,60,223,67,36,224,61,67,0,245,207,67,0, 12,54,67,108,0,245,207,67,128,217,36,67,99,109,128,33,193,67,0,168,88, 67,108,0,66,193,67,0,76,109,67,98,231,184,189,67,77,205,109,67,69,50, 181,67,126,6,99,67,64,134,176,67,128,236,88,67,98,154,69,176,67,99,138, 100,67,49,218,177,67,174,80,128,67,128,33,193,67,192,58,132,67,108,128, 33,193,67,0,212,140,67,108,192,42,211,67,0,40,121,67,108,128,33,193,67, 0,168,88,67,99,101,0,0]);

Panel.setPaintRoutine(function(g)
{ g.fillAll(Colours.grey); var area = [20, 20, 100, 100];
 g.drawDropShadowFromPath(p, area, 0x88000000, 5, [0, 5]); g.setColour(Colours.white); g.fillPath(p, area);
});
```

```
const var Panel1 = Content.getComponent("Panel1");

// that's a poor circle, but the blur will save us...
var circlePath = Content.createPath();
circlePath.startNewSubPath(0.5, 0);
circlePath.quadraticTo(1.0, 0.0, 1.0, 0.5);
circlePath.quadraticTo(1.0, 1.0, 0.5, 1.0);
circlePath.quadraticTo(0.0, 1.0, 0.0, 0.5);
circlePath.quadraticTo(0.0, 0.0, 0.5, 0.0);

Panel1.set("width", Panel1.get("height"));

Panel1.setPaintRoutine(function(g)
{
	g.drawDropShadowFromPath(circlePath, this.getLocalBounds(50), Colours.black, 50, [0, 0]);
});
```

#### **drawEllipse**

Draws a ellipse in the given area.

```
Graphics.drawEllipse(var area, float lineThickness)
```

```
const var Panel1 = Content.getComponent("Panel1");

Panel1.setPaintRoutine(function(g)
{
	g.setColour(Colours.white);
	g.drawEllipse([10,10,80,50], 1.5);
});
```

#### **drawFFTSpectrum**

Draws the spectrum of the FFT object to the panel.

```
Graphics.drawFFTSpectrum(var fftObject, var area)
```

under construction

```
const var Panel1 = Content.getComponent("Panel1");

const var fft = Engine.createFFT();

Panel1.setPaintRoutine(function(g)
{
	g.setColour(Colours.white);
	g.drawFFTSpectrum(fft, this.getLocalBounds(0));

});
```

#### **drawFittedText**

Tries to draw a text string inside a given space.

```
Graphics.drawFittedText(String text, var area, String alignment, int maxLines, float scale)
```

old multi-line text method

```
Engine.loadFontAs("{PROJECT_FOLDER}fonts/Nunito-Regular.ttf", "nunito");

const var Panel1 = Content.getComponent("Panel1");

Panel1.setPaintRoutine(function(g)
{
	g.setFont("nunito", 32);
	g.setColour(Colours.white);
	g.drawFittedText("Hello World", this.getLocalBounds(0), "topLeft", 2, 20);
});
```

#### **drawHorizontalLine**

Draws a (non interpolated) horizontal line.

```
Graphics.drawHorizontalLine(int y, float x1, float x2)
```

```
const var Panel1 = Content.getComponent("Panel1");

Panel1.setPaintRoutine(function(g)
{
	g.setColour(Colours.white);
	g.drawHorizontalLine(0, 0, this.getWidth()); // xStart, yStart, length
});
```

#### **drawImage**

Draws a image into the area.

```
Graphics.drawImage(String imageName, var area, int xOffset, int yOffset)
```

While `area`
is measured in usual HISE screen-space pixels, xOffset and yOffset are measured in pixels in the source image before any scaling is applied.

```
const var Panel1 = Content.getComponent("Panel1");

Panel1.loadImage("{PROJECT_FOLDER}image.png", "image"); // Load image.png from the "Images" folder

Panel1.setPaintRoutine(function(g)
{
	g.drawImage("image", this.getLocalBounds(0), 0, 0); // draw the image in the Panel boundaries.

});
```

#### **drawInnerShadowFromPath**

Draws an inner shadow for the given path using melatonin blur. Edit on GitHub

```
Graphics.drawInnerShadowFromPath(var path, var area, var colour, int radius, var offset)
```

#### **drawLine**

Draws a line.

```
Graphics.drawLine(float x1, float x2, float y1, float y2, float lineThickness)
```

```
const var Panel1 = Content.getComponent("Panel1");

Panel1.setPaintRoutine(function(g)
{
	g.setColour(Colours.white);
	g.drawLine(0, 100, 50, 100, 1.2); // x1,x2,y1,y2,linewidth
});
```

#### **drawMarkdownText**

Draws the text of the given markdown renderer to its specified area.

```
Graphics.drawMarkdownText(var markdownRenderer)
```

Draw a MarkdownRenderer
element on a panel.

```
const var Panel1 = Content.getComponent("Panel1");

const var markd = Content.createMarkdownRenderer();
markd.setTextBounds(Panel1.getLocalBounds(0));

markd.setText("
## Heading
Explain explain explain
");

Panel1.setPaintRoutine(function(g)
{
	g.drawMarkdownText(markd);
});
```

#### **drawMultiLineText**

Break to new lines when the text becomes wider than maxWidth.

```
Graphics.drawMultiLineText(String text, var xy, int maxWidth, String alignment, float leading)
```

```
const var Panel1 = Content.getComponent("Panel1");

const var text = "Lorem ipsum HISEorium explanadum in excelsis christophorum non delandam improprium contenatio cimex."

Panel1.setPaintRoutine(function(g)
{
	g.setColour(Colours.white);
	g.drawMultiLineText(text, [0,20], this.getWidth(), "left", 2.); // text, width, alignment, lineHeight
});
```

#### **drawPath**

Draws the given path.

```
Graphics.drawPath(var path, var area, var strokeStyle)
```

The stroke style can be either just a number (then it determines the stroke thickness), or a JSON object that allows a more fine grained control over the stroke behaviour:

```
const var c = Content.createPath();

c.startNewSubPath(0.0, 0.0);
c.lineTo(0.0, 1.0);
c.lineTo(1.0, 0.0);
c.lineTo(0.5, 1.0);

const var Panel1 = Content.getComponent("Panel1");

Panel1.setPaintRoutine(function(g)
{ g.fillAll(0x22FFFFFF); g.setColour(Colours.white);
 var p = {};               // Pick one of these: p.EndCapStyle = "butt";   // ["butt", "square", "rounded"] p.JointStyle = "rounded"; // ["mitered", "curved","beveled"] p.Thickness = 12.0;

	g.drawPath(c, this.getLocalBounds(p.Thickness), p);
});
```

For a detailed explanation of these properties, take a look at the JUCE API documentation here:

JUCE PathStrokeStyle API

#### **drawRect**

Draws a rectangle.

```
Graphics.drawRect(var area, float borderSize)
```

```
const var Panel1 = Content.getComponent("Panel1");

Panel1.setPaintRoutine(function(g)
{
	g.setColour(Colours.white);
	g.drawRect(this.getLocalBounds(0), 3);
});
```

#### **drawRepaintMarker**

fills the entire component with a random colour to indicate a UI repaint.

```
Graphics.drawRepaintMarker( String label)
```

Draws a differently colored background each time the panel is redrawn. This can be used to debug the paint routine.

```
const var Panel1 = Content.getComponent("Panel1");

Panel1.setPaintRoutine(function(g)
{
	g.drawRepaintMarker("");
});
```

#### **drawRoundedRectangle**

Draws a rounded rectangle. cornerData can be either a float number (for the corner size) or a JSON object for more customization options.

```
Graphics.drawRoundedRectangle(var area, var cornerData, float borderSize)
```

```
const var Panel1 = Content.getComponent("Panel1");

Panel1.setPaintRoutine(function(g)
{
	g.setColour(Colours.white);

	// area, float value (0-50) for all corners or object with {Cornersize:15, Rounded:[1,1,1,1]}, lineWidth
	g.drawRoundedRectangle([8,8,90,60], {CornerSize:15, Rounded:[0,1,1,0]}, 1.5);
});
```

#### **drawSVG**

Draws a SVG object within the given bounds and opacity.

```
Graphics.drawSVG(var svgObject, var bounds, float opacity)
```

Draw a SVG to the panel. You first have to create a SVG object with Content.createSVG("Base64String")
and then pass it to the drawSVG function. You can create the Base64 encoded SVG string with the SVG to Path Converter
that you can find under **Tools > Scripting Tools**.

```
const var Panel1 = Content.getComponent("Panel1");

const var svg = Content.createSVG("552.nT6K8CFjCTOD.Xa2dUB7vwL.SvXp6TpBfQoF8BK9fB04advjZYtXueJWWylbAdFn2PtHYAvT.HE.5rS67tttXTRauwfO3CIDiu+uEnPhmjIRhwHzJhQF3KBCMfvDQ7t31dIDgESh.gDAfDfAG.yX3jEmynrvT6sGDhQgIS.mtvWqbE19fR+gS37cSa4dYTpb.jfkyJYy3PyjkcyHqiHkbkmw0xosaVsFbxVQosIEihh9Mv2rJRRobNsgevG537uF5+jOIbpRFgN6kaiccsXO3.R4Cmv1V2Nn01x+OFiaUWLMJ8Bwqzz3Oc91UV8SE5cH4u3PqUGWVebIyRsw48BhlN9rBwrz797idlkWt7DT4p2TTfSTz4L1vT586Bx6wT5los6KELGYsD9l0vxX2Hq2aZ2rpGVVYb..FbwsEgrDMmMuWo0KZZndSzCMpw+ZcoVcYs9Hc4C0.zG4SZc4IxoRn2A3j0CaSoU8met3T+XD9nfkG5I.iKsD8g7mm4CjWcfU+g57voNdPnfPf.C.YHCuCPQ..D.VbASWpJIv.zgSfoDP4fAkPqLUiDXB.n..V7tA3Hb.iq3e.SSDCbUQzX3KnvI9YcxM6fibJgmc42KQ3z.uEElWxrMVBU.J1gKFfMkE9fPWLPtyXTAFX.gIKvPCvjUfnO.FubCO.OzFZEtB9CDBDLLstdfvZ0LokAGD6UR.RFeMvXSxYionq.qoALngCSAwAtBX.Fo.");

Panel1.setPaintRoutine(function(g)
{
	g.setColour(Colours.white);
	g.drawSVG(svg, this.getLocalBounds(0), 1);
});
```

#### **drawText**

Draws a centered and vertically stretched text.

```
Graphics.drawText(String text, var area)
```

This will draw a text string to the center of the panel. If you don't specify your own font it will use the HISE default font.

```
Engine.loadFontAs("{PROJECT_FOLDER}fonts/Nunito-Regular.ttf", "nunito");

const var Panel1 = Content.getComponent("Panel1");

Panel1.setPaintRoutine(function(g)
{
	g.setFont("nunito", 32);
	g.setColour(Colours.white);
	g.drawText("Hello World", this.getLocalBounds(0));
});
```

#### **drawTriangle**

Draws a triangle rotated by the angle in radians.

```
Graphics.drawTriangle(var area, float angle, float lineThickness)
```

```
const var Panel1 = Content.getComponent("Panel1");

Panel1.setPaintRoutine(function(g)
{
	g.setColour(Colours.white);
	g.drawTriangle(this.getLocalBounds(0), Math.toRadians(180), 2);
});
```

#### **drawVerticalLine**

Draws a (non interpolated) vertical line.

```
Graphics.drawVerticalLine(int x, float y1, float y2)
```

```
const var Panel1 = Content.getComponent("Panel1");

Panel1.setPaintRoutine(function(g)
{
	g.setColour(Colours.white);
	g.drawVerticalLine(this.getWidth()/2, 0, this.getHeight()); // xStart, yStart, length
});
```

#### **endLayer**

flushes the current layer.

```
Graphics.endLayer()
```

```
const var Panel1 = Content.getComponent("Panel1");

Panel1.setPaintRoutine(function(g)
{
	g.beginLayer(true);

	 // fill the layer.

	g.endLayer();
});
```

#### **fillAll**

Fills the whole area with the given colour.

```
Graphics.fillAll(var colour)
```

```
const var Panel1 = Content.getComponent("Panel1");

Panel1.setPaintRoutine(function(g)
{
	g.fillAll(Colours.grey);
});
```

#### **fillEllipse**

Fills a ellipse in the given area.

```
Graphics.fillEllipse(var area)
```

```
const var Panel1 = Content.getComponent("Panel1");

Panel1.setPaintRoutine(function(g)
{
	g.setColour(Colours.pink);
	g.fillEllipse([0,0,this.getWidth(), this.getHeight()]);
});
```

#### **fillPath**

Fills a Path.

```
Graphics.fillPath(var path, var area)
```

```
const var p = Content.createPath();

p.startNewSubPath(0.0, 0.0);
p.lineTo(0, 0);
p.lineTo(0.5, 1);
p.lineTo(1, 0);

const var Panel1 = Content.getComponent("Panel1");

Panel1.setPaintRoutine(function(g)
{
	g.setColour(Colours.withAlpha(Colours.white, 0.5));
	g.fillPath(p, this.getLocalBounds(0));
});
```

#### **fillRect**

Fills a rectangle with the given colour.

```
Graphics.fillRect(var area)
```

```
Panel1.setPaintRoutine(function(g)
{
	g.setColour(Colours.white);
	g.fillRect([0,0,this.getWidth(),this.getHeight()]);
});
```

#### **fillRoundedRectangle**

Fills a rounded rectangle. cornerData can be either a float number (for the corner size) or a JSON object for more customization options.

```
Graphics.fillRoundedRectangle(var area, var cornerData)
```

```
const var Panel1 = Content.getComponent("Panel1");

Panel1.setPaintRoutine(function(g)
{
	g.setColour(Colours.white);
	g.fillRoundedRectangle(this.getLocalBounds(10), 25); // area, rounded 0 - 100+
});
```

#### **fillTriangle**

Fills a triangle rotated by the angle in radians.

```
Graphics.fillTriangle(var area, float angle)
```

```
const var Panel1 = Content.getComponent("Panel1");

Panel1.setPaintRoutine(function(g)
{
	g.setColour(Colours.white);
	g.fillTriangle([0,0,this.getWidth(), this.getHeight()], Math.toRadians(90));
});
```

#### **flip**

Flips the canvas at the center.

```
Graphics.flip(bool horizontally, var totalArea)
```

Flips the Panel horizontally. Set the boolean to
0 to flip.

```
const var p = Content.createPath();

p.startNewSubPath(0.0, 0.0);
p.lineTo(0, 0);
p.lineTo(0.8, 1);
p.lineTo(1, 0);

const var Panel1 = Content.getComponent("Panel1");

Panel1.setPaintRoutine(function(g)
{
	g.setColour(Colours.withAlpha(Colours.white, 0.5));
	g.flip(0, this.getLocalBounds(0));
	g.fillPath(p, this.getLocalBounds(0));
});
```

#### **gaussianBlur**

Applies gaussian blur to the current layer.

```
Graphics.gaussianBlur(var blurAmount)
```

```
const var Panel1 = Content.getComponent("Panel1");

Panel1.setPaintRoutine(function(g)
{
	g.beginLayer(true);

	g.setColour(Colours.white);
	g.fillRoundedRectangle(this.getLocalBounds(10), 50);
	g.gaussianBlur(12);

	g.endLayer();
});
```

#### **getStringWidth**

Returns the width of the string using the current font.

```
Graphics.getStringWidth(String text)
```

```
const var Panel1 = Content.getComponent("Panel1");

Panel1.setPaintRoutine(function(g)
{
	Console.print(g.getStringWidth("Hello"));
});
```

#### **rotate**

Rotates the canvas around center `[x, y]`
by the given amount in radian.

```
Graphics.rotate(var angleInRadian, var center)
```

Use this with a path object.

```
const var Panel1 = Content.getComponent("Panel1");

const var p = Content.createPath();

p.startNewSubPath(0.0, 0.0);
p.lineTo(0, 0);
p.lineTo(0.8, 1);
p.lineTo(1, 0);

Panel1.setPaintRoutine(function(g)
{
	g.setColour(Colours.withAlpha(Colours.white, 0.5));
	g.rotate(Math.toRadians(180), [this.getWidth()/2,this.getHeight()/2]);
	g.fillPath(p, this.getLocalBounds(0));
});
```

#### **setColour**

Sets the current colour.

```
Graphics.setColour(var colour)
```

Set a color for an element to draw. For many elements you first have to set a color to visualise the draw or fill call.

After typing the "Colours." handle you can select a colour by name of a predefined list. Take a look at the Colours API
for more colours options.

```
const var Panel1 = Content.getComponent("Panel1");

Panel1.setPaintRoutine(function(g)
{
	g.setColour(Colours.white);
	g.fillEllipse([0,0,50,50]);

});
```

```
const var Panel1 = Content.getComponent("Panel1");

Panel1.setPaintRoutine(function(g)
{
	g.setColour(Colours.white);
	g.fillEllipse([0,0,50,50]);

	g.setColour(Colours.grey);
	g.fillEllipse([55,0,50,50]);

	g.setColour(Colours.black);
	g.fillEllipse([110,0,50,50]);

	g.setColour(Colours.red);
	g.fillEllipse([0,55,50,50]);

	g.setColour(Colours.green);
	g.fillEllipse([55,55,50,50]);

	g.setColour(Colours.dodgerblue);
	g.fillEllipse([110,55,50,50]);
});
```

#### **setFont**

Sets the current font.

```
Graphics.setFont(String fontName, float fontSize)
```

Set a font, a color and draw some text.

Load a font from the Image folder with Engine.setFontAs. Then you can set the font by its given fontID.

```
Engine.loadFontAs("{PROJECT_FOLDER}Nunito-Regular.ttf", "nunito");

const var Panel1 = Content.getComponent("Panel1");

Panel1.setPaintRoutine(function(g)
{
	g.setFont("nunito", 48);
	g.setColour(Colours.white);
	g.drawAlignedText("hello", this.getLocalBounds(0), "top");
});
```

#### **setFontWithSpacing**

Sets the current font with the specified spacing between the characters.

```
Graphics.setFontWithSpacing(String fontName, float fontSize, float spacing)
```

```
Engine.loadFontAs("{PROJECT_FOLDER}fonts/Nunito-Regular.ttf", "nunito");

const var Panel1 = Content.getComponent("Panel1");

Panel1.setPaintRoutine(function(g)
{
	g.setFontWithSpacing("nunito", 36, 0.08); // from 0 to 1 over the whole width of the panel.
	g.setColour(Colours.white);
	g.drawAlignedText("hello", this.getLocalBounds(0), "top");
});
```

#### **setGradientFill**

Sets the current gradient via an array [Colour1, x1, y1, Colour2, x2, y2]

```
Graphics.setGradientFill(var gradientData)
```

This method allows you to set the current brush to a gradient. The parameter you pass in must be an array that has at least 6 elements:

1. The first colour
2. The x-position of the first colour
3. The y-position of the first colour
4. The second colour
5. The x-position of the second colour
6. The y-position of the second colour
7. whether the gradient is radial: `true` or `false` (optional)
8. An additional colour (optional)
9. The normalised position for the additional colour (eg. `0.5` if it should be in the middle) (optional)
10. The next additional colour (optional)
11. The normalised position for the second additional colour (optional)
12....

##### **Examples**

```
// A blurry white ball in the middle
g.setGradientFill([Colours.white, 100.0, 100.0,
				   Colours.black, 50.0, 50.0,
				   true]);

// A top down gradient with a black bar in the middle and white at the edges
g.setGradientFill([Colours.white, 0.0, 0.0,
				   Colours.white, 0.0, 100.0,
				   false,
				   Colours.black, 0.5]);
```

```
Panel1.setPaintRoutine(function(g)
{
	g.setGradientFill([Colours.white, 0, 0,
				   Colours.black, this.getWidth()/1.5, 0,
				   false]);

	g.fillRect(this.getLocalBounds(0));
});
```

#### **setOpacity**

Sets a global transparency level.

```
Graphics.setOpacity(float alphaValue)
```

```
const var Panel1 = Content.getComponent("Panel1");

Panel1.loadImage("{PROJECT_FOLDER}image.png", "image");

Panel1.setPaintRoutine(function(g)
{
	g.setOpacity(0.3);
	g.drawImage("image", this.getLocalBounds(0), 0, 0);
});
```

### LorisManager

Get a reference to a `LorisManager`
object with `Engine.getLorisManager()`

#### **analyse**

Analyse a file. Edit on GitHub

```
LorisManager.analyse(var file, double estimatedRootFrequency)
```

#### **createEnvelopePaths**

Creates a list of path of every channel from the envelope of the given parameter and harmonic index. Edit on GitHub

```
LorisManager.createEnvelopePaths(var file, String parameter, int harmonicIndex)
```

#### **createEnvelopes**

Creates an audio rate envelope from the given parameter and harmonic index. Edit on GitHub

```
LorisManager.createEnvelopes(var file, String parameter, int harmonicIndex)
```

#### **createSnapshot**

Creates a parameter value list for each harmonic at the given time. Edit on GitHub

```
LorisManager.createSnapshot(var file, String parameter, double time)
```

#### **get**

Returns the setting value for the Loris algorithm. Edit on GitHub

```
LorisManager.get(String optionId)
```

#### **process**

Processes the partial list using predefined commands. Edit on GitHub

```
LorisManager.process(var file, String command, var data)
```

#### **processCustom**

Processes the partial list using the given function. Edit on GitHub

```
LorisManager.processCustom(var file, var processCallback)
```

#### **set**

set a option for the Loris algorithm. Edit on GitHub

```
LorisManager.set(String optionId, var newValue)
```

#### **synthesise**

Resynthesise the file from the partial lists. Returns an array of variant buffers. Edit on GitHub

```
LorisManager.synthesise(var file)
```

### MacroHandler

Create a `MacroHandler`
with:

```
const var MacroHandler = Engine.createMacroHandler()
```

#### **getMacroDataObject**

Returns an object that contains the macro connection data. Edit on GitHub

```
MacroHandler.getMacroDataObject()
```

#### **setExclusiveMode**

Enables the "exclusive" mode for MIDI automation (only one active parameter for each controller). Edit on GitHub

```
MacroHandler.setExclusiveMode(bool shouldBeExclusive)
```

#### **setMacroDataFromObject**

Rebuilds the macro connections from the JSON object. Edit on GitHub

```
MacroHandler.setMacroDataFromObject(var jsonData)
```

#### **setUpdateCallback**

Set a callback to be notified when a macro connection changes. Edit on GitHub

```
MacroHandler.setUpdateCallback(var callback)
```

### MarkdownRenderer

The MarkdownPanel
is a FloatingTile that can be used to display the documentation for your plugin using the markdown syntax. However for some use cases, this is overkill and requires to setup a file directory (unless you give it a custom string to parse).

If you need more customizability, you can now create an object of this type using Content.createMarkdownRenderer()
and use it to render dynamic markdown text directly on a Panel (or any other paint callback with a `Graphics`
object like LAF functions).

In order to use it, create an object, give it a string to display, set the width of the render area (so that it can calculate the line breaks and layout) and then call Graphics.drawMarkdownText()
in order to render it on your panel.

#### **getStyleData**

Returns the current style data.

```
MarkdownRenderer.getStyleData()
```

Returns an object containing the style information for the markdown text.

#### **setImageProvider**

Creates an image provider from the given JSON data that resolves image links.

```
MarkdownRenderer.setImageProvider(var data)
```

This function lets you define an image provider which is used to resolve image links in the markdown text

By default, the image rendering is non-functional when using a MarkdownRenderer, but you can supply it with image files and even Path
objects to render a path. The parameter you pass in must be a JSON object with a list of metadata objects that will be used to determine how to resolve image links.

**Property** | **Type** | **Description** || `URL` | String | the URL that points to the image. Should be a relative and valid markdown link URL |
| `Type` | `"Path"` or `"Image"` | A string describing the type of the image - whether its a (pooled) image or a monochromatic icon rendered from a path. |
| `Data` | String or Path | Depending on the type, this must either be a image reference (using the `{PROJECT_FOLDER}` ) wildcard or a reference to a path object. Note: You can also just pass in the Base64 string describing the path so you don't need to create a path object just for this function. |
| `Colour` | 32bit (ARGB) | the colour of the path (only useful when rendering a path obviously). |

Note that you can use the non-standard syntax of defining the size of the path inside the link:

- if you want it to have an absolute size, use `![](link-to-image:80px)`.
- if you want it to have a relative size, use `![](link-to-image:50%)`

###### **Example:**

```
const var md = Content.createMarkdownRenderer();

const var p = Content.createPath();

// Create a triangle
p.startNewSubPath(0.0, 0.0);
p.lineTo(1.0, 1.0);
p.lineTo(0.0, 1.0);
p.closeSubPath();

const var imageData =
[
{
	"URL": "my-path",
	"Type": "Path",
	"Data": p,
	"Colour": Colours.blue
}];

md.setImageProvider(imageData);

md.setText("### Example\n> Please render a path like an icon\n![](/my-path:30%)this is text after the icon");

md.setTextBounds([10, 10, 200, 9000]);

const var Panel1 = Content.getComponent("Panel1");

Panel1.setPaintRoutine(function(g)
{
	g.fillAll(0xFF111111);
	g.drawMarkdownText(md);
});
```

#### **setStyleData**

Sets the style data for the markdown renderer.

```
MarkdownRenderer.setStyleData(var styleData)
```

Allows you to style the markdown output. In order to use it, get a JSON object with the default values using getStyleData(), then change the properties and call this method.

It's very likely that these properties will change over time (which is why I don't provide a soon-to-be-deprecated list of available properties). The best "documentation" for the available properties is using `Console.print(trace(md.getStyleData()))`.

#### **setText**

Set the markdown text to be displayed.

```
MarkdownRenderer.setText( String markdownText)
```

Sets the text and parses the markdown elements. You need to call this before rendering the text obviously.

If you want a newline, you need to use the raw `\n`
character

#### **setTextBounds**

Parses the text for the specified area and returns the used height (might be more or less than the height of the area passed in).

```
MarkdownRenderer.setTextBounds(var area)
```

Call this after you've set the text in order to create the layout of the text. This will also set the absolute position in the graphics context later. The argument must be a valid Rectangle (= array of 4 float numbers), however since the height is being calculated automatically, there's absolutely no reason to NOT use `9000`
as height.

### Math

The `Math`
class is a collection of math functions that can be used in the scripting engine. It is a feature-complete clone of the "official" Javascript Math object.

Unless specified otherwise, the value type of the function is `double`. Most of the functions are pretty self-explanatory if you managed to get through high school, but there are a few special function that deserve a more detailed explanation.

If you're going to start out with SNEX or use the expression nodes in scriptnode, you might be happy to know that this class is also available there.

In the editor the `Math`
keyword will also give you access to a few Math constants (PI, E).

#### **abs**

Returns the absolute (unsigned) value.

```
Math.abs(var value)
```

Useful for inverting negative values.

#### **acos**

Calculates the acosine value (radian based).

```
Math.acos(var value)
```

Wikipedia: Inverse Trigonmetric functions

#### **acosh**

Calculates the acosh value (radian based).

```
Math.acosh(var value)
```

The hyperbolic version
of acos.

#### **asin**

Calculates the asine value (radian based).

```
Math.asin(var value)
```

#### **asinh**

Calculates the asinh value (radian based).

```
Math.asinh(var value)
```

#### **atan**

Calculates the atan value (radian based).

```
Math.atan(var value)
```

#### **atanh**

Calculates the atanh value (radian based).

```
Math.atanh(var value)
```

#### **ceil**

Rounds up the value.

```
Math.ceil(var value)
```

Pushes the value up to the next full number.

#### **cos**

Calculates the cosine value (radian based).

```
Math.cos(var value)
```

Basic Trigonometric Function. Returns 1 at 0 and -1 at PI.

#### **cosh**

Calculates the cosh value (radian based).

```
Math.cosh(var value)
```

#### **exp**

Calculates the exp value.

```
Math.exp(var value)
```

Wikipedia: Exponential function

#### **floor**

Rounds down the value.

```
Math.floor(var value)
```

Opposite of Math.ceil()

#### **fmod**

Returns the remainder when dividing value with limit.

```
Math.fmod(var value, var limit)
```

This is usually useful for two use cases:

1. Get the fractional part: `Math.fmod(19.52, 1.0) == 0.52)`
2. Loop around a range limit: `Math.fmod(13.2, 12.0) == 1.2`

Note that if you're using it for the latter use case, the function Math.wrap()
might be a better candidate as it correctly wraps around negative values too.

#### **from0To1**

Converts a normalised value (between 0 and 1) to a range defined by the JSON data in rangeObj.

```
Math.from0To1(var value, var rangeObj)
```

Converting between value ranges is a pretty common task when writing scripts. This function will scale a normalized input value from (0...1) to a given output range which allows you to switch between different domains without excessive math formula usage. The inverse process can be achieved with Math.to0to1.

The second parameter will define a range and you can either use a JSON object or a fix object created by a FixObjectFactory. The latter will significantly improve the performance of this function because it doesn't have to look up the dynamic properties but uses a internal LUT to create the C++ range object.

A range object has up to 5 properties:

- a minimum value
- a maximum value
- a factor that skews the curve (think gamma curve)
- an interval for making discrete steps
- a inversion

Note that the interval and the skew factor property are mutually exclusive: you either want to skew the output or you want discrete steps.

Unfortunately there are multiple types of range definitions used across HISE so there is not a single property set, but it tries to cope with them all and automatically detects which range property set to use:

**Domain** | **Property Names** | **Additional information** || **scriptnode** | `MinValue`, `MaxValue`, `SkewFactor`, `StepSize`, `Inverted` | the range object from scriptnode parameters |
| **UI components** | `min`, `max`, `middlePosition`, `stepSize`, `Inverted` | the range object from a UI component's JSON. Note that it uses the middle position to calculate the skew factor (this introduces a small overhead so make sure to use another mode if performance is critical) |
| MIDI Automation | `Start`, `End`, `Skew`, `Interval`, `Inverted` | the range object from a MIDI automation connection MIDI automation connection |

You can use Math.skew() in order to convert a mid position value to a skew factor.

Take a look at the example how to use it with a fix object factory:

```
// define a prototype using the scriptnode syntax
reg prototype = {
	"MinValue": 20.0,
	"MaxValue": 20000.0,
	"SkewFactor": 0.6
};

// pass that into the factory to create a fix object
const var f1 = Engine.createFixObjectFactory(prototype);

// create a fix object (think JSON but faster)
const var range = f1.create();

// 9.5% slower than just calling Math.pow() (which is the baseline for this function)
const var x = Math.from0To1(0.5, range);

// 34% slower than just calling Math.pow
const var y = Math.from0To1(0.5, prototype);

// There's a small rounding error because of single precision vs. double precision
// but that shouldn't have a real world impact
Console.assertTrue(Math.abs(x - y) < 0.001);
```

#### **isinf**

Checks for infinity. Edit on GitHub

```
Math.isinf(var value)
```

#### **isnan**

Checks for NaN (invalid floating point value). Edit on GitHub

```
Math.isnan(var value)
```

#### **log**

Calculates the log value (with base E).

```
Math.log(var value)
```

inverse
of Math.exp().

#### **log10**

Calculates the log value (with base 10).

```
Math.log10(var value)
```

#### **max**

Returns the bigger number.

```
Math.max(var first, var second)
```

`Math.max(x,0);`

#### **min**

Returns the smaller number.

```
Math.min(var first, var second)
```

`Math.min(x,0);`

#### **pow**

Calculates the power of base and exponent.

```
Math.pow(var base, var exp)
```

`Math.pow(x,3);`

Be aware that this is a rather costly operation, so if you just want to square the value, the plain ol' `x*x`
will get you there faster.

#### **randInt**

Returns a random integer between the low and the high values. Edit on GitHub

```
Math.randInt(var low, var high)
```

#### **random**

Returns a random number between 0.0 and 1.0. Edit on GitHub

```
Math.random()
```

#### **range**

Limits the value to the given range.

```
Math.range(var value, var lowerLimit, var upperLimit)
```

`Math.range(x, -1, 1)`

#### **round**

Rounds the value to the next integer.

```
Math.round(var value)
```

Rounds the value up or down at.5

#### **sanitize**

Sets infinity & NaN floating point numbers to zero. Edit on GitHub

```
Math.sanitize(var value)
```

#### **sign**

Returns the sign of the value.

```
Math.sign(var value)
```

Sign function

#### **sin**

Calculates the sine value (radian based).

```
Math.sin(var value)
```

Oh, holy. As in Sinewave Generator.

#### **sinh**

Calculates the sinh value (radian based).

```
Math.sinh(var value)
```

#### **skew**

Returns the skew factor for the given mid point.

```
Math.skew(var start, var end, var midPoint)
```

The raw usage of this function allows you to simulate the range behaviour from the Math.from0to1()
method:

```
const var skewFactor = Math.skew(0.0, 20000.0, 1000.0);
const var midPoint = Math.pow(0.5, 1.0 / skewFactor) * 20000.0; // => 1000
```

However the most interesting use case for this would be if you want to convert a range object from a mid point to a skew factor based range definition for increased performance:

```
// This is a range how it would come from a UI component
// it defines the curve with a middle position
const var p1 = {
	min: 20.0,
	max: 20000.0,
	middlePosition: 1000.0
}

// Using a skew-based range avoids an additional log calculation
// in the conversion functions
const var p2 = {
	MinValue: p1.min,
	MaxValue: p1.max,
	SkewFactor: Math.skew(p1.min, p1.max, p1.middlePosition)
};

// We're caring about performance here so we use fix objects:
const var f1 = Engine.createFixObjectFactory(p1);
const var f2 = Engine.createFixObjectFactory(p2);
const var o1 = f1.create();
const var o2 = f2.create();

{.profile(" - mid point with JSON");

	for(i = 0; i < 100000; i++)
		Math.from0To1(0.5, p1);
}

{.profile(" - skew factor with JSON");

	for(i = 0; i < 100000; i++)
		Math.from0To1(0.5, p2);
}

{.profile(" - mid point with fix object");

	for(i = 0; i < 100000; i++)
		Math.from0To1(0.5, o1);
}

{.profile(" - skew factor with fix object");

	for(i = 0; i < 100000; i++)
		Math.from0To1(0.5, o2);
}

/* Results:
- mid point with JSON: 83.185 ms
- skew factor with JSON: 29.896 ms
- mid point with fix object: 27.032 ms
- skew factor with fix object: 24.955 ms
*/
```

As you can see, the performance can be drastically improved from 83ms to 25ms by using both the `skew()`
function and a fix object.

#### **smoothstep**

Calculates a smooth transition between the lower and the upper value.

```
Math.smoothstep(var input, var lower, var upper)
```

`Math.smoothstep(x,0,2);`

This function is very popular in graphics programming because it allows a seemless transition between two values, but there are certainly a few interesting use cases for DSP scripting / MIDI processing too. A good explanation of this function can be found here.

#### **sqr**

Calculates the square (x*x) of the value.*

```
Math.sqr(var value)
```

#### **sqrt**

Calculates the square root of the value.

```
Math.sqrt(var value)
```

Wikipedia: Square Root

#### **tan**

Calculates the tan value (radian based).

```
Math.tan(var value)
```

#### **tanh**

Calculates the tanh value (radian based).

```
Math.tanh(var value)
```

#### **to0To1**

Converts a value inside a range defined by the JSON data in range obj to a normalised value.

```
Math.to0To1(var value, var rangeObj)
```

This function will take a range defined by a JSON object and convert values back and to the normalized range of `0...1`.

Take a look at the Math.from0To1()
function for a detailed description on how to use this method.

#### **toDegrees**

Converts radian (0...2PI) to degree (0...3600).

```
Math.toDegrees(var value)
```

Wikipedia: Degrees
)

```
Console.print(Math.toDegrees(Math.PI*2)); // 360.0
```

#### **toRadians**

Converts degree (0...3600) to radian (0...2*PI).*

```
Math.toRadians(var value)
```

Wikipedia: Radian

```
Console.print(Math.toRadians(360)); // 6.2831.. // PI*2
```

#### **wrap**

Wraps the value around the limit (always positive).

```
Math.wrap(var value, var limit)
```

Unlike its sibling fmod(), this function will not behave weird with negative values, so if you rely on it to loop around correctly with negative numbers, use this instead.

```
// fmod will not wrap around zero
Console.print(Math.fmod(-1.0, 19.0)); // -> -1.0

// wrap will... wrap around zero
Console.print(Math.wrap(-1.0, 19.0)); // -> 18.0
```

### Message

If you use one of the MIDI callbacks (`onNoteOn`, `onNoteOff`
or `onController`
), this object contains methods to get / change the message that triggered the callback.

```
Message.getNoteNumber() // returns the note number in note callbacks
Message.setChannel(newChannel) // changes the channel of the midi message
```

#### **delayEvent**

Delays the event by the sampleAmount.

```
Message.delayEvent(int samplesToDelay)
```

Be aware that if you call this method with a note on message, it will not delay the note-off message automatically too. You either have to ensure that your script performs this task in the respective note-off too or use the new API call Synth.setFixNoteOnAfterNoteOff()
which performs a few safe checks to prevent stuck notes in this scenario.

#### **getChannel**

Returns the MIDI Channel from 1 to 16. Edit on GitHub

```
Message.getChannel()
```

#### **getCoarseDetune**

Returns the coarse detune amount in semitones. Edit on GitHub

```
Message.getCoarseDetune()
```

#### **getControllerNumber**

returns the controller number or 'undefined', if the message is neither controller nor pitch wheel nor aftertouch. Edit on GitHub

```
Message.getControllerNumber()
```

#### **getControllerValue**

Returns the value of the controller. Edit on GitHub

```
Message.getControllerValue()
```

#### **getEventId**

Returns the event id of the current message. Edit on GitHub

```
Message.getEventId()
```

#### **getFineDetune**

Returns the fine detune amount int cents. Edit on GitHub

```
Message.getFineDetune()
```

#### **getGain**

Returns the volume of the note. Edit on GitHub

```
Message.getGain()
```

#### **getMonophonicAftertouchPressure**

Returns the aftertouch value of the monophonic aftertouch message. Edit on GitHub

```
Message.getMonophonicAftertouchPressure()
```

#### **getNoteNumber**

Return the note number. This can be called only on midi event callbacks. Edit on GitHub

```
Message.getNoteNumber()
```

#### **getPolyAfterTouchNoteNumber**

Returns the polyphonic aftertouch note number. Edit on GitHub

```
Message.getPolyAfterTouchNoteNumber()
```

#### **getPolyAfterTouchPressureValue**

Checks if the message is a POLYPHONIC aftertouch message (Use isChannelPressure() for monophonic aftertouch). Edit on GitHub

```
Message.getPolyAfterTouchPressureValue()
```

#### **getProgramChangeNumber**

Returns the program change number or -1 if it isn't a program change message. Edit on GitHub

```
Message.getProgramChangeNumber()
```

#### **getTimestamp**

Returns the timestamp of the message. Edit on GitHub

```
Message.getTimestamp()
```

#### **getTransposeAmount**

Gets the tranpose value. Edit on GitHub

```
Message.getTransposeAmount()
```

#### **getVelocity**

Returns the Velocity. Edit on GitHub

```
Message.getVelocity()
```

#### **ignoreEvent**

Ignores the event. Edit on GitHub

```
Message.ignoreEvent(bool shouldBeIgnored=true)
```

#### **isArtificial**

Checks if the event was created by a script earlier. Edit on GitHub

```
Message.isArtificial()
```

#### **isMonophonicAfterTouch**

Checks if the message is a MONOPHONIC aftertouch message. Edit on GitHub

```
Message.isMonophonicAfterTouch()
```

#### **isPolyAftertouch**

Checks if the message is a POLYPHONIC aftertouch message (Use isChannelPressure() for monophonic aftertouch). Edit on GitHub

```
Message.isPolyAftertouch()
```

#### **isProgramChange**

Checks if the message is a program change message. Edit on GitHub

```
Message.isProgramChange()
```

#### **makeArtificial**

Creates a artificial copy of this event and returns the new event ID. If the event is already artificial it will return the event ID. Edit on GitHub

```
Message.makeArtificial()
```

#### **makeArtificialOrLocal**

Creates a artificial copy of this event and returns the new event ID. If the event is artificial it will make a new one with a new ID. Edit on GitHub

```
Message.makeArtificialOrLocal()
```

#### **sendToMidiOut**

This will forward the message to the MIDI out of the plugin. Edit on GitHub

```
Message.sendToMidiOut()
```

#### **setAllNotesOffCallback**

Sets a callback that will be performed when an all notes off message is received. Edit on GitHub

```
Message.setAllNotesOffCallback(var onAllNotesOffCallback)
```

#### **setChannel**

Changes the MIDI channel from 1 to 16. Edit on GitHub

```
Message.setChannel(int newChannel)
```

#### **setCoarseDetune**

Sets the coarse detune amount in semitones. Edit on GitHub

```
Message.setCoarseDetune(int semiToneDetune)
```

#### **setControllerNumber**

Changes the ControllerNumber. Edit on GitHub

```
Message.setControllerNumber(int newControllerNumber)
```

#### **setControllerValue**

Changes the controller value (range 0 - 127). Edit on GitHub

```
Message.setControllerValue(int newControllerValue)
```

#### **setFineDetune**

Sets the fine detune amount in cents. Edit on GitHub

```
Message.setFineDetune(int cents)
```

#### **setGain**

Sets the volume of the note (-100 = silence). Edit on GitHub

```
Message.setGain(int gainInDecibels)
```

#### **setMonophonicAfterTouchPressure**

Sets the pressure value of the monophonic aftertouch message Edit on GitHub

```
Message.setMonophonicAfterTouchPressure(int pressure)
```

#### **setNoteNumber**

Changes the note number. Edit on GitHub

```
Message.setNoteNumber(int newNoteNumber)
```

#### **setPolyAfterTouchNoteNumberAndPressureValue**

Copied from MidiMessage. Edit on GitHub

```
Message.setPolyAfterTouchNoteNumberAndPressureValue(int noteNumber, int aftertouchAmount)
```

#### **setStartOffset**

Sets the start offset for the given message. Edit on GitHub

```
Message.setStartOffset(int newStartOffset)
```

#### **setTransposeAmount**

Transposes the note on. Edit on GitHub

```
Message.setTransposeAmount(int tranposeValue)
```

#### **setVelocity**

Changes the velocity (range 1 - 127). Edit on GitHub

```
Message.setVelocity(int newVelocity)
```

#### **store**

Stores a copy of the current event into the given holder object. Edit on GitHub

```
Message.store(var messageEventHolder)
```

### MessageHolder

This object mirrors the functionality of the Message
class, but operates on an arbitrary event (while the `Message`
class will only work inside a MIDI callback and operates on the current event that caused the callback).

This can be useful for one of these occasions:

- MIDI file processing (MidiPlayer.getEventList() will return an array of objects of this type.
- Storing MIDI messages for later processing using Message.store()
- Send previously stored messages using Synth.addMessageFromHolder()
- Debugging (dump() prints out a nice string that contains useful information)

You can create an object using the API call Engine.createMessageHolder()

#### **addToTimestamp**

Adds the given sample amount to the current timestamp. Edit on GitHub

```
MessageHolder.addToTimestamp(int deltaSamples)
```

#### **clone**

Returns a copy of this message holder object. Edit on GitHub

```
MessageHolder.clone()
```

#### **dump**

Creates a info string for debugging. Edit on GitHub

```
MessageHolder.dump()
```

#### **getChannel**

Returns the MIDI Channel from 1 to 16. Edit on GitHub

```
MessageHolder.getChannel()
```

#### **getCoarseDetune**

Returns the coarse detune amount in semitones. Edit on GitHub

```
MessageHolder.getCoarseDetune()
```

#### **getControllerNumber**

returns the controller number or 'undefined', if the message is neither controller nor pitch wheel nor aftertouch. Edit on GitHub

```
MessageHolder.getControllerNumber()
```

#### **getControllerValue**

Returns the value of the controller. Edit on GitHub

```
MessageHolder.getControllerValue()
```

#### **getEventId**

Returns the event id of the current message. Edit on GitHub

```
MessageHolder.getEventId()
```

#### **getFineDetune**

Returns the fine detune amount int cents. Edit on GitHub

```
MessageHolder.getFineDetune()
```

#### **getGain**

Returns the volume of the note. Edit on GitHub

```
MessageHolder.getGain()
```

#### **getMonophonicAftertouchPressure**

Returns the aftertouch value of the monophonic aftertouch message. Edit on GitHub

```
MessageHolder.getMonophonicAftertouchPressure()
```

#### **getNoteNumber**

Return the note number. This can be called only on midi event callbacks. Edit on GitHub

```
MessageHolder.getNoteNumber()
```

#### **getPolyAfterTouchNoteNumber**

Returns the polyphonic aftertouch note number. Edit on GitHub

```
MessageHolder.getPolyAfterTouchNoteNumber()
```

#### **getPolyAfterTouchPressureValue**

Checks if the message is a POLYPHONIC aftertouch message (Use isChannelPressure() for monophonic aftertouch). Edit on GitHub

```
MessageHolder.getPolyAfterTouchPressureValue()
```

#### **getTimestamp**

Returns the current timestamp. Edit on GitHub

```
MessageHolder.getTimestamp()
```

#### **getTransposeAmount**

Gets the tranpose value. Edit on GitHub

```
MessageHolder.getTransposeAmount()
```

#### **getVelocity**

Returns the Velocity. Edit on GitHub

```
MessageHolder.getVelocity()
```

#### **ignoreEvent**

Ignores the event. Edit on GitHub

```
MessageHolder.ignoreEvent(bool shouldBeIgnored=true)
```

#### **isController**

Returns true if the event is a CC controller event. Edit on GitHub

```
MessageHolder.isController()
```

#### **isMonophonicAfterTouch**

Checks if the message is a MONOPHONIC aftertouch message. Edit on GitHub

```
MessageHolder.isMonophonicAfterTouch()
```

#### **isNoteOff**

Returns true if the event is a note-off event. Edit on GitHub

```
MessageHolder.isNoteOff()
```

#### **isNoteOn**

Returns true if the event is a note-on event. Edit on GitHub

```
MessageHolder.isNoteOn()
```

#### **isPolyAftertouch**

Checks if the message is a POLYPHONIC aftertouch message (Use isChannelPressure() for monophonic aftertouch). Edit on GitHub

```
MessageHolder.isPolyAftertouch()
```

#### **setChannel**

Changes the MIDI channel from 1 to 16. Edit on GitHub

```
MessageHolder.setChannel(int newChannel)
```

#### **setCoarseDetune**

Sets the coarse detune amount in semitones. Edit on GitHub

```
MessageHolder.setCoarseDetune(int semiToneDetune)
```

#### **setControllerNumber**

Changes the ControllerNumber. Edit on GitHub

```
MessageHolder.setControllerNumber(int newControllerNumber)
```

#### **setControllerValue**

Changes the controller value (range 0 - 127). Edit on GitHub

```
MessageHolder.setControllerValue(int newControllerValue)
```

#### **setFineDetune**

Sets the fine detune amount in cents. Edit on GitHub

```
MessageHolder.setFineDetune(int cents)
```

#### **setGain**

Sets the volume of the note (-100 = silence). Edit on GitHub

```
MessageHolder.setGain(int gainInDecibels)
```

#### **setMonophonicAfterTouchPressure**

Sets the pressure value of the monophonic aftertouch message Edit on GitHub

```
MessageHolder.setMonophonicAfterTouchPressure(int pressure)
```

#### **setNoteNumber**

Changes the note number. Edit on GitHub

```
MessageHolder.setNoteNumber(int newNoteNumber)
```

#### **setPolyAfterTouchNoteNumberAndPressureValue**

Copied from MidiMessage. Edit on GitHub

```
MessageHolder.setPolyAfterTouchNoteNumberAndPressureValue(int noteNumber, int aftertouchAmount)
```

#### **setStartOffset**

Sets the start offset. Edit on GitHub

```
MessageHolder.setStartOffset(int offset)
```

#### **setTimestamp**

Sets the timestamp in samples. Edit on GitHub

```
MessageHolder.setTimestamp(int timestampSamples)
```

#### **setTransposeAmount**

Transposes the note on. Edit on GitHub

```
MessageHolder.setTransposeAmount(int tranposeValue)
```

#### **setType**

Sets the type of the event. Edit on GitHub

```
MessageHolder.setType(int type)
```

#### **setVelocity**

Changes the velocity (range 1 - 127). Edit on GitHub

```
MessageHolder.setVelocity(int newVelocity)
```

### MidiAutomationHandler

This class is a interface for modifying the MIDI control assignments in HISE through scripting.

You can:

- edit / change the list of assignments
- attach a callback (or broadcaster) that listen to changes of MIDI control assignments
- customize the behaviour / appearance of any MIDI assignment related interactions.

A common practice in plugins is the ability to right click on a control and assign it to a MIDI CC controller so that it can be controlled by hardware controllers (or MIDI clips from the host).

This can be achieved in HISE by setting the `enableMidiLearn`
property of any suitable component (slider / button / combobox) to true (or set the `allowMidiAutomation`
property in the JSON object that you pass into UserPresetHandler.setCustomAutomation()
if you're using the custom automation model).

The assignments can be modified using the MidiLearnPanel
floating tile which allows you to remove connections, modify the range of how the parameter is mapped and invert the parameter.

However if you need more flexibility you can use this class and implement your own MIDI assignment interface.

Note that MIDI assignments are stored in the user preset system by default, so you don't need to use this class for data management.

#### **getAutomationDataObject**

Returns an object that contains the MIDI automation data.

```
MidiAutomationHandler.getAutomationDataObject()
```

This method returns an array with JSON objects for every MIDI control assignment that is present. The JSON object will have these properties:

**Property** | **Type** | **Description** || `Controller` | int | the CC number (zero based) of the MIDI assignment. |
| `Channel` | int | the MIDI channel of the MIDI assignment (see below). This is one-based(!) and a omni connection that applies to all MIDI channels should have the value `-1`. |
| `Processor` | String | the ID of the module that connects to the MIDI control. This is most likely your Interface. |
| `Attribute` | String | the ID (not the index!) of the attribute that the MIDI assignment is supposed to control. |
| `MacroIndex` | int | if the control is mapped to a macro control, this will contain the index. |
| `Start` | double | the current start of the mapped range as it was set in the MidiLearnPanel. By default this is equal to the `FullStart` property. |
| `End` | double | the current end of the mapped range as it was set in the MidiLearnPanel. By default this is equal to the `FullEnd` property. |
| 'Inverted' | bool | whether the MIDI assignment should invert the value range (basically what the Invert button does on the MidiLearnPanel). Note that this does not affect the `Start` and `End` properties and it's still expected that `Start < End`. |
| `FullStart` | double | the lower limit of the range that can be set (in the MidiLearnPanel this would be the min value of the range sliders). |
| `FullEnd` | double | the upper limit of the range that can be set (in the MidiLearnPanel this would be the min value of the range sliders). |
| `Skew` | double | the logarithmic skew of the range that can be used for changing the gamma curve of the MIDI assignment. |
| `Interval` | double | the step size of the MIDI assignments. For discrete controls this can be `1.0`. |
| `Converter` | String | a spurious Base64 string that will contain the encoded text to value converter so that it displays the values correctly. |

##### **Note about the Channel property**

Starting with HISE 4.5.0 there is the ability of filtering MIDI CC messages by MIDI channel, so that you can eg. assign the modwheel of the MIDI channel 2 to another control than the modwheel of the MIDI channel 1.

By default this is deactivated (so in our example any modwheel message from any channel would control an assigned UI element). If you don't see the `Channel`
property in the JSON object, you have to enable the support for different MIDI channels by adding `HISE_USE_MIDI_CHANNELS_FOR_AUTOMATION=1`
to your Extra Definitions field
(you don't have to recompile HISE for it to be applied though).

##### **Data Example**

Here's one JSON object in its full glory:

```
[{ "Controller": 1, "Channel": 0, "Processor": "Interface", "MacroIndex": -1, "Start": 0.0, "End": 1.0, "FullStart": 0.0, "FullEnd": 1.0, "Skew": 1.0, "Interval": 0.01, "Converter": "37.nT6K8CBGgC..VEFa0U1Pu4lckIGckIG.ADPXiQWZ1UF.ADf...", "Attribute": "Knob1", "Inverted": false
}]
```

#### **setAutomationDataFromObject**

Sets the MIDI automation from the automation data object.

```
MidiAutomationHandler.setAutomationDataFromObject(var automationData)
```

This can be used to modify the list of MIDI assignments programmatically. It expects an array of JSON objects with the exact format as described in the method above and will replace all MIDI assignments with this data and send an update message to the MidiLearnPanel
and any attached callback.

```
function modifySecondController()
{
	// grab the existing list
	var list = mh.getAutomationDataObject();

	// set the second range start to 50%
	list[1].Start = 0.5;

	// send the list back to the automation handler.
	mh.setAutomationDataObject(list);
}
```

#### **setConsumeAutomatedControllers**

Sets whether a automated MIDI CC message should be consumed by the automation handler (default is enabled).

```
MidiAutomationHandler.setConsumeAutomatedControllers(bool shouldBeConsumed)
```

This setting specifies whether a MIDI control that is assigned to a UI control should be excempted from further processing. The default value for this is `true`
(so HISE will not forward a MIDI control message to its internal processing chain if it was assigned to a UI control), but for some projects you might want to enable this to be able to process all MIDI messages, regardless of the MIDI assignments.

#### **setControllerNumberNames**

Replaces the names in the popup.

```
MidiAutomationHandler.setControllerNumberNames(var ccName, var nameArray)
```

This can be used to modify the appearance of the context menu. By default it displays the controller types as `"CC #2"`, but if you don't like that, you can customize the strings used for the popup menu as well as the text "Add XXX" / "Remove XXX" for the ultimate UX customization!

`ccName`
must be a string and `ccNames`
an array with strings. Note that the length of `ccNames`
must be either 127 or the exact length of the array you passed into MidiAutomationHandler.setControllerNumbersInPopup()

```
mh.setControllerNumbersInPopup([1, 2, 7]);
mh.setControllerNumberNames("Funky Controller!!!", ["Modwheel", "Breath Controller", "Volume"]);
```

The context menu will then look like this:

#### **setControllerNumbersInPopup**

Sets the numbers that are displayed in the MIDI automation popup.

```
MidiAutomationHandler.setControllerNumbersInPopup(var numberArray)
```

This can be used to modify the appearance of the context menu. By default it displays all 127 CC numbers in a submenu, but if you don't like that, you can limit the list of available entries by supplying a list of CC numbers that you want to show.

#### **setExclusiveMode**

Enables the "exclusive" mode for MIDI automation (only one active parameter for each controller).

```
MidiAutomationHandler.setExclusiveMode(bool shouldBeExclusive)
```

By default you can assign a single MIDI controller to multiple UI controls so if you want to eg. control the volume of multiple channels with your modwheel this can be achieved by assigning it to those controls.

However this might be an unwanted behaviour for your project so if you want to ensure that there is only a single connection for each MIDI control present, call this function with `true`
and it will change the behaviour of the context menu:

1. It will grey out MIDI assignments that are already connected to another MIDI controller.
2. When you enable MIDI learn and then assign a controller to a knob, it will remove any existing connection to other controls for this particular MIDI controller. Note that if you are using `HISE_USE_MIDI_CHANNELS_FOR_AUTOMATION=1` to support different assignments for MIDI channels, it will retain connections from different MIDI channels, but remove "Omni" connections as well as connections with the same channel.

Note that this logic will not be used to check the data you pass into MidiAutomationHandler.setAutomationDataFromObject()
so you must take care of avoiding duplicates in there yourself.

#### **setUpdateCallback**

Set a function (with one parameter containing the automation data as JSON) that will be executed whenever the MIDI automation changes.

```
MidiAutomationHandler.setUpdateCallback(var callback)
```

This can be used to attach a function (or Broadcaster
) to be notified whenever the MIDI assignments change). The events that cause this call back are:

- adding / removing connections through the context menu selection
- when MIDI learn is active and a suitable MIDI message was received
- removing connections with the MidiLearnPanel.
- calling MidiAutomationHandler.setAutomationDataFromObject()
- loading user presets (this includes the initial preset)

Note that changing the properties of a connection (eg. the range) in the MIDI learn panel does not send an update message.

Whenever one of these events is happening, it will **asynchronously**
call this function. It expects a callable object with a single parameter which contains the JS array with JSON objects exactly as returned by MidiAutomationHandler.getAutomationDataObject().

```
const var mh = Engine.createMidiAutomationHandler();

mh.setUpdateCallback(function(obj)
{
	Console.print(trace(obj));
});
```

Never call MidiAutomationHandler.setAutomationDataFromObject()
inside this function or it will cause an endless loop of callbacks! Note that trying to outsmart this rule by using a simple recursion protection would not work as the update message is asynchronous.

```
const var mh = Engine.createMidiAutomationHandler();

// This freezes your computer.
mh.setUpdateCallback(function(obj)
{
	obj[0].Start = 0.5;
	mh.setAutomationDataFromObject(obj);
});

var recursion = false;

// Good idea and extra points for using scoped statements,
// but this freezes your computer too because the update message
// will be called asynchronously...
mh.setUpdateCallback(function(obj)
{
	if(!recursion)
	{.set(recursion, true);

		obj[0].Start = 0.5;
		mh.setAutomationDataFromObject(obj);
	}
});
```

### MidiList

A `MidiList`
is an array with 128 numbers that is particularly useful for MIDI processing.

It offers a slight performance advantage as well as some handy methods which makes it the preferred data type when you need to store a list of numbers:

```
/** MidiList Benchmark
 Performs a set of operations to show the performance benefit of using a MidiList over a standard array.
 On my system it's 733ms vs. 4ms. Be aware that this is a highly artificial benchmark, real world use cases will not show this kind of performance gain!
*/

// Set this to true to use the MidiList, then run the code again and watch
// the benchmark result.
const var MEASURE_FAST = false;

// Create a (fast) MidiList and a (slow) Javascript array.
const var fast = Engine.createMidiList();
const var slow = [];

// preallocate so that the array has at least a tiny chance (JK, doesn't).
slow.reserve(128);

// Initialise the array and the MidiList with the same values.
for(i = 0; i < 128; i++)
{ var v = Math.random() * 12; fast.setValue(i, v); slow[i] = v;
}

// Normal Array
if(!MEASURE_FAST) Console.start();
for(i = 0; i < 10000; i++)
{ // find a item slow.indexOf(8);
 // search number of occurences var slowCounter = 0; for(j = 0; j < 128; j++) { if(slow[j] == 5) slowCounter++; }
 // fill with constant for(j = 0; j < 128; j++) slow[j] = 12;
}
if(!MEASURE_FAST) Console.stop();

// MidiList
if(MEASURE_FAST) Console.start();
for(i = 0; i < 10000; i++)
{ // find an item fast.getIndex(8);
 // fill with constant fast.fill(12);
 // search number of occurences var fastCounter = fast.getValueAmount(5);
}
if(MEASURE_FAST) Console.stop();
```

#### **clear**

Clears the MidiList to -1. Edit on GitHub

```
MidiList.clear()
```

#### **fill**

Fills the MidiList with a number specified with valueToFill. Edit on GitHub

```
MidiList.fill(int valueToFill)
```

#### **getBase64String**

Encodes all values into a base64 encoded string for storage. Edit on GitHub

```
MidiList.getBase64String()
```

#### **getIndex**

Returns the first index that contains this value. Edit on GitHub

```
MidiList.getIndex(int value)
```

#### **getNumSetValues**

Returns the number of values that are not -1. Edit on GitHub

```
MidiList.getNumSetValues()
```

#### **getValue**

Returns the value at the given number. Edit on GitHub

```
MidiList.getValue(int index)
```

#### **getValueAmount**

Returns the number of occurences of 'valueToCheck' Edit on GitHub

```
MidiList.getValueAmount(int valueToCheck)
```

#### **isEmpty**

Checks if the list contains any data. Edit on GitHub

```
MidiList.isEmpty()
```

#### **restoreFromBase64String**

Restore the values from a String that was created with getBase64String(). Edit on GitHub

```
MidiList.restoreFromBase64String(String base64encodedValues)
```

#### **setRange**

Sets a range of items to the same value. Edit on GitHub

```
MidiList.setRange(int startIndex, int numToFill, int value)
```

#### **setValue**

Sets the number to something between -127 and 128. Edit on GitHub

```
MidiList.setValue(int index, int value)
```

### MidiPlayer

A `MidiPlayer`
reference can be used to control the playback of a MIDI Player module as well as processing the currently loaded MIDI sequency. It also acts as event controller for building customised UI elements to display MIDI content.

`javascript const var MIDIPlayer1 = Synth.getMidiPlayer("MIDI Player1");`

#### **asMidiProcessor**

Returns a typed MIDI processor reference (for setting attributes etc). Edit on GitHub

```
MidiPlayer.asMidiProcessor()
```

#### **clearAllSequences**

Removes all sequences and tracks. Edit on GitHub

```
MidiPlayer.clearAllSequences()
```

#### **connectToMetronome**

Connects this MIDI player to the given metronome. Edit on GitHub

```
MidiPlayer.connectToMetronome(var metronome)
```

#### **connectToPanel**

Connect this to the panel and it will be automatically updated when something changes.

```
MidiPlayer.connectToPanel(var panel)
```

This function is particularly helpful when you want to build a custom UI for the MIDI Player's content.

Once this is called and a ScriptPanel is connected to this reference, It will automatically cause a repaint of the ScriptPanel
on these events:

- new MIDI content being loaded
- track / sequence being changed
- MIDI sequence being cleared
- flushing of a MIDI processing
- if setRepaintOnPositionChange() was enabled, whenever the playback position changes.

You can then use the functions getNoteRectangleList
and getPlaybackPosition()
to fetch the data and write the UI logic you want.

#### **convertEventListToNoteRectangles**

Converts a given array of Message holders to a rectangle list. Edit on GitHub

```
MidiPlayer.convertEventListToNoteRectangles(var eventList, var targetBounds)
```

#### **create**

Creates an empty sequence with the given length.

```
MidiPlayer.create(int nominator, int denominator, int barLength)
```

The nominator and denominator will define the time signature, so for a `3/4`
time signature and 7 bars, use `MidiPlayer.create(3, 4, 7)`

Be aware that this adds a new sequence to the player add the end of the list, so you probably want to check `isEmpty()`
if you just want to write a bunch of notes

#### **flushMessageList**

Writes the given array of MessageHolder objects into the current sequence. This is undoable. Edit on GitHub

```
MidiPlayer.flushMessageList(var messageList)
```

#### **flushMessageListToSequence**

Writes the given array of MessageHolder objects into the sequence with the given (one-based!) index. This is undoable. Edit on GitHub

```
MidiPlayer.flushMessageListToSequence(var messageList, int sequenceIndexOneBased)
```

#### **getEventList**

Creates an array containing all MIDI messages wrapped into MessageHolders for processing.

```
MidiPlayer.getEventList()
```

This is the first step of three when you want to process the content of a MIDI Player.
It creates an array of MessageHolder
objects which can be used to transform the MIDI data.

The event ID of the events will be created consecutively and the events are sorted chronologically. You can find the matching note-off event to a note-on event using something like this:

```
inline function getNoteOff(list, noteOn)
{ for(e in list) { if(e.isNoteOff() && e.getEventId() == noteOn.getEventId()) return e; }
}
```

The timestamp will be using the current samplerate and host BPM tempo to convert the relative MIDI timing to absolute sample positions. Be careful to never change the order of a note-on / note-off pair, otherwise the results will be very weird.

There are a few new helper functions in the `Engine`
class to help you converting between the domains (search for `QuarterBeats`
)

Also make sure to call flushMessageList()
after finishing the processing to apply the changes.

#### **getEventListFromSequence**

Creates an array containing all MIDI messages from the sequence with the given (one-based!) index into Message Holders. Edit on GitHub

```
MidiPlayer.getEventListFromSequence(int sequenceIndexOneBased)
```

#### **getLastPlayedNotePosition**

Returns the position of the last played note. Edit on GitHub

```
MidiPlayer.getLastPlayedNotePosition()
```

#### **getMidiFileList**

Returns a list of all MIDI files that are embedded in the plugin. Edit on GitHub

```
MidiPlayer.getMidiFileList()
```

#### **getNoteRectangleList**

Returns an array containing all notes converted to the space supplied with the target bounds [x, y, w, h].

```
MidiPlayer.getNoteRectangleList(var targetBounds)
```

This converts the MIDI data in the current sequence to a list of rectangles for each note scaled to fill the rectangle supplied as argument.

A rectangle in **HISEScript**
is always an array of 4 integers:
`[x, y, width, height]`.

The most simple application of this is to draw a piano-roll content into a Panel.

```
// Fetch a Panel
const var Panel = Content.getComponent("Panel1");

// Fetch a MIDI Player
const var Player = Synth.getMidiPlayer("MIDI Player1");

// Connect the player to the panel to make it update automatically
Player.connectToPanel(Panel);

Panel.setPaintRoutine(function(g)
{ // create a list of note rectangles. // the argument is the boundaries of this panel so it will scale // them to the dimensions of the entire panel. var entireArea = [0, 0, this.getWidth(), this.getHeight()]; var list = Player.getNoteRectangleList(entireArea);
 g.setColour(Colours.white);
 // Now we can simply iterate over them and paint them for(note in list) { // `note` is a array with 4 numbers and can be passed // into all Graphic API functions pretty conveniently. g.fillRect(note); }
});
```

#### **getNumSequences**

Returns the number of loaded sequences. Edit on GitHub

```
MidiPlayer.getNumSequences()
```

#### **getNumTracks**

Returns the number of tracks in the current sequence. Edit on GitHub

```
MidiPlayer.getNumTracks()
```

#### **getPlaybackPosition**

Returns the playback position in the current loop between 0.0 and 1.0. Edit on GitHub

```
MidiPlayer.getPlaybackPosition()
```

#### **getPlayState**

Returns the play state (0 = stop, 1 = play, 2 = recording. Edit on GitHub

```
MidiPlayer.getPlayState()
```

#### **getTicksPerQuarter**

Returns the tick resolution for a quarter note. Edit on GitHub

```
MidiPlayer.getTicksPerQuarter()
```

#### **getTimeSignature**

Returns an object with properties about the length of the current sequence. Edit on GitHub

```
MidiPlayer.getTimeSignature()
```

#### **getTimeSignatureFromSequence**

Returns an object with properties about the length of the sequence with the given index. Edit on GitHub

```
MidiPlayer.getTimeSignatureFromSequence(int index)
```

#### **isEmpty**

Checks if the MIDI player contains a sequence to read / write.

```
MidiPlayer.isEmpty()
```

This doesn't check whether the current sequence contains any notes, but checks whether there is any sequence loaded at all: If you load up the MIDI Player, it will not have a sequence loaded until you either load a MIDI file, or call Midiplayer.create.

If you want to check whether the sequence is empty, you can use this:

```
// Do not call this in the audio thread obviously...
inline function sequenceHasNoEvents(player)
{ return player.getEventList().length == 0;
}
```

#### **isSequenceEmpty**

Returns true if the sequence with the given (one-based!) index doesn't contain any midi data. Edit on GitHub

```
MidiPlayer.isSequenceEmpty(int indexOneBased)
```

#### **play**

Starts playing. Use the timestamp to delay the event or use the currents event timestamp for sample accurate playback. Edit on GitHub

```
MidiPlayer.play(int timestamp)
```

#### **record**

Starts recording (not yet implemented). Use the timestamp to delay the event or use the currents event timestamp for sample accurate playback. Edit on GitHub

```
MidiPlayer.record(int timestamp)
```

#### **redo**

Redo the last edit.

```
MidiPlayer.redo()
```

Just like undo(), this will not use the global undo manager, but a dedicated undo manager for each MIDI player (otherwise the actions interfere with changing UI values, which would be very annoying).

#### **reset**

Resets the current sequence to the last loaded file. Edit on GitHub

```
MidiPlayer.reset()
```

#### **saveAsMidiFile**

Saves the current sequence into the given file at the track position.

```
MidiPlayer.saveAsMidiFile(var file, int trackIndex)
```

This overwrites the track (starting with one) in the given file.

This is not undoable and the original content will be swept into digital nirvana (except if you have a backup of the original file, obviously), so **NEVER**
use this method unless you know exactly what to do.

#### **setAutomationHandlerConsumesControllerEvents**

This will send any CC messages from the MIDI file to the global MIDI handler. Edit on GitHub

```
MidiPlayer.setAutomationHandlerConsumesControllerEvents(bool shouldBeEnabled)
```

#### **setFile**

Loads a MIDI file and switches to this sequence if specified. Edit on GitHub

```
MidiPlayer.setFile(var fileName, bool clearExistingSequences, bool selectNewSequence)
```

#### **setGlobalPlaybackRatio**

Sets a global playback ratio (for all MIDI players). Edit on GitHub

```
MidiPlayer.setGlobalPlaybackRatio(double globalRatio)
```

#### **setPlaybackCallback**

Attaches a callback with two arguments (timestamp, playState) that gets executed when the play state changes. Edit on GitHub

```
MidiPlayer.setPlaybackCallback(var playbackCallback, var synchronous)
```

#### **setPlaybackPosition**

Sets the playback position in the current loop. Input must be between 0.0 and 1.0.

```
MidiPlayer.setPlaybackPosition(var newPosition)
```

Similar to AudioSampleProcessor.setFile(), this will load a file into the MIDI player.

It uses the standard HISE syntax for file references. The other arguments let you choose

- whether you want to clear the existing sequences or add this to the end of the list of "loaded" sequences. You can switch between multiple sequences on the fly (even during playback), so if you want to use this feature, you need to add multiple sequences by setting this flag to `true`.
- whether you want to set the newly loaded sequence to be played back or keep the current sequence in the playback slot.

#### **setRecordEventCallback**

Sets a inline function that will process every note that is about to be recorded. Edit on GitHub

```
MidiPlayer.setRecordEventCallback(var recordEventCallback)
```

#### **setRepaintOnPositionChange**

If true, the panel will get a repaint() call whenever the playback position changes.

```
MidiPlayer.setRepaintOnPositionChange(var shouldRepaintPanel)
```

By default this is off, but if you need your connected Panel
to repaint during playback (eg. to display a ruler that indicates the position), set this to true and it repaint() will be called periodically during playback.

#### **setSequence**

Enables the (previously loaded) sequence with the given (one-based!) index. Edit on GitHub

```
MidiPlayer.setSequence(int sequenceIndex)
```

#### **setSequenceCallback**

Attaches a callback that gets executed whenever the sequence was changed. Edit on GitHub

```
MidiPlayer.setSequenceCallback(var updateFunction)
```

#### **setSyncToMasterClock**

Syncs the playback of this MIDI player to the master clock (external or internal). Edit on GitHub

```
MidiPlayer.setSyncToMasterClock(bool shouldSyncToMasterClock)
```

#### **setTimeSignature**

Sets the timing information of the current sequence using the given object. Edit on GitHub

```
MidiPlayer.setTimeSignature(var timeSignatureObject)
```

#### **setTimeSignatureToSequence**

Sets the timing information of the sequence with the given index using the given object. Edit on GitHub

```
MidiPlayer.setTimeSignatureToSequence(int index, var timeSignatureObject)
```

#### **setTrack**

Sets the track index (starting with one).

```
MidiPlayer.setTrack(int trackIndex)
```

This makes the MIDI Player choose the selected track (again, starting with `1`, not with zero). Be aware that changing tracks is not as "dynamic" as switching between different sequences.

#### **setUseGlobalUndoManager**

If enabled, it uses the global undo manager for all edits (So you can use Engine.undo()). Edit on GitHub

```
MidiPlayer.setUseGlobalUndoManager(bool shouldUseGlobalUndoManager)
```

#### **setUseTimestampInTicks**

Uses Ticks instead of samples when editing the MIDI data. Edit on GitHub

```
MidiPlayer.setUseTimestampInTicks(bool shouldUseTicksAsTimestamps)
```

#### **stop**

Starts playing. Use the timestamp to delay the event or use the currents event timestamp for sample accurate playback. Edit on GitHub

```
MidiPlayer.stop(int timestamp)
```

#### **undo**

Undo the last edit. Edit on GitHub

```
MidiPlayer.undo()
```

### MidiProcessor

Get a reference to a Midi Processor
with Synth.getMidiProcessor()
to call its functions.

```
const var Arpeggiator1 = Synth.getMidiProcessor("Arpeggiator1");
```

#### **asMidiPlayer**

Returns a reference of type ScriptedMidiPlayer that can be used to control the playback. Edit on GitHub

```
MidiProcessor.asMidiPlayer()
```

#### **exists**

Checks if the Object exists and prints a error message on the console if not. Edit on GitHub

```
MidiProcessor.exists()
```

#### **exportScriptControls**

Export the control values (without the script). Edit on GitHub

```
MidiProcessor.exportScriptControls()
```

#### **exportState**

Exports the state as base64 string. Edit on GitHub

```
MidiProcessor.exportState()
```

#### **getAttribute**

Returns the attribute with the given index. Edit on GitHub

```
MidiProcessor.getAttribute(int index)
```

#### **getAttributeId**

Returns the ID of the attribute with the given index. Edit on GitHub

```
MidiProcessor.getAttributeId(int index)
```

#### **getAttributeIndex**

Returns the index of the attribute with the given ID. Edit on GitHub

```
MidiProcessor.getAttributeIndex(String id)
```

#### **getId**

Returns the ID of the MIDI Processor. Edit on GitHub

```
MidiProcessor.getId()
```

#### **getNumAttributes**

Returns the number of attributes. Edit on GitHub

```
MidiProcessor.getNumAttributes()
```

#### **isBypassed**

Checks if the MidiProcessor is bypassed. Edit on GitHub

```
MidiProcessor.isBypassed()
```

#### **restoreScriptControls**

Restores the control values for scripts (without recompiling). Edit on GitHub

```
MidiProcessor.restoreScriptControls(String base64Controls)
```

#### **restoreState**

Restores the state from a base64 string. Edit on GitHub

```
MidiProcessor.restoreState(String base64State)
```

#### **setAttribute**

Sets the attribute of the MidiProcessor. If it is a script, then the index of the component is used. Edit on GitHub

```
MidiProcessor.setAttribute(int index, float value)
```

#### **setBypassed**

Bypasses the MidiProcessor. Edit on GitHub

```
MidiProcessor.setBypassed(bool shouldBeBypassed)
```

### Modifiers

A scripting class to set Key modifiers (SHIFT, CTRL, etc..). Please take a look at Scriptslider.setModifier()
to learn more about how to add and change modifier keys for UI components.

### Modulator

Get a reference to Modulators
with Synth.getModulator()
to call its functions.

```
const var LFOModulator1 = Synth.getModulator("LFO Modulator1");
```

#### **addGlobalModulator**

Adds a and connects a receiver modulator for the given global modulator. Edit on GitHub

```
Modulator.addGlobalModulator(var chainIndex, var globalMod, String modName)
```

#### **addModulator**

Adds a modulator to the given chain and returns a reference. Edit on GitHub

```
Modulator.addModulator(var chainIndex, var typeName, var modName)
```

#### **addStaticGlobalModulator**

Adds and connects a receiving static time variant modulator for the given global modulator. Edit on GitHub

```
Modulator.addStaticGlobalModulator(var chainIndex, var timeVariantMod, String modName)
```

#### **asTableProcessor**

Returns a reference as table processor to modify the table or undefined if no table modulator. Edit on GitHub

```
Modulator.asTableProcessor()
```

#### **connectToGlobalModulator**

Connects a receive modulator to a global modulator. Edit on GitHub

```
Modulator.connectToGlobalModulator(String globalModulationContainerId, String modulatorId)
```

#### **exists**

Checks if the Object exists and prints a error message on the console if not. Edit on GitHub

```
Modulator.exists()
```

#### **exportScriptControls**

Export the control values (without the script). Edit on GitHub

```
Modulator.exportScriptControls()
```

#### **exportState**

Exports the state as base64 string. Edit on GitHub

```
Modulator.exportState()
```

#### **getAttribute**

Returns the attribute with the given index. Edit on GitHub

```
Modulator.getAttribute(int index)
```

#### **getAttributeId**

Returns the ID of the attribute with the given index. Edit on GitHub

```
Modulator.getAttributeId(int index)
```

#### **getAttributeIndex**

Returns the index of the attribute with the given ID. Edit on GitHub

```
Modulator.getAttributeIndex(String id)
```

#### **getCurrentLevel**

Returns the current peak value of the modulator. Edit on GitHub

```
Modulator.getCurrentLevel()
```

#### **getGlobalModulatorId**

Returns the id of the global modulation container and global modulator this modulator is connected to Edit on GitHub

```
Modulator.getGlobalModulatorId()
```

#### **getId**

Returns the ID of the modulator. Edit on GitHub

```
Modulator.getId()
```

#### **getIntensity**

Returns the intensity of the Modulator. Ranges: Gain: 0...1, Pitch: -12...12. Edit on GitHub

```
Modulator.getIntensity()
```

#### **getModulatorChain**

Returns the Modulator chain with the given index. Edit on GitHub

```
Modulator.getModulatorChain(var chainIndex)
```

#### **getNumAttributes**

Returns the number of attributes. Edit on GitHub

```
Modulator.getNumAttributes()
```

#### **getType**

Returns the Type of the modulator. Edit on GitHub

```
Modulator.getType()
```

#### **isBipolar**

Returns true if the modulator works in bipolar mode. Edit on GitHub

```
Modulator.isBipolar()
```

#### **isBypassed**

Checks if the modulator is bypassed. Edit on GitHub

```
Modulator.isBypassed()
```

#### **restoreScriptControls**

Restores the control values for scripts (without recompiling). Edit on GitHub

```
Modulator.restoreScriptControls(String base64Controls)
```

#### **restoreState**

Restores the state from a base64 string. Edit on GitHub

```
Modulator.restoreState(String base64State)
```

#### **setAttribute**

Sets the attribute of the Modulator. You can look up the specific parameter indexes in the manual. Edit on GitHub

```
Modulator.setAttribute(int index, float value)
```

#### **setBypassed**

Bypasses the Modulator. Edit on GitHub

```
Modulator.setBypassed(bool shouldBeBypassed)
```

#### **setIntensity**

Changes the Intensity of the Modulator. Ranges: Gain Mode 0... 1, PitchMode -12... 12. Edit on GitHub

```
Modulator.setIntensity(float newIntensity)
```

#### **setIsBipolar**

Sets the modulator to a bipolar range (if applicable). Edit on GitHub

```
Modulator.setIsBipolar(bool shouldBeBipolar)
```

#### **setMatrixProperties**

Sets the data for the input & output ranges if this modulator is a MatrixModulator.

```
Modulator.setMatrixProperties(var matrixData)
```

This function can be called in order to programmatically change the Modulation / UI Ranges

of a matrix modulator.

This obviously only works when called with a reference to a Matrix Modulator.

The function expects a JSON object with this format:

```
mod.setMatrixProperties({
	InputRange: // defines the range of the UI knob
	{
		min: 0.0,
		max: 1.0,
		middlePosition: 0.5,
		mode: "NormalizedPercentage",
		stepSize: 0.0,
	},
	OutputRange: // defines the range of the scaled modulation output signal
	{
		min: 0.0,
		max: 1.0,
		middlePosition: 0.5,
		stepSize: 0.0,
		UseMidPositionAsZero: false
	}
});
```

Note that if you want to supply a text converter, it will only lookup the `mode`
property in the input range. If you want to change the mid position to be used as zero position, then you need to set the `UseMidPositionAsZero`
property of the output range

### ModuleIds

#### **getObjectName**

Returns the name. Edit on GitHub

```
ModuleIds.getObjectName()  override
```

### NetworkTest

The `NetworkTest`
can be used for testing ScriptNode networks, mainly intended for internal usage.

#### **addRuntimeFunction**

Sets a function that will be executed at the given time to simulate live user input. Edit on GitHub

```
NetworkTest.addRuntimeFunction(var f, int timestamp)
```

#### **checkCompileHashCodes**

Checks whether the hash code of all compiled nodes match their network file. Edit on GitHub

```
NetworkTest.checkCompileHashCodes()
```

#### **createAsciiDiff**

Creates a ASCII diff with 'X' as error when the datas don't match. Edit on GitHub

```
NetworkTest.createAsciiDiff(var data1, var data2, int numLines)
```

#### **createBufferContentAsAsciiArt**

Creates a string that vaguely represents the buffer data content. Edit on GitHub

```
NetworkTest.createBufferContentAsAsciiArt(var buffer, int numLines)
```

#### **dumpNetworkAsXml**

Creates a XML representation of the current network. Edit on GitHub

```
NetworkTest.dumpNetworkAsXml()
```

#### **expectEquals**

Compares the two data types and returns a error message if they don't match. Edit on GitHub

```
NetworkTest.expectEquals(var data1, var data2, float errorDb)
```

#### **getDllInfo**

Returns an object containing the information about the project dll. Edit on GitHub

```
NetworkTest.getDllInfo()
```

#### **getLastTestException**

Returns the exception that was caused by the last test run (or empty if fine). Edit on GitHub

```
NetworkTest.getLastTestException()
```

#### **getListOfAllCompileableNodes**

Returns the list of all nodes that can be compiled. Edit on GitHub

```
NetworkTest.getListOfAllCompileableNodes()
```

#### **getListOfCompiledNodes**

Returns the list of all compiled nodes. Edit on GitHub

```
NetworkTest.getListOfCompiledNodes()
```

#### **runTest**

runs the test and returns the buffer. Edit on GitHub

```
NetworkTest.runTest()
```

#### **setProcessSpecs**

Set the processing specifications for the test run. Edit on GitHub

```
NetworkTest.setProcessSpecs(int numChannels, double sampleRate, int blockSize)
```

#### **setTestProperty**

Sets a test property. Edit on GitHub

```
NetworkTest.setTestProperty(String id, var value)
```

#### **setWaitingTime**

Sets a time to wait between calling prepare and processing the data. Edit on GitHub

```
NetworkTest.setWaitingTime(int timeToWaitMs)
```

### NeuralNetwork

You can create a `NeuralNetwork`
object with Engine.createNeuralNetwork("String id"). Please take a look at the NeuralNetwork Sine Generator Snippet
to take a look at a working example.

```
const var nn = Engine.createNeuralNetwork("NeuralNetwork");
```

#### **build**

Create a network using the given JSON for the layer setup. Edit on GitHub

```
NeuralNetwork.build( var modelJSON)
```

#### **clearModel**

Destroys the model and allows rebuilding using a different layout JSON. Edit on GitHub

```
NeuralNetwork.clearModel()
```

#### **connectToGlobalCables**

Connects the network to a input and output global cable. Edit on GitHub

```
NeuralNetwork.connectToGlobalCables(String inputId, String outputId)
```

#### **createModelJSONFromTextFile**

Helper function to create a JSON model definition from the Pytorch print(model) output. Edit on GitHub

```
NeuralNetwork.createModelJSONFromTextFile(var fileObject)
```

#### **getModelJSON**

Returns the model JSON. Edit on GitHub

```
NeuralNetwork.getModelJSON()
```

#### **loadNAMModel**

Loads the model from a NAM file. Edit on GitHub

```
NeuralNetwork.loadNAMModel( var modelJSON)
```

#### **loadOnnxModel**

Loads the ONNX runtime model for spectral analysis. Edit on GitHub

```
NeuralNetwork.loadOnnxModel( var base64Data, int numOutputValues)
```

#### **loadPytorchModel**

Loads the model layout and weights from a Pytorch model JSON. Edit on GitHub

```
NeuralNetwork.loadPytorchModel( var modelJSON)
```

#### **loadTensorFlowModel**

Loads the model layout and weights from a tensorflow model JSON. Edit on GitHub

```
NeuralNetwork.loadTensorFlowModel( var modelJSON)
```

#### **loadWeights**

Loads the weights from the JSON object. Edit on GitHub

```
NeuralNetwork.loadWeights( var weightData)
```

#### **process**

Runs inference on the given input and returns either a single float or a reference to the output buffer. Edit on GitHub

```
NeuralNetwork.process(var input)
```

#### **processFFTSpectrum**

Processes the FFT spectrum and returns the output tensor as array of float numbers. Edit on GitHub

```
NeuralNetwork.processFFTSpectrum(var fftObject, int numFreqPixels, int numTimePixels)
```

#### **reset**

Resets the network pipeline. Edit on GitHub

```
NeuralNetwork.reset()
```

### Node

The "Script" part of Scriptnode
means that you can use HiseScript to programmatically modify, add or remove nodes within a DSP network. This can be used to build up dynamic FX chains, programmatically create complex patches that would be annoying to patch up manually
or other use cases that require you to change the layout of your DSP network.
The `Node`
object is how you can access a node
with scripting. It is usually created / referenced from a DSPNetwork
scripting object and then can perform almost every operation that you do in the scriptnode workspace:

- create / remove nodes from a container
- setting parameters or properties
- adding / connecting parameters or modulation outputs
- bypassing / move the nodes within the parent container

```
// create a reference to a scriptnode network with the given ID
const var sn = Engine.createDspNetwork("my_network");

// create a reference to the root container of that network
// (!= the network itself)
const var rootNode = sn.get("my_network");

// Add a oscillator with the ID "osc"
const var node = sn.create("core.oscillator", "osc");

// Add the oscillator to the root container.
node.setParent(rootNode, -1);

Console.print(node.getNumParameters());
```

#### **connectTo**

Connects this node to the given parameter target. sourceInfo is either the parameter name (String) or output slot (integer).

```
Node.connectTo(var parameterTarget, var sourceInfo)
```

This function can be used to connect the modulation output of this node to a target parameter.

If you want to connect a parameter of a container to another parameter you will need to use the Parameter.addConnectionFrom()
method which operates on the target parameter.

You can call this method on any node that has one or more modulation outputs. This modulation output will be the **source**
of the connection and the method will create a connection from this output to the targetParameter:

- the parameterTarget parameter must be a Parameter object that references the parameter that will be the target of the connection.
- the sourceInfo parameter is providing additional information for certain cases. If the node has multiple modulation outputs (like eg. the control.xfader node), you can specify at which output slot it should connect to. For single modulation slots this parameter is ignored.

#### **connectToBypass**

Connects the bypass button of this node to the given source info ("NodeId.ParameterId"). Edit on GitHub

```
Node.connectToBypass(var sourceInfo)
```

#### **get**

Returns a property of the node. Edit on GitHub

```
Node.get(var id)
```

#### **getChildNodes**

Returns a list of child nodes if this node is a container. Edit on GitHub

```
Node.getChildNodes(bool recursive)
```

#### **getIndexInParent**

Returns the index in the parent. Edit on GitHub

```
Node.getIndexInParent()
```

#### **getNodeHolder**

Not necessarily the DSP network. Edit on GitHub

```
Node.getNodeHolder()
```

#### **getNumParameters**

Returns the number of parameters. Edit on GitHub

```
Node.getNumParameters()
```

#### **getOrCreateParameter**

Returns a reference to a parameter or creates a parameter (if non existent and possible). Edit on GitHub

```
Node.getOrCreateParameter(var indexOrId)
```

#### **isActive**

Checks if the node is inserted into the signal path. Edit on GitHub

```
Node.isActive(bool checkRecursively)
```

#### **isBypassed**

Checks if the node is bypassed. Edit on GitHub

```
Node.isBypassed()
```

#### **reset**

Reset the node's internal state (eg. at voice start). Edit on GitHub

```
Node.reset()=0
```

#### **set**

Sets the property of the node.

```
Node.set(var id, var value)
```

There are two concepts of "states" for a node:

- Parameters are single double precision float numbers which can be changed in realtime via modulation slots or parameter connections. They are always dynamic and if you compile the network to a C++ class, you can still modify these through the parameter connections.
- Properties are type-agnostic values that define a static property of a node. If you compile a network to a C++ class, these will be turned into compile-time constants that define the behaviour.

**Examples for parameters:**

- volume parameter of a gain node
- frequency parameter of an oscillator
- filter type of a EQ

**Examples for properties**

- data slot index to an external audio file slot
- crossfade curve of the xfader node
- conversion function of the converter node

#### **setBypassed**

Bypasses the node. Edit on GitHub

```
Node.setBypassed(bool shouldBeBypassed)
```

#### **setComplexDataIndex**

Sets the complex data type at the dataSlot to the given index and data (if embedded). Edit on GitHub

```
Node.setComplexDataIndex(String dataType, int dataSlot, int indexValue)
```

#### **setParent**

Inserts the node into the given parent container. Edit on GitHub

```
Node.setParent(var parentNode, int indexInParent)
```

### Parameter

#### **addConnectionFrom**

Adds (and/or) returns a connection from the given data. Edit on GitHub

```
Parameter.addConnectionFrom(var connectionData)
```

#### **getId**

Returns the name of the parameter. Edit on GitHub

```
Parameter.getId()
```

#### **getRangeObject**

Returns the range properties as JSON object. Edit on GitHub

```
Parameter.getRangeObject()
```

#### **getValue**

Returns the current value. Edit on GitHub

```
Parameter.getValue()
```

#### **setRangeFromObject**

Updates the parameter range from the given object. Edit on GitHub

```
Parameter.setRangeFromObject(var propertyObject)
```

#### **setRangeProperty**

Sets a range property. Edit on GitHub

```
Parameter.setRangeProperty(String id, var newValue)
```

#### **setValueAsync**

Sets the value immediately and stores it asynchronously. Edit on GitHub

```
Parameter.setValueAsync(double newValue)
```

#### **setValueSync**

Stores the value synchronously and calls the callback. Edit on GitHub

```
Parameter.setValueSync(double newValue)
```

### Path

The `Path`
object with which you can define a path that can be drawn to a Panel. You can create a new path object with Content.createPath()
and draw it with Graphics.drawPath().

```
const var p = Content.createPath();

p.startNewSubPath(0.0, 0.0);
p.lineTo(0.2, 1.0);
p.lineTo(1.0, 0.2);
p.lineTo(0.7, 1.0);

const var Panel1 = Content.getComponent("Panel1");

Panel1.setPaintRoutine(function(g)
{ g.setColour(Colours.white);
 var path_data = {}; // pathStrokeStyle object path_data.Thickness = 3.0;

	g.drawPath(p, this.getLocalBounds(10), path_data);
});
```

#### **addArc**

Adds an arc to the path. Edit on GitHub

```
Path.addArc(var area, var fromRadians, var toRadians)
```

#### **addArrow**

Adds an arrow to the path from start [x, y] and end [x, y]. Edit on GitHub

```
Path.addArrow(var start, var end, var thickness, var headWidth, var headLength)
```

#### **addEllipse**

Adds an ellipse to the path. Edit on GitHub

```
Path.addEllipse(var area)
```

#### **addPolygon**

Adds a polygon to the path from the center [x, y]. Edit on GitHub

```
Path.addPolygon(var center, var numSides, var radius, var angle)
```

#### **addQuadrilateral**

Adds a addQuadrilateral to the path. Edit on GitHub

```
Path.addQuadrilateral(var xy1, var xy2, var xy3, var xy4)
```

#### **addRectangle**

Adds a rectangle to the path. Edit on GitHub

```
Path.addRectangle(var area)
```

#### **addRoundedRectangle**

Adds a rounded rectangle to the path. Edit on GitHub

```
Path.addRoundedRectangle(var area, var cornerSize)
```

#### **addRoundedRectangleCustomisable**

Adds a fully customisable rounded rectangle to the path. area[x,y,w,h], cornerSizeXY[x,y], boolCurves[bool,bool,bool,bool] Edit on GitHub

```
Path.addRoundedRectangleCustomisable(var area, var cornerSizeXY, var boolCurves)
```

#### **addStar**

Adds a star to the path from the center [x, y]. Edit on GitHub

```
Path.addStar(var center, var numPoints, var innerRadius, var outerRadius, var angle)
```

#### **addTriangle**

Adds a triangle to the path. Edit on GitHub

```
Path.addTriangle(var xy1, var xy2, var xy3)
```

#### **clear**

Clears the Path. Edit on GitHub

```
Path.clear()
```

#### **closeSubPath**

Closes the Path. Edit on GitHub

```
Path.closeSubPath()
```

#### **contains**

Checks whether a point lies within the path. This is only relevant for closed paths. Edit on GitHub

```
Path.contains(var point)
```

#### **createStrokedPath**

Creates a fillable path using the provided strokeData (with optional dot. Edit on GitHub

```
Path.createStrokedPath(var strokeData, var dotData)
```

#### **cubicTo**

Adds a cubic bezier curve with two sets of control point arrays [cx1,cy1] and [cx2,cy2], and the end point [x,y]. Edit on GitHub

```
Path.cubicTo(var cxy1, var cxy2, var x, var y)
```

#### **fromString**

Restores a path that has been converted into a string. Edit on GitHub

```
Path.fromString(String stringPath)
```

#### **getBounds**

Returns the area ([x, y, width, height]) that the path is occupying with the scale factor applied. Edit on GitHub

```
Path.getBounds(var scaleFactor)
```

#### **getIntersection**

Returns the point where a line ([x1, y1], [x2, y2]) intersects the path when appropriate. Returns false otherwise. Edit on GitHub

```
Path.getIntersection(var start, var end, bool keepSectionOutsidePath)
```

#### **getLength**

Returns the length of the path. Edit on GitHub

```
Path.getLength()
```

#### **getPointOnPath**

Returns the point at a certain distance along the path. Edit on GitHub

```
Path.getPointOnPath(var distanceFromStart)
```

#### **getYAt**

Returns the y coordinate of the first intersection at the given X position or undefined if no match. Edit on GitHub

```
Path.getYAt(float xPos)
```

#### **lineTo**

Adds a line to [x,y]. Edit on GitHub

```
Path.lineTo(var x, var y)
```

#### **loadFromData**

Loads a path from a data array. Edit on GitHub

```
Path.loadFromData(var data)
```

#### **quadraticTo**

Adds a quadratic bezier curve with the control point [cx,cy] and the end point [x,y]. Edit on GitHub

```
Path.quadraticTo(var cx, var cy, var x, var y)
```

#### **roundCorners**

Creates a version of this path where all sharp corners have been replaced by curves. Edit on GitHub

```
Path.roundCorners(var radius)
```

#### **scaleToFit**

Rescales the path to make it fit neatly into a given space. preserveProportions keeps the w/h ratio. Edit on GitHub

```
Path.scaleToFit(var x, var y, var width, var height, bool preserveProportions)
```

#### **setBounds**

Sets a (minimal) bounding box for the path.

```
Path.setBounds(var boundingBox)
```

By default a path's bounding box is defined by its shapes and set to the maximal rectangle area that covers all shapes in the path. In most path rendering functions this bounding box will be taken into account when scaling the path to the requested drawing dimensions.

In some cases (eg. when rendering a knob ring) this might lead to an unwanted skewing of the path, because the arc shape might not cover the entire area that it was painted on. In order to solve this, you would have to start two empty subpaths with the corners of your desired bounding box so that the scaling will ignore the actual shape of the arc.

This function is just a shortcut to this procedure and can be called with a Rectangle
object for the ultimate code beauty:

```
const var Panel1 = Content.getComponent("Panel1");
const var ARC = -2.4;

Panel1.setPaintRoutine(function(g)
{
	g.fillAll(0x22FFFFFF);

	var p = Content.createPath();
	var r = Rectangle(this.getLocalBounds(5));
	var n = Rectangle(1.0, 1.0);

	// this adds an arc to the path AND sets the bounding box
	// to the exact dimensions of the arc shape
	p.addArc(n, -ARC, ARC);
	g.setColour(Colours.white);

	// drawing the path will now scale the bounding box to the
	// panel's bounds and skew the shape along the process
	g.drawPath(p, r, 10);
	g.drawAlignedText("UGGO!", r, "centred");
});

const var Panel2 = Content.getComponent("Panel2");

Panel2.setPaintRoutine(function(g)
{
	g.fillAll(0x22FFFFFF);

	var p = Content.createPath();
	var r = Rectangle(this.getLocalBounds(5));
	var n = Rectangle(1.0, 1.0);

	// now we set the bounding box to the normalised area
	p.setBounds(n);

	// this function basically does this, but shorter and leaner:
	//p.startNewSubPath(0.0, 0.0);
	//p.startNewSubPath(1.0, 1.0);

	// the bounding box is no longer dependent on the actual shape
	// of the arc
	p.addArc(n, -ARC, ARC);
	g.setColour(Colours.white);

	// now we can scale the bounding box correctly without skewing
	// the arc shape
	g.drawPath(p, r, 10);
	g.drawAlignedText("NOICE!", r, "centred");
});
```

#### **startNewSubPath**

Starts a new Path. It does not clear the path, so use 'clear()' if you want to start all over again. Edit on GitHub

```
Path.startNewSubPath(var x, var y)
```

#### **toBase64**

Creates a base64 encoded representation of the path. Edit on GitHub

```
Path.toBase64()
```

#### **toString**

Creates a string representation of this path. Edit on GitHub

```
Path.toString()
```

### Rectangle

This object type is a native type in HiseScript and represents a two dimensional rectangle. The functionality was "inspired" (read stolen) from the JUCE class
and is a helpful tool for all UI tasks.

Note that most methods create and return a new rectangle object which makes it unsuitable for any realtime thread operations, but that should not be a serious limitation as 99% of the use cases will be within paint routines or other UI related functions.

Until now, the representation of rectangles in HiseScript was a plain ol' JS array with four elements (`[x, y, width, height]`
). This was fine (and for backwards compatibility you can still use JS arrays to represent rectangles), but there are a few advantages of having a dedicated type for rectangles:

1. better debugging: print in one line, inspect multiple rectangles with the rectangle viewer
2. inbuilt methods for common tasks like scaling, translating and slicing rectangles

You can create a Rectangle using the inbuild function `Rectangle()`. This function accepts a variety of arguments to create a rectangle:

```
// creates an empty rectangle
var r0  = Rectangle();

// accepts a JS array and converts it to a Rectangle
var r1  = Rectangle([x, y, w, h]);

// creates a rectangle at the origin position [0, 0]
var r2a = Rectangle(width, height);

// creates a rectangle from two points.
var r2b = Rectangle([x1, y1], [x2, y2]);

// creates a rectangle with the given dimensions.
var r4  = Rectangle(x, y, w, h);
```

The rectangle can then be used / modified like a JS array but has some additional QOL methods:

```
Panel1.setPaintRoutine(function(g)
{
	// Create a rectangle
	var rect = Rectangle(100, 100);

	// Access / change members
	Console.print(rect[0]); // use the [0, 1, 2, 3] indexes like before
	Console.print(rect.x); // or use x, y, width, height

	rect.width = 90;

	// Pass that object into API calls that expect a rectangle
	g.fillRect(rect.reduced(10));
});
```

Note that for backwards compatibility, HISE will still use the JS arrays for all methods or callbacks that return a rectangle (eg. `ScriptComponent.getLocalBounds()`
or the `obj.area`
property in LAF functions). In order to change that you can enable the preprocessor `HISE_USE_SCRIPT_RECTANGLE_OBJECT=1`, then it will return a Rectangle object for the full experience.

##### **Inspect rectangles using sampling**

A neat feature of the Rectangle class is that it allows you to quickly inspect the rectangles using a sampling session. These are the steps you have to take:

1. Enable sampling for a scope using the `.sample("id")` scoped statement
2. Use Console.sample() to add data points
3. Click on the inspect icon next to the `.sample()` scoped statement to open the rectangle viewer.

```
{.sample("withAspectRatioLike");

	var r = Rectangle(20, 10, 300, 300);
	var other = Rectangle(500, 80, 100, 50);

	Console.sample("target", r);
	Console.sample("other", other);
	Console.sample("fitted", r.withAspectRatioLike(other));
}
```

If you now click on the icon at the top, it will open a popup that shows all items of the sampling session, in this case three rectangles that are a perfect visualisation of what the withAspectRatioLike
method is doing:

#### **assign**

Override this method and assign the new value to the given id. Edit on GitHub

```
Rectangle.assign( String id,  var newValue) override
```

#### **constrainedWithin**

Tries to fit this rectangle within a target area, returning the result.

```
Rectangle.constrainedWithin(var targetArea)
```

This function moves the rectangle into the given target area while keeping the size the same. This is useful if you eg. want to display a text at the hover position but make sure that the entire text is visible when you hover at the edges.

```
{.sample("constrainedWithin");

	var textPos = Rectangle(200, 20);
	var bounds = Rectangle(100, 100, 400, 300);

	Console.sample("bounds", bounds);
	Console.sample("textBounds", textPos);
	Console.sample("fitted", textPos.constrainedWithin(bounds));
}
```

Result:

#### **contains**

Returns true if this other rectangle is completely inside this one. Edit on GitHub

```
Rectangle.contains(var otherRectOrPoint)
```

#### **expanded**

Returns a rectangle that is larger than this one by a given amount. Edit on GitHub

```
Rectangle.expanded(double x, double optionalY)
```

#### **getIntersection**

Returns the intersection of both rectangles (the largest rectangle that fits into both rectangles. Edit on GitHub

```
Rectangle.getIntersection(var otherRect)
```

#### **getUnion**

Returns the smallest rectangle that contains both this one and the one passed-in.

```
Rectangle.getUnion(var otherRect)
```

```
{.sample("getUnion");

	var r1 = Rectangle(10, 50, 90, 65);
	var r2 = Rectangle(300, 200, 10, 55);

	Console.sample("r1", r1);
	Console.sample("r2", r2);
	Console.sample("union", r1.getUnion(r2));
}
```

Result:

#### **intersects**

Returns true if any part of another rectangle overlaps this one. Edit on GitHub

```
Rectangle.intersects(var otherRect)
```

#### **isEmpty**

Returns true if the rectangle's width or height are zero or less. Edit on GitHub

```
Rectangle.isEmpty()
```

#### **reduced**

Returns a rectangle that is smaller than this one by a given amount.

```
Rectangle.reduced(double x, double optionalY)
```

This function can be called with either one or two arguments. If you call it with two arguments, it will be reduced with different X / Y values, if you call it with one argument, it will reduce all sides equally:

```
{.sample("reduced");

	var x = Rectangle(20, 20, 400, 200);

	Console.sample("before", x);
	Console.sample("afterTwoArgs", x.reduced(50, 20));
	Console.sample("afterOneArg", x.reduced(30));
}
```

#### **removeFromBottom**

Removes a strip from the bottom of this rectangle, reducing this rectangle by the specified amount and returning the section that was removed.

```
Rectangle.removeFromBottom(double numToRemove)
```

This function (and it's siblings `removeFromLeft(), removeFromRight()`
and `removeFromTop()`
are incredibly useful to divide a rectangle into different areas for layout purposes (eg. rendering a text label beyond a slider knob). Note that calling this method modifies the rectangle, slices off and returns the part.

```
{.sample("slicing");

	var r = Rectangle(20, 20, 500, 400);

	Console.sample("full", r);

	var top = r.removeFromTop(50);

	Console.sample("topLeft", top.removeFromLeft(50));
	Console.sample("top", top);
	Console.sample("remaining", r);
};
```

Result:

#### **removeFromLeft**

Removes a strip from the left of this rectangle, reducing this rectangle by the specified amount and returning the section that was removed. Edit on GitHub

```
Rectangle.removeFromLeft(double numToRemove)
```

#### **removeFromRight**

Removes a strip from the right of this rectangle, reducing this rectangle by the specified amount and returning the section that was removed. Edit on GitHub

```
Rectangle.removeFromRight(double numToRemove)
```

#### **removeFromTop**

Removes a strip from the top of this rectangle, reducing this rectangle by the specified amount and returning the section that was removed. Edit on GitHub

```
Rectangle.removeFromTop(double numToRemove)
```

#### **scaled**

Returns a rectangle with the position and size being scaled by the given factors. Edit on GitHub

```
Rectangle.scaled(double factorX, double optionalFactorY)
```

#### **setCentre**

Changes the position of the rectangle's centre (leaving its size unchanged). Edit on GitHub

```
Rectangle.setCentre(double centerX, double centerY)
```

#### **setPosition**

Changes the position of the rectangle's top-left corner (leaving its size unchanged). Edit on GitHub

```
Rectangle.setPosition(double x, double y)
```

#### **setSize**

Changes the rectangle's size, leaving the position of its top-left corner unchanged. Edit on GitHub

```
Rectangle.setSize(double width, double height)
```

#### **toArray**

Returns a standard JS array with the position [x, y, w, h]. Edit on GitHub

```
Rectangle.toArray()
```

#### **translated**

Returns a rectangle which is the same as this one moved by a given amount. Edit on GitHub

```
Rectangle.translated(double deltaX, double deltaY)
```

#### **withAspectRatioLike**

Returns the biggest rectangle that fits in this rectangle using the aspect ratio of the other rectangle.

```
Rectangle.withAspectRatioLike(var otherRect)
```

This method is useful if you have a path that you want to render somewhere while keeping it's aspect ratio the same.

```
{.sample("withAspectRatioLike");

	var r = Rectangle(20, 10, 300, 300]);
	var other = Rectangle(500, 80, 100, 50);

	Console.sample("target", r);
	Console.sample("other", other);
	Console.sample("fitted", r.withAspectRatioLike(other));
}
```

Result:

#### **withBottom**

Returns a new rectangle with a different bottom edge position, but the same top edge as this one. Edit on GitHub

```
Rectangle.withBottom(double newBottom)
```

#### **withBottomY**

Returns a rectangle which has the same size and x-position as this one, but whose bottom edge has the given position. Edit on GitHub

```
Rectangle.withBottomY(double newBottomY)
```

#### **withCentre**

Returns a rectangle with the same size as this one, but a new centre position. Edit on GitHub

```
Rectangle.withCentre(double newWidth, double newHeight)
```

#### **withHeight**

Returns a rectangle which has the same position and width as this one, but with a different height. Edit on GitHub

```
Rectangle.withHeight(double newHeight)
```

#### **withLeft**

Returns a new rectangle with a different x position, but the same right-hand edge as this one. Edit on GitHub

```
Rectangle.withLeft(double newLeft)
```

#### **withRight**

Returns a new rectangle with a different right-hand edge position, but the same left-hand edge as this one. Edit on GitHub

```
Rectangle.withRight(double newRight)
```

#### **withSize**

Returns a rectangle with the same top-left position as this one, but a new size. Edit on GitHub

```
Rectangle.withSize(double newWidth, double newHeight)
```

#### **withSizeKeepingCentre**

Returns a rectangle with the same centre position as this one, but a new size.

```
Rectangle.withSizeKeepingCentre(double newWidth, double newHeight)
```

This is useful if you want to draw something with a centered alignment.

```
{.sample("withSizeKeepingCentre");

	var x = Rectangle(10, 10, 300, 300);

	Console.sample("bounds", x);
	Console.sample("smaller", x.withSizeKeepingCentre(50, 50));
}
```

#### **withTrimmedBottom**

Returns a version of this rectangle with the given amount removed from its bottom edge. Edit on GitHub

```
Rectangle.withTrimmedBottom(double amountToRemove)
```

#### **withTrimmedLeft**

Returns a version of this rectangle with the given amount removed from its left-hand edge. Edit on GitHub

```
Rectangle.withTrimmedLeft(double amountToRemove)
```

#### **withTrimmedRight**

Returns a version of this rectangle with the given amount removed from its right-hand edge. Edit on GitHub

```
Rectangle.withTrimmedRight(double amountToRemove)
```

#### **withTrimmedTop**

Returns a version of this rectangle with the given amount removed from its top edge. Edit on GitHub

```
Rectangle.withTrimmedTop(double amountToRemove)
```

#### **withWidth**

Returns a rectangle which has the same position and height as this one, but with a different width. Edit on GitHub

```
Rectangle.withWidth(double newWidth)
```

#### **withX**

Returns a rectangle which has the same size and y-position as this one, but with a different x-position. Edit on GitHub

```
Rectangle.withX(double newX)
```

#### **withY**

Returns a rectangle which has the same size and x-position as this one, but with a different y-position. Edit on GitHub

```
Rectangle.withY(double newY)
```

### RoutingMatrix

The `RoutingMatrix`
object with which you can manipulate the channels and connections of each audio modules outputs.

```
const var MasterChain = Synth.getRoutingMatrix("Master Chain");
MasterChain.setNumChannels(8);
```

#### **1. Building HISE Multi Output**

In order to do it, you'll have to build a multi-output version of HISE.

##### **A. In the projucer file, add these two preprocessor definitions:**

```
NUM_MAX_CHANNELS = XX
```

```
HISE_NUM_PLUGIN_CHANNELS = XX
```

'XX' being the number of outputs you need in your plugin, and it must be a multiple of 2, obviously.

I'm using the latest develop build of HISE, but noticed that the `NUM_MAX_CHANNELS = XX`
preprocessor didn't work properly. I don't know if it's a bug or a problem on my end - or I was really tired at that moment...

I changed the value directly in HISE's source code.This can be changed in the file: `{HISE_FOLDER}hi_tools\Marcos.h`
line (49):`/** Change this value if you need more than 8 stereo channels in HISE routing. Default: 16*/`

```
### B. Build HISE

Build HISE as usual.

## **2. Setting the outputs in HISE**

1. In HISE, click on the Main channel meter to open the routing popup:

![0a41c2ca-8e4e-4c5c-8993-93ddc6a16d5d-image.png](/assets/uploads/files/1736238706068-0a41c2ca-8e4e-4c5c-8993-93ddc6a16d5d-image.png)

![becdbc83-be2d-46bc-9a0d-0780a557e2fb-image.png](/assets/uploads/files/1736238745099-becdbc83-be2d-46bc-9a0d-0780a557e2fb-image.png)

> My build has 48 channels, that's why there're so many output here. Your setup will be different depending on how many outputs you've configured for your build)

Right-click somewhere in the popup, and change the channel amount (let's say we want 8 outputs):

![5b812dd2-6a5b-4617-a2a8-3b5a3d64ec1a-image.png](/assets/uploads/files/1736238916802-5b812dd2-6a5b-4617-a2a8-3b5a3d64ec1a-image.png)

Now the routing appears like this:

![464f87a6-a230-40e4-8595-a9821772305c-image.png](/assets/uploads/files/1736238972422-464f87a6-a230-40e4-8595-a9821772305c-image.png)

> Again, it will look a bit different on your version, but all the output of your plugin should be routed to each of HISE's output channels.

2. Edit the project setting

Lastly, you'll have to add those extra definitions in your project's settings:
```

HISE\_NUM\_PLUGIN\_CHANNELS=8NUM\_MAX\_CHANNELS=8

You're all set now to do what you want with your outputs.

Here's a snippet:`HiseSnippet 2136.3oc6as0TajbEdDvrAoMYK6s1Zq7XWToJjVKj0Mt3PbYrEfCULFUHXcRQQ4pYlVnNdT2S5oG.U65Gxur7WH+T1WySImSOijFIKqEDdcXoF8.ntO849oO8W2EzTIcXAARkUlbG0ymYk42Z2pmP2oQGJWXs21VYJXePn1OTS5xDgADovqGosTQzcXDWoSHLslp4Rg0K54SCBXtVYxL+KQ1yjcAKyme5Yuf5QENrgSYY88RtC6U7tb8vYat0eg64sK0kcDuahUWeq8bjhFROYHXpyaW1xm57N54rWSwkMms0elFzwJy2YSqUys8ZqswSbcpuZkmzlttqyY0dxpL2p0qwdBy0c8Ztm0tsUluXGWtVpZAVOKvJyBuP51qUG4khHE787.9YdLbPEqVflildWomK5h3rVM5v8ba1OFFXYkYwlCinyGEQ+F684t7AyOLx9.CAxPNRF.yL2nl27iXdURZdkSXdSvjxjvjVHxjdncKGE2WOjBZOeo8dBMS0lB4ojlRzZsl6+rn8ieL4nN7.Rff66yzD3qmQgkAkEjFcT7.szuyxAjk2OzSyAWUHXdjiXA5kI9J4em4nKRnWP4dTv3IbgoLBjH6s5Pva4TOhh4KykqgDrEgtTW56X6pfACrs7aTtbQR0xkKrY1b4.K5kfgfhQwZyTLnJCpRaSXTmNjkgpFMDuYpkQk0CJeH9dgmCeOuoNuHIf102ioJRFrzhDl1oToREPguyELUORfLT3R5JcCAqFjB4Rp.TpjnjgZFg4EbYGP24.YDnImq7azWX6S0J9UjmRNwnuRmyzGB7vEmGQI+RsfkQdC8BF3H.CTHLTYoBEykM5yMfspyFa0lM1puTgS2LWrKevwG073id6qOdevU2XSSdYWXqLgJHTkh1ibIW2gPgYvTU.jKYRhSTAR.LGUCqiMr1.EvaXKCqOLfAzgJs3pEYx1QNfDOCZEDfqeOMnEOrBRGpDQL8GIHEWplF0FC8Kn.AxGm.UQUNsH4jpEI0veWuHYU72qUjr9oCcsIvK5YQSErMCxydA4K.qmK7vvT6PgC1PbhKK2OjKqmDL63XPi9g.vh.clEZslmCCJuIgS9SIhqOtJLyidTgbY+ALYEICvfLbx+NvIfe7nJnLxlcTYWxOLnSdbsfUl884xFGfFcUal68ersSX+dy9ILnGkrtbXto+t.jonMWPGfj6XBhijWPU3dinPx9l7GX682oCEcMjc8kBXP9kfudl7ExqLaEHS4yzYu5si8Z2N1i1hfoTSfCJfG08KPvxAjVo.T.BsR50HtjNuTfKZmqfrjfFWHEuFLO1ms7KE.6K2SzTwfQKUjnUgrBlr43EjSQh4c5a9Eg7jGHggUpbgKCagMpwWxL8AsGxIZUCpKw8nOMRTqTAHjKKTaY1RF0O.9RHdxgFaCvbdGg21TA8pGeXe1GzdfcEbxRPoA6bBcvisvhGzWi73S6qCrd97npQnrSvLtt4HASmGlGLCn2QZoGF.85Lzedy8FFuflGnDGoWXIpqaiAxMOGNG.DkxAx.P3.1EBS3BG3wEFTQlYKfl1X6rGrcNar6bB+znX7XmcbhINe535s3GzX5jnv1offvLQTz3Prn.Cx8OLtxiphEhNvw1XLA5OyTJoJWVd678sjxfk7TRapGrle7G6GuOoxvoiaC8Q8or2.+fG0U584RTm9ZolcfHpcIPgLNo1smHs3hY377IRFAUplFi4EgcOCQ.LbK.tP.3znnwr+3nwRBVzIp6PhEhEDb8A9LwGCBoUbKE.41BwVErTsA21Chws0u+hE2EgsMnWokwrSh615FJhpiKBqstohn13hXwarHpOtHdvVVGu21P8NhmMN.AAMelRyw7QlsYW.2lHBcaV6sYAuCPhZhfw8l.79WyX3UCU6eaqdIGzkBzryfi4ZV2.DHckUplq1J0ys5Jqka8U1.Se2PMVMgF2R94Pi0R5i89bnw5IzX4+4LnwO7NLvsmvd2HRzjWoBu3YLgwuSJdCBQ.W2K4FjOY2y55ZhOztIW6zYx13bSvFgR9eIrw3am96r2ocanW7PCbA6c+q+xbUzjp+qhT+WZi2rvbqCix+V6Iccno7zB+6q6SK3eseZgCbzf5ORQEA9xfjsS+WsXc4GAU9AI01wAvMTY+iCwrYx4aHopIR5md1tfSNQdZQAj4lxhm2E.nnGoLX9o8hEUlwWrXg6buXwuB1rOxipjsuM1hiOkvNhKXdvQSFa7qgyhZSC8z8mczZ48kBoeGof6jLQeHCvKc94LURaehNzy0Z3lBCm4a15P.eKMYQ6eXqWAEaTEDmXyXrnxM9AllX952aGYtDbCH4WuMom+dcS5QRmKN3QgMk1uru5+p3IH3LSq8rk01LO5HAp2vcgl8I..LgF36A6VT5lROpZ7v77epJaW3ZWKftzc65UrMCDluqajlT+cai7A1Mo++JYOx6L.XhecX2VlmVn+Szg3jmCQVDMtLN1fZfIbMC9uvmXhUvwYhIVoOwOK5XFg4U8NBLOzcRg4kBy61.yqZJLuTXd2uf4UMElWJLuTXd2ig4M2zzw7epf4U6txq48rTXdov7tcv7pkByKEl28KXd0Rg4kByKEl28XXdKLMcX+oBlW86Jul2Vov7Rg4c6f4UOElWJLu6Wv7pmByKElWJLu6wv79hooieyOmNd3D0wh2J+HlX0ju0X0wHVK4aMVaLh0SBes9XDWMI70UGi3ZIiHqMFw0SFQVePDoK0QIeqSze5xl+49Ly.UBBy+0gYs2GGS9f+rqsr5BHtdqiynh5CXr5rxXsYkw5yJiqNqLt1rx35yJia7yyHBH94gZY2ntEVV62bGyec4Yxri.+uOyz3v5+wGeMh2`

Original post on the forum: Multi Output Tutorial

#### **addConnection**

adds a connection to the given channels. Edit on GitHub

```
RoutingMatrix.addConnection(int sourceIndex, int destinationIndex)
```

#### **addSendConnection**

adds a send connection to the given channels. Edit on GitHub

```
RoutingMatrix.addSendConnection(int sourceIndex, int destinationIndex)
```

#### **clear**

Removes all connections. Edit on GitHub

```
RoutingMatrix.clear()
```

#### **getDestinationChannelForSource**

Returns the output channel that is mapped to the given input channel (or -1). Edit on GitHub

```
RoutingMatrix.getDestinationChannelForSource(var sourceIndex)
```

#### **getNumDestinationChannels**

Gets the amount of destination channels. Edit on GitHub

```
RoutingMatrix.getNumDestinationChannels()
```

#### **getNumSourceChannels**

Gets the amount of source channels. Edit on GitHub

```
RoutingMatrix.getNumSourceChannels()
```

#### **getSourceChannelsForDestination**

Returns one or multiple input channels that is mapped to the given output channel (or -1). Edit on GitHub

```
RoutingMatrix.getSourceChannelsForDestination(var destinationIndex)
```

#### **getSourceGainValue**

Gets the current peak value of the given channelIndex. Edit on GitHub

```
RoutingMatrix.getSourceGainValue(int channelIndex)
```

#### **removeConnection**

Removes the connection from the given channels. Edit on GitHub

```
RoutingMatrix.removeConnection(int sourceIndex, int destinationIndex)
```

#### **removeSendConnection**

removes the send connection. Edit on GitHub

```
RoutingMatrix.removeSendConnection(int sourceIndex, int destinationIndex)
```

#### **setNumChannels**

Sets the amount of channels (if the matrix is resizeable). Edit on GitHub

```
RoutingMatrix.setNumChannels(int numSourceChannels)
```

### Sample

Functions for doing something with a single samples selected from a Sampler. You can get and filter the array of samples from the sampler with one of these functions:

- Sampler.createListFromGUISelection()
- Sampler.createListFromScriptSelection()
- Sampler.createSelection(String regex)
- Sampler.createSelectionFromIndexes(var indexData)
- Sampler.createSelectionWithFilter(var filterFunction)

```
const var Sampler1 = Synth.getChildSynth("Sampler1"); // Script reference to Sampler module

const var sampler_obj = Sampler1.asSampler(); // Sampler object

const var sample = sampler_obj.createSelection("foley").pop(); // single sample from regex array

Console.print(sample.get(sample.FileName));
```

#### **deleteSample**

Deletes the sample from the Sampler (not just this reference!). Edit on GitHub

```
Sample.deleteSample()
```

#### **duplicateSample**

Duplicates the sample. Edit on GitHub

```
Sample.duplicateSample()
```

#### **get**

Returns the sample property.

```
Sample.get(int propertyIndex)
```

**Attribute Name** | **Description** || `FileName` | The file name |
| `Root` | The root note |
| `HiKey` | The highest mapped key |
| `LoKey` | The lowest mapped key |
| `LoVel` | The lowest mapped velocity |
| `HiVel` | The highest mapped velocity |
| `RRGroup` | The group index for round robin / random group start behaviour |
| `Volume` | The gain in decibels. |
| `Pan` | The stereo balance (-100 = left, 100 = right) |
| `Normalized` | Enables / disables Autogain to 0dB for all samples. |
| `Pitch` | The pitch factor in cents (+- 100). This is for fine tuning, for anything else, use RootNote. |
| `SampleStart` | The start of the sample. |
| `SampleEnd` | The end sample |
| `SampleStartMod` | The amount of samples that the sample start can be modulated. |
| `LoopStart` | The loop start in samples. This is independent from the sample start / end (so 0 is the SampleStart value and not the beginning of the file, but it checks the bounds. |
| `LoopEnd` | The loop end in samples. This is independent from the sample start / end, but it checks the bounds. |
| `LoopXFade` | The loop crossfade at the end of the loop (using a recalculated buffer) |
| `LoopEnabled` | True if the sample should be looped. |
| `ReleaseStart` | The release start value. A value of 0 disables the feature. |
| `LowerVelocityXFade` | The length of the lower velocity crossfade (0 if there is no crossfade). |
| `UpperVelocityXFade` | The length of the upper velocity crossfade (0 if there is no crossfade). |
| `SampleState` | This property allows to set the state of samples between Normal(0) and Purged (1) |
| `Reversed` | Whether the sample is reversed. |

Example to print the `SamplEnd`
of all samples:

```
const selection = Synth.getChildSynth("Sampler1").asSampler().createSelection(".")` //Array of `Sample` objects.
for (sample in selection){ Console.print(sample.get(Sampler.SamplEnd));
}
```

Note that attribute names belong to the `Sampler`
class, not `Sample`

trace() does not work on `Sample`
objects. Use the Script Watch Table
to peek inside.

#### **getCustomProperties**

Returns an object that can hold additional properties. Edit on GitHub

```
Sample.getCustomProperties()
```

#### **getId**

Returns the ID of the property (use this with the setFromJSONMethod). Edit on GitHub

```
Sample.getId(int id)
```

#### **getRange**

Returns the value range that the given property can have (eg. the loop end might not go beyond the sample end. Edit on GitHub

```
Sample.getRange(int propertyIndex)
```

#### **loadIntoBufferArray**

Loads the sample into a array of buffers for analysis. Edit on GitHub

```
Sample.loadIntoBufferArray()
```

#### **refersToSameSample**

Checks if the otherSample object refers to the same sample as this. Edit on GitHub

```
Sample.refersToSameSample(var otherSample)
```

#### **replaceAudioFile**

Writes the content of the audio data (array of buffers) into the audio file. This is undoable!. Edit on GitHub

```
Sample.replaceAudioFile(var audioData)
```

#### **set**

Sets the sample property. Edit on GitHub

```
Sample.set(int propertyIndex, var newValue)
```

#### **setFromJSON**

Sets the properties from a JSON object. Edit on GitHub

```
Sample.setFromJSON(var object)
```

### Sampler

The `Sampler`
object can be used to access sampler-specific properties, like loading samplemaps, changing sample properties, setting the current RR index, etc.

If you have a generic reference obtained by calling `Synth.getChildSynth()`, you can turn it into a Sampler reference with ChildSynth.asSampler():

```
const var Sampler1 = Synth.getChildSynth("Sampler1");

Sampler1.asSampler().loadSampleMap("My SampleMap");
```

Be aware that most of the functions that change samples will be executed asynchronously - if you want to keep your UI updated, take a look at ScriptPanel.setLoadingCallback()

#### **clearSampleMap**

Clears the current samplemap. Edit on GitHub

```
Sampler.clearSampleMap()
```

#### **createListFromGUISelection**

Returns a list of the sounds selected in the samplemap. Edit on GitHub

```
Sampler.createListFromGUISelection()
```

#### **createListFromScriptSelection**

Returns a list of the sounds selected by the selectSounds() method. Edit on GitHub

```
Sampler.createListFromScriptSelection()
```

#### **createSelection**

Returns an array with all samples that match this regex. Edit on GitHub

```
Sampler.createSelection(String regex)
```

#### **createSelectionFromIndexes**

Returns an array with all samples from the index data (can be either int or array of int, -1 selects all.). Edit on GitHub

```
Sampler.createSelectionFromIndexes(var indexData)
```

#### **createSelectionWithFilter**

Returns an array with all samples that match the filter function. Edit on GitHub

```
Sampler.createSelectionWithFilter(var filterFunction)
```

#### **enableRoundRobin**

Enables / Disables the automatic round robin group start logic (works only on samplers). Edit on GitHub

```
Sampler.enableRoundRobin(bool shouldUseRoundRobin)
```

#### **getActiveRRGroup**

Returns the currently (single) active RR group.

```
Sampler.getActiveRRGroup()
```

If you have set the active group using the API call Sampler.setActiveGroupForEventId(), then you need to use the function Sampler.getActiveGroupForEventId()
to query the specific group for the given event ID.

#### **getActiveRRGroupForEventId**

Returns the RR group that is associated with the event ID.

```
Sampler.getActiveRRGroupForEventId(int eventId)
```

This returns the group index for the given event ID. Be aware that the lifetime of this information is very short (only between calling the function `setActiveGroupForEventId()`
and the next audio render callback). If you call this function with a "dangling" event ID (an event ID that was already processed or discarded after the audio render callback), it will simply return the active RR group (so basically the same as `getActiveRRGroup()`
).

#### **getAttribute**

Gets the attribute with the given index (use the constants for clearer code). Edit on GitHub

```
Sampler.getAttribute(int index)
```

#### **getAttributeId**

Returns the ID of the attribute with the given index. Edit on GitHub

```
Sampler.getAttributeId(int index)
```

#### **getAttributeIndex**

Returns the index of the attribute with the given ID. Edit on GitHub

```
Sampler.getAttributeIndex(String id)
```

#### **getAudioWaveformContentAsBase64**

Converts the user preset data of a audio waveform to a base 64 samplemap. Edit on GitHub

```
Sampler.getAudioWaveformContentAsBase64(var presetObj)
```

#### **getCurrentSampleMapId**

Returns the currently loaded sample map. Edit on GitHub

```
Sampler.getCurrentSampleMapId()
```

#### **getMicPositionName**

Returns the name of the channel with the given index (Multimic samples only. Edit on GitHub

```
Sampler.getMicPositionName(int channelIndex)
```

#### **getNumActiveGroups**

Returns the number of currently active groups. Edit on GitHub

```
Sampler.getNumActiveGroups()
```

#### **getNumAttributes**

Returns the number of attributes. Edit on GitHub

```
Sampler.getNumAttributes()
```

#### **getNumMicPositions**

Returns the number of mic positions. Edit on GitHub

```
Sampler.getNumMicPositions()
```

#### **getNumSelectedSounds**

Returns the amount of selected samples. Edit on GitHub

```
Sampler.getNumSelectedSounds()
```

#### **getReleaseStartOptions**

Returns the current release start options as JSON object. Edit on GitHub

```
Sampler.getReleaseStartOptions()
```

#### **getRRGroupsForMessage**

Returns the amount of actual RR groups for the notenumber and velocity Edit on GitHub

```
Sampler.getRRGroupsForMessage(int noteNumber, int velocity)
```

#### **getSampleMapAsBase64**

Returns a base64 compressed string containing the entire samplemap. Edit on GitHub

```
Sampler.getSampleMapAsBase64()
```

#### **getSampleMapList**

Returns an array with all available sample maps. Edit on GitHub

```
Sampler.getSampleMapList()
```

#### **getSoundProperty**

Returns the property of the sound with the specified index. Edit on GitHub

```
Sampler.getSoundProperty(int propertyIndex, int soundIndex)
```

#### **getTimestretchOptions**

Returns the current timestretching options as JSON object. Edit on GitHub

```
Sampler.getTimestretchOptions()
```

#### **importSamples**

Loads a few samples in the current samplemap and returns a list of references to these samples. Edit on GitHub

```
Sampler.importSamples(var fileNameList, bool skipExistingSamples)
```

#### **isMicPositionPurged**

Checks if the mic position is purged. Edit on GitHub

```
Sampler.isMicPositionPurged(int micIndex)
```

#### **isNoteNumberMapped**

Checks whether the note number is mapped to any samples. Edit on GitHub

```
Sampler.isNoteNumberMapped(int noteNumber)
```

#### **loadSampleForAnalysis**

Loads the content of the given sample into an array of VariantBuffers that can be used for analysis. Edit on GitHub

```
Sampler.loadSampleForAnalysis(int indexInSelection)
```

#### **loadSampleMap**

Loads a new samplemap into this sampler.

```
Sampler.loadSampleMap( String fileName)
```

This method will return immediately and load a new samplemap on a background thread.

If you want to be notified when the sample loading has finished, you will need to create a Panel and add a PreloadingCallback using setLoadingCallback()

#### **loadSampleMapFromBase64**

Loads a base64 compressed string with the samplemap.

```
Sampler.loadSampleMapFromBase64( String b64)
```

This will load a samplemap that was previously exported with `getSampleMapAsBase64()`
and is particularly useful if you want to store a custom samplemap in a user preset.

#### **loadSampleMapFromJSON**

Loads a samplemap from a list of JSON objects.

```
Sampler.loadSampleMapFromJSON(var jsonSampleMap)
```

This function will take an array of JSON objects describing a sample and load it as samplemap. So the days of dragging around a AudioLoop Player just for the user sample import are finally over.The data you need to pass in must have the following format:

```
[
{
	"FileName": "C:\\MyFileName.wav",
	"Root": 64
},
{
	"FileName": "C:\\AnotherSample.wav",
	"SampleStart": 64
}];
```

You can use every property ID that is used in a standard XML samplemap (take a look at one of your samplemaps for inspiration).

If you want to leverage the relative file format using the `{PROJECT_FOLDER}`
wildcard when you are trying to load a sample that is in the actual sample folder of your plugin take a look at File.getReferenceString()

Be aware that you are responsible to store and restore this data in a user preset. The most practical way to do this is to use Sampler.getSampleMapAsBase64()
as this will also take into account if you drag the sample range in an audiowaveform - you could also just save and restore that JSON array that you pass in, but then you will lose all changes you might to to the samplemapping afterwards.

#### **loadSfzFile**

Loads an SFZ file into the sampler.

```
Sampler.loadSfzFile(var sfzFile)
```

This function expects either a String with a full path to the SFZ file or a File
object and will try to parse it and load the multisample set into the Sampler. This finally enables you to offer multisample import on your compiled plugin! Be aware that if you load a SFZ file, the sampler will not store this information automatically, so you need to add a UI component that stores that information and calls this function in its control callback. A suitable candidate for this would be a ScriptPanel with file-drop support using this API function

The SFZ importer is not fully standard compliant (at this point it's just the old HISE SFZ import that has been cleaned up a little bit). However the goal is to offer enough standard compliance so that all mapping information of a SFZ is being imported correctly and without crashing the plugin (obviously stuff like the envelope attack time will never be parsed). If you encounter an issue with a SFZ file, please post it in the forum, then I'll take a look.

#### **parseSampleFile**

Creates a JSON object from the sample file that can be used with loadSampleMapFromJSON. Edit on GitHub

```
Sampler.parseSampleFile(var sampleFile)
```

#### **purgeMicPosition**

Purges all samples of the given mic (Multimic samples only). Edit on GitHub

```
Sampler.purgeMicPosition(String micName, bool shouldBePurged)
```

#### **purgeSampleSelection**

Purges the array of sampler sounds (and unpurges the rest). Edit on GitHub

```
Sampler.purgeSampleSelection(var selection)
```

#### **refreshInterface**

Refreshes the interface. Call this after you changed the properties. Edit on GitHub

```
Sampler.refreshInterface()
```

#### **refreshRRMap**

Recalculates the RR Map. Call this at compile time if you want to use 'getRRGroupForMessage()'. Edit on GitHub

```
Sampler.refreshRRMap()
```

#### **saveCurrentSampleMap**

Saves (and loads) the current samplemap to the given path (which should be the same string as the ID). Edit on GitHub

```
Sampler.saveCurrentSampleMap(String relativePathWithoutXml)
```

#### **selectSounds**

Selects samples using the regex string as wildcard and the selectMode ("SELECT", "ADD", "SUBTRACT") Edit on GitHub

```
Sampler.selectSounds(String regex)
```

#### **setActiveGroup**

Enables the group with the given index (one-based). Works only with samplers and `enableRoundRobin(false)`.

```
Sampler.setActiveGroup(int activeGroupIndex)
```

Note: if you need to rely on this function to set the event ID for a given note with 100% accuracy, you need to use this method instead.

#### **setActiveGroupForEventId**

Enables the group with the given index (one-based) for the given event ID. Works only with samplers and `enableRoundRobin(false)`.

```
Sampler.setActiveGroupForEventId(int eventId, int activeGroupIndex)
```

Usually the Sampler.setActiveGroup
function is all you need in order to programmatically set the round robin group. However there are a few edge cases where this function leads to inaccurate behaviour: if you play multiple notes pretty fast (we're talking about a few milliseconds between events), the MIDI event queue contains more than one note on message per audio buffer. In this case the internal processing order will override the active group index of the last API call before the voices get started. This might result in voices **being started with a different group index than it was set during the MIDI callback execution**.
Usually this isn't problematic because the result is just that it will pick another RR group as desired and if you use this for actual round robin repetitions there is almost no perceivable change in the sound (because chances are great that notes that are being played this fast will be different notes which masks the machine gun effect we're trying to prevent here).

However there are a few use cases
where this becomes a problem so in order to ensure that the group index that you've set during the MIDI callback is guaranteed to be the one that is picked up by the voice allocation logic a few CPU cycles down the line, you will have to use this method instead which takes in the event ID of the message that is about to start the next voice and store it in a internal queue until the voice allocator will use it to set it to the exact group index you've specified here.

This queue has a very limited lifetime and will get automatically cleared after each audio render callback of the sampler. This ensures that it won't stack up "unused" notes, but this also means that this procedure does not work with events that are not processed immediately (eg. because you've delayed them using `Message.delayEvent()`
after calling this method).

The method also works with artificial notes and the internal event queue can store up to 64 note on messages (there's a tradeoff between object size and functionality here but with 64 messages within a single audio callback you should have enough headroom for even the most craziest applications).

#### **setAllowReleaseStart**

Enable / disables the release start feature for the given event.

```
Sampler.setAllowReleaseStart(int eventId, bool shouldBeAllowed)
```

This function can be used to enable / disable the release start feature of a sampler.

You can either disable / enable it for each event by supplying a currently active event ID or globally by passing in `-1`
as event ID. Using it on a per event basis allows you to eg. deactivate the release skip when you're implementing a custom logic (eg. legato intervals).

The function returns true if it has found the provided event ID so you can verify that your script works as intended. It is safe (and recommended) to call this in the noteOff callback and it will be picked up correctly by the given sampler.

#### **setAttribute**

Sets a attribute to the given value. Edit on GitHub

```
Sampler.setAttribute(int index, var newValue)
```

#### **setGUISelection**

Sets the currently selected samples on the interface to the given list. Edit on GitHub

```
Sampler.setGUISelection(var sampleList, bool addToSelection)
```

#### **setMultiGroupIndex**

Enables the group with the given index (one-based). Allows multiple groups to be active.

```
Sampler.setMultiGroupIndex(var groupIndex, bool enabled)
```

This function can be used to enabled multiple groups at once. By default, only one RR group is active at the same time - as long as the Group XF property is disabled, then it will play all groups.

You can define a custom RR behaviour using Sampler.setActiveGroup(), but this function still gives you one exclusively active group.

However there are a few legitimate edge cases where you need multiple, but not all groups enabled - the most common one might be if you want to implement round robin behaviour in combination with Group XF samples.

In order to do so, you can use this function to tell the sampler to allow multiple groups at the same time - you also need to call Sampler.enableRoundRobin(false)
before using this function. The function accepts different types as `groupIndex`
argument:

- an integer (be aware that it's one based to match the other RR functions).
- an array with integers (also one-based). This can be used to predefine static ranges at initialisation and then just pass those arrays in the function to avoid writing loops in HiseScript
- a MidiList. In that case, the `enabled` argument will be discarded and it will enable all groups where the MidiList has a valid entry (`!= -1` ).

Be aware that as soon as you activate this feature by calling this method, the table index used for defining the crossfade gain will be capped to the number of active groups (`groupIndex %= numActiveGroups`
). The rationale behind this is that if you have 4 dynamic layers and 3 round robin repetitions, you still want only 4 tables to be active (instead of 12). However this means that as soon as you use this feature **the amount of dynamic layers must be consistent across RR repetitions**.

```
// A simple example for 2 dynamic layers with 2 RR repetitions.
Sampler.enableRoundRobin(false);

const var g1 = [1, 2, 3];
const var g2 = [4, 5, 6];

reg on = false;

function onNoteOn()
{ // Calling this function tells the sample to just use // the first 3 tables for crossfading Sampler.setMultiGroupIndex(g1, on);
	Sampler.setMultiGroupIndex(g2, !on);
 on = !on;
}
```

Note: if you're using this function in the `onNoteOn`
callback and must ensure that the correct group index state is applied to the current note on message, you will need to use the Sampler.setMultiGroupIndexForEventId()
method which takes in the event ID of the current note. More information about this issue can be found here.

#### **setMultiGroupIndexForEventId**

Enables the group with the given index (one-based) for the given event id. Allows multiple groups to be active.

```
Sampler.setMultiGroupIndexForEventId(int eventId, var groupIndex, bool enabled)
```

This function is the event-ID agnostic variant of `setMultiGroupIndex()`. In order to find out which function to use, take a look at this function
for a description of the problem.

#### **setReleaseStartOptions**

Sets the options for the release start behaviour.

```
Sampler.setReleaseStartOptions(var newOptions)
```

This will set the options for the ReleaseStart
playback mode. Usually you will combine this call with getReleaseStartOptions
which returns a JSON object with all properties:

```
const var obj = Sampler.getReleaseStartOptions();

obj.FadeGamma = 0.5;

Sampler.setReleaseStartOptions(obj);
```

#### **setRRGroupVolume**

Sets the volume of a particular group (use -1 for active group). Only works with disabled crossfade tables. Edit on GitHub

```
Sampler.setRRGroupVolume(int groupIndex, int gainInDecibels)
```

#### **setSortByRRGroup**

Enables a presorting of the sounds into RR groups. This might improve the performance at voice start if you have a lot of samples (> 20.000) in many RR groups. Edit on GitHub

```
Sampler.setSortByRRGroup(bool shouldSort)
```

#### **setSoundProperty**

Sets the property for the index within the selection. Edit on GitHub

```
Sampler.setSoundProperty(int soundIndex, int propertyIndex, var newValue)
```

#### **setSoundPropertyForAllSamples**

Sets the property for all samples of the sampler. Edit on GitHub

```
Sampler.setSoundPropertyForAllSamples(int propertyIndex, var newValue)
```

#### **setSoundPropertyForSelection**

Sets the property of the sampler sound for the selection. Edit on GitHub

```
Sampler.setSoundPropertyForSelection(int propertyIndex, var newValue)
```

#### **setTimestretchOptions**

Sets the timestretching options from a JSON object.

```
Sampler.setTimestretchOptions(var newOptions)
```

This will set the timestretching
options for the sampler using a JSON object. Usually you would get that object with Sampler.getTimestretchOptions(), apply your changes and then call this function with the modified object.

#### **setTimestretchRatio**

Sets the timestretch ratio for the sampler depending on its timestretch mode.

```
Sampler.setTimestretchRatio(double newRatio)
```

This will change the time ratio of the sampler playback when timestretching is enabled.

Depending on the timestretch mode, this value will be applied to new voices or all currently active voices. For an explanation of the different modes, take a look at the Sampler Module Documentation

Currently the time ratio is limited to 50% - 200% of the original time, but that limitation might be lifted at some point.

#### **setUseStaticMatrix**

Disables dynamic resizing when a sample map is loaded. Edit on GitHub

```
Sampler.setUseStaticMatrix(bool shouldUseStaticMatrix)
```

### ScriptAudioWaveform

Create a reference to a AudioWaveform
UI component and modify its values.

```
const var AudioWaveform1 = Content.getComponent("AudioWaveform1");
```

#### **addToMacroControl**

Adds the knob / button to a macro controller (from 0 to 7). Edit on GitHub

```
ScriptAudioWaveform.addToMacroControl(int macroIndex)
```

#### **changed**

Call this to indicate that the value has changed (the onControl callback will be executed. Edit on GitHub

```
ScriptAudioWaveform.changed()
```

#### **createLocalLookAndFeel**

Returns a local look and feel if it was registered before. Edit on GitHub

```
ScriptAudioWaveform.createLocalLookAndFeel(ScriptContentComponent *contentComponent, Component *componentToRegister)
```

#### **fadeComponent**

Toggles the visibility and fades a component using the global animator. Edit on GitHub

```
ScriptAudioWaveform.fadeComponent(bool shouldBeVisible, int milliseconds)
```

#### **get**

returns the value of the property. Edit on GitHub

```
ScriptAudioWaveform.get(String propertyName)
```

#### **getAllProperties**

Returns a list of all property IDs as array. Edit on GitHub

```
ScriptAudioWaveform.getAllProperties()
```

#### **getChildComponents**

Returns list of component's children Edit on GitHub

```
ScriptAudioWaveform.getChildComponents()
```

#### **getGlobalPositionX**

Returns the absolute x-position relative to the interface. Edit on GitHub

```
ScriptAudioWaveform.getGlobalPositionX()
```

#### **getGlobalPositionY**

Returns the absolute y-position relative to the interface. Edit on GitHub

```
ScriptAudioWaveform.getGlobalPositionY()
```

#### **getHeight**

Returns the height of the component. Edit on GitHub

```
ScriptAudioWaveform.getHeight()
```

#### **getId**

Returns the ID of the component. Edit on GitHub

```
ScriptAudioWaveform.getId()
```

#### **getLocalBounds**

Returns a [x, y, w, h] array that was reduced by the given amount. Edit on GitHub

```
ScriptAudioWaveform.getLocalBounds(float reduceAmount)
```

#### **getPopupMenuTarget**

Override this if you want to change the `component`
parameter of the popup menu callback. Edit on GitHub

```
ScriptAudioWaveform.getPopupMenuTarget( MouseEvent e)
```

#### **getRangeEnd**

Returns the current range end. Edit on GitHub

```
ScriptAudioWaveform.getRangeEnd()
```

#### **getRangeStart**

Returns the current range start. Edit on GitHub

```
ScriptAudioWaveform.getRangeStart()
```

#### **getValue**

Returns the current value. Edit on GitHub

```
ScriptAudioWaveform.getValue()
```

#### **getValueNormalized**

Returns the normalized value. Edit on GitHub

```
ScriptAudioWaveform.getValueNormalized()
```

#### **getWidth**

Returns the width of the component. Edit on GitHub

```
ScriptAudioWaveform.getWidth()
```

#### **grabFocus**

Call this method in order to grab the keyboard focus for this component. Edit on GitHub

```
ScriptAudioWaveform.grabFocus()
```

#### **loseFocus**

Call this method in order to give away the focus for this component. Edit on GitHub

```
ScriptAudioWaveform.loseFocus()
```

#### **referToData**

Connects this AudioFile to an existing ScriptAudioFile object. -1 sets it back to its internal data object. Edit on GitHub

```
ScriptAudioWaveform.referToData(var audioData)
```

#### **registerAtParent**

Registers this waveform to the script processor to be acessible from the outside. Edit on GitHub

```
ScriptAudioWaveform.registerAtParent(int pIndex)
```

#### **sendRepaintMessage**

Manually sends a repaint message for the component. Edit on GitHub

```
ScriptAudioWaveform.sendRepaintMessage()
```

#### **set**

Sets the property. Edit on GitHub

```
ScriptAudioWaveform.set(String propertyName, var value)
```

#### **setColour**

sets the colour of the component (BG, IT1, IT2, TXT). Edit on GitHub

```
ScriptAudioWaveform.setColour(int colourId, int colourAs32bitHex)
```

#### **setConsumedKeyPresses**

Registers a selection of key presses to be consumed by this component. Edit on GitHub

```
ScriptAudioWaveform.setConsumedKeyPresses(var listOfKeys)
```

#### **setControlCallback**

Pass a inline function for a custom callback event. Edit on GitHub

```
ScriptAudioWaveform.setControlCallback(var controlFunction)
```

#### **setDefaultFolder**

Set the folder to be used when opening the file browser. Edit on GitHub

```
ScriptAudioWaveform.setDefaultFolder(var newDefaultFolder)
```

#### **setKeyPressCallback**

Adds a callback to react on key presses (when this component is focused). Edit on GitHub

```
ScriptAudioWaveform.setKeyPressCallback(var keyboardFunction)
```

#### **setLocalLookAndFeel**

Attaches the local look and feel to this component. Edit on GitHub

```
ScriptAudioWaveform.setLocalLookAndFeel(var lafObject)
```

#### **setPlaybackPosition**

Sets the playback position. Edit on GitHub

```
ScriptAudioWaveform.setPlaybackPosition(double normalisedPosition)
```

#### **setPosition**

Sets the position of the component. Edit on GitHub

```
ScriptAudioWaveform.setPosition(int x, int y, int w, int h)
```

#### **setPropertiesFromJSON**

Restores all properties from a JSON object. Edit on GitHub

```
ScriptAudioWaveform.setPropertiesFromJSON( var jsonData)
```

#### **setStyleSheetClass**

Sets the given class selectors for the component stylesheet. Edit on GitHub

```
ScriptAudioWaveform.setStyleSheetClass( String classIds)
```

#### **setStyleSheetProperty**

Sets a variable for this component that can be queried from a style sheet. Edit on GitHub

```
ScriptAudioWaveform.setStyleSheetProperty( String variableId,  var value,  String type)
```

#### **setStyleSheetPseudoState**

Programatically sets a pseudo state (:hover,:active,:checked,:focus,:disabled) that will be used by the CSS renderer. Edit on GitHub

```
ScriptAudioWaveform.setStyleSheetPseudoState( String pseudoState)
```

#### **setTooltip**

Shows a informative text on mouse hover. Edit on GitHub

```
ScriptAudioWaveform.setTooltip( String tooltip)
```

#### **setValue**

Sets the current value Edit on GitHub

```
ScriptAudioWaveform.setValue(var newValue)
```

#### **setValueNormalized**

Sets the current value from a range 0.0... 1.0. Edit on GitHub

```
ScriptAudioWaveform.setValueNormalized(double normalizedValue)
```

#### **setValueWithUndo**

Sets the current value and adds it to the undo list. Don't call this from onControl! Edit on GitHub

```
ScriptAudioWaveform.setValueWithUndo(var newValue)
```

#### **setZLevel**

Changes the depth hierarchy (z-axis) of sibling components (Back, Default, Front or AlwaysOnTop). Edit on GitHub

```
ScriptAudioWaveform.setZLevel(String zLevel)
```

#### **showControl**

Hides / Shows the control. Edit on GitHub

```
ScriptAudioWaveform.showControl(bool shouldBeVisible)
```

#### **updateContentPropertyInternal**

This updates the internal content data object from the script processor. Edit on GitHub

```
ScriptAudioWaveform.updateContentPropertyInternal(int propertyId,  var newValue)
```

#### **updateValueFromProcessorConnection**

Updates the value from the processor connection. Call this method whenever the module state has changed and you want to refresh the knob value to show the current state. Edit on GitHub

```
ScriptAudioWaveform.updateValueFromProcessorConnection()
```

### ScriptButton

Create a reference to a Button
UI component and modify its values.

```
const var Button1 = Content.getComponent("Button1");
```

#### **addToMacroControl**

Adds the knob / button to a macro controller (from 0 to 7). Edit on GitHub

```
ScriptButton.addToMacroControl(int macroIndex)
```

#### **changed**

Call this to indicate that the value has changed (the onControl callback will be executed. Edit on GitHub

```
ScriptButton.changed()
```

#### **createLocalLookAndFeel**

Returns a local look and feel if it was registered before. Edit on GitHub

```
ScriptButton.createLocalLookAndFeel(ScriptContentComponent *contentComponent, Component *componentToRegister)
```

#### **fadeComponent**

Toggles the visibility and fades a component using the global animator. Edit on GitHub

```
ScriptButton.fadeComponent(bool shouldBeVisible, int milliseconds)
```

#### **get**

returns the value of the property. Edit on GitHub

```
ScriptButton.get(String propertyName)
```

#### **getAllProperties**

Returns a list of all property IDs as array. Edit on GitHub

```
ScriptButton.getAllProperties()
```

#### **getChildComponents**

Returns list of component's children Edit on GitHub

```
ScriptButton.getChildComponents()
```

#### **getGlobalPositionX**

Returns the absolute x-position relative to the interface. Edit on GitHub

```
ScriptButton.getGlobalPositionX()
```

#### **getGlobalPositionY**

Returns the absolute y-position relative to the interface. Edit on GitHub

```
ScriptButton.getGlobalPositionY()
```

#### **getHeight**

Returns the height of the component. Edit on GitHub

```
ScriptButton.getHeight()
```

#### **getId**

Returns the ID of the component. Edit on GitHub

```
ScriptButton.getId()
```

#### **getLocalBounds**

Returns a [x, y, w, h] array that was reduced by the given amount. Edit on GitHub

```
ScriptButton.getLocalBounds(float reduceAmount)
```

#### **getPopupMenuTarget**

Override this if you want to change the `component`
parameter of the popup menu callback. Edit on GitHub

```
ScriptButton.getPopupMenuTarget( MouseEvent e)
```

#### **getValue**

Returns the current value. Edit on GitHub

```
ScriptButton.getValue()
```

#### **getValueNormalized**

Returns the normalized value. Edit on GitHub

```
ScriptButton.getValueNormalized()
```

#### **getWidth**

Returns the width of the component. Edit on GitHub

```
ScriptButton.getWidth()
```

#### **grabFocus**

Call this method in order to grab the keyboard focus for this component. Edit on GitHub

```
ScriptButton.grabFocus()
```

#### **loseFocus**

Call this method in order to give away the focus for this component. Edit on GitHub

```
ScriptButton.loseFocus()
```

#### **sendRepaintMessage**

Manually sends a repaint message for the component. Edit on GitHub

```
ScriptButton.sendRepaintMessage()
```

#### **set**

Sets the property. Edit on GitHub

```
ScriptButton.set(String propertyName, var value)
```

#### **setColour**

sets the colour of the component (BG, IT1, IT2, TXT). Edit on GitHub

```
ScriptButton.setColour(int colourId, int colourAs32bitHex)
```

#### **setConsumedKeyPresses**

Registers a selection of key presses to be consumed by this component. Edit on GitHub

```
ScriptButton.setConsumedKeyPresses(var listOfKeys)
```

#### **setControlCallback**

Pass a inline function for a custom callback event. Edit on GitHub

```
ScriptButton.setControlCallback(var controlFunction)
```

#### **setKeyPressCallback**

Adds a callback to react on key presses (when this component is focused). Edit on GitHub

```
ScriptButton.setKeyPressCallback(var keyboardFunction)
```

#### **setLocalLookAndFeel**

Attaches the local look and feel to this component. Edit on GitHub

```
ScriptButton.setLocalLookAndFeel(var lafObject)
```

#### **setPopupData**

Sets a FloatingTile that is used as popup. Edit on GitHub

```
ScriptButton.setPopupData(var jsonData, var position)
```

#### **setPosition**

Sets the position of the component. Edit on GitHub

```
ScriptButton.setPosition(int x, int y, int w, int h)
```

#### **setPropertiesFromJSON**

Restores all properties from a JSON object. Edit on GitHub

```
ScriptButton.setPropertiesFromJSON( var jsonData)
```

#### **setStyleSheetClass**

Sets the given class selectors for the component stylesheet.

```
ScriptButton.setStyleSheetClass( String classIds)
```

This will write the given CSS class selectors
to the component so that it can change what selectors are applied to the component.

The argument expects a string that follows the syntax of defining class selectors in HTML: a whitespace separated list of class selectors.

`".classone.classtwo.classthree"`

Calling this method will update the classes for the component and invalidate the style sheet to be recalculated. This can be used to alter the appearance of a UI component.

For a change of a single property using the setStyleSheetProperty
function might be a better tool.

#### **setStyleSheetProperty**

Sets a variable for this component that can be queried from a style sheet. Edit on GitHub

```
ScriptButton.setStyleSheetProperty( String variableId,  var value,  String type)
```

#### **setStyleSheetPseudoState**

Programatically sets a pseudo state (:hover,:active,:checked,:focus,:disabled) that will be used by the CSS renderer. Edit on GitHub

```
ScriptButton.setStyleSheetPseudoState( String pseudoState)
```

#### **setTooltip**

Shows a informative text on mouse hover. Edit on GitHub

```
ScriptButton.setTooltip( String tooltip)
```

#### **setValue**

Sets the current value Edit on GitHub

```
ScriptButton.setValue(var newValue)
```

#### **setValueNormalized**

Sets the current value from a range 0.0... 1.0. Edit on GitHub

```
ScriptButton.setValueNormalized(double normalizedValue)
```

#### **setValueWithUndo**

Sets the current value and adds it to the undo list. Don't call this from onControl! Edit on GitHub

```
ScriptButton.setValueWithUndo(var newValue)
```

#### **setZLevel**

Changes the depth hierarchy (z-axis) of sibling components (Back, Default, Front or AlwaysOnTop). Edit on GitHub

```
ScriptButton.setZLevel(String zLevel)
```

#### **showControl**

Hides / Shows the control. Edit on GitHub

```
ScriptButton.showControl(bool shouldBeVisible)
```

#### **updateContentPropertyInternal**

This updates the internal content data object from the script processor. Edit on GitHub

```
ScriptButton.updateContentPropertyInternal(int propertyId,  var newValue)
```

#### **updateValueFromProcessorConnection**

Updates the value from the processor connection. Call this method whenever the module state has changed and you want to refresh the knob value to show the current state. Edit on GitHub

```
ScriptButton.updateValueFromProcessorConnection()
```

### ScriptComboBox

Create a reference to a Combobox
UI component and modify its values.

```
const var Combobox1 = Content.getComponent("Combobox1");
```

#### **addItem**

Adds an item to a combo box. Edit on GitHub

```
ScriptComboBox.addItem( String newName)
```

#### **addToMacroControl**

Adds the knob / button to a macro controller (from 0 to 7). Edit on GitHub

```
ScriptComboBox.addToMacroControl(int macroIndex)
```

#### **changed**

Call this to indicate that the value has changed (the onControl callback will be executed. Edit on GitHub

```
ScriptComboBox.changed()
```

#### **createLocalLookAndFeel**

Returns a local look and feel if it was registered before. Edit on GitHub

```
ScriptComboBox.createLocalLookAndFeel(ScriptContentComponent *contentComponent, Component *componentToRegister)
```

#### **fadeComponent**

Toggles the visibility and fades a component using the global animator. Edit on GitHub

```
ScriptComboBox.fadeComponent(bool shouldBeVisible, int milliseconds)
```

#### **get**

returns the value of the property. Edit on GitHub

```
ScriptComboBox.get(String propertyName)
```

#### **getAllProperties**

Returns a list of all property IDs as array. Edit on GitHub

```
ScriptComboBox.getAllProperties()
```

#### **getChildComponents**

Returns list of component's children Edit on GitHub

```
ScriptComboBox.getChildComponents()
```

#### **getGlobalPositionX**

Returns the absolute x-position relative to the interface. Edit on GitHub

```
ScriptComboBox.getGlobalPositionX()
```

#### **getGlobalPositionY**

Returns the absolute y-position relative to the interface. Edit on GitHub

```
ScriptComboBox.getGlobalPositionY()
```

#### **getHeight**

Returns the height of the component. Edit on GitHub

```
ScriptComboBox.getHeight()
```

#### **getId**

Returns the ID of the component. Edit on GitHub

```
ScriptComboBox.getId()
```

#### **getItemText**

Returns the currently selected item text. Edit on GitHub

```
ScriptComboBox.getItemText()
```

#### **getLocalBounds**

Returns a [x, y, w, h] array that was reduced by the given amount. Edit on GitHub

```
ScriptComboBox.getLocalBounds(float reduceAmount)
```

#### **getPopupMenuTarget**

Override this if you want to change the `component`
parameter of the popup menu callback. Edit on GitHub

```
ScriptComboBox.getPopupMenuTarget( MouseEvent e)
```

#### **getValue**

Returns the current value. Edit on GitHub

```
ScriptComboBox.getValue()
```

#### **getValueNormalized**

Returns the normalized value. Edit on GitHub

```
ScriptComboBox.getValueNormalized()
```

#### **getWidth**

Returns the width of the component. Edit on GitHub

```
ScriptComboBox.getWidth()
```

#### **grabFocus**

Call this method in order to grab the keyboard focus for this component. Edit on GitHub

```
ScriptComboBox.grabFocus()
```

#### **loseFocus**

Call this method in order to give away the focus for this component. Edit on GitHub

```
ScriptComboBox.loseFocus()
```

#### **sendRepaintMessage**

Manually sends a repaint message for the component. Edit on GitHub

```
ScriptComboBox.sendRepaintMessage()
```

#### **set**

Sets the property. Edit on GitHub

```
ScriptComboBox.set(String propertyName, var value)
```

#### **setColour**

sets the colour of the component (BG, IT1, IT2, TXT). Edit on GitHub

```
ScriptComboBox.setColour(int colourId, int colourAs32bitHex)
```

#### **setConsumedKeyPresses**

Registers a selection of key presses to be consumed by this component. Edit on GitHub

```
ScriptComboBox.setConsumedKeyPresses(var listOfKeys)
```

#### **setControlCallback**

Pass a inline function for a custom callback event. Edit on GitHub

```
ScriptComboBox.setControlCallback(var controlFunction)
```

#### **setKeyPressCallback**

Adds a callback to react on key presses (when this component is focused). Edit on GitHub

```
ScriptComboBox.setKeyPressCallback(var keyboardFunction)
```

#### **setLocalLookAndFeel**

Attaches the local look and feel to this component. Edit on GitHub

```
ScriptComboBox.setLocalLookAndFeel(var lafObject)
```

#### **setPosition**

Sets the position of the component. Edit on GitHub

```
ScriptComboBox.setPosition(int x, int y, int w, int h)
```

#### **setPropertiesFromJSON**

Restores all properties from a JSON object. Edit on GitHub

```
ScriptComboBox.setPropertiesFromJSON( var jsonData)
```

#### **setStyleSheetClass**

Sets the given class selectors for the component stylesheet. Edit on GitHub

```
ScriptComboBox.setStyleSheetClass( String classIds)
```

#### **setStyleSheetProperty**

Sets a variable for this component that can be queried from a style sheet. Edit on GitHub

```
ScriptComboBox.setStyleSheetProperty( String variableId,  var value,  String type)
```

#### **setStyleSheetPseudoState**

Programatically sets a pseudo state (:hover,:active,:checked,:focus,:disabled) that will be used by the CSS renderer. Edit on GitHub

```
ScriptComboBox.setStyleSheetPseudoState( String pseudoState)
```

#### **setTooltip**

Shows a informative text on mouse hover. Edit on GitHub

```
ScriptComboBox.setTooltip( String tooltip)
```

#### **setValue**

Sets the current value Edit on GitHub

```
ScriptComboBox.setValue(var newValue)
```

#### **setValueNormalized**

Sets the current value from a range 0.0... 1.0. Edit on GitHub

```
ScriptComboBox.setValueNormalized(double normalizedValue)
```

#### **setValueWithUndo**

Sets the current value and adds it to the undo list. Don't call this from onControl! Edit on GitHub

```
ScriptComboBox.setValueWithUndo(var newValue)
```

#### **setZLevel**

Changes the depth hierarchy (z-axis) of sibling components (Back, Default, Front or AlwaysOnTop). Edit on GitHub

```
ScriptComboBox.setZLevel(String zLevel)
```

#### **showControl**

Hides / Shows the control. Edit on GitHub

```
ScriptComboBox.showControl(bool shouldBeVisible)
```

#### **updateContentPropertyInternal**

This updates the internal content data object from the script processor. Edit on GitHub

```
ScriptComboBox.updateContentPropertyInternal(int propertyId,  var newValue)
```

#### **updateValueFromProcessorConnection**

Updates the value from the processor connection. Call this method whenever the module state has changed and you want to refresh the knob value to show the current state. Edit on GitHub

```
ScriptComboBox.updateValueFromProcessorConnection()
```

### ScriptDynamicContainer

#### **addToMacroControl**

Adds the knob / button to a macro controller (from 0 to 7). Edit on GitHub

```
ScriptDynamicContainer.addToMacroControl(int macroIndex)
```

#### **changed**

Call this to indicate that the value has changed (the onControl callback will be executed. Edit on GitHub

```
ScriptDynamicContainer.changed()
```

#### **createLocalLookAndFeel**

Returns a local look and feel if it was registered before. Edit on GitHub

```
ScriptDynamicContainer.createLocalLookAndFeel(ScriptContentComponent *contentComponent, Component *componentToRegister)
```

#### **fadeComponent**

Toggles the visibility and fades a component using the global animator. Edit on GitHub

```
ScriptDynamicContainer.fadeComponent(bool shouldBeVisible, int milliseconds)
```

#### **get**

returns the value of the property. Edit on GitHub

```
ScriptDynamicContainer.get(String propertyName)
```

#### **getAllProperties**

Returns a list of all property IDs as array. Edit on GitHub

```
ScriptDynamicContainer.getAllProperties()
```

#### **getChildComponents**

Returns list of component's children Edit on GitHub

```
ScriptDynamicContainer.getChildComponents()
```

#### **getGlobalPositionX**

Returns the absolute x-position relative to the interface. Edit on GitHub

```
ScriptDynamicContainer.getGlobalPositionX()
```

#### **getGlobalPositionY**

Returns the absolute y-position relative to the interface. Edit on GitHub

```
ScriptDynamicContainer.getGlobalPositionY()
```

#### **getHeight**

Returns the height of the component. Edit on GitHub

```
ScriptDynamicContainer.getHeight()
```

#### **getId**

Returns the ID of the component. Edit on GitHub

```
ScriptDynamicContainer.getId()
```

#### **getLocalBounds**

Returns a [x, y, w, h] array that was reduced by the given amount. Edit on GitHub

```
ScriptDynamicContainer.getLocalBounds(float reduceAmount)
```

#### **getValue**

Returns the current value. Edit on GitHub

```
ScriptDynamicContainer.getValue()
```

#### **getValueNormalized**

Returns the normalized value. Edit on GitHub

```
ScriptDynamicContainer.getValueNormalized()
```

#### **getWidth**

Returns the width of the component. Edit on GitHub

```
ScriptDynamicContainer.getWidth()
```

#### **grabFocus**

Call this method in order to grab the keyboard focus for this component. Edit on GitHub

```
ScriptDynamicContainer.grabFocus()
```

#### **loseFocus**

Call this method in order to give away the focus for this component. Edit on GitHub

```
ScriptDynamicContainer.loseFocus()
```

#### **sendRepaintMessage**

Manually sends a repaint message for the component. Edit on GitHub

```
ScriptDynamicContainer.sendRepaintMessage()
```

#### **set**

Sets the property. Edit on GitHub

```
ScriptDynamicContainer.set(String propertyName, var value)
```

#### **setColour**

sets the colour of the component (BG, IT1, IT2, TXT). Edit on GitHub

```
ScriptDynamicContainer.setColour(int colourId, int colourAs32bitHex)
```

#### **setConsumedKeyPresses**

Registers a selection of key presses to be consumed by this component. Edit on GitHub

```
ScriptDynamicContainer.setConsumedKeyPresses(var listOfKeys)
```

#### **setControlCallback**

Pass a inline function for a custom callback event. Edit on GitHub

```
ScriptDynamicContainer.setControlCallback(var controlFunction)
```

#### **setData**

Sets the content data for this container. Edit on GitHub

```
ScriptDynamicContainer.setData( var newData)
```

#### **setKeyPressCallback**

Adds a callback to react on key presses (when this component is focused). Edit on GitHub

```
ScriptDynamicContainer.setKeyPressCallback(var keyboardFunction)
```

#### **setLocalLookAndFeel**

Attaches the local look and feel to this component. Edit on GitHub

```
ScriptDynamicContainer.setLocalLookAndFeel(var lafObject)
```

#### **setPosition**

Sets the position of the component. Edit on GitHub

```
ScriptDynamicContainer.setPosition(int x, int y, int w, int h)
```

#### **setPropertiesFromJSON**

Restores all properties from a JSON object. Edit on GitHub

```
ScriptDynamicContainer.setPropertiesFromJSON( var jsonData)
```

#### **setStyleSheetClass**

Sets the given class selectors for the component stylesheet. Edit on GitHub

```
ScriptDynamicContainer.setStyleSheetClass( String classIds)
```

#### **setStyleSheetProperty**

Sets a variable for this component that can be queried from a style sheet. Edit on GitHub

```
ScriptDynamicContainer.setStyleSheetProperty( String variableId,  var value,  String type)
```

#### **setStyleSheetPseudoState**

Programatically sets a pseudo state (:hover,:active,:checked,:focus,:disabled) that will be used by the CSS renderer. Edit on GitHub

```
ScriptDynamicContainer.setStyleSheetPseudoState( String pseudoState)
```

#### **setTooltip**

Shows a informative text on mouse hover. Edit on GitHub

```
ScriptDynamicContainer.setTooltip( String tooltip)
```

#### **setValue**

Sets the current value Edit on GitHub

```
ScriptDynamicContainer.setValue(var newValue)
```

#### **setValueCallback**

Sets a callback that will be executed whenever a value is changed. Edit on GitHub

```
ScriptDynamicContainer.setValueCallback( var valueFunction)
```

#### **setValueNormalized**

Sets the current value from a range 0.0... 1.0. Edit on GitHub

```
ScriptDynamicContainer.setValueNormalized(double normalizedValue)
```

#### **setValueWithUndo**

Sets the current value and adds it to the undo list. Don't call this from onControl! Edit on GitHub

```
ScriptDynamicContainer.setValueWithUndo(var newValue)
```

#### **setZLevel**

Changes the depth hierarchy (z-axis) of sibling components (Back, Default, Front or AlwaysOnTop). Edit on GitHub

```
ScriptDynamicContainer.setZLevel(String zLevel)
```

#### **showControl**

Hides / Shows the control. Edit on GitHub

```
ScriptDynamicContainer.showControl(bool shouldBeVisible)
```

#### **updateContentPropertyInternal**

This updates the internal content data object from the script processor. Edit on GitHub

```
ScriptDynamicContainer.updateContentPropertyInternal(int propertyId,  var newValue)
```

#### **updateValueFromProcessorConnection**

Updates the value from the processor connection. Call this method whenever the module state has changed and you want to refresh the knob value to show the current state. Edit on GitHub

```
ScriptDynamicContainer.updateValueFromProcessorConnection()
```

### ScriptedViewport

Create a reference to a Viewport
UI component and modify its values.

```
const var Viewport1 = Content.getComponent("Viewport1");
```

#### **addToMacroControl**

Adds the knob / button to a macro controller (from 0 to 7). Edit on GitHub

```
ScriptedViewport.addToMacroControl(int macroIndex)
```

#### **changed**

Call this to indicate that the value has changed (the onControl callback will be executed. Edit on GitHub

```
ScriptedViewport.changed()
```

#### **createLocalLookAndFeel**

Returns a local look and feel if it was registered before. Edit on GitHub

```
ScriptedViewport.createLocalLookAndFeel(ScriptContentComponent *contentComponent, Component *componentToRegister)
```

#### **fadeComponent**

Toggles the visibility and fades a component using the global animator. Edit on GitHub

```
ScriptedViewport.fadeComponent(bool shouldBeVisible, int milliseconds)
```

#### **get**

returns the value of the property. Edit on GitHub

```
ScriptedViewport.get(String propertyName)
```

#### **getAllProperties**

Returns a list of all property IDs as array. Edit on GitHub

```
ScriptedViewport.getAllProperties()
```

#### **getChildComponents**

Returns list of component's children Edit on GitHub

```
ScriptedViewport.getChildComponents()
```

#### **getGlobalPositionX**

Returns the absolute x-position relative to the interface. Edit on GitHub

```
ScriptedViewport.getGlobalPositionX()
```

#### **getGlobalPositionY**

Returns the absolute y-position relative to the interface. Edit on GitHub

```
ScriptedViewport.getGlobalPositionY()
```

#### **getHeight**

Returns the height of the component. Edit on GitHub

```
ScriptedViewport.getHeight()
```

#### **getId**

Returns the ID of the component. Edit on GitHub

```
ScriptedViewport.getId()
```

#### **getLocalBounds**

Returns a [x, y, w, h] array that was reduced by the given amount. Edit on GitHub

```
ScriptedViewport.getLocalBounds(float reduceAmount)
```

#### **getOriginalRowIndex**

Returns the index of the original data passed into setTableRowData. Edit on GitHub

```
ScriptedViewport.getOriginalRowIndex(int rowIndex)
```

#### **getPopupMenuTarget**

Override this if you want to change the `component`
parameter of the popup menu callback. Edit on GitHub

```
ScriptedViewport.getPopupMenuTarget( MouseEvent e)
```

#### **getValue**

Returns the current value. Edit on GitHub

```
ScriptedViewport.getValue()
```

#### **getValueNormalized**

Returns the normalized value. Edit on GitHub

```
ScriptedViewport.getValueNormalized()
```

#### **getWidth**

Returns the width of the component. Edit on GitHub

```
ScriptedViewport.getWidth()
```

#### **grabFocus**

Call this method in order to grab the keyboard focus for this component. Edit on GitHub

```
ScriptedViewport.grabFocus()
```

#### **loseFocus**

Call this method in order to give away the focus for this component. Edit on GitHub

```
ScriptedViewport.loseFocus()
```

#### **sendRepaintMessage**

Manually sends a repaint message for the component. Edit on GitHub

```
ScriptedViewport.sendRepaintMessage()
```

#### **set**

Sets the property. Edit on GitHub

```
ScriptedViewport.set(String propertyName, var value)
```

#### **setColour**

sets the colour of the component (BG, IT1, IT2, TXT). Edit on GitHub

```
ScriptedViewport.setColour(int colourId, int colourAs32bitHex)
```

#### **setConsumedKeyPresses**

Registers a selection of key presses to be consumed by this component. Edit on GitHub

```
ScriptedViewport.setConsumedKeyPresses(var listOfKeys)
```

#### **setControlCallback**

Pass a inline function for a custom callback event. Edit on GitHub

```
ScriptedViewport.setControlCallback(var controlFunction)
```

#### **setEventTypesForValueCallback**

Specify the event types that should trigger a setValue() callback.

```
ScriptedViewport.setEventTypesForValueCallback(var eventTypeList)
```

If you want the table to store the current selection in its value slot (for saving & restoring), you can supply a list of event types that trigger a call to `setValue()`. The parameter must be a array of strings from this list:

```
["Selection", "SingleClick", "DoubleClick", "ReturnKey" ]
```

The value that is stored is either the row index (starting with 0) or if you're in multi-column mode, an array with the data `[columnIndex, rowIndex]`
(again, zero-based).

Be aware that using this method will also make the table use the undo manager if the `useUndoManager`
flag is set.

Note that if you have assigned a callback to the table with setTableCallback, the JSON object of the callback will have set the type to `SetValue`
or `Undo`
if you call `setValue()`
or `Engine.undo()`, so you should handle those cases gracefully in your callback too.

#### **setKeyPressCallback**

Adds a callback to react on key presses (when this component is focused). Edit on GitHub

```
ScriptedViewport.setKeyPressCallback(var keyboardFunction)
```

#### **setLocalLookAndFeel**

Attaches the local look and feel to this component. Edit on GitHub

```
ScriptedViewport.setLocalLookAndFeel(var lafObject)
```

#### **setPosition**

Sets the position of the component. Edit on GitHub

```
ScriptedViewport.setPosition(int x, int y, int w, int h)
```

#### **setPropertiesFromJSON**

Restores all properties from a JSON object. Edit on GitHub

```
ScriptedViewport.setPropertiesFromJSON( var jsonData)
```

#### **setStyleSheetClass**

Sets the given class selectors for the component stylesheet. Edit on GitHub

```
ScriptedViewport.setStyleSheetClass( String classIds)
```

#### **setStyleSheetProperty**

Sets a variable for this component that can be queried from a style sheet. Edit on GitHub

```
ScriptedViewport.setStyleSheetProperty( String variableId,  var value,  String type)
```

#### **setStyleSheetPseudoState**

Programatically sets a pseudo state (:hover,:active,:checked,:focus,:disabled) that will be used by the CSS renderer. Edit on GitHub

```
ScriptedViewport.setStyleSheetPseudoState( String pseudoState)
```

#### **setTableCallback**

Set a function that is notified for all user interaction with the table.

```
ScriptedViewport.setTableCallback(var callbackFunction)
```

You can assign a callback that will be executed whenever there is an user interaction with the table:

- selection changes (using keyboard or mouse clicks)
- click / double click on cells
- deleting a row (pressing delete when one or multiple rows are selected)
- slider drag
- button click

The parameter you pass in must be a function with a single parameter, which will hold a JSON object with the callback data. It will have these properties:

**Property** | **Type** | **Description** || Type | String | A string indicating the callback type. This can be one of these values: `"Slider"`, `"Button"`, `"Selection"`, `"Click"`, `"DoubleClick"`, `"ReturnKey"`, `"DeleteRow"` |
| rowIndex | int | the (zero-based) row index |
| columnID | String | the ID of the column as defined with the setColumnData function. |
| value | number or object | Depending on the callback type, this is either the value of the UI element (slider or button) or the entire row data for the other event types. |

#### **setTableColumns**

Define the columns of the table. This can only be done in the onInit callback.

```
ScriptedViewport.setTableColumns(var columnMetadata)
```

This method can be used to define the column layout of the table. It expects a single argument with a list of JSON objects for every column you want to add to your table. This function must be called after setting the table metadata and before populating the table with row data.

**Property** | **Type** | **Description** || ID | String | A unique ID for each column. |
| Type | String | Defines the UI element for the given column. This can be either `"Text"`, `"Button"`, `"Slider"` or `"ComboBox"`. |
| Label | String | A string that is used for the column header. If this is undefined, the ID property will be used instead. |
| Focus | bool | If MultiColumnMode is enabled, this will control whether a left / right key press will focus this cell. Set to false if you want to skip that column (default is true). |
| Visible | bool | By default all columns are visible, but you can hide a column in order to use the ID as hidden metadata. |
| MinWidth | int | the minimum size of the column. |
| MaxWidth | int | the maximum width of the column. -1 for auto-fit |
| Width | int | the standard width of the column. If undefined, it will use the minimum width. |

###### **Sliders**

If the column should be a slider you will have these additional properties:

**Property** | **Type** | **Description** || MinValue | double | the minimum value. |
| MaxValue | double | the maximum value. |
| SkewFactor | double | the skew factor. |
| StepSize | double | the step size. |

You can override the default look and feel of the slider with the "drawLinearSlider" method.

###### **Buttons**

If the column should display a button, you can use these additional properties:

**Property** | **Type** | **Description** || Toggle | bool | whether the button is momentary or has a toggle state. |
| Text | String | The text to show on the display. |

You can override the default look and feel of the button with the "drawToggleButton" method.

###### **Comboboxes**

If the columns should display a Combobox, you can use these additional properties:

**Property** | **Type** | **Description** || items | Array | The list of items you want to show |
| ValueMode | String | defines how the value is supposed to be interpreted. |
| Value | var | defines the default value of the combobox. The format of the value is defined by the ValueMode property |
| Text | String | The text to show when nothing is selected. |

The `ValueMode`
property defines how the value is supposed to be interpreted. There are three options:

- "ID" uses a one-based integer (so the first value is 1). This is how the combobox in HISE works and is the default
- "Index" uses a zero-based integer (so the first value is 0).
- "Text" expects a string as value and searches the items to set it to the respective entry

The properties `Value`
and `items`
are dynamic, which means that you can pass in a JSON object into setTableRowData() to define different item lists for different rows:

```
const var ModTable = Content.getComponent("Viewport1");

ModTable.setTableMode({
	"MultiColumnMode": false,
	"HeaderHeight": 32,
	"RowHeight": 32,
	"ScrollOnDrag": false
});

ModTable.setTableRowData([
{
	"Source": "Source",
	"Mode":
	{
		"items": ["Yes", "No", "Maybe"],
		"Value": "No"
	}
},
{
	"Source": "Other Source",
	"Mode":
	{
		"items": ["Some other item", "Second"],
		"Value": "Second"
	}
}]);

ModTable.setTableColumns([
{
	"ID": "Source",
	"Type": "Text",
	"MinWidth": 150
},
{
	"ID": "Mode",
	"Type": "ComboBox",
	"MinWidth": 80,
	"Toggle": true,
	"Text": "Default",
	"ValueMode": "Text"
}
]);
```

You can override the default look and feel of the combobox with the "drawComboBox" method.

#### **setTableMode**

Turns this viewport into a table with the given metadata. This can only be done in the onInit callback.

```
ScriptedViewport.setTableMode(var tableMetadata)
```

Calling this function will turn this Viewport into a table with multiple columns and dynamic row data. The function expects a JSON object as single argument which contains some metadata properties that define the appearance and behaviour of the table.

**Property** | **Type** | **Description** || MultiColumnMode | bool | If enabled, the table will treat each column as individual data entity (see above for a detailed explanation of this mode). |
| HeaderHeight | int | The height of the column header. If this is 0, it will be hidden. |
| RowHeight | int | the height of each row. |
| Sortable | bool | If this is set, then clicking on the column header will set it to be the sort column, and clicking again will reverse the order.. |
| MultiSelection | bool | if enabled, this allows selection of multiple rows at once. |
| ScrollOnDrag | bool | if enabled, dragging the mouse will scroll the viewport (like on a web browser). If disabled, you'll need to use the scrollbars. |
| SliderRangeIdSet | String | if you're using sliders in a cell, you can define which ID set is used to fetch the range limits. This is useful if you're displaying JSON data with a fixed format (eg. the output of Midiautomationhandler.getAutomationDataObject() ). The possible values are `"scriptnode"`, `"ScriptComponent"`, `"MidiAutomation"` and `"MidiAutomationFull"` (check the console output for a list of range ids that is used when you call this method with this property). |
| CallbackOnSliderDrag | bool | This controls whether the sliders in the table will send a update while dragging or just when you lift the mouse button. In some cases, you will need to skip the updates while dragging because it will spawn a heavyweight operation that you only want to perform once (eg. when setting the automation data from the JSON object). |

This function needs to be called before any other function related to tables. Also be aware that calling this function is only possible during the onInit callback.

##### **Multi-column mode**

If you set the `MultiColumnMode`
property to true, it will cause repaints whenever you hover over cells. This can be useful if you want to arrange your data in a 2D space (eg. if you're creating a browser that displays multiple files in a row). You can also use `setValue()`
with a `[columnIndex, rowIndex]`
array to set the active cell programatically (and if the viewport has the `saveInPreset`
flag, it will cause a callback when you load user presets).

In this mode, the viewport will also support horizontal navigation with the left-right arrow keys and it will fire the table callback whenever a cell has changed.

Please be aware that the default appearance will still highlight the entire row, so you need to customize the `drawTableCell`
function with a LAF object. In this callback, the `selected`
property will stil be true for the entire row, but you can use the `clicked`
and `hover`
property to figure out which cell is active / hovered.

#### **setTableRowData**

Update the row data for the table.

```
ScriptedViewport.setTableRowData(var tableData)
```

If you have setup this Viewport as a table, you can use this method in order to populate the rows of the table.

The argument must be a list of JSON objects, which must define a value for every column ID:

- Button columns must be true or false
- Slider columns must be a number
- Text columns must be a string

The data you pass in will not be copied, so if you modify the data, it will update the table content.

Also dragging the slider or clicking the button in a column will update the values in this object (so you don't have to do this manually in the table callback).

#### **setTableSortFunction**

Sets a custom function that can be used in order to sort the table if the user clicks on a column header. Edit on GitHub

```
ScriptedViewport.setTableSortFunction(var sortFunction)
```

#### **setTooltip**

Shows a informative text on mouse hover. Edit on GitHub

```
ScriptedViewport.setTooltip( String tooltip)
```

#### **setValueNormalized**

Sets the current value from a range 0.0... 1.0. Edit on GitHub

```
ScriptedViewport.setValueNormalized(double normalizedValue)
```

#### **setValueWithUndo**

Sets the current value and adds it to the undo list. Don't call this from onControl! Edit on GitHub

```
ScriptedViewport.setValueWithUndo(var newValue)
```

#### **setZLevel**

Changes the depth hierarchy (z-axis) of sibling components (Back, Default, Front or AlwaysOnTop). Edit on GitHub

```
ScriptedViewport.setZLevel(String zLevel)
```

#### **showControl**

Hides / Shows the control. Edit on GitHub

```
ScriptedViewport.showControl(bool shouldBeVisible)
```

#### **updateContentPropertyInternal**

This updates the internal content data object from the script processor. Edit on GitHub

```
ScriptedViewport.updateContentPropertyInternal(int propertyId,  var newValue)
```

#### **updateValueFromProcessorConnection**

Updates the value from the processor connection. Call this method whenever the module state has changed and you want to refresh the knob value to show the current state. Edit on GitHub

```
ScriptedViewport.updateValueFromProcessorConnection()
```

### ScriptFloatingTile

Create a reference to a FloatingTile
UI component and modify its values.

```
const var FloatingTile1 = Content.getComponent("FloatingTile1");
```

#### **addToMacroControl**

Adds the knob / button to a macro controller (from 0 to 7). Edit on GitHub

```
ScriptFloatingTile.addToMacroControl(int macroIndex)
```

#### **changed**

Call this to indicate that the value has changed (the onControl callback will be executed. Edit on GitHub

```
ScriptFloatingTile.changed()
```

#### **createLocalLookAndFeel**

Returns a local look and feel if it was registered before. Edit on GitHub

```
ScriptFloatingTile.createLocalLookAndFeel(ScriptContentComponent *contentComponent, Component *componentToRegister)
```

#### **fadeComponent**

Toggles the visibility and fades a component using the global animator. Edit on GitHub

```
ScriptFloatingTile.fadeComponent(bool shouldBeVisible, int milliseconds)
```

#### **get**

returns the value of the property. Edit on GitHub

```
ScriptFloatingTile.get(String propertyName)
```

#### **getAllProperties**

Returns a list of all property IDs as array. Edit on GitHub

```
ScriptFloatingTile.getAllProperties()
```

#### **getChildComponents**

Returns list of component's children Edit on GitHub

```
ScriptFloatingTile.getChildComponents()
```

#### **getGlobalPositionX**

Returns the absolute x-position relative to the interface. Edit on GitHub

```
ScriptFloatingTile.getGlobalPositionX()
```

#### **getGlobalPositionY**

Returns the absolute y-position relative to the interface. Edit on GitHub

```
ScriptFloatingTile.getGlobalPositionY()
```

#### **getHeight**

Returns the height of the component. Edit on GitHub

```
ScriptFloatingTile.getHeight()
```

#### **getId**

Returns the ID of the component. Edit on GitHub

```
ScriptFloatingTile.getId()
```

#### **getLocalBounds**

Returns a [x, y, w, h] array that was reduced by the given amount. Edit on GitHub

```
ScriptFloatingTile.getLocalBounds(float reduceAmount)
```

#### **getPopupMenuTarget**

Override this if you want to change the `component`
parameter of the popup menu callback. Edit on GitHub

```
ScriptFloatingTile.getPopupMenuTarget( MouseEvent e)
```

#### **getValueNormalized**

Returns the normalized value. Edit on GitHub

```
ScriptFloatingTile.getValueNormalized()
```

#### **getWidth**

Returns the width of the component. Edit on GitHub

```
ScriptFloatingTile.getWidth()
```

#### **grabFocus**

Call this method in order to grab the keyboard focus for this component. Edit on GitHub

```
ScriptFloatingTile.grabFocus()
```

#### **loseFocus**

Call this method in order to give away the focus for this component. Edit on GitHub

```
ScriptFloatingTile.loseFocus()
```

#### **sendRepaintMessage**

Manually sends a repaint message for the component. Edit on GitHub

```
ScriptFloatingTile.sendRepaintMessage()
```

#### **set**

Sets the property. Edit on GitHub

```
ScriptFloatingTile.set(String propertyName, var value)
```

#### **setColour**

sets the colour of the component (BG, IT1, IT2, TXT). Edit on GitHub

```
ScriptFloatingTile.setColour(int colourId, int colourAs32bitHex)
```

#### **setConsumedKeyPresses**

Registers a selection of key presses to be consumed by this component. Edit on GitHub

```
ScriptFloatingTile.setConsumedKeyPresses(var listOfKeys)
```

#### **setContentData**

Sets the JSON object for the given floating tile. Edit on GitHub

```
ScriptFloatingTile.setContentData(var data)
```

#### **setControlCallback**

Pass a inline function for a custom callback event. Edit on GitHub

```
ScriptFloatingTile.setControlCallback(var controlFunction)
```

#### **setKeyPressCallback**

Adds a callback to react on key presses (when this component is focused). Edit on GitHub

```
ScriptFloatingTile.setKeyPressCallback(var keyboardFunction)
```

#### **setLocalLookAndFeel**

Attaches the local look and feel to this component. Edit on GitHub

```
ScriptFloatingTile.setLocalLookAndFeel(var lafObject)
```

#### **setPosition**

Sets the position of the component. Edit on GitHub

```
ScriptFloatingTile.setPosition(int x, int y, int w, int h)
```

#### **setPropertiesFromJSON**

Restores all properties from a JSON object. Edit on GitHub

```
ScriptFloatingTile.setPropertiesFromJSON( var jsonData)
```

#### **setStyleSheetClass**

Sets the given class selectors for the component stylesheet. Edit on GitHub

```
ScriptFloatingTile.setStyleSheetClass( String classIds)
```

#### **setStyleSheetProperty**

Sets a variable for this component that can be queried from a style sheet. Edit on GitHub

```
ScriptFloatingTile.setStyleSheetProperty( String variableId,  var value,  String type)
```

#### **setStyleSheetPseudoState**

Programatically sets a pseudo state (:hover,:active,:checked,:focus,:disabled) that will be used by the CSS renderer. Edit on GitHub

```
ScriptFloatingTile.setStyleSheetPseudoState( String pseudoState)
```

#### **setTooltip**

Shows a informative text on mouse hover. Edit on GitHub

```
ScriptFloatingTile.setTooltip( String tooltip)
```

#### **setValueNormalized**

Sets the current value from a range 0.0... 1.0. Edit on GitHub

```
ScriptFloatingTile.setValueNormalized(double normalizedValue)
```

#### **setValueWithUndo**

Sets the current value and adds it to the undo list. Don't call this from onControl! Edit on GitHub

```
ScriptFloatingTile.setValueWithUndo(var newValue)
```

#### **setZLevel**

Changes the depth hierarchy (z-axis) of sibling components (Back, Default, Front or AlwaysOnTop). Edit on GitHub

```
ScriptFloatingTile.setZLevel(String zLevel)
```

#### **showControl**

Hides / Shows the control. Edit on GitHub

```
ScriptFloatingTile.showControl(bool shouldBeVisible)
```

#### **updateContentPropertyInternal**

This updates the internal content data object from the script processor. Edit on GitHub

```
ScriptFloatingTile.updateContentPropertyInternal(int propertyId,  var newValue)
```

#### **updateValueFromProcessorConnection**

Updates the value from the processor connection. Call this method whenever the module state has changed and you want to refresh the knob value to show the current state. Edit on GitHub

```
ScriptFloatingTile.updateValueFromProcessorConnection()
```

### ScriptImage

Create a reference to a Image
UI component and modify its values.

```
const var Image1 = Content.getComponent("Image1");
```

#### **addToMacroControl**

Adds the knob / button to a macro controller (from 0 to 7). Edit on GitHub

```
ScriptImage.addToMacroControl(int macroIndex)
```

#### **changed**

Call this to indicate that the value has changed (the onControl callback will be executed. Edit on GitHub

```
ScriptImage.changed()
```

#### **createLocalLookAndFeel**

Returns a local look and feel if it was registered before. Edit on GitHub

```
ScriptImage.createLocalLookAndFeel(ScriptContentComponent *contentComponent, Component *componentToRegister)
```

#### **fadeComponent**

Toggles the visibility and fades a component using the global animator. Edit on GitHub

```
ScriptImage.fadeComponent(bool shouldBeVisible, int milliseconds)
```

#### **get**

returns the value of the property. Edit on GitHub

```
ScriptImage.get(String propertyName)
```

#### **getAllProperties**

Returns a list of all property IDs as array. Edit on GitHub

```
ScriptImage.getAllProperties()
```

#### **getChildComponents**

Returns list of component's children Edit on GitHub

```
ScriptImage.getChildComponents()
```

#### **getGlobalPositionX**

Returns the absolute x-position relative to the interface. Edit on GitHub

```
ScriptImage.getGlobalPositionX()
```

#### **getGlobalPositionY**

Returns the absolute y-position relative to the interface. Edit on GitHub

```
ScriptImage.getGlobalPositionY()
```

#### **getHeight**

Returns the height of the component. Edit on GitHub

```
ScriptImage.getHeight()
```

#### **getId**

Returns the ID of the component. Edit on GitHub

```
ScriptImage.getId()
```

#### **getLocalBounds**

Returns a [x, y, w, h] array that was reduced by the given amount. Edit on GitHub

```
ScriptImage.getLocalBounds(float reduceAmount)
```

#### **getPopupMenuTarget**

Override this if you want to change the `component`
parameter of the popup menu callback. Edit on GitHub

```
ScriptImage.getPopupMenuTarget( MouseEvent e)
```

#### **getValue**

Returns the current value. Edit on GitHub

```
ScriptImage.getValue()
```

#### **getValueNormalized**

Returns the normalized value. Edit on GitHub

```
ScriptImage.getValueNormalized()
```

#### **getWidth**

Returns the width of the component. Edit on GitHub

```
ScriptImage.getWidth()
```

#### **grabFocus**

Call this method in order to grab the keyboard focus for this component. Edit on GitHub

```
ScriptImage.grabFocus()
```

#### **loseFocus**

Call this method in order to give away the focus for this component. Edit on GitHub

```
ScriptImage.loseFocus()
```

#### **sendRepaintMessage**

Manually sends a repaint message for the component. Edit on GitHub

```
ScriptImage.sendRepaintMessage()
```

#### **set**

Sets the property. Edit on GitHub

```
ScriptImage.set(String propertyName, var value)
```

#### **setAlpha**

Sets the transparency (0.0 = full transparency, 1.0 = full opacity). Edit on GitHub

```
ScriptImage.setAlpha(float newAlphaValue)
```

#### **setColour**

sets the colour of the component (BG, IT1, IT2, TXT). Edit on GitHub

```
ScriptImage.setColour(int colourId, int colourAs32bitHex)
```

#### **setConsumedKeyPresses**

Registers a selection of key presses to be consumed by this component. Edit on GitHub

```
ScriptImage.setConsumedKeyPresses(var listOfKeys)
```

#### **setControlCallback**

Pass a inline function for a custom callback event. Edit on GitHub

```
ScriptImage.setControlCallback(var controlFunction)
```

#### **setImageFile**

Sets the image file that will be displayed. Edit on GitHub

```
ScriptImage.setImageFile( String absoluteFileName, bool forceUseRealFile)
```

#### **setKeyPressCallback**

Adds a callback to react on key presses (when this component is focused). Edit on GitHub

```
ScriptImage.setKeyPressCallback(var keyboardFunction)
```

#### **setLocalLookAndFeel**

Attaches the local look and feel to this component. Edit on GitHub

```
ScriptImage.setLocalLookAndFeel(var lafObject)
```

#### **setPosition**

Sets the position of the component. Edit on GitHub

```
ScriptImage.setPosition(int x, int y, int w, int h)
```

#### **setPropertiesFromJSON**

Restores all properties from a JSON object. Edit on GitHub

```
ScriptImage.setPropertiesFromJSON( var jsonData)
```

#### **setStyleSheetClass**

Sets the given class selectors for the component stylesheet. Edit on GitHub

```
ScriptImage.setStyleSheetClass( String classIds)
```

#### **setStyleSheetProperty**

Sets a variable for this component that can be queried from a style sheet. Edit on GitHub

```
ScriptImage.setStyleSheetProperty( String variableId,  var value,  String type)
```

#### **setStyleSheetPseudoState**

Programatically sets a pseudo state (:hover,:active,:checked,:focus,:disabled) that will be used by the CSS renderer. Edit on GitHub

```
ScriptImage.setStyleSheetPseudoState( String pseudoState)
```

#### **setTooltip**

Shows a informative text on mouse hover. Edit on GitHub

```
ScriptImage.setTooltip( String tooltip)
```

#### **setValue**

Sets the current value Edit on GitHub

```
ScriptImage.setValue(var newValue)
```

#### **setValueNormalized**

Sets the current value from a range 0.0... 1.0. Edit on GitHub

```
ScriptImage.setValueNormalized(double normalizedValue)
```

#### **setValueWithUndo**

Sets the current value and adds it to the undo list. Don't call this from onControl! Edit on GitHub

```
ScriptImage.setValueWithUndo(var newValue)
```

#### **setZLevel**

Changes the depth hierarchy (z-axis) of sibling components (Back, Default, Front or AlwaysOnTop). Edit on GitHub

```
ScriptImage.setZLevel(String zLevel)
```

#### **showControl**

Hides / Shows the control. Edit on GitHub

```
ScriptImage.showControl(bool shouldBeVisible)
```

#### **updateContentPropertyInternal**

This updates the internal content data object from the script processor. Edit on GitHub

```
ScriptImage.updateContentPropertyInternal(int propertyId,  var newValue)
```

#### **updateValueFromProcessorConnection**

Updates the value from the processor connection. Call this method whenever the module state has changed and you want to refresh the knob value to show the current state. Edit on GitHub

```
ScriptImage.updateValueFromProcessorConnection()
```

### ScriptLabel

Create a reference to a Label
UI component and modify its values.

```
const var Label1 = Content.getComponent("Label1");
```

#### **addToMacroControl**

Adds the knob / button to a macro controller (from 0 to 7). Edit on GitHub

```
ScriptLabel.addToMacroControl(int macroIndex)
```

#### **changed**

Call this to indicate that the value has changed (the onControl callback will be executed. Edit on GitHub

```
ScriptLabel.changed()
```

#### **createLocalLookAndFeel**

Returns a local look and feel if it was registered before. Edit on GitHub

```
ScriptLabel.createLocalLookAndFeel(ScriptContentComponent *contentComponent, Component *componentToRegister)
```

#### **fadeComponent**

Toggles the visibility and fades a component using the global animator. Edit on GitHub

```
ScriptLabel.fadeComponent(bool shouldBeVisible, int milliseconds)
```

#### **get**

returns the value of the property. Edit on GitHub

```
ScriptLabel.get(String propertyName)
```

#### **getAllProperties**

Returns a list of all property IDs as array. Edit on GitHub

```
ScriptLabel.getAllProperties()
```

#### **getChildComponents**

Returns list of component's children Edit on GitHub

```
ScriptLabel.getChildComponents()
```

#### **getGlobalPositionX**

Returns the absolute x-position relative to the interface. Edit on GitHub

```
ScriptLabel.getGlobalPositionX()
```

#### **getGlobalPositionY**

Returns the absolute y-position relative to the interface. Edit on GitHub

```
ScriptLabel.getGlobalPositionY()
```

#### **getHeight**

Returns the height of the component. Edit on GitHub

```
ScriptLabel.getHeight()
```

#### **getId**

Returns the ID of the component. Edit on GitHub

```
ScriptLabel.getId()
```

#### **getLocalBounds**

Returns a [x, y, w, h] array that was reduced by the given amount. Edit on GitHub

```
ScriptLabel.getLocalBounds(float reduceAmount)
```

#### **getPopupMenuTarget**

Override this if you want to change the `component`
parameter of the popup menu callback. Edit on GitHub

```
ScriptLabel.getPopupMenuTarget( MouseEvent e)
```

#### **getValue**

Returns the current value. Edit on GitHub

```
ScriptLabel.getValue()  override
```

#### **getValueNormalized**

Returns the normalized value. Edit on GitHub

```
ScriptLabel.getValueNormalized()
```

#### **getWidth**

Returns the width of the component. Edit on GitHub

```
ScriptLabel.getWidth()
```

#### **grabFocus**

Call this method in order to grab the keyboard focus for this component. Edit on GitHub

```
ScriptLabel.grabFocus()
```

#### **loseFocus**

Call this method in order to give away the focus for this component. Edit on GitHub

```
ScriptLabel.loseFocus()
```

#### **sendRepaintMessage**

Manually sends a repaint message for the component. Edit on GitHub

```
ScriptLabel.sendRepaintMessage()
```

#### **set**

Sets the property. Edit on GitHub

```
ScriptLabel.set(String propertyName, var value)
```

#### **setColour**

sets the colour of the component (BG, IT1, IT2, TXT). Edit on GitHub

```
ScriptLabel.setColour(int colourId, int colourAs32bitHex)
```

#### **setConsumedKeyPresses**

Registers a selection of key presses to be consumed by this component. Edit on GitHub

```
ScriptLabel.setConsumedKeyPresses(var listOfKeys)
```

#### **setControlCallback**

Pass a inline function for a custom callback event. Edit on GitHub

```
ScriptLabel.setControlCallback(var controlFunction)
```

#### **setEditable**

makes a label `editable`. Edit on GitHub

```
ScriptLabel.setEditable(bool shouldBeEditable)
```

#### **setKeyPressCallback**

Adds a callback to react on key presses (when this component is focused). Edit on GitHub

```
ScriptLabel.setKeyPressCallback(var keyboardFunction)
```

#### **setLocalLookAndFeel**

Attaches the local look and feel to this component. Edit on GitHub

```
ScriptLabel.setLocalLookAndFeel(var lafObject)
```

#### **setPosition**

Sets the position of the component. Edit on GitHub

```
ScriptLabel.setPosition(int x, int y, int w, int h)
```

#### **setPropertiesFromJSON**

Restores all properties from a JSON object. Edit on GitHub

```
ScriptLabel.setPropertiesFromJSON( var jsonData)
```

#### **setStyleSheetClass**

Sets the given class selectors for the component stylesheet. Edit on GitHub

```
ScriptLabel.setStyleSheetClass( String classIds)
```

#### **setStyleSheetProperty**

Sets a variable for this component that can be queried from a style sheet. Edit on GitHub

```
ScriptLabel.setStyleSheetProperty( String variableId,  var value,  String type)
```

#### **setStyleSheetPseudoState**

Programatically sets a pseudo state (:hover,:active,:checked,:focus,:disabled) that will be used by the CSS renderer. Edit on GitHub

```
ScriptLabel.setStyleSheetPseudoState( String pseudoState)
```

#### **setTooltip**

Shows a informative text on mouse hover. Edit on GitHub

```
ScriptLabel.setTooltip( String tooltip)
```

#### **setValueNormalized**

Sets the current value from a range 0.0... 1.0. Edit on GitHub

```
ScriptLabel.setValueNormalized(double normalizedValue)
```

#### **setValueWithUndo**

Sets the current value and adds it to the undo list. Don't call this from onControl! Edit on GitHub

```
ScriptLabel.setValueWithUndo(var newValue)
```

#### **setZLevel**

Changes the depth hierarchy (z-axis) of sibling components (Back, Default, Front or AlwaysOnTop). Edit on GitHub

```
ScriptLabel.setZLevel(String zLevel)
```

#### **showControl**

Hides / Shows the control. Edit on GitHub

```
ScriptLabel.showControl(bool shouldBeVisible)
```

#### **updateContentPropertyInternal**

This updates the internal content data object from the script processor. Edit on GitHub

```
ScriptLabel.updateContentPropertyInternal(int propertyId,  var newValue)
```

#### **updateValueFromProcessorConnection**

Updates the value from the processor connection. Call this method whenever the module state has changed and you want to refresh the knob value to show the current state. Edit on GitHub

```
ScriptLabel.updateValueFromProcessorConnection()
```

### ScriptLookAndFeel

The `ScriptLookAndFeel`
object gives you access and let's you modify the LookAndFeel classes that you can create and attach to Interface components. Right-click on an interface element to create some boilerplate code for this with: "Create LocalLookAndFeel for selection"

```
const var local_laf432 = Content.createLocalLookAndFeel();
```

See also: Look and Feel Getting Started

#### **isImageLoaded**

Checks if the image has been loaded into the look and feel obkect Edit on GitHub

```
ScriptLookAndFeel.isImageLoaded(String prettyName)
```

#### **loadImage**

Loads an image that can be used by the look and feel functions. Edit on GitHub

```
ScriptLookAndFeel.loadImage(String imageFile, String prettyName)
```

#### **registerFunction**

Registers a function that will be used for the custom look and feel. Edit on GitHub

```
ScriptLookAndFeel.registerFunction(var functionName, var function)
```

#### **setGlobalFont**

Set a global font. Edit on GitHub

```
ScriptLookAndFeel.setGlobalFont( String fontName, float fontSize)
```

#### **setInlineStyleSheet**

Parses CSS code and switches the look and feel to use the CSS renderer.

```
ScriptLookAndFeel.setInlineStyleSheet( String cssCode)
```

This method will take a string and parse it as CSS
code that will be applied to whatever component is registered to this LookAndFeel object.

```
const var b1 = Content.addButton("b1", 0, 0);
const var laf = Content.createLocalLookAndFeel();

b1.setLocalLookAndFeel(laf);

/** Set the inline style sheet that just colours the button. */
laf.setInlineStyleSheet("button{
	background-color: red;
}");
```

This method is for quick and dirty use cases, for more complex style sheets it's recommended to use setStyleSheet
with a file reference so you can edit the CSS in a specific code editor tab with proper CSS syntax highlighting & autocomplete.

#### **setStyleSheet**

Parses CSS code from a style sheet file in the scripts folder and switches the look and feel to use the CSS renderer.

```
ScriptLookAndFeel.setStyleSheet( String fileName)
```

This method will load (or create) a file with the specified filename in the `Scripts`
folder of your project and parse it as CSS code that will be applied to any UI component that is associated with this LookAndFeel object.

The file will then be included (like an external script file or a.glsl file) and you can open it using the drop down in the code editor.

The code editor will then switch to CSS mode with proper syntax highlighting & autocomplete of all supported CSS properties. Also pressing F5 while editing the CSS code will **not**
recompile the entire script, but just reparse the CSS and update the (currently) visible UI components. This allows a super fast iteration of UI design!

Take a look at the CSS reference guide here
for a list of supported properties & language features.

#### **setStyleSheetProperty**

Sets a variable that can be queried from a style sheet.

```
ScriptLookAndFeel.setStyleSheetProperty( String variableId, var value,  String type)
```

This allows you to send a dynamic value to all components that use the LookAndFeel object. Just call this method with a valid ID, a value and supply an optional type conversion and then query the value in CSS using the standard CSS syntax for variables:

```
// HiseScript:
// Set myProperty as a pixel value
laf.setStyleSheetProperty("myProperty", "10", "px");

// CSS side
button
{
	/** read the property and use it as border radius. */
	border-radius: var(--myProperty);
}
```

Note that calling this method will automatically repaint the components so you don't have to explicitely repaint them with `sendRepaintMessage()`
or friends.

##### **Inbuilt colour properties**

Be aware that HISE will automatically send changes to any of the colour properties from an UI component to the CSS, so if you eg. want to update the background color based on the `bgColour`
property, you don't need to use this method, but just use the variable in your CSS code like this:

```
button
{
	background-color: var(--bgColour);
}
```

##### **Value converters**

The third argument in the function call is a string that can be used to convert the value into a CSS value domain.

**Type** | **Expected Value** | **Description** || `""` | any string | does no conversion and just passes the raw string over to CSS |
| `"px"` | a number | uses the number as pixel value |
| `"%"` | a float number between 0.0 and 1.0 | converts the number to a percentage value. |
| `"color"` | a colour value (either int or string) | converts any colour from HiseScript (eg. `Colours.red` or `0xFF00FF00` into a propert CSS string ('#FF00FF00') |
| `path` | a Path object. | Converts the given path into a base64 string which then can be used as `background-image` property to replace the standard background rectangle path. |
| `class` | a string | writes one or multiple class selectors into the component. |

```
// HiseScript:
// Raw string
laf.setStyleSheetProperty("rawString", "bold", "");

// Pixel value (25px)
laf.setStyleSheetProperty("pixelVariable", 25, "px");

// Relative value (80%)
laf.setStyleSheetProperty("percentageVariable", 0.8, "%");

// Colour value (#FF0000FF)
laf.setStyleSheetProperty("colorVariable", Colours.blue, "color");

// Path object (some Base64 gibberish)
const var p = Content.createPath();
p.addEllipse([12, 12, 30, 30]);
laf.setStyleSheetProperty("pathVariable", p, "path");

// set the CSS class
const var b = Content.getComponent("button");
b.setStyleSheetProperty("class", ".someclass", "class");

// CSS side
button
{
	font-weight: var(--bold);
	padding-left: var(--pixelVariable);
	transform: scale(var(--percentageVariable));
	background-color: var(--colorVariable);
	background-image: var(--pathVariable);
}.someclass
{
	/* will be applied to the `b` Button only. */
	background: red;
}
```

The last conversion allows you to pass any path in HISE over to CSS and render it with box shadows & different stroke types.

##### **Precedence**

Using this method from the LAF object will send the value to all objects that use the LAF, however there is another method
that you can call on individual UI components in order to use different properties for different components.

In that case, the properties set by the component method will always override the properties set by this method, even if they are executed in reversed order:

```
const var b1 = Content.addButton("b1", 0, 0);
const var b2 = Content.addButton("b2", 130, 0);

const var laf = Content.createLocalLookAndFeel();

b1.setLocalLookAndFeel(laf);
b2.setLocalLookAndFeel(laf);

/** Set the inline style sheet that just colours the button. */
laf.setInlineStyleSheet("button{
	background-color: var(--c);
}");

/** Set the component specific property. */
b1.setStyleSheetProperty("c", Colours.blue, "color");

/** Set the "global" property for all components. */
laf.setStyleSheetProperty("c", Colours.red, "color");
```

In this code example, the first button will be blue, even if the property for the component was set before setting the global component.

##### **Debugging properties**

In order to check the value of each property for individual components, you can right click on any UI component in the Interface designer that has assigned a CSS LookAndFeel and then choose `Show CSS debugger`
in the context menu. Doing so for the second button will show this:

```
Current variable values:
{ "c": "#FFFF0000", "bgColour": "#00000000", "itemColour": "#00000000", "itemColour2": "#00000000", "textColour": "#00000000"
}
==============================

/* CSS for component hierarchy: */

button #b2.scriptbutton

/** Component stylesheet: */
button #b2.scriptbutton { background-color[]: var(--c)
}

/** Inherited style sheets: */
button { background-color[]: var(--c)
}
```

#### **unloadAllImages**

Unload all images from the look and feel object. Edit on GitHub

```
ScriptLookAndFeel.unloadAllImages()
```

### ScriptModulationMatrix

This class provides programmatical access to the new matrix modulation system in HISE 5.0. It offers convenient methods to query modulation properties, be notified over connection events as well as programmatically perform connection changes.

In addition to these features, this class will also act as data management tool and automatically register itself to the user preset system so that all modulation connections are stored / restored in the user preset.

This class is just a simple wrapper around the functions available at different locations within HISE, so for a detailed overview of the entire matrix modulation system, please take a look at these sections:

- The Matrix Modulator module for a explanation of the (new) architecture that is powering the modulation matrix system.
- The ModulationMatrix and ModulationMatrixController floating tiles for a explanation of the available UI building blocks.

In order to use this class make sure to setup your system to work with matrix modulators:

1. Create a global modulator container and add modulation sources in there
2. Add Matrix modulators to every target that you want to modulate
3. Add / customize the floating tiles to display / edit the modulation connections
4. Create this object in the `onInit` callback with Engine.createModulationMatrix() and then register callbacks / perform operations on this object.

Note that this object was completely redesigned in HISE 5.0 with absolutely no attention paid to remaining backwards compatible to the API of older versions, so if you were using this object before, you will need to completely rewrite your modulation logic.

#### **canConnect**

Checks whether the modulation connection can be made.

```
ScriptModulationMatrix.canConnect(String source, String target)
```

This method checks whether the source and target IDs are valid (= they exist) and are not connected.

- it returns true if both IDs are valid and there is no connection
- it returns false if one of the IDs are invalid or there is already a connection

Note that you don't need to call this method if you intend to call connect(), as this method performs this check internally too.

#### **clearAllConnections**

Removes all connections for the given target (or all connections if no target is specified).

```
ScriptModulationMatrix.clearAllConnections(String targetId)
```

This clears all connections for the given target ID or all connections if you pass in an empty string.

This action is fully undoable with `Engine.undo()`. Note that this will kill all voices and perform this operation on the scripting thread to avoid audio glitches.

#### **connect**

Adds (or removes) a connection from the source to the target.

```
ScriptModulationMatrix.connect(String sourceId, String targetId, bool addConnection)
```

This method allows you to programmatically connect modulators (just like using the UI functions). Calling this method connects / disconnects the given source modulator to the specified target and returns true if a connection was established. If there was already a connection or one of the IDs was invalid, it will return false.

This action is fully undoable with `Engine.undo()`. Note that this will kill all voices and perform this operation on the scripting thread to avoid audio glitches.

#### **fromBase64**

Loads the state from a previously exported Base64 string.

```
ScriptModulationMatrix.fromBase64(String b64)
```

This restores all modulation connections from a given Base64 string. Note that by default a ScriptModulationMatrix will register itself to the user preset system and automatically restore / save its connections into user presets, but this function alongside with ScriptModulationMatrix.toBase64()
allows you to manually save / restore the modulation setup of your synth.

This action is fully undoable with `Engine.undo()`. Note that this will kill all voices and perform this operation on the scripting thread to avoid audio glitches.

#### **getComponent**

Get the component reference for the given modulation target ID.

```
ScriptModulationMatrix.getComponent(String targetId)
```

This function returns a reference to the first UI component that is assigned to a given modulation target.

Note that this does not return the ID but the component reference itself so you don't need to call `Content.getComponent()`
afterwards.

#### **getMatrixModulationProperties**

Returns a JSON object with the current matrix modulation properties.

```
ScriptModulationMatrix.getMatrixModulationProperties()
```

This will return a JSON object with all the properties of the matrix modulation system. Usually you call this method, modify the object and then pass it back to ScriptModulationMatrix.setMatrixModulationProperties()
to apply the changes in the onInit callback.

#### **getSourceList**

Return a list of all sources.

```
ScriptModulationMatrix.getSourceList()
```

This function returns a list of all available modulation sources, which are basically just the IDs of all modulators in the global modulator container.

#### **getTargetId**

Get the target ID (either ID of the matrix modulator or matrixTargetId property) for the given component.

```
ScriptModulationMatrix.getTargetId(var componentOrId)
```

This function returns the associated target ID for the given component. The argument can be either a ID (then it will search all UI component for the first match) or a direct reference to the UI element.

This is basically the reverse function to ScriptModulationMatrix.getComponent().

#### **getTargetList**

Return a list of all targets.

```
ScriptModulationMatrix.getTargetList()
```

This function returns a list of all available modulation targets. This will be the ID of all matrix modulators as well as all ScriptSlider components that have the `matrixTargetId`
property set (in that case it will not return the UI component's ID but the actual value string of the `matrixTargetId`
property).

#### **setConnectionCallback**

Set a callback that will be executed whenever the matrix state changes.

```
ScriptModulationMatrix.setConnectionCallback(var updateFunction)
```

This function will be executed whenever a connection was added or removed. It expects a function / callable object with three parameters:

1. the source ID
2. the target ID
3. whether it was added or removed.

Note that this function will be executed for every connection, so if you clear all connection at once it will be executed multiple times. So if you use a broadcaster for the notification callback make sure you enable the queue with Broadcaster.setEnableQueue(), otherwise it will only fire with the last event.

```
const var m = Engine.createModulationMatrix("Global Modulator Container1");

// setup a connection callback
m.setConnectionCallback(function(source, target, wasAdded)
{
	// dump the event data
	Console.print(trace({
		source: source,
		target: target,
		wasAdded: wasAdded
	}));
});

// connect the LFO to the OSC1 Gain target
// It assumes that you have set this up!
m.connect("LFO", "OSC1 Gain", true);

// Clear the connection again
m.clearAllConnections("");;
```

Output:

```
Interface: { "source": "LFO", "target": "OSC1 Gain", "wasAdded": true
}
Interface: { "source": "LFO", "target": "OSC1 Gain", "wasAdded": false
}
```

#### **setConnectionProperty**

Sets the property of a modulation connection (with undo). Edit on GitHub

```
ScriptModulationMatrix.setConnectionProperty(String sourceId, String targetId, String propertyId, var value)
```

#### **setCurrentlySelectedSource**

Sets the currently selected source.

```
ScriptModulationMatrix.setCurrentlySelectedSource(String sourceId)
```

This method can be used to programatically change the currently selected source. Usually this is done automatically by the ModulationMatrixController, but if you are implementing a custom UI replacement for that UI component, you can use this functionality.

Note that whenever you call this function (or drag a dragger), it will automatically close all hover popups that are currently active.

This functionality can be disabled with the ScriptModulationMatrix.setMatrixModulationProperties()
function.

#### **setDragCallback**

Attaches a callback to be notified wheneve a modulation connection is being dragged.

```
ScriptModulationMatrix.setDragCallback(var newDragCallback)
```

If you setup a UI component for dragging modulation connections on a target, you can attach a callback to drag events using that method. This function expects a callable object with 3 parameters:

1. The source modulator ID
2. The target ID if the user drags a connection over a modulatable knob
3. A string with the event type

This function will now get executed with the following string values as third event type parameter:

- `"DragStart"` whenever the user starts dragging a modulation connection with the ModulationMatrixController or via ScriptPanel.startInternalDrag() (if the drag data is connected to the modulation system). In that case the `targetId` parameter will be empty.
- `"DragEnd"` if the user stops dragging the source or is dropped on a illegal target. In that case the `sourceId` and `targetId` parameters will be empty.
- `"Drop"` whenever the user drops the modulation connection on a valid UI knob. In that case the `targetId` parameter will be the `matrixTargetId` of the hovered knob.

- `"Hover"` if the user drags the connection over a valid target knob (on hover). In that case the `targetId` parameter will be the `matrixTargetId` of the hovered knob.
- `"DisabledHover"` if the user drags the connection over an invalid target knob (eg. because it has already a connection to that source). In that case the `targetId` parameter will be the `matrixTargetId` of the hovered knob.

#### **setEditCallback**

Set a callback that will be executed when the user clicks on "Edit connections".

```
ScriptModulationMatrix.setEditCallback(var menuItems, var editFunction)
```

This function can be used to supply additional functions in the context menu of a modulatable UI component.

This method expects two arguments:

1. A single string or an array of strings for each menu item
2. a function or callable object with two parameters that will be executed when you click on said context menu item with the zero based index of the clicked item and the associated target ID of the UI component.

If you want to find out the component that was clicked just pass that into the ScriptModulationMatrix.getComponent()
method.

```
const var m = Engine.createModulationMatrix("Global Modulator Container1");

m.setEditCallback(["funky", "noice"], function(idx, targetId)
{
	Console.print(idx); // 0 if you click funky, 1 if you click on noice...

	Console.print("TARGET: " + targetId);
	Console.print("COMPONENT: " + this.getComponent(targetId).get("id"));
});
```

The use cases for this method are pretty diverse:

- you can use it to "edit the connections" by showing a matrix component with all connections of the target
- you can use it to add a "clear all connections" function for the given component (or other data management functions like custom save / restore)
- you can use it to reset the intensity values

#### **setMatrixModulationProperties**

Sets the global properties for the matrix modulation system.

```
ScriptModulationMatrix.setMatrixModulationProperties(var newProperties)
```

This function can be used to modify the behaviour / properties of the entire matrix modulation system. Currently you can:

- Enable / Disable the exclusive source selection feature.
- Change the default intensity values and modulation mode for each target that are used when adding a new connection
- Change the range properties of every matrix modulator (this can also be achieved with Modulator.setMatrixProperties() ), however this function allows you to set all ranges in one go without having to fetch references to each modulator.

The best way to go about this is to fetch the current state with ScriptModulationMatrix.getModulationProperties(), modify that object and then call this method to ensure that the object layout is valid.

The JSON object will expect these properties:

**Key** | **Type** | **Description** || `SelectableSources` | bool | Defines whether to use the exclusive source feature. If this is true, then the callbacks that will fire when switching the currently selected source are disabled. |
| `DefaultInitValues` | JSON | Defines the initial intensity and modulation mode values for new connections for each target. This must be a JSON object with the target ID as key for each target you want to customize. (see below for a detailed description). |
| `RangeProperties` | JSON | Defines the range properties for each modulation target. This must be a JSON object with the target IDs as keys for each target you want to customize. Look here for a description of all properties of each item. |

##### **DefaultInitValues items**

If the user adds a new connection from a modulation to a target source there is a sensible default for each target type:

- if the modulation target is Gain modulation, it will pick the `"Scale"` mode with 100% intensity.
- otherwise it will use 0% intensity and `"Bipolar"` modulation as default.

You can override this behaviour - eg. if you want to add a little bit of intensity so that there is an immediate effect when adding a modulation connection. In order to do so, just pass in a JSON object as `DefaultInitValues`
key that defines a JSON object for each target. The properties you need to define here are:

**Key** | **Type** | **Description** || `Intensity` | double | The intensity value that should be initialised. The value domain of this is defined by the `IsNormalized` property explained below. |
| `Mode` | String | One of the following strings that define the mode: `["Scale", "Unipolar", "Bipolar"]`. |
| `IsNormalized` | bool | Whether to convert the `Intensity` value from the input range of the target modulator. So eg. if you have a pitch modulator set to +-12 semitones and want to set the initial modulation intensity to 3 semitones, you would set this property to `false` and `Intensity` to `3.0`. By default this is deactivated so it will pickup the "raw" intensity value that will be applied to the modulation connection. |

#### **setSourceSelectionCallback**

Attaches a callback to be notified whenever a new modulation source is selected.

```
ScriptModulationMatrix.setSourceSelectionCallback(var sourceSelectionCallback)
```

This function can be used to attach a callback to be notified when the **currently selected**
modulation source is changed. This is caused by one of two events:

1. You click on a dragger from a ModulationMatrixController.
2. You call ScriptModulationMatrix.setCurrentlySelectedSource() (most likely because you're reimplementing something like the modulation matrix controller with a ScriptPanel).

This can now be used for different things, eg:

- changing the layout of the hover popup that shows all modulation connections of a given UI knob
- highlighting the modulator module on your UI

The function expects a callable object with a single parameter that will be called with the ID string of the source (= the modulator's ID).

Take a look at this snippet
for an example use case (showing only the currently selected modulation connection when you hover over a knob).

#### **toBase64**

Creates a Base64 string of all connections. Edit on GitHub

```
ScriptModulationMatrix.toBase64()
```

### ScriptMultipageDialog

This is the scripting reference object to a Multipage Dialog
UI component and can be used to programmatically build complex dialogs or load prebuilt dialogs made with the multipagecreator tool. The workflow of using this class is somewhat similar to the Builder
class:

1. Create an instance / reference to the multipage dialog
2. Add pages / elements using add() or addPage() which returns an integer index so that you can reference the element later
3. Modify the elements using the supplied index with setElementProperty() or setElementValue()
4. Attach callbacks to "global events" using setOnFinishCallback() or setOnPageLoad() or specific components using bindCallback()
5. "Flush" the changes and show the dialog using show()

Note that the state of the dialog is not persistent across compilations so you need to rebuild the dialog everytime you compile. If you want to reset the dialog after the onInit callback, you can use the resetDialog()
method which will clear all the pages and internal states.

##### **Hello world example**

This code snippet will create a multipage dialog and shows how to use the API to build up a dialog that you can attach HiseScript callbacks to:

```
// Create a multipage dialog component
const var mp = Content.addMultipageDialog("mp", 0, 0);

// the text property is used as title
mp.set("text", "Hello Dialog!");

// I swear this is the "last" time I'll do this...
mp.set("Font", "Comic Sans MS");

// The width / height properties will define what
// area is masked by the dialog
mp.set("height", 600);

// The actual dialog size is set by those properties
mp.set("DialogWidth", 550);
mp.set("DialogHeight", 500);

// Add two pages
const var firstPage = mp.addPage();
const var secondPage = mp.addPage();

// Add a markdown text
mp.add(firstPage, mp.types.MarkdownText, { Text: "This is some markdown  \n> Noice!" });

// This function will be called when you click the button defined below...
inline function hiseCallback(id, value, state)
{
	Console.print("ID: " + id + ", value: " + value);
}

// Add a button to the second page
mp.add(secondPage, mp.types.Button,
{ ID: "MyButton", Text: "Click me", // You can bind HiseScript callbacks to react on // button clicks like this: Code: mp.bindCallback("hiseCallback", hiseCallback, // Create a multipage dialog component
const var mp = Content.addMultipageDialog("mp", 0, 0);

// the text property is used as title
mp.set("text", "Hello Dialog!");

// I swear this is the "last" time I'll do this...
mp.set("Font", "Comic Sans MS");

// The width / height properties will define what
// area is masked by the dialog
mp.set("height", 600);

// The actual dialog size is set by those properties
mp.set("DialogWidth", 550);
mp.set("DialogHeight", 500);

// Add two pages
const var firstPage = mp.addPage();
const var secondPage = mp.addPage();

// Add a markdown text
mp.add(firstPage, mp.types.MarkdownText, { Text: "This is some markdown  \n> Noice!" });

// This function will be called when you click the button defined below...
inline function hiseCallback(id, value, state)
{
	Console.print("ID: " + id + ", value: " + value);
}

// Add a button to the second page
mp.add(secondPage, mp.types.Button,
{ ID: "MyButton", Text: "Click me", // You can bind HiseScript callbacks to react on // button clicks like this: Code: mp.bindCallback("hiseCallback", hiseCallback, "string")
});

// Show the dialog
mp.show(true);)
});

// Show the dialog
mp.show(true);
```

#### **add**

Adds an element to the parent with the given type and properties.

```
ScriptMultipageDialog.add(int parentIndex, String type,  var properties)
```

This will add a UI element to a parent defined by the `parentIndex`
index. The `type`
argument must be a valid type string.

It's highly recommended to use the typelist provided as the `ScriptMultipageDialog.types`
constant.

The `properties`
argument must be a JSON object that will contain the property definitions for the UI element.

For a reference of all available UI elements and their properties, take a look at this list:

Multipage Dialog Reference

#### **addModalPage**

Adds a modal page to the dialog that can be populated like a normal page and shown using showModalPage(). Edit on GitHub

```
ScriptMultipageDialog.addModalPage()
```

#### **addPage**

Adds a page to the dialog and returns the element index of the page.

```
ScriptMultipageDialog.addPage()
```

This will add a page to the dialog and return an integer index that can be used to add elements to the page.

```
const var mp = Content.addMultipageDialog("mp", 0, 0);

for(i = 0; i < 10; i++)
	mp.addPage();
```

Make sure to store the page index returned by this function as you will need it to add UI elements to the page later.

#### **addToMacroControl**

Adds the knob / button to a macro controller (from 0 to 7). Edit on GitHub

```
ScriptMultipageDialog.addToMacroControl(int macroIndex)
```

#### **bindCallback**

Registers a callable object to the dialog and returns the codestring that calls it from within the dialogs Javascript engine. Edit on GitHub

```
ScriptMultipageDialog.bindCallback(String id, var callback, var notificationType)
```

#### **cancel**

Closes the dialog (as if the user pressed the cancel button). Edit on GitHub

```
ScriptMultipageDialog.cancel()
```

#### **changed**

Call this to indicate that the value has changed (the onControl callback will be executed. Edit on GitHub

```
ScriptMultipageDialog.changed()
```

#### **createLocalLookAndFeel**

Returns a local look and feel if it was registered before. Edit on GitHub

```
ScriptMultipageDialog.createLocalLookAndFeel(ScriptContentComponent *contentComponent, Component *componentToRegister)
```

#### **exportAsMonolith**

Exports the entire dialog. Edit on GitHub

```
ScriptMultipageDialog.exportAsMonolith(var optionalFile)
```

#### **fadeComponent**

Toggles the visibility and fades a component using the global animator. Edit on GitHub

```
ScriptMultipageDialog.fadeComponent(bool shouldBeVisible, int milliseconds)
```

#### **get**

returns the value of the property. Edit on GitHub

```
ScriptMultipageDialog.get(String propertyName)
```

#### **getAllProperties**

Returns a list of all property IDs as array. Edit on GitHub

```
ScriptMultipageDialog.getAllProperties()
```

#### **getChildComponents**

Returns list of component's children Edit on GitHub

```
ScriptMultipageDialog.getChildComponents()
```

#### **getElementProperty**

Returns the value for the given element ID. Edit on GitHub

```
ScriptMultipageDialog.getElementProperty(int elementId, String propertyId)
```

#### **getGlobalPositionX**

Returns the absolute x-position relative to the interface. Edit on GitHub

```
ScriptMultipageDialog.getGlobalPositionX()
```

#### **getGlobalPositionY**

Returns the absolute y-position relative to the interface. Edit on GitHub

```
ScriptMultipageDialog.getGlobalPositionY()
```

#### **getHeight**

Returns the height of the component. Edit on GitHub

```
ScriptMultipageDialog.getHeight()
```

#### **getId**

Returns the ID of the component. Edit on GitHub

```
ScriptMultipageDialog.getId()
```

#### **getLocalBounds**

Returns a [x, y, w, h] array that was reduced by the given amount. Edit on GitHub

```
ScriptMultipageDialog.getLocalBounds(float reduceAmount)
```

#### **getPopupMenuTarget**

Override this if you want to change the `component`
parameter of the popup menu callback. Edit on GitHub

```
ScriptMultipageDialog.getPopupMenuTarget( MouseEvent e)
```

#### **getState**

returns the state object for the dialog. Edit on GitHub

```
ScriptMultipageDialog.getState()
```

#### **getValueNormalized**

Returns the normalized value. Edit on GitHub

```
ScriptMultipageDialog.getValueNormalized()
```

#### **getWidth**

Returns the width of the component. Edit on GitHub

```
ScriptMultipageDialog.getWidth()
```

#### **grabFocus**

Call this method in order to grab the keyboard focus for this component. Edit on GitHub

```
ScriptMultipageDialog.grabFocus()
```

#### **loadFromDataFile**

Loads the dialog from a file (on the disk). Edit on GitHub

```
ScriptMultipageDialog.loadFromDataFile(var fileObject)
```

#### **loseFocus**

Call this method in order to give away the focus for this component. Edit on GitHub

```
ScriptMultipageDialog.loseFocus()
```

#### **navigate**

Navigates to the given page index. Edit on GitHub

```
ScriptMultipageDialog.navigate(int pageIndex, bool submitCurrentPage)
```

#### **resetDialog**

Clears the dialog. Edit on GitHub

```
ScriptMultipageDialog.resetDialog()
```

#### **set**

Sets the property. Edit on GitHub

```
ScriptMultipageDialog.set(String propertyName, var value)
```

#### **setColour**

sets the colour of the component (BG, IT1, IT2, TXT). Edit on GitHub

```
ScriptMultipageDialog.setColour(int colourId, int colourAs32bitHex)
```

#### **setConsumedKeyPresses**

Registers a selection of key presses to be consumed by this component. Edit on GitHub

```
ScriptMultipageDialog.setConsumedKeyPresses(var listOfKeys)
```

#### **setControlCallback**

Pass a inline function for a custom callback event. Edit on GitHub

```
ScriptMultipageDialog.setControlCallback(var controlFunction)
```

#### **setElementProperty**

Sets the property for the given element ID and updates the dialog. Edit on GitHub

```
ScriptMultipageDialog.setElementProperty(int elementId, String propertyId,  var newValue)
```

#### **setElementValue**

Sets the value of the given element ID and calls the callback. Edit on GitHub

```
ScriptMultipageDialog.setElementValue(int elementId, var value)
```

#### **setKeyPressCallback**

Adds a callback to react on key presses (when this component is focused). Edit on GitHub

```
ScriptMultipageDialog.setKeyPressCallback(var keyboardFunction)
```

#### **setLocalLookAndFeel**

Attaches the local look and feel to this component. Edit on GitHub

```
ScriptMultipageDialog.setLocalLookAndFeel(var lafObject)
```

#### **setOnFinishCallback**

Registers a function that will be called when the dialog is finished. Edit on GitHub

```
ScriptMultipageDialog.setOnFinishCallback(var onFinish)
```

#### **setOnPageLoadCallback**

Registers a function that will be called when the dialog shows a new page. Edit on GitHub

```
ScriptMultipageDialog.setOnPageLoadCallback(var onPageLoad)
```

#### **setPosition**

Sets the position of the component. Edit on GitHub

```
ScriptMultipageDialog.setPosition(int x, int y, int w, int h)
```

#### **setPropertiesFromJSON**

Restores all properties from a JSON object. Edit on GitHub

```
ScriptMultipageDialog.setPropertiesFromJSON( var jsonData)
```

#### **setStyleSheetClass**

Sets the given class selectors for the component stylesheet. Edit on GitHub

```
ScriptMultipageDialog.setStyleSheetClass( String classIds)
```

#### **setStyleSheetProperty**

Sets a variable for this component that can be queried from a style sheet. Edit on GitHub

```
ScriptMultipageDialog.setStyleSheetProperty( String variableId,  var value,  String type)
```

#### **setStyleSheetPseudoState**

Programatically sets a pseudo state (:hover,:active,:checked,:focus,:disabled) that will be used by the CSS renderer. Edit on GitHub

```
ScriptMultipageDialog.setStyleSheetPseudoState( String pseudoState)
```

#### **setTooltip**

Shows a informative text on mouse hover. Edit on GitHub

```
ScriptMultipageDialog.setTooltip( String tooltip)
```

#### **setValueNormalized**

Sets the current value from a range 0.0... 1.0. Edit on GitHub

```
ScriptMultipageDialog.setValueNormalized(double normalizedValue)
```

#### **setValueWithUndo**

Sets the current value and adds it to the undo list. Don't call this from onControl! Edit on GitHub

```
ScriptMultipageDialog.setValueWithUndo(var newValue)
```

#### **setZLevel**

Changes the depth hierarchy (z-axis) of sibling components (Back, Default, Front or AlwaysOnTop). Edit on GitHub

```
ScriptMultipageDialog.setZLevel(String zLevel)
```

#### **show**

Shows the dialog (with optionally clearing the state. Edit on GitHub

```
ScriptMultipageDialog.show(bool clearState)
```

#### **showControl**

Hides / Shows the control. Edit on GitHub

```
ScriptMultipageDialog.showControl(bool shouldBeVisible)
```

#### **showModalPage**

Shows a modal page with the given index and the state object. Edit on GitHub

```
ScriptMultipageDialog.showModalPage(int pageIndex, var modalState, var finishCallback)
```

#### **updateContentPropertyInternal**

This updates the internal content data object from the script processor. Edit on GitHub

```
ScriptMultipageDialog.updateContentPropertyInternal(int propertyId,  var newValue)
```

#### **updateValueFromProcessorConnection**

Updates the value from the processor connection. Call this method whenever the module state has changed and you want to refresh the knob value to show the current state. Edit on GitHub

```
ScriptMultipageDialog.updateValueFromProcessorConnection()
```

### ScriptPanel

Create a reference to a Panel
UI component and modify its values.

See Script Panel
for examples and common usecases.

```
const var Panel1 = Content.getComponent("Panel1");
```

#### **addChildPanel**

Adds a child panel to this panel.

```
ScriptPanel.addChildPanel()
```

This function will create and return an anonymous panel and add it to the panel as child component (similar to setting the `parentComponent`
property). However there are two important differences:

1. You can call this function any time and **add (and remove)** these panels after the onInit callback.
2. The panels that you create with this method will not be listed in the component list (and therefore can not store / restore their value with user presets et al).

The main use case for this method is to create dynamic components which have a varying amount of sub-elements: tables with modulation connections, effect slots, and basically anything that has a dynamic amount that can be changed in your script.

Be aware that these panels are not accessible to the interface designer, so you have to set every property using scripting API calls.

You can call this method again on the new panel and create a nested architecture of child panels. In order to delete the panel (and any child panel), use the removeFromParent()
method.

For an example use case, take a look at the Horizontal List Recipe

#### **addToMacroControl**

Adds the knob / button to a macro controller (from 0 to 7). Edit on GitHub

```
ScriptPanel.addToMacroControl(int macroIndex)
```

#### **closeAsPopup**

Closes the popup manually. Edit on GitHub

```
ScriptPanel.closeAsPopup()
```

#### **createLocalLookAndFeel**

Returns a local look and feel if it was registered before. Edit on GitHub

```
ScriptPanel.createLocalLookAndFeel(ScriptContentComponent *contentComponent, Component *componentToRegister)
```

#### **fadeComponent**

Toggles the visibility and fades a component using the global animator. Edit on GitHub

```
ScriptPanel.fadeComponent(bool shouldBeVisible, int milliseconds)
```

#### **get**

returns the value of the property. Edit on GitHub

```
ScriptPanel.get(String propertyName)
```

#### **getAllProperties**

Returns a list of all property IDs as array. Edit on GitHub

```
ScriptPanel.getAllProperties()
```

#### **getAnimationData**

Returns a JSON object containing the data of the animation object.

```
ScriptPanel.getAnimationData()
```

This method will return an object containing the properties of the current animation in this panel:

**Property** | **Description** || `active` | whether an animation is active. This might be false if the animation couldn't be loaded. |
| `currentFrame` | the current frame that is displayed. You can use this in the timer callback to increase it in order to create a moving image. |
| `numFrames` | the total number of frames in this animation. |
| `frameRate` | the suggested framerate. You don't need to use this value, but you might want to call `Panel.startTimer(1000.0 / data.frameRate)` with it. |

These properties will be updated if you load another animation or change the frame, so you just need to call this method once and then access its properties.

#### **getChildComponents**

Returns list of component's children Edit on GitHub

```
ScriptPanel.getChildComponents()
```

#### **getChildPanelList**

Returns a list of all panels that have been added as child panel.

```
ScriptPanel.getChildPanelList()
```

This creates an array with references to all panels that have been created using `addChildPanel()`. Be aware that this only takes one level of hierarchy into account, so if you have nested child panels, the list will only contain the top level panels.

See addChildPanel(), getParentPanel()
and removeFromParent()

#### **getGlobalPositionX**

Returns the absolute x-position relative to the interface. Edit on GitHub

```
ScriptPanel.getGlobalPositionX()
```

#### **getGlobalPositionY**

Returns the absolute y-position relative to the interface. Edit on GitHub

```
ScriptPanel.getGlobalPositionY()
```

#### **getHeight**

Returns the height of the component. Edit on GitHub

```
ScriptPanel.getHeight()
```

#### **getId**

Returns the ID of the component. Edit on GitHub

```
ScriptPanel.getId()
```

#### **getLocalBounds**

Returns a [x, y, w, h] array that was reduced by the given amount. Edit on GitHub

```
ScriptPanel.getLocalBounds(float reduceAmount)
```

#### **getParentPanel**

Returns the panel that this panel has been added to with addChildPanel. Edit on GitHub

```
ScriptPanel.getParentPanel()
```

#### **getPopupMenuTarget**

Override this if you want to change the `component`
parameter of the popup menu callback. Edit on GitHub

```
ScriptPanel.getPopupMenuTarget( MouseEvent e)
```

#### **getValue**

Returns the current value. Edit on GitHub

```
ScriptPanel.getValue()
```

#### **getValueNormalized**

Returns the normalized value. Edit on GitHub

```
ScriptPanel.getValueNormalized()
```

#### **getWidth**

Returns the width of the component. Edit on GitHub

```
ScriptPanel.getWidth()
```

#### **grabFocus**

Call this method in order to grab the keyboard focus for this component. Edit on GitHub

```
ScriptPanel.grabFocus()
```

#### **isImageLoaded**

Checks if the image has been loaded into the panel Edit on GitHub

```
ScriptPanel.isImageLoaded(String prettyName)
```

#### **isVisibleAsPopup**

Returns true if the popup is currently showing. Edit on GitHub

```
ScriptPanel.isVisibleAsPopup()
```

#### **loadImage**

Loads a image which can be drawn with the paint function later on. Edit on GitHub

```
ScriptPanel.loadImage(String imageName, String prettyName)
```

#### **loseFocus**

Call this method in order to give away the focus for this component. Edit on GitHub

```
ScriptPanel.loseFocus()
```

#### **removeFromParent**

Removes the panel from its parent panel if it was created with addChildPanel().

```
ScriptPanel.removeFromParent()
```

If you want to remove a panel from the interface that has been created with addChildPanel(), call this method and it will remove the panel from the parent and update the UI.

#### **repaint**

Triggers an asynchronous repaint. Edit on GitHub

```
ScriptPanel.repaint()
```

#### **repaintImmediately**

Calls the paint routine immediately. Edit on GitHub

```
ScriptPanel.repaintImmediately()
```

#### **set**

Sets the property. Edit on GitHub

```
ScriptPanel.set(String propertyName, var value)
```

#### **setAnimation**

Sets an JSON animation.

```
ScriptPanel.setAnimation(String base64LottieAnimation)
```

You can use Lottie
animation files to be displayed in a ScriptPanel.

Just load an animation into the Lottie Developer Panel, compress it to a Base64 string and give it to this method and you can start using the frames inside the animation with setAnimationFrame.

Be aware that there is no built in animation functionality, but you can easily create "moving images" by using the timer callback
for it.

#### **setAnimationFrame**

Sets a frame to be displayed.

```
ScriptPanel.setAnimationFrame(int numFrame)
```

Once you've loaded an animation into the panel with setAnimation, you can call this method and supply the frame index you want to display.
Calling this method will pick the frame and immediately repaint the panel.

In order to find out, which frame you want to display, use the getAnimationData
method which returns an object with the animation specs.

#### **setColour**

sets the colour of the component (BG, IT1, IT2, TXT). Edit on GitHub

```
ScriptPanel.setColour(int colourId, int colourAs32bitHex)
```

#### **setConsumedKeyPresses**

Registers a selection of key presses to be consumed by this component.

```
ScriptPanel.setConsumedKeyPresses(var listOfKeys)
```

A key stroke from your computer keyboard can be registered to fire a callback using ScriptPanel.setKeyPressCallback(). However if you do this, you most likely want this key stroke to be "consumed" (so it won't trigger other actions as it progresses upwards the component tree).

Before this method was introduced, you had to return `true`
in the callback for a consumed key press (the JUCE keyboard callbacks work similar to this so I copied the behaviour), but that forced the callback to run synchronously in the message thread which is not ideal - also if you forget to return true (which everybody
did), the callback ended up being fired multiple times which caused some irritations.

So instead this method was introduced that you must call **before**

calling `setKeyPressCallback()`
with either a single key press "object" or an array of key presses. A key press object can be either a string description of the key press like it's supplied in the callback argument or a JSON object like the callback parameter.

You can also use the special string `"all"`
to make the component consume every single key stroke, which is the default behaviour when you don't call this method (so compiled plugins will still work as they don't report compilation errors).

There is another special string `"all_nonexclusive"`
that you can pass into this function which will fire the script callback for each key press but not consume it so it can be processed further (a use case for this would be to attach additional functionality to a ScriptLabel
)

By using the same format as the callback parameter you can use this procedure for creating the filter list:

1. Call this function with "all".
2. Register a key callback, then dump the parameter JSON object.
3. Hit the key combination(s) that you want to consume.
4. Copy the JSON objects from the console into this function call.
5. Cleanup and paste the objects back into the first function call

So if you use this:

```
const var panel = Content.addPanel("p", 0, 0);

panel.setConsumedKeyPresses("all");

panel.setKeyPressCallback(function(obj)
{
	Console.print(trace(obj));
});
```

then clicking on the panel (to gain focus) and pressing any key will yield something like this output:

```
Interface: { "isFocusChange": false, "character": "", "specialKey": true, "isWhitespace": false, "isLetter": false, "isDigit": false, "keyCode": 63238, "description": "shift + F3", "shift": true, "cmd": false, "alt": false
}
```

This JSON object is a bit noisy as it provides additional information that we don't really need so we can reduce the number of required properties and paste it back into our first function call:

```
panel.setConsumedKeyPresses({ "keyCode": 63238, "shift": true, "cmd": false, "alt": false
});
```

So from now on, the function will only react on "Shift + F3 key presses". If you use a single key press this also brings the additional benefit of not having to branch at all so you can just rawdog your logic into the callback without any if checks.

#### **setControlCallback**

Pass a inline function for a custom callback event. Edit on GitHub

```
ScriptPanel.setControlCallback(var controlFunction)
```

#### **setDraggingBounds**

If `allowedDragging`
is enabled, it will define the boundaries where the panel can be dragged. Edit on GitHub

```
ScriptPanel.setDraggingBounds(var area)
```

#### **setFileDropCallback**

Sets a file drop callback.

```
ScriptPanel.setFileDropCallback(String callbackLevel, String wildcard, var dropFunction)
```

This function allows a file to be dropped on the panel that you can use for any purpose. It's basically the same functionality as the FileSystem.browse()
call, but with a different UX that some people might prefer over the native file dialogue.

The function expects three parameters, the first one will determine at which events the callback will be exeucted and must be one of these Strings (similar to the `callbackLevel`
property):

**String** | **Description** || `"No Callbacks"` | Ignore all file drag operations (default). |
| `"Drop Only"` | Only fires the callback when the file was dropped. |
| `"Drop & Hover"` | Additionally fires a callback when a dragged file enters / exits the panel. |
| `"All Callbacks"` | Also fires the callback when you move the dragged file inside the panel. |

If you pass in an empty String, it will deactivate the callback like `"No Callbacks"`. You can use this parameter to limit the execution of the callback to match your implementation: if you only want to react to a file being dropped, then use `"Drop Only"`
and the other callback levels offer a way for you to change the UI to let the user know that the file can be dropped (on top of the OS-native mouse cursor change).

The second parameter is a wildcard that filters the file types that can be dropped on the panel. The format is the usual file wildcard format, so `*.txt`
or `*.*`.
If you want multiple wildcards, use a semicolon or comma: `*.aiff,*.wav,*.mp3`.

if you want to only allow folders to be dropped, you need to supply the string `"{FOLDER}"`
as wildcard.

The third parameter is the function that is executed at all events specified by the callback level parameter. It must be a (inline) function with a single parameter that contains a JSON object with the file drop status information:

**Property** | **Type** | **Event** | **Description** || `x` | `int` | Move, Enter, Drop | the `x` position relative to the top left of the panel of the drag event. |
| `y` | `int` | Move, Enter, Drop | the `y` position relative to the top left of the panel of the drag event. |
| `hover` | `bool` | Move, Enter, Drop, Exit | `true` if the file is currently being dragged over the panel. |
| `drop` | `bool` | Move, Enter, Drop, Exit | `true` if the file is being dropped. |
| `fileName` | `String` | Drop | The absolute path of the file being dropped. If more than one file is dropped, then this will be an array with all matching filenames. |

If you need a File
object from the file being dropped, just use the new FileSystem.fromAbsolutePath()
method

If you want to store the filename as value in a user preset, you need to wrap the String into a JSON object like this:

```
Panel1.setFileDropCallback("All Callbacks", "*.wav", function(f)
{ if(f.drop) { // We can't pass in only the filename // (a String is forbidden as preset value in order // to prevent subtle bugs) so we need to create // a simple object with a single property var x = {}; x.fileName = f.fileName;
 // We could also just have passed in f to the function, // but this reduces the noise a bit this.setValue(x); this.changed(); }
});

inline function onPanel1Control(component, value)
{ // This might be empty (at initialisation or for whatever reason)... if(isDefined(value.fileName)) { var myFile = FileSystem.fromAbsolutePath(value.fileName); // Do something with myFile... }
};
```

#### **setImage**

Disables the paint routine and just uses the given (clipped) image. Edit on GitHub

```
ScriptPanel.setImage(String imageName, int xOffset, int yOffset)
```

#### **setIsModalPopup**

If this is set to true, the popup will be modal with a dark background that can be clicked to close. Edit on GitHub

```
ScriptPanel.setIsModalPopup(bool shouldBeModal)
```

#### **setKeyPressCallback**

Adds a callback to react on key presses (when this component is focused).

```
ScriptPanel.setKeyPressCallback(var keyboardFunction)
```

If you want the Panel to react on key strokes (from the computer keyboard, not the MIDI controller), you can attach a function with this method.
The function you pass in must have a single parameter which will contain the details of the key that was pressed (see below).

You will also need to call setConsumedKeyPresses()
and supply a list of key presses that you expect this component to consume (and not doing this will cause a compilation error to ensure that you don't accidentaly forget this and cause other issues later down the line).

This is a breaking change introduced in May 2024 to ensure that the callbacks can be executed asynchronously to match the behaviour of Content.setKeyPress().

If it is not consumed, the key press will trickle down the parent hierarchy until it finds a suitable target, so in order to avoid multiple actions with a single key press, make sure to register any key press if appropriate.

Also be aware that this function can be used with each component type (Labels, Buttons, etc), it's not limited to ScriptPanels

In addition to the event of a key press, this function will also be called when the keyboard focus shifts towards or from this component. This can be used to refresh the appearance and indicate in some way that the Panel is focused (or not).

**Property** | **Type** | **Description** || `isFocusChange` | `bool` | whether this callback was invoked because of a focus change (or a key press) |
| `hasFocus` | `bool` | if the callback was invoked because of a focus change, this will indicate whether it has the focus or not. |
| `character` | `String` | a character representation for the given key press. This is case sensitive, so pressing Shift+A will result in `A`, while pressing `A` without the shift modifier will result in `a`. |
| `keyCode` | `int` | the ASCII code for the key press. This can be also used to check for special keys. |
| `specialKey` | `bool` | this is true if the key press is not a printable character, eg. `F5` or `backspace`. You can still fetch the key codes to distinguish the events. |
| `description` | `String` | A textual representation of the key press, which is helpful during debugging. |
| `shift` | `bool` | whether the shift key was held down. |
| `cmd` | `bool` | whether the command (or ctrl) key was held down. |
| `alt` | `bool` | whether the alt key was held down. |

If you want to "complete" the text input, you might want to call ScriptPanel.loseFocus()
from inside the callback.

This example snippet will turn a Panel into a very simple Label:

```
const var Panel1 = Content.getComponent("Panel1");

Panel1.setPaintRoutine(function(g)
{
	g.fillAll(0x22FFFFFF);
	g.setColour(0x55FFFFFF);

	if(this.data.hasFocus)
		g.drawRect(this.getLocalBounds(0), 1.0);

	g.setColour(Colours.white);
	g.drawAlignedText(this.data.text, this.getLocalBounds(0), "centred");
});

Panel1.setKeyPressCallback(function(obj)
{
	// Take a look at this in the console
	Console.print(trace(obj));

	if(obj.isFocusChange)
	{
		this.data.hasFocus = obj.hasFocus;
	}
	else
	{
		switch(obj.keyCode)
		{
			// ESCAPE: Delete the text
			case 27: this.data.text = "";
				     break;
			// RETURN KEY: just lose the focus
			case 13: this.loseFocus();
					 break;
			// BACKSPACE: Remove the last character
			case 8:  this.data.text = this.data.text.substring(0, this.data.text.length-1);
					 break;
			// Append any non-special character
			default: if(!obj.specialKey)
						this.data.text += obj.character;
		}
	}

	this.repaint();
});
```

#### **setLoadingCallback**

Sets a loading callback that will be called when the preloading starts or finishes.

```
ScriptPanel.setLoadingCallback(var loadingCallback)
```

The loading of samples will be executed asynchronously on a background thread (in fact the same thread used for streaming the samples).

If you call `Sampler.loadSampleMap()`
or any other function that changes the sample content, it will kill all voices, load it on the background thread.

If you want your UI to reflect this behaviour, you can use a ScriptPanel as "loading indicator". Just register a function with this method and change the appearance accordingly:

```
// Example: Preloading callback
// this code will add a panel which will flash white during the preloading of new samples.

const var panel = Content.addPanel("Panel", 0, 0);

panel.data.colour = Colours.grey;

panel.setPaintRoutine(function(g)
{
	g.fillAll(this.data.colour);
});

// This function will be executed whenever the preload state changes
panel.setLoadingCallback(function(isPreloading)
{
	if(isPreloading) this.data.colour = Colours.white; else this.data.colour = Colours.grey;
 // Update the UI this.repaint();
});
```

Note that there is now a better way of handling events of a samplemap. This function is suited for displaying progress bars and other "soft" targets, but if you want to implement some kind of data logic that depends on the correct order of execution, take a look at Broadcaster.attachToSampleMap()
for a much more fine-grained tool for the job.

#### **setLocalLookAndFeel**

Attaches the local look and feel to this component. Edit on GitHub

```
ScriptPanel.setLocalLookAndFeel(var lafObject)
```

#### **setMouseCallback**

Sets a mouse callback. Edit on GitHub

```
ScriptPanel.setMouseCallback(var mouseCallbackFunction)
```

#### **setMouseCursor**

Sets a Path as mouse cursor for this panel.

```
ScriptPanel.setMouseCursor(var pathIcon, var colour, var hitPoint)
```

Instead of `pathIcon`, one of the following standard cursors can also be used as a string:

**Property** | **Description** || NoCursor | An invisible cursor. |
| NormalCursor | The standard arrow cursor. |
| WaitCursor | The normal hourglass or spinning-beachball 'busy' cursor. |
| IBeamCursor | A vertical I-beam for positioning within text. |
| CrosshairCursor | A pair of crosshairs. |
| CopyingCursor | The normal arrow cursor, but with a "+" on it. |
| PointingHandCursor | A hand with a pointing finger, for clicking on web-links. |
| DraggingHandCursor | An open flat hand for dragging heavy objects around. |
| LeftRightResizeCursor | An arrow pointing left and right. |
| UpDownResizeCursor | An arrow pointing up and down. |
| UpDownLeftRightResizeCursor | An arrow pointing up, down, left and right. |
| TopEdgeResizeCursor | A platform-specific cursor for resizing the top-edge of a window. |
| BottomEdgeResizeCursor | A platform-specific cursor for resizing the bottom-edge of a window. |
| LeftEdgeResizeCursor | A platform-specific cursor for resizing the left-edge of a window. |
| RightEdgeResizeCursor | A platform-specific cursor for resizing the right-edge of a window. |
| TopLeftCornerResizeCursor | A platform-specific cursor for resizing the top-left-corner of a window. |
| TopRightCornerResizeCursor | A platform-specific cursor for resizing the top-right-corner of a window. |
| BottomLeftCornerResizeCursor | A platform-specific cursor for resizing the bottom-left-corner of a window. |
| BottomRightCornerResizeCursor | A platform-specific cursor for resizing the bottom-right-corner of a window. |

```
// Changes the mouse pointer over the ScriptPanel1 to a hand with a pointing finger
ScriptPanel1.setMouseCursor("PointingHandCursor", Colours.white, [0, 0]);
```

#### **setPaintRoutine**

Sets a paint routine (a function with one parameter).

```
ScriptPanel.setPaintRoutine(var paintFunction)
```

setPaintRoutine() automatically passes a graphics API
object to the provided function, so it can be accessed from inside the paint routine. Conventionally, this parameter is named `g`.

##### **Examples**

Setting a paint routine for a single panel:

```
const myPanel = Content.addPanel("myPanel",0,0);
myPanel.setPaintRoutine(function(g)
{ g.fillRect(this.getLocalBounds(0));
});
```

Using an inlined function to paint multiple panels:

```
const panel1 = Content.addPanel("panel1",0,0);
const panel2 = Content.addPanel("panel2",0,60);

inline function paintPanels(g)
{ g.fillRect(this.getLocalBounds(0));
}

panel1.setPaintRoutine(paintPanels);
panel2.setPaintRoutine(paintPanels);
```

Using a regular function to paint multiple panels:

```
const panel1 = Content.addPanel("panel1",0,0);
const panel2 = Content.addPanel("panel2",0,60);

function paintPanels(g) //The function declaration must come before setPaintRoutine().
{ g.fillRect(this.getLocalBounds(0));
}

panel1.setPaintRoutine(paintPanels);
panel2.setPaintRoutine(paintPanels);
```

#### **setPanelValueWithUndo**

Sets a new value, stores this action in the undo manager and calls the control callbacks. Edit on GitHub

```
ScriptPanel.setPanelValueWithUndo(var oldValue, var newValue, var actionName)
```

#### **setPopupData**

Sets a FloatingTile that is used as popup. The position is a array [x, y, width, height] that is used for the popup dimension Edit on GitHub

```
ScriptPanel.setPopupData(var jsonData, var position)
```

#### **setPosition**

Sets the position of the component. Edit on GitHub

```
ScriptPanel.setPosition(int x, int y, int w, int h)
```

#### **setPropertiesFromJSON**

Restores all properties from a JSON object. Edit on GitHub

```
ScriptPanel.setPropertiesFromJSON( var jsonData)
```

#### **setStyleSheetClass**

Sets the given class selectors for the component stylesheet. Edit on GitHub

```
ScriptPanel.setStyleSheetClass( String classIds)
```

#### **setStyleSheetProperty**

Sets a variable for this component that can be queried from a style sheet. Edit on GitHub

```
ScriptPanel.setStyleSheetProperty( String variableId,  var value,  String type)
```

#### **setStyleSheetPseudoState**

Programatically sets a pseudo state (:hover,:active,:checked,:focus,:disabled) that will be used by the CSS renderer. Edit on GitHub

```
ScriptPanel.setStyleSheetPseudoState( String pseudoState)
```

#### **setTimerCallback**

Sets a timer callback. Edit on GitHub

```
ScriptPanel.setTimerCallback(var timerCallback)
```

#### **setTooltip**

Shows a informative text on mouse hover. Edit on GitHub

```
ScriptPanel.setTooltip( String tooltip)
```

#### **setValue**

Sets the current value Edit on GitHub

```
ScriptPanel.setValue(var newValue)
```

#### **setValueNormalized**

Sets the current value from a range 0.0... 1.0. Edit on GitHub

```
ScriptPanel.setValueNormalized(double normalizedValue)
```

#### **setValueWithUndo**

Sets the current value and adds it to the undo list. Don't call this from onControl! Edit on GitHub

```
ScriptPanel.setValueWithUndo(var newValue)
```

#### **setZLevel**

Changes the depth hierarchy (z-axis) of sibling components (Back, Default, Front or AlwaysOnTop). Edit on GitHub

```
ScriptPanel.setZLevel(String zLevel)
```

#### **showAsPopup**

Opens the panel as popup. Edit on GitHub

```
ScriptPanel.showAsPopup(bool closeOtherPopups)
```

#### **showControl**

Hides / Shows the control. Edit on GitHub

```
ScriptPanel.showControl(bool shouldBeVisible)
```

#### **startExternalFileDrag**

Starts dragging an external file (or a number of files). Edit on GitHub

```
ScriptPanel.startExternalFileDrag(var fileOrFilesToDrag, bool moveOriginalFiles, var finishCallback)
```

#### **startInternalDrag**

Starts dragging something inside the UI. Edit on GitHub

```
ScriptPanel.startInternalDrag(var dragData)
```

#### **unloadAllImages**

Unload all images from the panel. Edit on GitHub

```
ScriptPanel.unloadAllImages()
```

#### **updateContentPropertyInternal**

This updates the internal content data object from the script processor. Edit on GitHub

```
ScriptPanel.updateContentPropertyInternal(int propertyId,  var newValue)
```

#### **updateValueFromProcessorConnection**

Updates the value from the processor connection. Call this method whenever the module state has changed and you want to refresh the knob value to show the current state. Edit on GitHub

```
ScriptPanel.updateValueFromProcessorConnection()
```

### ScriptShader

A shader is a small program that will run natively on the GPU and allows very complex animation / textures. There is a whole universe of different shaders available.

In order to use it, create a shader object using Content.createShader(fileName)
and then render the shader on any ScriptPanel using Graphics.applyShader().

There are a few limitations to the shader support in HISE:

- no texture input
- only fragment shader support

and obviously the support of different shaders depend on the hardware on the end user system.

##### **How to use existing shaders in HISE**

Check out shadertoy.com
for a vast gallery of shaders. Unfortunately there is not a 100% clean API so you will need to adjust the shader code a bit in order to run inside HISE (I tried to make it as compatible as possible so the amount of tweaking is the absolute minimum).
Below you can see the **Hello world**
of shaders on shadertoy.com:

```
void mainImage( out vec4 fragColor, in vec2 fragCoord )
{ // Normalized pixel coordinates (from 0 to 1) vec2 uv = fragCoord/iResolution.xy;
 // Time varying pixel color vec3 col = 0.5 + 0.5*cos(iTime+uv.xyx+vec3(0,2,4));
 // Output to screen fragColor = vec4(col,1.0);
}
```

In order to use this shader in HISE you will have to do two steps:

1. modify the main function signature
2. multiply the output colour with `pixelAlpha`

If you do these two steps, you will end up with this code:

```
void main() // must be named `main()` without parameters
{ // Normalized pixel coordinates (from 0 to 1) vec2 uv = fragCoord/iResolution.xy;
 // Time varying pixel color vec3 col = 0.5 + 0.5*cos(iTime+uv.xyx+vec3(0,2,4));
 // Output to screen fragColor = pixelAlpha * vec4(col,1.0);
}
```

As soon as there is an image or something in the `iChannel`
boxes on the shadertoy website, the shader will not work, so make sure that you only use shaders without external textures.

##### **How to declare constants**

You can define constants or declare them above the main function like so:

```
#define PI 3.14159265359

const float myFloat = 2.35468;

const vec2 myVector = vec2(0.6546, 0.9512);
```

Arrays cannot be declared as constants as it is not supported by this version of GLSL.

So this won't work:

```
// this doesn't work
const vec2 myArray1[2] = vec2[2] (vec2( 0.4657,  0.2149), vec2( 0.5536,  0.1345));
```

But instead, you can declare arrays inside the main function like so:

```
void main()
{
	vec2 myArray1[2]; myArray1[0] = vec2( 0.4657,  0.2149); myArray1[1] = vec2( 0.5536,  0.1345);
 vec2 myArray2[64]; for (int i=0; i < 64; i++) // myArray2.length() isn't supported by the current GLSL version {
	    myArray2[i] = vec2(0.); }
 // Note that this won't work either: //vec2 myArray1[2] = vec2[3] (vec2( 0.4657,  0.2149), vec2( 0.5536,  0.1345));
}
```

##### **Learn to write shaders**

If you want to do more than pasting shaders from shadertoy.com and look at it in awe, you will need to learn how to write shaders. OpenGL shaders use a specific language called `GLSL`
which is similar to C / C++. There are lots of useful resources on the web,

I can recommend this
Youtube channel. Start with the basic introduction and watch the time pass by as you click the next video over and over again.

#### **fromBase64**

Compiles the code from the given base64 string.

```
ScriptShader.fromBase64(String b64)
```

During development it's highly recommended to use human readable GLSL text files in the script repository, however there are a few use cases where you need to dynamically load new shaders:

1. If you ship new shaders with expansions
2. If you want a monolithic patch (for pasting the HiseSnippet to the forum).

This method can be used to give the shader a base64 encoded string that was created with the ScriptShader.toBase64()
method.

#### **getOpenGLStatistics**

Returns a JSON object with the current OpenGL statistics. Edit on GitHub

```
ScriptShader.getOpenGLStatistics()
```

#### **setBlendFunc**

Sets the blend mode for the shader.

```
ScriptShader.setBlendFunc(bool enabled, int sFactor, int dFactor)
```

This sets the blending mode for the shader. The first parameter enables / disables blending all together and the other two parameters need to be OpenGL constants (which are defined as constants of the shader object).

There are plenty of options available in order to define the blending. Take a look at eg. this
website for a detailed explanation.

This is a small cheat sheet for the most useful combinations:

```
const var shader = Content.createShader("myShader");

// No blending
shader.setBlendFunc(false, shader.GL_ZERO, shader.GL_ZERO);

// Additive blending with alpha
shader.setBlendFunc(true, shader.GL_SRC_ALPHA, shader.GL_ONE);

// Default blending based on alpha value:
shader.setBlendFunc(true, shader.GL_SRC_ALPHA, shader.GL_ONE_MINUS_SRC_ALPHA);

// Additive blending without alpha
shader.setBlendFunc(true, shader.GL_ONE, shader.GL_ONE);

// Additive blending with alpha
shader.setBlendFunc(true, shader.GL_SRC_ALPHA, shader.GL_ONE);
```

#### **setEnableCachedBuffer**

If this is enabled, the shader will create a buffered image of the last rendering result. Edit on GitHub

```
ScriptShader.setEnableCachedBuffer(bool shouldEnableBuffer)
```

#### **setFragmentShader**

Loads a.glsl file from the script folder.

```
ScriptShader.setFragmentShader(String shaderFile)
```

Normally you don't need to use this method because the shader input will be defined when you create this object, but you can opt to use the same shader object but with a different input file if that suits your workflow.

The input parameter is the shader file name (without the `.glsl`
extension and the file must be inside the Scripts folder of your project (it will be embedded like any other script file when you export the project).

As soon as you added a shader, you can select the file in the drop down menu to get the code editor that you can use to modify the shader.

#### **setPreprocessor**

Adds a preprocessor definition before the code and recompiles the shader (Empty string removes all preprocessors). Edit on GitHub

```
ScriptShader.setPreprocessor(String preprocessorString, var value)
```

#### **setUniformData**

Sets an uniform variable to be used in the shader code.

```
ScriptShader.setUniformData( String id, var data)
```

This function can be used to pass around data from the HiseScript world to GLSL. It just needs two steps:

1. Define the variable in your GLSL code (with the uniform keyword).
2. Call this method.

So this is the example code for the GLSL part:

```
// GLSL side

uniform float myValue;
uniform vec3 myColour;
uniform float myBuffer[128];

void main()
{ fragColor = pixelAlpha * vec4(myColour, myValue);
}
```

From the script you need to call this:

```
// Javascript side:

const var shader = Content.createShader("MyShader");

// a single number will be parsed as float
shader.setUniformData("myValue", 0.8);

// an array with three elements will be interpreted as vec3 type.
shader.setUniformData("myColour", [0.0, 1.0, 0.0]);

const var buffer = Buffer.create(128);

// A Buffer object (a float array) will be passed on to the GPU as read only
shader.setUniformData("myBuffer", buffer);
```

Make sure that the types match (or the behaviour will be undefined). Also be aware that you will need to pass in the buffer data when it changes (the GPU doesn't reference the actual buffer data but takes a copy when you call this method).

#### **toBase64**

Compresses the GLSL code and returns a encoded string snippet.

```
ScriptShader.toBase64()
```

If you want to use dynamic shaders, you can call this method to get a compressed version of the current shader code which you then can pass into ScriptShader.fromBase64()

The most efficient workflow is to use `Console.print()`
with this method, then copy & paste the output as string literal.

Note that this string will include all files that are imported in the main shader using `#include`
so it's guaranteed to work without relying on any dependency.

### ScriptSlider

Create a reference to a Slider
UI component and modify its values.

```
const var Knob1 = Content.getComponent("Knob1");
```

#### **addToMacroControl**

Adds the knob / button to a macro controller (from 0 to 7). Edit on GitHub

```
ScriptSlider.addToMacroControl(int macroIndex)
```

#### **changed**

Call this to indicate that the value has changed (the onControl callback will be executed. Edit on GitHub

```
ScriptSlider.changed()
```

#### **connectToModulatedParameter**

Connects this slider to the modulation slot. Edit on GitHub

```
ScriptSlider.connectToModulatedParameter(String moduleId, var parameterId)
```

#### **contains**

Checks if the given value is within the range. Edit on GitHub

```
ScriptSlider.contains(double value)
```

#### **createLocalLookAndFeel**

Returns a local look and feel if it was registered before. Edit on GitHub

```
ScriptSlider.createLocalLookAndFeel(ScriptContentComponent *contentComponent, Component *componentToRegister)
```

#### **createModifiers**

Creates a object with constants for setModifiers().

```
ScriptSlider.createModifiers()
```

This creates an object holding constants to be used in setModifier(). There are two types of constants in there: action IDs and modifier key magic numbers.

##### **Actions**

There are multiple actions that are performed when interacting with a slider based on different modifier keys.

**ID** | **Default** | **Description** || TextInput | shift key | Opens the text input |
| ResetToDefault | double click | sets the slider to the default value |
| ContextMenu | right click | opens the context menu that lets you assign CCs etc |
| FineTune | command, ctrl or alt | changes the dragging sensitivity to a finer resolution |

The constants for the Action IDs just hold the same string as value, so it's not 100% required to use them (however it let's you use the autocomplete entries instead of looking up the available actions).

##### **Modifiers**

The other constants in this object are modifier keys and are basically identical to the properties of the event JSON object that is passed into the mouse callback of the panel:

```
const var mods = Knob1.createModifiers();

// keyboard modifiers
mods.shiftDown
mods.altDown
mods.ctrlDown
mods.cmdDown

// mouse button modifiers
mods.rightClick
mods.doubleClick

// special modifiers
mods.disabled
mods.noKeyModifier
```

Be aware that these constants do not hold string values like the action IDs, but integer flags that use bitwise operators for combining multiple modifiers.

The special modifiers can be used to either disable an action altogether or make sure that the action is only performed if no modifier key is pressed (you will need that if you set two actions to the same mouse click type).

#### **fadeComponent**

Toggles the visibility and fades a component using the global animator. Edit on GitHub

```
ScriptSlider.fadeComponent(bool shouldBeVisible, int milliseconds)
```

#### **get**

returns the value of the property. Edit on GitHub

```
ScriptSlider.get(String propertyName)
```

#### **getAllProperties**

Returns a list of all property IDs as array. Edit on GitHub

```
ScriptSlider.getAllProperties()
```

#### **getChildComponents**

Returns list of component's children Edit on GitHub

```
ScriptSlider.getChildComponents()
```

#### **getGlobalPositionX**

Returns the absolute x-position relative to the interface. Edit on GitHub

```
ScriptSlider.getGlobalPositionX()
```

#### **getGlobalPositionY**

Returns the absolute y-position relative to the interface. Edit on GitHub

```
ScriptSlider.getGlobalPositionY()
```

#### **getHeight**

Returns the height of the component. Edit on GitHub

```
ScriptSlider.getHeight()
```

#### **getId**

Returns the ID of the component. Edit on GitHub

```
ScriptSlider.getId()
```

#### **getLocalBounds**

Returns a [x, y, w, h] array that was reduced by the given amount. Edit on GitHub

```
ScriptSlider.getLocalBounds(float reduceAmount)
```

#### **getMaxValue**

Returns the upper range end. Edit on GitHub

```
ScriptSlider.getMaxValue()
```

#### **getMinValue**

Returns the lower range end. Edit on GitHub

```
ScriptSlider.getMinValue()
```

#### **getPopupMenuTarget**

Override this if you want to change the `component`
parameter of the popup menu callback. Edit on GitHub

```
ScriptSlider.getPopupMenuTarget( MouseEvent e)
```

#### **getValue**

Returns the current value. Edit on GitHub

```
ScriptSlider.getValue()
```

#### **getValueNormalized**

Returns the normalized value. Edit on GitHub

```
ScriptSlider.getValueNormalized()  override
```

#### **getWidth**

Returns the width of the component. Edit on GitHub

```
ScriptSlider.getWidth()
```

#### **grabFocus**

Call this method in order to grab the keyboard focus for this component. Edit on GitHub

```
ScriptSlider.grabFocus()
```

#### **loseFocus**

Call this method in order to give away the focus for this component. Edit on GitHub

```
ScriptSlider.loseFocus()
```

#### **sendRepaintMessage**

Manually sends a repaint message for the component. Edit on GitHub

```
ScriptSlider.sendRepaintMessage()
```

#### **set**

Sets the property. Edit on GitHub

```
ScriptSlider.set(String propertyName, var value)
```

#### **setColour**

sets the colour of the component (BG, IT1, IT2, TXT). Edit on GitHub

```
ScriptSlider.setColour(int colourId, int colourAs32bitHex)
```

#### **setConsumedKeyPresses**

Registers a selection of key presses to be consumed by this component. Edit on GitHub

```
ScriptSlider.setConsumedKeyPresses(var listOfKeys)
```

#### **setControlCallback**

Pass a inline function for a custom callback event. Edit on GitHub

```
ScriptSlider.setControlCallback(var controlFunction)
```

#### **setKeyPressCallback**

Adds a callback to react on key presses (when this component is focused). Edit on GitHub

```
ScriptSlider.setKeyPressCallback(var keyboardFunction)
```

#### **setLocalLookAndFeel**

Attaches the local look and feel to this component. Edit on GitHub

```
ScriptSlider.setLocalLookAndFeel(var lafObject)
```

#### **setMaxValue**

Sets the upper range end to the given value. Edit on GitHub

```
ScriptSlider.setMaxValue(double max)
```

#### **setMidPoint**

Sets the value that is shown in the middle position. Edit on GitHub

```
ScriptSlider.setMidPoint(double valueForMidPoint)
```

#### **setMinValue**

Sets the lower range end to the given value. Edit on GitHub

```
ScriptSlider.setMinValue(double min)
```

#### **setMode**

Sets the knob to the specified mode. Edit on GitHub

```
ScriptSlider.setMode(String mode)
```

#### **setModifiers**

Sets the modifiers for different actions using a JSON object.

```
ScriptSlider.setModifiers(String action, var modifiers)
```

This allows you to override the default modifiers for various actions related to the slider. It expects an ID for the action you want to change and a combination of modifier keys that will be assigned to the action. For both parameters it's highly recommended to use the properties from the Modifier object returned by createModifiers()
as it provides all available IDs and magic numbers as pretty named properties.

Be aware that this function is supposed to be called once at initialisation. Also it will keep the assignments from previous compilations, so if you want to reset it to the default you need to rebuild the UI from the interface designer.

###### **Combining modifier keys**

You can use both logical operators AND / OR in order to combine modifier keys, however the syntax differs a bit:

1. The OR operator can be implemented using the bitwise-or syntax
2. The AND operator must be implemented by passing an array of modifiers (up to three modifiers are supported)

```
const var mods = Knob1.createModifiers();

const var doubleClickAndShift = [ mods.doubleClick, mods.shiftDown];
const var rightClickOrAlt = mods.rightClick | mods.altDown;
const var commandOrShift = mods.shiftDown | mods.cmdDown;
const var doubleClickWithoutModifiers = [ mods.doubleClick, mods.noKeyModifiers ];
```

You can just overwrite the function you want to reassign, however you need to make sure that the assignment doesn't create any collision with the default mapping, otherwise the action that will be performed might not be the one you have reassigned (it will just pick the first match that is stored in a arbitrary order internally).

```
const var Knob1 = Content.getComponent("Knob1");
const var mods = Knob1.createModifiers();

// We want to reassign the reset double click to shift + double click
Knob1.setModifiers(mods.ResetToDefault, [ mods.doubleClick, mods.shiftDown ]);

// and the text input to a double click without modifiers.
Knob1.setModifiers(mods.TextInput, [mods.doubleClick, mods.noKeyModifier]);
```

#### **setPosition**

Sets the position of the component. Edit on GitHub

```
ScriptSlider.setPosition(int x, int y, int w, int h)
```

#### **setPropertiesFromJSON**

Restores all properties from a JSON object. Edit on GitHub

```
ScriptSlider.setPropertiesFromJSON( var jsonData)
```

#### **setRange**

Sets the range and the step size of the knob. Edit on GitHub

```
ScriptSlider.setRange(double min, double max, double stepSize)
```

#### **setStyle**

Sets the style Knob, Horizontal, Vertical. Edit on GitHub

```
ScriptSlider.setStyle(String style)
```

#### **setStyleSheetClass**

Sets the given class selectors for the component stylesheet. Edit on GitHub

```
ScriptSlider.setStyleSheetClass( String classIds)
```

#### **setStyleSheetProperty**

Sets a variable for this component that can be queried from a style sheet. Edit on GitHub

```
ScriptSlider.setStyleSheetProperty( String variableId,  var value,  String type)
```

#### **setStyleSheetPseudoState**

Programatically sets a pseudo state (:hover,:active,:checked,:focus,:disabled) that will be used by the CSS renderer. Edit on GitHub

```
ScriptSlider.setStyleSheetPseudoState( String pseudoState)
```

#### **setTooltip**

Shows a informative text on mouse hover. Edit on GitHub

```
ScriptSlider.setTooltip( String tooltip)
```

#### **setValue**

Sets the current value Edit on GitHub

```
ScriptSlider.setValue(var newValue)
```

#### **setValueNormalized**

Set the value from a 0.0 to 1.0 range Edit on GitHub

```
ScriptSlider.setValueNormalized(double normalizedValue) override
```

#### **setValuePopupFunction**

Pass a function that takes a double and returns a String in order to override the popup display text. Edit on GitHub

```
ScriptSlider.setValuePopupFunction(var newFunction)
```

#### **setValueWithUndo**

Sets the current value and adds it to the undo list. Don't call this from onControl! Edit on GitHub

```
ScriptSlider.setValueWithUndo(var newValue)
```

#### **setZLevel**

Changes the depth hierarchy (z-axis) of sibling components (Back, Default, Front or AlwaysOnTop). Edit on GitHub

```
ScriptSlider.setZLevel(String zLevel)
```

#### **showControl**

Hides / Shows the control. Edit on GitHub

```
ScriptSlider.showControl(bool shouldBeVisible)
```

#### **updateContentPropertyInternal**

This updates the internal content data object from the script processor. Edit on GitHub

```
ScriptSlider.updateContentPropertyInternal(int propertyId,  var newValue)
```

#### **updateValueFromProcessorConnection**

Updates the value from the processor connection. Call this method whenever the module state has changed and you want to refresh the knob value to show the current state. Edit on GitHub

```
ScriptSlider.updateValueFromProcessorConnection()
```

### ScriptSliderPack

Create a reference to a SliderPack
UI component and modify its values.

```
const var SliderPack1 = Content.getComponent("SliderPack1");
```

#### **addToMacroControl**

Adds the knob / button to a macro controller (from 0 to 7). Edit on GitHub

```
ScriptSliderPack.addToMacroControl(int macroIndex)
```

#### **createLocalLookAndFeel**

Returns a local look and feel if it was registered before. Edit on GitHub

```
ScriptSliderPack.createLocalLookAndFeel(ScriptContentComponent *contentComponent, Component *componentToRegister)
```

#### **fadeComponent**

Toggles the visibility and fades a component using the global animator. Edit on GitHub

```
ScriptSliderPack.fadeComponent(bool shouldBeVisible, int milliseconds)
```

#### **get**

returns the value of the property. Edit on GitHub

```
ScriptSliderPack.get(String propertyName)
```

#### **getAllProperties**

Returns a list of all property IDs as array. Edit on GitHub

```
ScriptSliderPack.getAllProperties()
```

#### **getChildComponents**

Returns list of component's children Edit on GitHub

```
ScriptSliderPack.getChildComponents()
```

#### **getDataAsBuffer**

Returns a Buffer object containing all slider values (as reference). Edit on GitHub

```
ScriptSliderPack.getDataAsBuffer()
```

#### **getGlobalPositionX**

Returns the absolute x-position relative to the interface. Edit on GitHub

```
ScriptSliderPack.getGlobalPositionX()
```

#### **getGlobalPositionY**

Returns the absolute y-position relative to the interface. Edit on GitHub

```
ScriptSliderPack.getGlobalPositionY()
```

#### **getHeight**

Returns the height of the component. Edit on GitHub

```
ScriptSliderPack.getHeight()
```

#### **getId**

Returns the ID of the component. Edit on GitHub

```
ScriptSliderPack.getId()
```

#### **getLocalBounds**

Returns a [x, y, w, h] array that was reduced by the given amount. Edit on GitHub

```
ScriptSliderPack.getLocalBounds(float reduceAmount)
```

#### **getNumSliders**

Returns the number of sliders. Edit on GitHub

```
ScriptSliderPack.getNumSliders()
```

#### **getPopupMenuTarget**

Override this if you want to change the `component`
parameter of the popup menu callback. Edit on GitHub

```
ScriptSliderPack.getPopupMenuTarget( MouseEvent e)
```

#### **getSliderValueAt**

Returns the value at the given index. Edit on GitHub

```
ScriptSliderPack.getSliderValueAt(int index)
```

#### **getValueNormalized**

Returns the normalized value. Edit on GitHub

```
ScriptSliderPack.getValueNormalized()
```

#### **getWidth**

Returns the width of the component. Edit on GitHub

```
ScriptSliderPack.getWidth()
```

#### **grabFocus**

Call this method in order to grab the keyboard focus for this component. Edit on GitHub

```
ScriptSliderPack.grabFocus()
```

#### **loseFocus**

Call this method in order to give away the focus for this component. Edit on GitHub

```
ScriptSliderPack.loseFocus()
```

#### **referToData**

Connects this SliderPack to an existing SliderPackData object. -1 sets it back to its internal data object. Edit on GitHub

```
ScriptSliderPack.referToData(var sliderPackData)
```

#### **registerAtParent**

Registers this sliderpack to the script processor to be acessible from the outside. Edit on GitHub

```
ScriptSliderPack.registerAtParent(int pIndex)
```

#### **sendRepaintMessage**

Manually sends a repaint message for the component. Edit on GitHub

```
ScriptSliderPack.sendRepaintMessage()
```

#### **set**

Sets the property. Edit on GitHub

```
ScriptSliderPack.set(String propertyName, var value)
```

#### **setAllValueChangeCausesCallback**

Enables or disables the control callback execution when the SliderPack is changed via setAllValues. Edit on GitHub

```
ScriptSliderPack.setAllValueChangeCausesCallback(bool shouldBeEnabled)
```

#### **setAllValues**

Sets all slider values to the given value. If value is a number it will be filled with the number. If it's a buffer (or array) it will set the values accordingly (without resizing the slider packs). Edit on GitHub

```
ScriptSliderPack.setAllValues(var value)
```

#### **setAllValuesWithUndo**

Like setAllValues, but with undo support (if useUndoManager is enabled). Edit on GitHub

```
ScriptSliderPack.setAllValuesWithUndo(var value)
```

#### **setColour**

sets the colour of the component (BG, IT1, IT2, TXT). Edit on GitHub

```
ScriptSliderPack.setColour(int colourId, int colourAs32bitHex)
```

#### **setConsumedKeyPresses**

Registers a selection of key presses to be consumed by this component. Edit on GitHub

```
ScriptSliderPack.setConsumedKeyPresses(var listOfKeys)
```

#### **setControlCallback**

Pass a inline function for a custom callback event. Edit on GitHub

```
ScriptSliderPack.setControlCallback(var controlFunction)
```

#### **setKeyPressCallback**

Adds a callback to react on key presses (when this component is focused). Edit on GitHub

```
ScriptSliderPack.setKeyPressCallback(var keyboardFunction)
```

#### **setLocalLookAndFeel**

Attaches the local look and feel to this component. Edit on GitHub

```
ScriptSliderPack.setLocalLookAndFeel(var lafObject)
```

#### **setPosition**

Sets the position of the component. Edit on GitHub

```
ScriptSliderPack.setPosition(int x, int y, int w, int h)
```

#### **setPropertiesFromJSON**

Restores all properties from a JSON object. Edit on GitHub

```
ScriptSliderPack.setPropertiesFromJSON( var jsonData)
```

#### **setSliderAtIndex**

sets the slider value at the given index. Edit on GitHub

```
ScriptSliderPack.setSliderAtIndex(int index, double value)
```

#### **setStyleSheetClass**

Sets the given class selectors for the component stylesheet. Edit on GitHub

```
ScriptSliderPack.setStyleSheetClass( String classIds)
```

#### **setStyleSheetProperty**

Sets a variable for this component that can be queried from a style sheet. Edit on GitHub

```
ScriptSliderPack.setStyleSheetProperty( String variableId,  var value,  String type)
```

#### **setStyleSheetPseudoState**

Programatically sets a pseudo state (:hover,:active,:checked,:focus,:disabled) that will be used by the CSS renderer. Edit on GitHub

```
ScriptSliderPack.setStyleSheetPseudoState( String pseudoState)
```

#### **setTooltip**

Shows a informative text on mouse hover. Edit on GitHub

```
ScriptSliderPack.setTooltip( String tooltip)
```

#### **setUsePreallocatedLength**

Sets a preallocated length that will retain values when the slider pack is resized below that limit. Edit on GitHub

```
ScriptSliderPack.setUsePreallocatedLength(int numMaxSliders)
```

#### **setValueNormalized**

Sets the current value from a range 0.0... 1.0. Edit on GitHub

```
ScriptSliderPack.setValueNormalized(double normalizedValue)
```

#### **setValueWithUndo**

Sets the current value and adds it to the undo list. Don't call this from onControl! Edit on GitHub

```
ScriptSliderPack.setValueWithUndo(var newValue)
```

#### **setWidthArray**

Sets a non-uniform width per slider using an array in the form [0.0,... a[i],... 1.0]. Edit on GitHub

```
ScriptSliderPack.setWidthArray(var normalizedWidths)
```

#### **setZLevel**

Changes the depth hierarchy (z-axis) of sibling components (Back, Default, Front or AlwaysOnTop). Edit on GitHub

```
ScriptSliderPack.setZLevel(String zLevel)
```

#### **showControl**

Hides / Shows the control. Edit on GitHub

```
ScriptSliderPack.showControl(bool shouldBeVisible)
```

#### **updateContentPropertyInternal**

This updates the internal content data object from the script processor. Edit on GitHub

```
ScriptSliderPack.updateContentPropertyInternal(int propertyId,  var newValue)
```

#### **updateValueFromProcessorConnection**

Updates the value from the processor connection. Call this method whenever the module state has changed and you want to refresh the knob value to show the current state. Edit on GitHub

```
ScriptSliderPack.updateValueFromProcessorConnection()
```

### ScriptTable

Create a reference to a Table UI component
and modify its values.

```
const var Table1 = Content.getComponent("Table1");
```

#### **addTablePoint**

Adds a new table point (x and y are normalized coordinates). Edit on GitHub

```
ScriptTable.addTablePoint(float x, float y)
```

#### **addToMacroControl**

Adds the knob / button to a macro controller (from 0 to 7). Edit on GitHub

```
ScriptTable.addToMacroControl(int macroIndex)
```

#### **changed**

Call this to indicate that the value has changed (the onControl callback will be executed. Edit on GitHub

```
ScriptTable.changed()
```

#### **createLocalLookAndFeel**

Returns a local look and feel if it was registered before. Edit on GitHub

```
ScriptTable.createLocalLookAndFeel(ScriptContentComponent *contentComponent, Component *componentToRegister)
```

#### **fadeComponent**

Toggles the visibility and fades a component using the global animator. Edit on GitHub

```
ScriptTable.fadeComponent(bool shouldBeVisible, int milliseconds)
```

#### **get**

returns the value of the property. Edit on GitHub

```
ScriptTable.get(String propertyName)
```

#### **getAllProperties**

Returns a list of all property IDs as array. Edit on GitHub

```
ScriptTable.getAllProperties()
```

#### **getChildComponents**

Returns list of component's children Edit on GitHub

```
ScriptTable.getChildComponents()
```

#### **getGlobalPositionX**

Returns the absolute x-position relative to the interface. Edit on GitHub

```
ScriptTable.getGlobalPositionX()
```

#### **getGlobalPositionY**

Returns the absolute y-position relative to the interface. Edit on GitHub

```
ScriptTable.getGlobalPositionY()
```

#### **getHeight**

Returns the height of the component. Edit on GitHub

```
ScriptTable.getHeight()
```

#### **getId**

Returns the ID of the component. Edit on GitHub

```
ScriptTable.getId()
```

#### **getLocalBounds**

Returns a [x, y, w, h] array that was reduced by the given amount. Edit on GitHub

```
ScriptTable.getLocalBounds(float reduceAmount)
```

#### **getPopupMenuTarget**

Override this if you want to change the `component`
parameter of the popup menu callback. Edit on GitHub

```
ScriptTable.getPopupMenuTarget( MouseEvent e)
```

#### **getTableValue**

Returns the table value from 0.0 to 1.0 according to the input value from 0.0 to 1.0. Edit on GitHub

```
ScriptTable.getTableValue(float inputValue)
```

#### **getValue**

Returns the current value. Edit on GitHub

```
ScriptTable.getValue()
```

#### **getValueNormalized**

Returns the normalized value. Edit on GitHub

```
ScriptTable.getValueNormalized()
```

#### **getWidth**

Returns the width of the component. Edit on GitHub

```
ScriptTable.getWidth()
```

#### **grabFocus**

Call this method in order to grab the keyboard focus for this component. Edit on GitHub

```
ScriptTable.grabFocus()
```

#### **loseFocus**

Call this method in order to give away the focus for this component. Edit on GitHub

```
ScriptTable.loseFocus()
```

#### **referToData**

Connects it to a table data object (or UI element in the same interface). -1 sets it back to its internal data object. Edit on GitHub

```
ScriptTable.referToData(var tableData)
```

#### **registerAtParent**

Registers this table (and returns a reference to the data) with the given index so you can use it from the outside. Edit on GitHub

```
ScriptTable.registerAtParent(int index)
```

#### **reset**

Resets the table with the given index to a 0..1 line. Edit on GitHub

```
ScriptTable.reset()
```

#### **sendRepaintMessage**

Manually sends a repaint message for the component. Edit on GitHub

```
ScriptTable.sendRepaintMessage()
```

#### **set**

Sets the property. Edit on GitHub

```
ScriptTable.set(String propertyName, var value)
```

#### **setColour**

sets the colour of the component (BG, IT1, IT2, TXT). Edit on GitHub

```
ScriptTable.setColour(int colourId, int colourAs32bitHex)
```

#### **setConsumedKeyPresses**

Registers a selection of key presses to be consumed by this component. Edit on GitHub

```
ScriptTable.setConsumedKeyPresses(var listOfKeys)
```

#### **setControlCallback**

Pass a inline function for a custom callback event. Edit on GitHub

```
ScriptTable.setControlCallback(var controlFunction)
```

#### **setKeyPressCallback**

Adds a callback to react on key presses (when this component is focused). Edit on GitHub

```
ScriptTable.setKeyPressCallback(var keyboardFunction)
```

#### **setLocalLookAndFeel**

Attaches the local look and feel to this component. Edit on GitHub

```
ScriptTable.setLocalLookAndFeel(var lafObject)
```

#### **setMouseHandlingProperties**

Customizes the dragging behaviour of the script table. Edit on GitHub

```
ScriptTable.setMouseHandlingProperties(var propertyObject)
```

#### **setPosition**

Sets the position of the component. Edit on GitHub

```
ScriptTable.setPosition(int x, int y, int w, int h)
```

#### **setPropertiesFromJSON**

Restores all properties from a JSON object. Edit on GitHub

```
ScriptTable.setPropertiesFromJSON( var jsonData)
```

#### **setSnapValues**

Connects the table to an existing Processor. Makes the table snap to the given x positions (from 0.0 to 1.0). Edit on GitHub

```
ScriptTable.setSnapValues(var snapValueArray)
```

#### **setStyleSheetClass**

Sets the given class selectors for the component stylesheet. Edit on GitHub

```
ScriptTable.setStyleSheetClass( String classIds)
```

#### **setStyleSheetProperty**

Sets a variable for this component that can be queried from a style sheet. Edit on GitHub

```
ScriptTable.setStyleSheetProperty( String variableId,  var value,  String type)
```

#### **setStyleSheetPseudoState**

Programatically sets a pseudo state (:hover,:active,:checked,:focus,:disabled) that will be used by the CSS renderer. Edit on GitHub

```
ScriptTable.setStyleSheetPseudoState( String pseudoState)
```

#### **setTablePoint**

Sets the point with the given index to the values. Edit on GitHub

```
ScriptTable.setTablePoint(int pointIndex, float x, float y, float curve)
```

#### **setTablePopupFunction**

Pass a function that takes a double and returns a String in order to override the popup display text. Edit on GitHub

```
ScriptTable.setTablePopupFunction(var newFunction)
```

#### **setTooltip**

Shows a informative text on mouse hover. Edit on GitHub

```
ScriptTable.setTooltip( String tooltip)
```

#### **setValue**

Sets the current value Edit on GitHub

```
ScriptTable.setValue(var newValue)
```

#### **setValueNormalized**

Sets the current value from a range 0.0... 1.0. Edit on GitHub

```
ScriptTable.setValueNormalized(double normalizedValue)
```

#### **setValueWithUndo**

Sets the current value and adds it to the undo list. Don't call this from onControl! Edit on GitHub

```
ScriptTable.setValueWithUndo(var newValue)
```

#### **setZLevel**

Changes the depth hierarchy (z-axis) of sibling components (Back, Default, Front or AlwaysOnTop). Edit on GitHub

```
ScriptTable.setZLevel(String zLevel)
```

#### **showControl**

Hides / Shows the control. Edit on GitHub

```
ScriptTable.showControl(bool shouldBeVisible)
```

#### **updateContentPropertyInternal**

This updates the internal content data object from the script processor. Edit on GitHub

```
ScriptTable.updateContentPropertyInternal(int propertyId,  var newValue)
```

#### **updateValueFromProcessorConnection**

Updates the value from the processor connection. Call this method whenever the module state has changed and you want to refresh the knob value to show the current state. Edit on GitHub

```
ScriptTable.updateValueFromProcessorConnection()
```

### ScriptWebView

The `WebView`
component allows you to render parts of your UI with the native browser technology on your OS. The integration into HISE is pretty straightforward and it allows bidirectional communication and resource management.

In order to use the Webview, just create it, set its bounds and then give it a root directory and a initial file to render.

##### **Component Properties**

There are a few special component properties that can be used to define the behaviour of the WebView

**Property** | **Description** || `rootDirectory` | A folder on your harddrive that will be used as root folder for all URLs |
| `indexFile` | A relative file path from the root directory to the HTML file you want to display initially. |
| `enableCache` | If this is true, then it will not reload the files from disk and cache every resource that you have requested. Usually you want to keep this off during development and then set it to true when you're done (this property needs to be enabled when you want to embed & export the web resources) |
| `enablePersistence` | if true, then every function call and JS code passed into evaluate() will be logged and called when a new webview is created. This allows a persistent state (see below for a more detailed explanation |

In addition to the "trivial" integration of a native webview handle into HISE there are a few quality of life improvements that will make working with a webview in HISE morestraightforward:

##### **Resource management**

During development, the files will be loaded from disk but for a compiled plugin you can embed all the resources into your plugin and load it from memory (so that you won't have to distribute the web files to the end user).

The embedding of the resources is purely optional and depends on whether the web resource root directory is a child of the HISE project folder - if it is, then we'll assume that the end user will not have your HISE project folder and embed it, but if the web root is somewhere else (eg. the app data folder) then we'll assume that you will prefer installing the web files on the end user's machine.

Also keep in mind that if you want to embed the resources that have to be loaded at the time you export the plugin.

##### **Automatic scaling**

We're still living in plugin-world where responsiveness is not the status quo and the only thing that people have started to expect is to resize the UI while keeping the aspect ratio the same. The zoom level system of HISE is extended into the webview, which means that whenever you change the scaling factor it will resize the UI handle and change the browser's zoom level to match the scale factor (exactly as if you would use Ctrl+/- in your browser).

##### **Persistence**

The lifetime of the webview is decoupled from the application state so we need to find a way to tell a webview that was created later to be updated to the current app state. For example if you show the value of a slider in the web view you would want it to display the correct slider value if you close and reopen the plugin window. The way that HISE handles this is that it keeps track of all communication between the HISE layer and the webview and then "repeats" every message after a new webview has been created (think of it as a "recap of everything that happened until now").

There are a few things to keep in mind:

1. The WebView should be considered as a pure, stateless UI element that can be destroyed and recreated without interrupting the data model or signal processing of your plugin (since that's how plugins work). Updating the data model will always be the responsibility of HISE.
2. The Webview is a native UI handle that is placed on top of the plugin interface. This means that you can't use any alpha blending or masking and put UI elements behind / infront of it.
3. During development, this might create a few glitches (the scale factor might be off if you're displaying a webview in the Interface designer, or it might overlap components there.

Make sure to checkout the tutorial project in the HISE tutorial
repo which contains multiple use cases

#### **addBufferToWebSocket**

Adds a buffer to be synchronised through the websocket. Edit on GitHub

```
ScriptWebView.addBufferToWebSocket(int bufferIndex, var buffer)
```

#### **addToMacroControl**

Adds the knob / button to a macro controller (from 0 to 7). Edit on GitHub

```
ScriptWebView.addToMacroControl(int macroIndex)
```

#### **bindCallback**

Binds a HiseScript function to a Javascript callback id.

```
ScriptWebView.bindCallback( String callbackId,  var functionToCall)
```

This will bind a callable HiseScript object (so either a function, an inline function or a broadcaster) to a function id in the WebView so you can call it from within JS in the web browser. In order to use this, just pass in a function ID that you will then use in JS to call this and a function with a single parameter. This parameter will be an array with all arguments that you pass into the JS function. You can also return a value which will then be used in a JS Promise to be evaluated asynchronously later:

###### **Javascript in your webview:**

```
someFunction({"value": Math.random()}).then ((result) =>
{ console.log(result);
});
```

###### **HiseScript**

```
wv.bindCallback("someFunction", function(args)
{
	Console.print(args.value);
	return args.value * 2.0;
});
```

#### **callFunction**

Calls the JS function (in the global scope) with the given arguments.

```
ScriptWebView.callFunction( String javascriptFunction,  var args)
```

You can use this method in order to (asynchronously) call a JS function that is visible to the global scope (=attached to the global windows). This function should not be called on the audio thread as it involves string allocation and JSON parsing, so make sure you defer the call if you want to react on a MIDI input (or signal cable).

###### **HiseScript**

```
wv.callFunction("someFunction", {"value": Math.random()});
```

###### **Javascript in your webview:**

You will need to define a JS function in your webview code somewhere like this:

```
// I'm not a web guy, but tucking it to the window object raises the chances of it being
// resolved correctly...
window.someFunction = function(args)
{
	console.log(args.value); // something between 0 and 1...
};
```

Note that there is no return value (because it can't be guaranteed that there is a webview present and if it is the function will be executed asynchronously on the message thread.

#### **changed**

Call this to indicate that the value has changed (the onControl callback will be executed. Edit on GitHub

```
ScriptWebView.changed()
```

#### **createLocalLookAndFeel**

Returns a local look and feel if it was registered before. Edit on GitHub

```
ScriptWebView.createLocalLookAndFeel(ScriptContentComponent *contentComponent, Component *componentToRegister)
```

#### **evaluate**

Evaluates the code in the web view. You need to pass in an unique identifier so that it will initialise new web views correctly.

```
ScriptWebView.evaluate( String identifier,  String jsCode)
```

You can tell the WebView to execute any chunk of JS code with this method - it will pass the string to the native browser API so make sure you follow the conventions here (I'm not a web guy lol).

One thing to keep in mind is that you need to pass in a unique ID for each time you call this function. This will store the JS string into a dictionary and then call it with the last JS code when a new WebView is created (to allow persistence).

#### **fadeComponent**

Toggles the visibility and fades a component using the global animator. Edit on GitHub

```
ScriptWebView.fadeComponent(bool shouldBeVisible, int milliseconds)
```

#### **get**

returns the value of the property. Edit on GitHub

```
ScriptWebView.get(String propertyName)
```

#### **getAllProperties**

Returns a list of all property IDs as array. Edit on GitHub

```
ScriptWebView.getAllProperties()
```

#### **getChildComponents**

Returns list of component's children Edit on GitHub

```
ScriptWebView.getChildComponents()
```

#### **getGlobalPositionX**

Returns the absolute x-position relative to the interface. Edit on GitHub

```
ScriptWebView.getGlobalPositionX()
```

#### **getGlobalPositionY**

Returns the absolute y-position relative to the interface. Edit on GitHub

```
ScriptWebView.getGlobalPositionY()
```

#### **getHeight**

Returns the height of the component. Edit on GitHub

```
ScriptWebView.getHeight()
```

#### **getId**

Returns the ID of the component. Edit on GitHub

```
ScriptWebView.getId()
```

#### **getLocalBounds**

Returns a [x, y, w, h] array that was reduced by the given amount. Edit on GitHub

```
ScriptWebView.getLocalBounds(float reduceAmount)
```

#### **getPopupMenuTarget**

Override this if you want to change the `component`
parameter of the popup menu callback. Edit on GitHub

```
ScriptWebView.getPopupMenuTarget( MouseEvent e)
```

#### **getValue**

Returns the current value. Edit on GitHub

```
ScriptWebView.getValue()
```

#### **getValueNormalized**

Returns the normalized value. Edit on GitHub

```
ScriptWebView.getValueNormalized()
```

#### **getWidth**

Returns the width of the component. Edit on GitHub

```
ScriptWebView.getWidth()
```

#### **grabFocus**

Call this method in order to grab the keyboard focus for this component. Edit on GitHub

```
ScriptWebView.grabFocus()
```

#### **loseFocus**

Call this method in order to give away the focus for this component. Edit on GitHub

```
ScriptWebView.loseFocus()
```

#### **reset**

Resets the entire webview.

```
ScriptWebView.reset()
```

This will clear all internal caches of the web view data model which might help with some glitches during development.

#### **sendRepaintMessage**

Manually sends a repaint message for the component. Edit on GitHub

```
ScriptWebView.sendRepaintMessage()
```

#### **sendToWebSocket**

Sends the data to the websocket.

```
ScriptWebView.sendToWebSocket(String id, var data)
```

This will send some data through the WebSocket connection to the webview. The communication is asynchronous, but not realtime safe.

The function expects two parameters, an `id`
and some `data`
that you want to send - either a String or a Buffer (or a JSON object that will be converted to a JSON string internally)

The ID will be used to coallascate calls (so subsequent calls with the same ID might only send that last data over to the webview).

Note that the ID can also be a stringified JSON object, which is a good practice if you want to attach some metadata to a audio buffer that you send over.

#### **set**

Sets the property. Edit on GitHub

```
ScriptWebView.set(String propertyName, var value)
```

#### **setColour**

sets the colour of the component (BG, IT1, IT2, TXT). Edit on GitHub

```
ScriptWebView.setColour(int colourId, int colourAs32bitHex)
```

#### **setConsumedKeyPresses**

Registers a selection of key presses to be consumed by this component. Edit on GitHub

```
ScriptWebView.setConsumedKeyPresses(var listOfKeys)
```

#### **setControlCallback**

Pass a inline function for a custom callback event. Edit on GitHub

```
ScriptWebView.setControlCallback(var controlFunction)
```

#### **setEnableWebSocket**

Enables Websocket communication between HISE and the webview.

```
ScriptWebView.setEnableWebSocket(int port)
```

This function will enable a bidirectional communication over a Websocket
connection between HISE and any webview that is shown on the screen. After a connection is established, you can use ScriptWebView.sendToWebsocket()
to send messages and add a callback that listens to data coming back from the WebView with ScriptWebView.setWebSocketCallback()

###### **WebSocket vs direct communication**

A websocket is an alternative option to the direct using the ScriptWebView.bindCallback()
and ScriptWebView.callFunction()
functions. Here is a overview of the advantages of each concept:

**Topic** | **WebSocket** | **Direct communication** || **Data** | large data blobs (eg. audio streams / images) | simple data (text, small JSONs) |
| **Development** | possible to develop the entire webview in a separate browser | more tightly coupled to HISE (can't communicate with "external" webviews). |
| **Setup** | more complicated setup, requires additional code in the webview | just bind & call the functions you want. |

###### **Client side (Webview Javascript)**

In order to streamline the implementation of the websocket communication with HISE, there is a minimal framework that contains a `HiseWebSocketServer`
class that handles all the communication.

In order to load the framework, just need to include this script in your HTML header:

```

```

Note that you don't need to provide the actual `hisewebsocket-min.js`
file as it's embedded in the webview wrapper and will automatically be loaded. However if you want to develop your webview through an external IDE, you will have to manually provide that file. Just copy this minified JS beauty into the root directory where your `index.html`
file resides:

```
class HiseWebSocketServer{constructor(e){this.port=e,this.eventListeners=[],this.initQueue=[],window.addEventListener("load",this.initialise),window.addEventListener("beforeunload",this.onUnload)}onUnload=()=>{this.socket.close()};onReader=e=>{let t=new Uint8Array(e.target.result),s=this.parseWebSocketMessage(t);for(let i=0;i{let t=new FileReader;t.onload=this.onReader,t.readAsArrayBuffer(e.data)};initialise=()=>{console.log("PORT: "+this.port),this.socket=new WebSocket("ws://localhost:"+this.port),this.socket.onmessage=this.onMessage,this.socket.onopen=this.sendInitMessages};sendInitMessages=()=>{for(let e=0;e
```

Now you can use the framework to create a HiseWebSocketServer object. It's recommended to put the initialisation code into a separate function and then call this from HISE to initialise the websocket server after everything has been loaded:

Now in HISE you can initialise the websocket like this:

```
const var wv = Content.addWebView("wv", 0, 0);

// just pick a random port and hope that there will be no collisions...
const var PORT = parseInt(Math.random() * 65536);
wv.setEnableWebSocket(PORT);

// we pass in the random port number to the initialisation function that opens
// the server connection on the webview
wv.callFunction("initWebSocket", PORT);
```

Note that choosing a random port number allows multiple plugin instances to communicate with their interface (while living with the 1/65536 chance of a collision, but that's life). However using a static / constant port number can also be used to implement a cross-instance communication across all plugin instances!

###### **Data Types**

The `data`
parameter that is passed to any callback that you register with `HiseWebSocketServer.addEventListener()`
contains the data and is one of two possible data types:

1. A `string` if the data sent from HISE was a String.
2. A Float32Array if the data sent from HISE was a Buffer object.

Note that the second data type is specifically added for transferring audio buffers between the webview and HISE to implement custom waveforms / oscilloscopes etc. If you want to send a JSON object (or a Array), you will need to convert and parse it yourself:

```
// on the HISE side
ScriptWebview.sendToWebsocket("myobject", trace(obj));

// on the Webview side
function onWebSocketMessage(id, data)
{
	let obj = JSON.parse(data);
}
```

#### **setHtmlContent**

Sets the HTML content to be used by the webview. Edit on GitHub

```
ScriptWebView.setHtmlContent( String htmlCode)
```

#### **setIndexFile**

Sets the file to be displayed by the WebView. Edit on GitHub

```
ScriptWebView.setIndexFile(var indexFile)
```

#### **setKeyPressCallback**

Adds a callback to react on key presses (when this component is focused). Edit on GitHub

```
ScriptWebView.setKeyPressCallback(var keyboardFunction)
```

#### **setLocalLookAndFeel**

Attaches the local look and feel to this component. Edit on GitHub

```
ScriptWebView.setLocalLookAndFeel(var lafObject)
```

#### **setPosition**

Sets the position of the component. Edit on GitHub

```
ScriptWebView.setPosition(int x, int y, int w, int h)
```

#### **setPropertiesFromJSON**

Restores all properties from a JSON object. Edit on GitHub

```
ScriptWebView.setPropertiesFromJSON( var jsonData)
```

#### **setStyleSheetClass**

Sets the given class selectors for the component stylesheet. Edit on GitHub

```
ScriptWebView.setStyleSheetClass( String classIds)
```

#### **setStyleSheetProperty**

Sets a variable for this component that can be queried from a style sheet. Edit on GitHub

```
ScriptWebView.setStyleSheetProperty( String variableId,  var value,  String type)
```

#### **setStyleSheetPseudoState**

Programatically sets a pseudo state (:hover,:active,:checked,:focus,:disabled) that will be used by the CSS renderer. Edit on GitHub

```
ScriptWebView.setStyleSheetPseudoState( String pseudoState)
```

#### **setTooltip**

Shows a informative text on mouse hover. Edit on GitHub

```
ScriptWebView.setTooltip( String tooltip)
```

#### **setValue**

Sets the current value Edit on GitHub

```
ScriptWebView.setValue(var newValue)
```

#### **setValueNormalized**

Sets the current value from a range 0.0... 1.0. Edit on GitHub

```
ScriptWebView.setValueNormalized(double normalizedValue)
```

#### **setValueWithUndo**

Sets the current value and adds it to the undo list. Don't call this from onControl! Edit on GitHub

```
ScriptWebView.setValueWithUndo(var newValue)
```

#### **setWebSocketCallback**

Registers a callable object to be notified for incoming messages from the websocket.

```
ScriptWebView.setWebSocketCallback(var callbackFunction)
```

This registers a callback that will be notified whenever you send anything through the established WebSocket connection.

It expects a function with a single parameter which will hold the data coming in from the webview. You can expect three data types:

1. A String when you send a string.
2. A JSON object when you send a JSON object (or Array) that was stringified. Note that you cannot send a JSON object directly, but use `JSON.stringify(myObject)` in Javascript (see below)
3. A Buffer object when you send a `Float32Array` from your webview.

In your webview code, you can use `HiseWebSocketServer.send()`
to send the data back to HISE.

```
// webview
HiseWebSocketServer.send("send some string");

// HISE
// data will be a plain string
ScriptWebView.setWebSocketCallback(function(data)
{
	Console.print(data) // "send some string"
});

// webview
const x = { "key1": 12, "key2": "some value"};
HiseWebSocketServer.send(JSON.stringify(x));

// HISE
// data will be a JSON object that you can trace to view
ScriptWebView.setWebSocketCallback(function(data)
{
	Console.print(trace(data)) // { key1: 12, key12: "some value" }
});

// webview
const x = new Float32Array(512);
for(i = 0; i < x.length; i++)
	x[i] = Math.random();
HiseWebSocketServer.send(x);

// HISE
// data will be a Buffer object
ScriptWebView.setWebSocketCallback(function(data)
{
	Console.print(data.length) // 512
});
```

Note that the execution order is guaranteed to be the same as you send the values, so you can send multiple messages at once and expect it to come into HISE in the same order.

#### **setZLevel**

Changes the depth hierarchy (z-axis) of sibling components (Back, Default, Front or AlwaysOnTop). Edit on GitHub

```
ScriptWebView.setZLevel(String zLevel)
```

#### **showControl**

Hides / Shows the control. Edit on GitHub

```
ScriptWebView.showControl(bool shouldBeVisible)
```

#### **updateBuffer**

Sends the buffer to the webview through the websocket connection. Edit on GitHub

```
ScriptWebView.updateBuffer(int bufferIndex)
```

#### **updateContentPropertyInternal**

This updates the internal content data object from the script processor. Edit on GitHub

```
ScriptWebView.updateContentPropertyInternal(int propertyId,  var newValue)
```

#### **updateValueFromProcessorConnection**

Updates the value from the processor connection. Call this method whenever the module state has changed and you want to refresh the knob value to show the current state. Edit on GitHub

```
ScriptWebView.updateValueFromProcessorConnection()
```

### Server

The `Server`
class offers a basic API for communicating with a server using POST and GET requests as well as functions for downloading resources.

##### **Server callbacks**

Every method in this class will use the asynchronous execution concept: it will return immediately and execute a function when the server has responded.

```
Server.anyFunction(parameters, function(status, response)
{ if(status == Server.StatusOK) { Console.print(response); }
});
```

The execution of server calls is guaranteed to be serially and consecutively and will be executed on a separate thread that will never stall the audio or UI thread. Nevertheless it should be obvious that you will never call one of these methods in a MIDI callback, right?

The `status`
will be an integer containing the HTTP status code. The `Server`
API class has a few constants that contains the most important codes (OK, 404, etc).

The `response`
argument contains an object with the response from the server.

This means whatever you do on the server-side, you have to return a valid JSON-formatted text.

##### **GET vs POST**

There are two different kind of HTTP requests, GET and POST. There is plenty of information available about this subject, but the gist of it is that you use GET for non-sensitive data and POST for sensitive data.

##### **About URLs**

In 99% of all cases, you will communicate with a single server. In order to save you some typing, the `Server`
API class uses a **Base URL**
that you need to setup once using Server.setBaseURL().

Calling this method will also start the server thread, so unless you explicitely use it, it won't eat up resources.

From then on, every call to the server just needs a sub URL to work - you also don't need to take care about the slashes:

```
Server.setBaseURL("https:forum.hise.audio");
Server.callSomething("api/recent");
// => https://forum.hise.audio/api/recent/
```

##### **Encryption**

If you use SSL for the communication and the POST method for passing around parameters, the communication with the server should be safe enough. However if you want to store any kind of data to a file, please use the File.writeEncryptedObject()
to make sure that there is no sensitive data lurking around on your hard drive.

##### **Debugging server calls & downloads**

The ServerController
floating tile offers a few useful tools that will assist you during the development of Server related tasks, so you might want to consider adding this to the scripting workspace while you're working on your server code.

#### **callWithGET**

Calls a sub URL and executes the callback when finished.

```
Server.callWithGET(String subURL, var parameters, var callback)
```

This calls the given URL with the `parameters`
as GET arguments and will execute the callback function when the server responded.

The `parameters`
have to be a non-nested JSON object and will automatically change the URL to embed these parameters

```
Server.setBaseURL("https://forum.hise.audio");

// The GET arguments as JSON object
const var p =
{ "term": "HISE", "in": "titlespost"
};

// => https://forum.hise.audio/api/search?term=HISE∈=titlesposts
Server.callWithGET("api/search", p, function(status, response)
{ if(status == Server.StatusOK) { // Just use the response like any other JSON object Console.print("There are " + response.matchCount + " results"); }
});
```

#### **callWithPOST**

Calls a sub URL with POST arguments and executes the callback when finished.

```
Server.callWithPOST(String subURL, var parameters, var callback)
```

The arguments in a POST call are not embedded in the URL so they are more suitable for sensitive information.

```
Server.setBaseURL("http://hise.audio");

const var p =
{ "first_argument": 9000
};

// This dummy file just returns the `first_argument` as `post_argument`...
Server.callWithPOST("post_test.php", p, function(status, response)
{ Console.print(response.post_argument);
});
```

#### **cleanFinishedDownloads**

Removes all finished downloads from the list. Edit on GitHub

```
Server.cleanFinishedDownloads()
```

#### **downloadFile**

Downloads a file to the given target and returns a Download object.

```
Server.downloadFile(String subURL, var parameters, var targetFile, var callback)
```

This method will start a download in the background and periodically executes the callback that can be used to track the progress.

The `target`
parameter has to be a valid File
object that points to a file (not a directory).

Be aware that this file will be deleted and overwritten!

Unlike the other methods, the function you pass in as `callback`
must not have any parameters. Instead you can query the state of the download via the `this.data`
object, which always points to the current download.
The object has these properties:

**Property** | **Type** | **Description** || `finished` | bool | `false` as long as the file is being downloaded. It will be executed exactly once with 'true' at the end of the download (or if you pause the download). |
| `success` | bool | at the end of the download (when `finished` is true), this can be used to check whether the download was successful, or if it was interrupted by something. If you pause the download, this will also be `false`. |
| `numTotal` | int | the total download size in bytes. This will not change during download. |
| `numDownloaded` | int | the number of bytes that have been downloaded until now. |

In addition to these properties, you can use the `this`
object in the function with all the API methods available in the Download
class.

```
Server.setBaseURL("http://hise.audio");
const var target = FileSystem.getFolder(FileSystem.Documents).getChildFile("HISE_1_1_1.exe");

Server.downloadFile("download/HISE_1_1_1.exe", {}, target, function()
{ var message = "";
 message += Engine.doubleToString(this.data.numDownloaded / 1024.0 / 1024.0, 1); message += "MB / " + Engine.doubleToString(this.data.numTotal / 1024.0 / 1024.0, 1) + "MB";
 Console.print(message);
 if(this.data.finished) Console.print(this.data.sucess ? "Done": "Fail");
});

inline function onButton1Control(component, value)
{
	if(value) Server.stopDownload("download/HISE_1_1_1.exe", {});
};

Content.getComponent("Button1").setControlCallback(onButton1Control);
```

Also be aware that if you call this method again with the same URL and parameters, it will not add another download, but just replace the callback in the already pending download. If you call this method with a file that already exists, the method assumes that it's a previously stopped download and resumes the download at the position (delete the file before calling the method if you don't want this behaviour).

#### **getPendingCalls**

Returns a list of all pending Calls. Edit on GitHub

```
Server.getPendingCalls()
```

#### **getPendingDownloads**

Returns a list of all pending Downloads.

```
Server.getPendingDownloads()
```

The lifetime of a Download
object will exceed the download time (so you can display a list of completed downloads). You can query the list of all available downloads with this method. If you want to remove all finished downloads, call Server.cleanFinishedDownloads()

#### **isEmailAddress**

Checks if given email address is valid - not fool proof. Edit on GitHub

```
Server.isEmailAddress(String email)
```

#### **isOnline**

Returns true if the system is connected to the internet. Edit on GitHub

```
Server.isOnline()
```

#### **resendLastCall**

Resends the last call to the Server (eg. in case that there was no internet connection). Edit on GitHub

```
Server.resendLastCall()
```

#### **setBaseURL**

Sets the base URL for all server queries. Edit on GitHub

```
Server.setBaseURL(String url)
```

#### **setEnforceTrailingSlash**

Sets whether to append a trailing slash to each POST call (default is true). Edit on GitHub

```
Server.setEnforceTrailingSlash(bool shouldAddSlash)
```

#### **setHttpHeader**

Adds the given String to the HTTP POST header. Edit on GitHub

```
Server.setHttpHeader(String additionalHeader)
```

#### **setNumAllowedDownloads**

Sets the maximal number of parallel downloads. Edit on GitHub

```
Server.setNumAllowedDownloads(int maxNumberOfParallelDownloads)
```

#### **setServerCallback**

This function will be called whenever there is server activity.

```
Server.setServerCallback(var callback)
```

You can use this function to implement some kind of notification to the user that there is something waiting for a response of the server and there is some internet activity.

For a real world use case you might to show some element spinning and then hide it when ready, but in this example, we'll just log to the Console:

```
Server.setBaseURL("https://forum.hise.audio/api");
Server.setServerCallback(function(isWaiting)
{ Console.print(isWaiting ? "SERVER IS BUSY": "DONE");
});

function printName(status, obj)
{ if(status == 200) Console.print(" " + obj.username);
};

// Now hammer the queue with the top 5 Posters
Server.callWithGET("user/d-healey", {}, printName);
Server.callWithGET("user/christoph-hart", {}, printName);
Server.callWithGET("user/ustk", {}, printName);
Server.callWithGET("user/Lindon", {}, printName);
Server.callWithGET("user/hisefilo", {}, printName);
```

The output:

```
Interface: SERVER IS BUSY
Interface:  d.healey
Interface:  Christoph Hart
Interface:  ustk
Interface:  Lindon
Interface:  hisefilo
Interface: DONE
```

As you can see the start / end callback is only called once. Be aware that this callback is not used when there is a download in progress as this has it's own notification tools.

#### **setTimeoutMessageString**

Sets a string that is parsed as timeout message when the server doesn't respond. Default is "{}" (empty JSON object). Edit on GitHub

```
Server.setTimeoutMessageString(String timeoutMessage)
```

### Settings

The `Settings`
object returns plugin specific settings, and functions to get and set their properties.

#### **clearMidiLearn**

Clears all MIDI CC assignments. Edit on GitHub

```
Settings.clearMidiLearn()
```

#### **crashAndBurn**

Calls abort to terminate the program. You can use this to check your crash reporting workflow. Edit on GitHub

```
Settings.crashAndBurn()
```

#### **getAvailableBufferSizes**

Returns available buffer sizes for the selected audio device. Edit on GitHub

```
Settings.getAvailableBufferSizes()
```

#### **getAvailableDeviceNames**

Returns names of available audio devices. Edit on GitHub

```
Settings.getAvailableDeviceNames()
```

#### **getAvailableDeviceTypes**

Returns available audio device types. Edit on GitHub

```
Settings.getAvailableDeviceTypes()
```

#### **getAvailableOutputChannels**

Returns array of available output channel pairs. Edit on GitHub

```
Settings.getAvailableOutputChannels()
```

#### **getAvailableSampleRates**

Returns array of available sample rate. Edit on GitHub

```
Settings.getAvailableSampleRates()
```

#### **getCurrentAudioDevice**

Gets the current audio device name Edit on GitHub

```
Settings.getCurrentAudioDevice()
```

#### **getCurrentAudioDeviceType**

Returns the current audio device type. Edit on GitHub

```
Settings.getCurrentAudioDeviceType()
```

#### **getCurrentBufferSize**

Returns the current buffer block size. Edit on GitHub

```
Settings.getCurrentBufferSize()
```

#### **getCurrentOutputChannel**

Returns current output channel pair. Edit on GitHub

```
Settings.getCurrentOutputChannel()
```

#### **getCurrentSampleRate**

Returns the current output sample rate (-1 if no audio device selected) Edit on GitHub

```
Settings.getCurrentSampleRate()
```

#### **getCurrentVoiceMultiplier**

Returns current voice amount multiplier setting. Edit on GitHub

```
Settings.getCurrentVoiceMultiplier()
```

#### **getDiskMode**

Gets the Streaming Mode (0 -> Fast-SSD, 1 -> Slow-HDD) Edit on GitHub

```
Settings.getDiskMode()
```

#### **getMidiInputDevices**

Returns array of MIDI input device names. Edit on GitHub

```
Settings.getMidiInputDevices()
```

#### **getUserDesktopSize**

Returns an array of the form [width, height]. Edit on GitHub

```
Settings.getUserDesktopSize()
```

#### **getZoomLevel**

Returns the UI Zoom factor. Edit on GitHub

```
Settings.getZoomLevel()
```

#### **isMidiChannelEnabled**

Returns enabled state of midi channel (0 = All channels). Edit on GitHub

```
Settings.isMidiChannelEnabled(int index)
```

#### **isMidiInputEnabled**

Returns enabled state of midi input device. Edit on GitHub

```
Settings.isMidiInputEnabled( String midiInputName)
```

#### **isOpenGLEnabled**

Returns whether OpenGL is enabled or not. The return value might be out of sync with the actual state (after you changed this setting until the next reload). Edit on GitHub

```
Settings.isOpenGLEnabled()
```

#### **setAudioDevice**

Sets the current audio device Edit on GitHub

```
Settings.setAudioDevice(String name)
```

#### **setAudioDeviceType**

Sets the current audio device type Edit on GitHub

```
Settings.setAudioDeviceType(String deviceName)
```

#### **setBufferSize**

Sets the buffer block size for the selected audio device. Edit on GitHub

```
Settings.setBufferSize(int newBlockSize)
```

#### **setDiskMode**

Sets the Streaming Mode (0 -> Fast-SSD, 1 -> Slow-HDD) Edit on GitHub

```
Settings.setDiskMode(int mode)
```

#### **setEnableDebugMode**

Enables or disables debug logging Edit on GitHub

```
Settings.setEnableDebugMode(bool shouldBeEnabled)
```

#### **setEnableOpenGL**

Enable OpenGL. This setting will be applied the next time the interface is rebuild. Edit on GitHub

```
Settings.setEnableOpenGL(bool shouldBeEnabled)
```

#### **setOutputChannel**

Sets the output channel pair Edit on GitHub

```
Settings.setOutputChannel(int index)
```

#### **setSampleFolder**

Changes the sample folder. Edit on GitHub

```
Settings.setSampleFolder(var sampleFolder)
```

#### **setSampleRate**

Sets the output sample rate Edit on GitHub

```
Settings.setSampleRate(double sampleRate)
```

#### **setVoiceMultiplier**

Sets the voice limit multiplier (1, 2, 4, or 8). Edit on GitHub

```
Settings.setVoiceMultiplier(int newVoiceAmount)
```

#### **setZoomLevel**

Changes the UI zoom (1.0 = 100%). Edit on GitHub

```
Settings.setZoomLevel(double newLevel)
```

#### **startPerfettoTracing**

Starts the perfetto profile recording. Edit on GitHub

```
Settings.startPerfettoTracing()
```

#### **stopPerfettoTracing**

Stops the perfetto profile recording and dumps the data to the given file. Edit on GitHub

```
Settings.stopPerfettoTracing(var traceFileToUse)
```

#### **toggleMidiChannel**

Enables or disables MIDI channel (0 = All channels). Edit on GitHub

```
Settings.toggleMidiChannel(int index, bool value)
```

#### **toggleMidiInput**

Enables or disables named MIDI input device. Edit on GitHub

```
Settings.toggleMidiInput( String midiInputName, bool enableInput)
```

### SliderPackData

Create a `SliderPackdata`
object with Engine.createAndRegisterSliderPackData
and modify its content via script.

```
const var SliderPackData = Engine.createAndRegisterSliderPackData(0);
```

#### **fromBase64**

Restores the data from the B64 string. Edit on GitHub

```
SliderPackData.fromBase64( String b64)
```

#### **getCurrentlyDisplayedIndex**

Returns the currently displayed slider index. Edit on GitHub

```
SliderPackData.getCurrentlyDisplayedIndex()
```

#### **getDataAsBuffer**

Returns a Buffer object containing all slider values (as reference). Edit on GitHub

```
SliderPackData.getDataAsBuffer()
```

#### **getNumSliders**

Returns the amount of sliders. Edit on GitHub

```
SliderPackData.getNumSliders()
```

#### **getStepSize**

Returns the step size. Edit on GitHub

```
SliderPackData.getStepSize()
```

#### **getValue**

Returns the value at the given position. Edit on GitHub

```
SliderPackData.getValue(int index)
```

#### **linkTo**

Links the sliderpack to the other slider pack. Edit on GitHub

```
SliderPackData.linkTo(var other)
```

#### **setAllValues**

Sets all values. Edit on GitHub

```
SliderPackData.setAllValues(var value)
```

#### **setAllValuesWithUndo**

Sets all values with an undo operation. Edit on GitHub

```
SliderPackData.setAllValuesWithUndo(var value)
```

#### **setAssignIsUndoable**

Enables undo support for []-operator assignments. Edit on GitHub

```
SliderPackData.setAssignIsUndoable(bool shouldBeUndoable)
```

#### **setContentCallback**

Sets a callback that is being executed when a point is added / removed / changed. Edit on GitHub

```
SliderPackData.setContentCallback(var contentFunction)
```

#### **setDisplayCallback**

Sets a callback that is being executed when the ruler position changes. Edit on GitHub

```
SliderPackData.setDisplayCallback(var displayFunction)
```

#### **setNumSliders**

Sets the amount of sliders. Edit on GitHub

```
SliderPackData.setNumSliders(var numSliders)
```

#### **setRange**

Sets the range. Edit on GitHub

```
SliderPackData.setRange(double minValue, double maxValue, double stepSize)
```

#### **setUsePreallocatedLength**

Sets a preallocated length that will retain values when the slider pack is resized below that limit. Edit on GitHub

```
SliderPackData.setUsePreallocatedLength(int length)
```

#### **setValue**

Sets the value at the given position. Edit on GitHub

```
SliderPackData.setValue(int sliderIndex, float value)
```

#### **setValueWithUndo**

Sets a single value at the given position with undo support. Edit on GitHub

```
SliderPackData.setValueWithUndo(int sliderIndex, float value)
```

#### **toBase64**

Exports the data to a B64 string. Edit on GitHub

```
SliderPackData.toBase64()
```

### SliderPackProcessor

Get a reference to a sliderpack at index withSynth.getSliderPackProcessor().

#### **getSliderPack**

Creates a data reference to the given index. Edit on GitHub

```
SliderPackProcessor.getSliderPack(int sliderPackIndex)
```

### SlotFX

The `SlotFX`
class gives you access to the Effect Slot
FX, with which you can swap effects in a programmatic way.

```
const var EffectSlot1 = Synth.getSlotFX("Effect Slot1");
```

#### **clear**

Clears the slot (loads a unity gain module). Edit on GitHub

```
SlotFX.clear()
```

#### **exists**

Checks if the Object exists and prints a error message on the console if not. Edit on GitHub

```
SlotFX.exists()
```

#### **getCurrentEffect**

Returns a reference to the currently loaded effect. Edit on GitHub

```
SlotFX.getCurrentEffect()
```

#### **getCurrentEffectId**

Returns the ID of the effect that is currently loaded. Edit on GitHub

```
SlotFX.getCurrentEffectId()
```

#### **getModuleList**

Returns the list of all available modules that you can load into the slot (might be empty if there is no compiled dll present). Edit on GitHub

```
SlotFX.getModuleList()
```

#### **getParameterProperties**

Returns a JSON object containing all parameters with their range properties. Edit on GitHub

```
SlotFX.getParameterProperties()
```

#### **setBypassed**

Bypasses the effect. This uses the soft bypass feature of the SlotFX module. Edit on GitHub

```
SlotFX.setBypassed(bool shouldBeBypassed)
```

#### **setEffect**

Loads the effect with the given name and returns a reference to it. Edit on GitHub

```
SlotFX.setEffect(String effectName)
```

#### **swap**

Swaps the effect with the other slot. Edit on GitHub

```
SlotFX.swap(var otherSlot)
```

### String

The `String`
object is the base class for all string operations in HISE.

```
const var s = "string";

Console.print(s.capitalize()); // String

Console.print("string".toUpperCase()); // STRING
```

#### **capitalize**

Converts a string to start case (first letter of every word is uppercase). Edit on GitHub

```
String.capitalize()
```

#### **charAt**

Returns the character at the given index. Edit on GitHub

```
String.charAt(int index)
```

#### **charCodeAt**

Returns the character at the given position as ASCII number. Edit on GitHub

```
String.charCodeAt(var index)
```

#### **concat**

Joins two or more strings, and returns a new joined strings. Edit on GitHub

```
String.concat(var stringlist)
```

#### **contains**

Checks if the string contains the given substring. Edit on GitHub

```
String.contains(String otherString)
```

#### **decrypt**

Decrypt a string from Blowfish encryption. Edit on GitHub

```
String.decrypt(var key)
```

#### **encrypt**

Encrypt a string using Blowfish encryption. Edit on GitHub

```
String.encrypt(var key)
```

#### **getIntValue**

Attempts to parse the string as integer number. Edit on GitHub

```
String.getIntValue()
```

#### **getTrailingIntValue**

Attempts to parse a integer number at the end of the string. Edit on GitHub

```
String.getTrailingIntValue()
```

#### **hash**

Creates a unique hash from the string. Edit on GitHub

```
String.hash()
```

#### **indexOf**

Returns the position of the first found occurrence of a specified value in a string. Edit on GitHub

```
String.indexOf(var substring)
```

#### **lastIndexOf**

Returns the position of the last found occurrence of a specified value in a string. Edit on GitHub

```
String.lastIndexOf(var substring)
```

#### **replace**

Returns a copy of the string and replaces all occurences of `a`
with `b`. Edit on GitHub

```
String.replace(var substringToLookFor, var replacement)
```

#### **split**

Splits the string into an array with the given separator. Edit on GitHub

```
String.split(var separatorString)
```

#### **splitCamelCase**

Splits the string at uppercase characters (so MyValue becomes ["My", "Value"]. Edit on GitHub

```
String.splitCamelCase()
```

#### **substring**

Returns the substring in the given range. Edit on GitHub

```
String.substring(int startIndex, int endIndex)
```

#### **toLowerCase**

Converts a string to lowercase letters. Edit on GitHub

```
String.toLowerCase()
```

#### **toUpperCase**

Converts a string to uppercase letters. Edit on GitHub

```
String.toUpperCase()
```

#### **trim**

Returns a copy of this string with any whitespace characters removed from the start and end. Edit on GitHub

```
String.trim()
```

### Synth

The `Synth`
object grants access to the Sound Generators internals (scoped). Depending on the type of Sound Generator, there are some function which will not work, because they are limited to a certain Processor type.

#### **addController**

Adds a controller to the buffer. Edit on GitHub

```
Synth.addController(int channel, int number, int value, int timeStampSamples)
```

#### **addEffect**

Adds a effect (index = -1 to append it at the end). Edit on GitHub

```
Synth.addEffect( String type,  String id, int index)
```

#### **addMessageFromHolder**

Adds the event from the given holder and returns a event id for note ons. Edit on GitHub

```
Synth.addMessageFromHolder(var messageHolder)
```

#### **addModulator**

Adds a Modulator to the synth's chain. If it already exists, it returns the index. Edit on GitHub

```
Synth.addModulator(int chainId,  String type,  String id)
```

#### **addNoteOff**

Adds a note off to the buffer. Edit on GitHub

```
Synth.addNoteOff(int channel, int noteNumber, int timeStampSamples)
```

#### **addNoteOn**

Adds a note on to the buffer.

```
Synth.addNoteOn(int channel, int noteNumber, int velocity, int timeStampSamples)
```

Be aware that if you call this method with a positive timestamp, it might create a stuck note if you don't ensure that the note-off message you create has a timestamp bigger than this.

There's a shortcut to solving this issue: the new API call Synth.setFixNoteOnAfterNoteOff()
which performs a few safe checks to prevent stuck notes in this scenario.

#### **addPitchFade**

Adds a pitch fade to the given event ID. Edit on GitHub

```
Synth.addPitchFade(int eventId, int fadeTimeMilliseconds, int targetCoarsePitch, int targetFinePitch)
```

#### **addToFront**

Adds the interface to the Container's body (or the frontend interface if compiled) Edit on GitHub

```
Synth.addToFront(bool addToFront)
```

#### **addVolumeFade**

Fades all voices with the given event id to the target volume (in decibels). Edit on GitHub

```
Synth.addVolumeFade(int eventId, int fadeTimeMilliseconds, int targetVolume)
```

#### **attachNote**

Attaches an artificial note to be stopped when the original note is stopped. Edit on GitHub

```
Synth.attachNote(int originalNoteId, int artificialNoteId)
```

#### **createBuilder**

Creates a Builder object that can be used to create the module tree. Edit on GitHub

```
Synth.createBuilder()
```

#### **deferCallbacks**

Defers all callbacks to the message thread (midi callbacks become read-only). Edit on GitHub

```
Synth.deferCallbacks(bool makeAsynchronous)
```

#### **getAllEffects**

Returns an array of all effects that match the given regex. Edit on GitHub

```
Synth.getAllEffects(String regex)
```

#### **getAllModulators**

Returns an array of all modulators that match the given regex. Edit on GitHub

```
Synth.getAllModulators(String regex)
```

#### **getAttribute**

Returns the attribute of the parent synth. Edit on GitHub

```
Synth.getAttribute(int attributeIndex)
```

#### **getAudioSampleProcessor**

Returns the child synth with the supplied name. Edit on GitHub

```
Synth.getAudioSampleProcessor( String name)
```

#### **getChildSynth**

Returns the child synth with the supplied name. Edit on GitHub

```
Synth.getChildSynth( String name)
```

#### **getChildSynthByIndex**

Returns the child synth with the given index. Edit on GitHub

```
Synth.getChildSynthByIndex(int index)
```

#### **getDisplayBufferSource**

Returns a reference to a processor that holds a display buffer. Edit on GitHub

```
Synth.getDisplayBufferSource( String name)
```

#### **getEffect**

Returns the Effect with the supplied name. Can only be called in onInit(). It looks also in all child processors. Edit on GitHub

```
Synth.getEffect( String name)
```

#### **getIdList**

Searches the child processors and returns a list with every ID of the given type. Edit on GitHub

```
Synth.getIdList( String type)
```

#### **getMidiPlayer**

Creates a reference to the given MIDI player. Edit on GitHub

```
Synth.getMidiPlayer( String playerId)
```

#### **getMidiProcessor**

Returns the MidiProcessor with the supplied name. Can not be the own name! Edit on GitHub

```
Synth.getMidiProcessor( String name)
```

#### **getModulator**

Returns the Modulator with the supplied name. Can be only called in onInit. It looks also in all child processors. Edit on GitHub

```
Synth.getModulator( String name)
```

#### **getModulatorIndex**

Returns the index of the Modulator in the chain with the supplied chainId Edit on GitHub

```
Synth.getModulatorIndex(int chainId,  String id)
```

#### **getNumChildSynths**

Returns the number of child synths. Works with SynthGroups and SynthChains. Edit on GitHub

```
Synth.getNumChildSynths()
```

#### **getNumPressedKeys**

Returns the number of pressed keys (!= the number of playing voices!). Edit on GitHub

```
Synth.getNumPressedKeys()
```

#### **getRoutingMatrix**

Creates a reference to the routing matrix of the given processor. Edit on GitHub

```
Synth.getRoutingMatrix( String processorId)
```

#### **getSampler**

Returns the first sampler with the name name. Edit on GitHub

```
Synth.getSampler( String name)
```

#### **getSliderPackProcessor**

Returns the sliderpack processor with the given name. Edit on GitHub

```
Synth.getSliderPackProcessor( String name)
```

#### **getSlotFX**

Returns the first slot with the given name. Edit on GitHub

```
Synth.getSlotFX( String name)
```

#### **getTableProcessor**

Returns the table processor with the given name. Edit on GitHub

```
Synth.getTableProcessor( String name)
```

#### **getTimerInterval**

Returns the current timer interval in seconds. Edit on GitHub

```
Synth.getTimerInterval()
```

#### **getWavetableController**

Creates a object to control the wavetable synthesiser features. Edit on GitHub

```
Synth.getWavetableController( String processorId)
```

#### **isArtificialEventActive**

Checks if the artificial event is active Edit on GitHub

```
Synth.isArtificialEventActive(int eventId)
```

#### **isKeyDown**

Checks if the given key is pressed. Edit on GitHub

```
Synth.isKeyDown(int noteNumber)
```

#### **isLegatoInterval**

Checks if any key is pressed. Edit on GitHub

```
Synth.isLegatoInterval()
```

#### **isSustainPedalDown**

Returns true if the sustain pedal is pressed. Edit on GitHub

```
Synth.isSustainPedalDown()
```

#### **isTimerRunning**

Checks if the timer for this script is running. Edit on GitHub

```
Synth.isTimerRunning()
```

#### **noteOff**

Sends a note off message. The envelopes will tail off. Edit on GitHub

```
Synth.noteOff(int noteNumber)
```

#### **noteOffByEventId**

Sends a note off message for the supplied event ID. This is more stable than the deprecated noteOff() method. Edit on GitHub

```
Synth.noteOffByEventId(int eventId)
```

#### **noteOffDelayedByEventId**

Sends a note off message for the supplied event ID with the given delay in samples. Edit on GitHub

```
Synth.noteOffDelayedByEventId(int eventId, int timestamp)
```

#### **noteOffFromUI**

Injects a note off to the incoming MIDI buffer (similar to playNoteFromUI). Edit on GitHub

```
Synth.noteOffFromUI(int channel, int noteNumber)
```

#### **playNote**

Plays a note and returns the event id. Be careful or you get stuck notes! Edit on GitHub

```
Synth.playNote(int noteNumber, int velocity)
```

#### **playNoteFromUI**

Injects a note on to the incoming MIDI buffer (just as if the virtual keyboard was pressed. Edit on GitHub

```
Synth.playNoteFromUI(int channel, int noteNumber, int velocity)
```

#### **playNoteWithStartOffset**

Plays a note and returns the event id with the given channel and start offset. Edit on GitHub

```
Synth.playNoteWithStartOffset(int channel, int number, int velocity, int offset)
```

#### **removeEffect**

Removes the given effect. Edit on GitHub

```
Synth.removeEffect(var effect)
```

#### **removeModulator**

Removes the modulator. Edit on GitHub

```
Synth.removeModulator(var mod)
```

#### **sendController**

Sends a controller event to the synth. Edit on GitHub

```
Synth.sendController(int number, int value)
```

#### **sendControllerToChildSynths**

The same as sendController (for backwards compatibility) Edit on GitHub

```
Synth.sendControllerToChildSynths(int controllerNumber, int controllerValue)
```

#### **setAttribute**

Sets an attribute of the parent synth. Edit on GitHub

```
Synth.setAttribute(int attributeIndex, float newAttribute)
```

#### **setClockSpeed**

Sets the internal clock speed. Edit on GitHub

```
Synth.setClockSpeed(int clockSpeed)
```

#### **setFixNoteOnAfterNoteOff**

Adds a few additional safe checks to prevent stuck notes from note offs being processed before their note-on message.

```
Synth.setFixNoteOnAfterNoteOff(bool shouldBeFixed)
```

If you're doing any kind of time-manipulation in your MIDI processing, you might end up with a scenario where a note on message is scheduled after its respective note-off message (and with respective note-off message I'm talking about the note-on message with the same event ID). There are usually two reasons for this: either because you're calling Synth.addNoteOn()
with a positive timestamp or Message.delayEvent()
with an existing event.

The default behaviour of HISE until now was that it was simply your problem to deal with that and if you've created a note-on in the future, the only way to prevent it from creating a stuck note is to make sure that the note-off has a timestamp bigger than the note-on.

That's where this method comes in handy. Just call this once in your `onInit`
script of the script that does the processing and it will magically solve this problem with two safe checks:

1. If a note-off message is about to be processed, it will look in the event queue of scheduled events if there is a note-on message with the same ID but a bigger timestamp and then cancel this event.
2. If you call any of the API methods that create an artificial note-off, it will also check the queue for future note-on events and perform the same check.

The first check solves hanging notes from `Message.delayEvent()`
and the latter will solve all issues with artificial note pairs having the wrong timestamp order.

Important: this is a per-sound generator setting, so calling it in your Interface script will not affect the MIDI processing of the child sound generator that actually does the MIDI manipulation!

#### **setMacroControl**

Sets one of the eight macro controllers to the newValue.

```
Synth.setMacroControl(int macroIndex, float newValue)
```

Calling this method will have the same effect as turning the respective Macro Control
but you can use it for a more fine-grained control about what and when to send the value change.

Unlike everything else in a proper programming language, the range of the `macroIndex`
argument starts with 1 (to be consistent with the labels in HISE).

The `value`
argument is expected to be in the `0 - 127`
value range, but it doesn't need to be an integer.

It's your responsibility to watch out that this call does not occur in a control that is connected to the same macro control or you might end up getting a recursive loop and freeze your system!

#### **setModulatorAttribute**

Sets a ModulatorAttribute. Edit on GitHub

```
Synth.setModulatorAttribute(int chainId, int modulatorIndex, int attributeIndex, float newValue)
```

#### **setShouldKillRetriggeredNote**

If set to true, this will kill retriggered notes (default). Edit on GitHub

```
Synth.setShouldKillRetriggeredNote(bool killNote)
```

#### **setUseUniformVoiceHandler**

Use a uniform voice index for the given container.

```
Synth.setUseUniformVoiceHandler(String containerId, bool shouldUseUniformVoiceHandling)
```

This is a new feature introduced with HISE 3.5.0 and ensures that all sound generators will use the same voice index whenever a new voice is started. Synchronizing the voice indexes comes with a slight overhead (so it's disabled by default), but it allows you to use envelope modulators as global modulation source because now it can properly fetch the required modulation values because it's guaranteed that the voice indexes will match.

In order to use this function, call it with a container ID that you want to be used as root for the voice unification. This is not required to be the master container, so you can still perform additional MIDI processing (arpeggiators, glide scripts etc). However you need to ensure that beyond that point every sound generator will start not more than one voice for each incoming MIDI event.

#### **setVoiceGainValue**

Applies a gain factor to a specified voice. Edit on GitHub

```
Synth.setVoiceGainValue(int voiceIndex, float gainValue)
```

#### **setVoicePitchValue**

Applies a pitch factor (0.5... 2.0) to a specified voice. Edit on GitHub

```
Synth.setVoicePitchValue(int voiceIndex, double pitchValue)
```

#### **startTimer**

Starts the timer of the synth. Edit on GitHub

```
Synth.startTimer(double seconds)
```

#### **stopTimer**

Stops the timer of the synth. You can call this also in the timer callback. Edit on GitHub

```
Synth.stopTimer()
```

### Table

The `Table`
object can be created with TableProcessor.getTable(), and provides access and functions for the tables complex data object.

#### **addTablePoint**

Adds a new table point (x and y are normalized coordinates). Edit on GitHub

```
Table.addTablePoint(float x, float y)
```

#### **getCurrentlyDisplayedIndex**

Returns the current ruler position (from 0 to 1). Edit on GitHub

```
Table.getCurrentlyDisplayedIndex()
```

#### **getTablePointsAsArray**

Returns an array containing all table points ([[x0, y0, curve0],...]). Edit on GitHub

```
Table.getTablePointsAsArray()
```

#### **getTableValueNormalised**

Returns the value of the table at the given input (0.0... 1.0). Edit on GitHub

```
Table.getTableValueNormalised(double normalisedInput)
```

#### **linkTo**

Makes this table refer to the given table. Edit on GitHub

```
Table.linkTo(var otherTable)
```

#### **reset**

Resets the table with the given index to a 0..1 line. Edit on GitHub

```
Table.reset()
```

#### **setContentCallback**

Sets a callback that is being executed when a point is added / removed / changed. Edit on GitHub

```
Table.setContentCallback(var contentFunction)
```

#### **setDisplayCallback**

Sets a callback that is being executed when the ruler position changes. Edit on GitHub

```
Table.setDisplayCallback(var displayFunction)
```

#### **setTablePoint**

Sets the point with the given index to the values. Edit on GitHub

```
Table.setTablePoint(int pointIndex, float x, float y, float curve)
```

#### **setTablePointsFromArray**

Sets the table points from a multidimensional array ([x0, y0, curve0],...]). Edit on GitHub

```
Table.setTablePointsFromArray(var pointList)
```

### TableProcessor

Create a script reference to a Modulator that uses a TableProcessor like the Table Envelope
or the Velocity Modulator

You can create this object with

```
const var TableEnvelope1 = Synth.getTableProcessor("StringOfModulator")
```

or with right-clicking the top-bar of a modulator and selecting "Create typed Table script reference".

For a more fine-granular manipulation of a Table object take a look at Table

#### **addTablePoint**

Adds a new table point (x and y are normalized coordinates). Edit on GitHub

```
TableProcessor.addTablePoint(int tableIndex, float x, float y)
```

#### **exists**

Checks if the Object exists and prints a error message on the console if not. Edit on GitHub

```
TableProcessor.exists()
```

#### **exportAsBase64**

Exports the state as base64 encoded string. Edit on GitHub

```
TableProcessor.exportAsBase64(int tableIndex)
```

#### **getTable**

Creates a ScriptTableData object for the given table. Edit on GitHub

```
TableProcessor.getTable(int tableIndex)
```

#### **reset**

Resets the table with the given index to a 0..1 line. Edit on GitHub

```
TableProcessor.reset(int tableIndex)
```

#### **restoreFromBase64**

Restores the state from a base64 encoded string. Edit on GitHub

```
TableProcessor.restoreFromBase64(int tableIndex,  String state)
```

#### **setTablePoint**

Sets the point with the given index to the values. Edit on GitHub

```
TableProcessor.setTablePoint(int tableIndex, int pointIndex, float x, float y, float curve)
```

### Threads

The `Threads`
API class provides information about various threads and some helper functions regarding multithreaded actions. This is an extremely advanced topic but it allows you to control and synchronize the different threads in a complex HISE project.

Basically you have 4 main thread types running simultaneously in HISE:

1. the **Audio thread** which renders the audio buffers coming from the DAW. This is the thread with the highest priority and making sure that this isn't interrupted or stalled should be your top priority. The utilisation of this thread will show up as CPU usage in your DAW meter.
2. the **Scripting thread**, which executes all non-synchronous scripting callbacks
3. the **Message thread** which renders the interface using either OpenGL or the software renderer. If you're using OpenGL, the rendering will be done on a separate thread than the rest of the UI stuff (handling mouse callbacks, etc), however this thread will hold the Message Thread lock so from our point of view, it's the same thread.
4. the **Loading thread** which performs various tasks. In normal operation mode this is used to fetch the samples from the disk, but if you initialise the plugin or load user presets / swap samplemaps, it will be executed on this thread

These threads are available as constant of this class and it's **HIGHLY**
recommended to never use magic numbers but these constants.

```
Threads.Audio; 		// Audio Thread
Threads.UI;    		// Message Thread
Threads.Scripting; 	// Scripting Thread
Threads.Loading;	// Loading Thread
Threads.Unknown;	// Any other thread (eg. a custom background task)
Threads.Free; 		// Idle Thread (mostly used when querying lock states)
```

Now you might ask yourself: if every script callback is executed on the **Scripting Thread**, why should I need this class at all? Well, there are a few exceptions to that rule:

- non-deferred MIDI callbacks are executed on the **Audio Thread**
- custom LAF methods are executed on the **Message Thread**
- when you load a user preset (or initialise the plugin), control callbacks are executed on the **Loading Thread**

With the exception of the latter, all these multithreaded use cases are not synchronised by default (with the rationale of preferring data race conditions over deadlocks and priority inversions). The exception is the user preset load, which locks the scripting thread by default during the operation. However if you start doing complex operations or even using a BackgroundTask object to perform a heavyweight task on a dedicated background thread, you might want to start thinking about proper synchronisation options and this is where this class comes in handy.

#### **How to synchronize threads**

Be aware that there are no methods for locking any thread in this API class, it only offers constants for thread identification as well as querying methods for checking the lock state of a given thread or getting information about the current thread.

If you want to lock the threads, you will have to use the scoped statement
`.lock(Threads.xxx)`, which ensures that the lock is guaranteed to be released after the scope even in a case of a script error (or if you simply forget to release it). This is consistent with the RAII concept that is used for locking threads in JUCE (and subsequently HISE).

This code example spawns off a timer and a background thread and uses the.lock() scoped statement in order to avoid simultaneuos execution:

```
// set this to false in order to deactivate the locking
const var LOCK = true;
reg isTimerRunning = false;

const var timer = Engine.createTimerObject();
timer.setTimerCallback(function()
{.trace("TIMER CALLBACK").set(isTimerRunning, true);

	for(i = 0; i < 4000; i++)
		Math.sin(i);
});

timer.startTimer(15);

const var backgroundTask = Engine.createBackgroundTask("big task");

backgroundTask.callOnBackgroundThread(function(t)
{.print("background task").trace("BACKGROUND TASK");

	for(i = 0; i < 1000; i++)
	{.if(LOCK):lock(Threads.Scripting);

		for(j = 0; j < 1000; j++);
		{
			Math.sin(j);

			if(isTimerRunning)
			{
				Console.print("ERROR: RACE CONDITION");
			}
		}
	}
});
```

The perfetto profiling timeline looks like this:

And if we zoom into one of the script events, we can see that the locking is working as expected. The "Waiting for ScriptLock" phase means that either one of the threads is waiting for the other to complete and there is no simultaneos execution: while the **TIMER CALLBACK**
is being executed, the **BACKGROUND TASK**
is stalling and vice versa.

You might notice how the **TIMER CALLBACK**
is waiting much longer than the **BACKGROUND TASK**. This is because there is almost no "idle" time between lock operations in the background task where the timer callback could grab the lock, so it must wait extremely long until it hits the lucky spot where the lock is released.

#### **Inspector Perfetto**

Multithreading is maybe one of the most complex topics in programming, so let's take a look at an example
that shows how the threads are interacting with each other. We're using the Perfetto Viewer to get a timeline of all events and investigate the details.

#### **getCurrentThread**

Returns the thread ID of the thread that is calling this method.

```
Threads.getCurrentThread()
```

The return value is one of the constants of this class, so if you can compare it against those. If you just want to dump the thread info to the console, you should use getCurrentThreadName() as this returns a string.

#### **getCurrentThreadName**

Returns the name of the current thread (for debugging purposes only!). Edit on GitHub

```
Threads.getCurrentThreadName()
```

#### **getLockerThread**

Returns the thread ID of the thread the locks the given thread ID. Edit on GitHub

```
Threads.getLockerThread(int threadThatIsLocked)
```

#### **isAudioRunning**

Returns true if the audio callback is running or false if it's suspended during a load operation.

```
Threads.isAudioRunning()
```

During some operations (eg. sample map loading, user preset switch etc), the audio thread is suspended and the loading thread is performing the operation. During that time, this method will return true so you can check if the current function is part of a heavyweight task.

#### **isCurrentlyExporting**

Returns true if the audio exporter is currently rendering the audio on a background thread. Edit on GitHub

```
Threads.isCurrentlyExporting()
```

#### **isLocked**

Returns true if the given thread is currently locked. Edit on GitHub

```
Threads.isLocked(int thread)
```

#### **isLockedByCurrentThread**

Returns true if the given thread is currently locked by the current thread. Edit on GitHub

```
Threads.isLockedByCurrentThread(int thread)
```

#### **killVoicesAndCall**

Kills all voices, suspends the audio processing and calls the given function on the loading thread. Returns true if the function was executed synchronously. Edit on GitHub

```
Threads.killVoicesAndCall( var functionToExecute)
```

#### **startProfiling**

Starts a profiling session and calls the finishCallback when ready.

```
Threads.startProfiling(var options, var finishCallback)
```

This function can be used to programatically start the profiling session. It expects two arguments:

1. either a number (a duration in milliseconds) that will directly start the profiling session for the given amount of time or a JSON object that sets up the profiler with the given settings.
2. A function with a single parameter that will contain the base64 encoded profiling session as argument and can be used to write this to a file (or copy it to the clipboard).

The recommended way to get this JSON object is to use the profiling options popup in the profiler toolkit and then click **Export as JSON**
to create the current state as a JSON object. Note that in order to keep the amount of data small it's recommended to limit the profiler settings to the threads & event types you actually want to inspect.

Note that if you're passing in a JSON object it will respect the trigger type, so if you eg. have selected Mouse click, it will not start the recording right away but only at the next time you move a control.

Here's an example with some random settings exctracted from the profiler popup and a function that dumps the profile file on the user's desktop.

```
// Grab your current settings from the profiling options popup
// Just click Export as JSON as paste it in your script. */
const var PROFILE_OPTIONS = { "threadFilter": [ "UI Thread" ], "eventFilter": [ "Lock", "Script", "Scriptnode", "Callback", "Broadcaster", "Paint", "DSP", "Trace", "Server", "Background Task", "Undefined", "Threads" ], "recordingLength": "300 ms", "recordingTrigger": 0
};

// Pick whatever file you like
const var PROFILE_TARGET = FileSystem.getFolder(FileSystem.Desktop).getChildFile("profile.dat");

// dumps the profile to the desktop
Threads.startProfiling(PROFILE_OPTIONS, x => PROFILE_TARGET.writeString(x));
```

Important: This function can also be used in the compiled plugin, however you will have to explicitely include the profiling toolkit in your compile process by adding `HISE_INCLUDE_PROFILING_TOOLKIT=1`
to your ExtraDefinitions field. In HISE it will print a warning if that flag isn't added to your ExtraDefinitions and try to call this method.

#### **toString**

Returns the name of the given string (for debugging purposes only!). Edit on GitHub

```
Threads.toString(int thread)
```

### ThreadSafeStorage

Create a ThreadSafeStorage with Engine.createThreadSafeStorage().

```
const var ThreadSafeStorage = Engine.createThreadSafeStorage();
```

#### **clear**

Clears the data. If another thread tries to read the value, it will block until that operation is done. Edit on GitHub

```
ThreadSafeStorage.clear()
```

#### **load**

Loads the data. If the data is currently being written, this will lock and wait until the write operation is completed. Edit on GitHub

```
ThreadSafeStorage.load()
```

#### **store**

Writes the given data to the internal storage. If another thread tries to read the value, it will block until that operation is done. Edit on GitHub

```
ThreadSafeStorage.store(var dataToStore)
```

#### **storeWithCopy**

Creates a copy of the data and writes the copy to the data storage. If another thread tries to read the value, it will block until that operation is done. Edit on GitHub

```
ThreadSafeStorage.storeWithCopy(var dataToStore)
```

#### **tryLoad**

Loads the data if the lock can be gained or returns a given default value if the data is currently being written. Edit on GitHub

```
ThreadSafeStorage.tryLoad(var returnValueIfLocked)
```

### Timer

The `Timer`
class will run a periodic callback with a customizable interval in order to implement UI interactions / animations. Be aware: The refresh rate of the callbacks will not be super precise because it will be scheduled by a background process to be approximately the time that you want it to be. This means that you better not use this for any kind of MIDI processing logic (use the inbuild onTimer callback
for this, as the callback is sample accurate).

#### **Suspending the TimerObject**

Contrary to the timer callback of a ScriptPanel, this callback will not be suspended when the interface is not shown, which means it keeps running when the interface is hidden. Depending on how your project is using these objects, this might create a significant overhead when using multiple instances. If you want to suspend the callbacks of this object to, you have to use the Content.setSuspendTimerCallback
method and start / stop the timer manually.

```
// Let's use a broadcaster for this
const var suspendBroadcaster = Engine.createBroadcaster({
	"id": "suspendBroadcaster",
	"args": [ "isSuspended" ]
});

// If you comment out this line, you'll see that the timer callback is
// still being executed while the panel callback is suspended properly.
Content.setSuspendTimerCallback(suspendBroadcaster);

const var to = Engine.createTimerObject();

to.setTimerCallback(function()
{
	Console.print("to" + Math.random());
});

// by using a broadcaster, we can attach each timer object exactly where we define it,
// so you don't have to keep track of all your timers at a global location
suspendBroadcaster.addListener(to, "suspend timer object", function(isSuspended)
{
	if(isSuspended)
		this.stopTimer();
	else
		this.startTimer(400);
});

to.startTimer(400);

const var panel = Content.addPanel("Panel1", 0, 0);

panel.setTimerCallback(function()
{
	Console.print("panel" + Math.random());
});

panel.startTimer(500);
```

#### **getMilliSecondsSinceCounterReset**

Returns the duration from the last counter reset. Edit on GitHub

```
Timer.getMilliSecondsSinceCounterReset()
```

#### **isTimerRunning**

Checks if the timer is active. Edit on GitHub

```
Timer.isTimerRunning()
```

#### **resetCounter**

Resets the internal counter. Edit on GitHub

```
Timer.resetCounter()
```

#### **setTimerCallback**

Sets the function that will be called periodically. Edit on GitHub

```
Timer.setTimerCallback(var callbackFunction)
```

#### **startTimer**

Starts the timer. Edit on GitHub

```
Timer.startTimer(int intervalInMilliSeconds)
```

#### **stopTimer**

Stops the timer. Edit on GitHub

```
Timer.stopTimer()
```

### TransportHandler

The `TransportHandler`
class can be used to register callbacks that react on host transport events. As of now, these events are supported:

- Tempo changes
- Time signature changes
- Transport state changes (only playback)
- Beat changes
- Grid events (a synched timer with a customizable frequency)

In order to use it, just create an object with Engine.createTransportHandler()
and then use the functions to register callbacks.

```
const var TransportHandler = Engine.createTransportHandler();
```

##### **Execution modes**

There are two execution modes for the callbacks: **synchronous**
and **asynchronous**. Synchronous means that the callback will be executed directly in the audio thread as soon as a state change is detected. This should be used for any logic regarding playback (eg. for implementing custom arpeggiators).
However if you want your UI to react on the host transport state, you must use the asynchronous mode.

You can specify the mode when you pass in the callbacks into the register functions. Be aware that each transport handler has two slots, so you can register two different callbacks for the synchronous and asynchronous execution.

This example will demonstrate all features of this class by implementing a simple metronome that should react to your host.

```
HiseSnippet 1721.3oc4WstaaTDEd23rkFWLzhpP7yQQHUGvjZW5MABUGmKsVzjXEmVnRHUMd2isG5tyXlc1jZphD+jGi9XvO4QoOB8MnblYu3cC1oFKZ.AVIVdly4Ly27ctLmoiT3BggBok8JGNdDXY+9NcGyUC2bHkwsZukk8G5bnjxCGIjpCgPkUqwinggfmksco6qUxdkksLed88ZQ8obWXxTVVOVvbgGxBXpIy1o42x782g5AGxBxo8Ma11Uv2T3KhP.Uxot0Hp6ynCf8nZ0Vxwx9Ba6wTBYWEUAgV1K2R3Mt6Pww7X8eLKj0yGzCZX0EWn3o2Q36oQrdVqMGx785jdvCsrrc5LgFJESCW0YWlGKa9IzwkMBHSrHOeXuzYAuF4gW84Gd14f2xwv6JNcckrQpIRzX6RNs4JP1mhtf7vJVWqk9sK3ro.0fqVOf9LXGINHyhp2td8ZjaUu9ZeckxUJe8qSNbHKjf+oFBjvwb2gn9hHbbZ7.YHk64CRxwCYtCIGiNUxHe5XiEAfRqe.P3BjLpTFcsgJxQTIJl7Mjs4CXbXcWIfbUVH1ChWwpYfX2Hznd.gxILtOZAoeD2UwDbbVWZTHPXp3sVFo0wr4zHOl.+Et3dUJeZCE7V3lVsG9UM7.tGbbKpbMRkxunRYB9wW3R8ILODkljg0odd6gGh84UaTib25jOOyJxmQZbiZ3+2oFwvbZ6iMRer2ue+s.jQ.uVi29Hj3a6Uk4oWCixmjbHa2mLVDQbQ9b.f7aD9kfzm5imtgfDpU3LRy4L7GSphldMTDteXpFILpmxGsGS43CH+HSg9WyljRWZ94QsSHGhm.B4WSQFDQQefBPtiDpnXTJYDHYBu0pTFOLgfZeCqsoAiU0XrVBQl4q1ATXX.t9ADeZOvufS+PHXj.YzzHvAfZSANEGGTcUizU0qzDK1SDLS8QYmR6s.9YnuQ5orniHbl5ixVM6bsm3Xxwflikv.VHRnX3n.OmRBxKDQ+rPqPz4Tv+PvHI+dXUrPsGMZjGFrm3AzKdJyZN9ITqwsWKaIqxgiMhWKK9zLTaX0UUvyUqVijpCFYtJoUmcQrW9jX7mtEcYC3TUjDl01HBpQ7zzzjMBY4haCJLIF2PnEDFaa19l6vklbOiclE1ASQvn0IaLR+wqcuAwWGrpNQMQMx8HwSFt9.I.bxWkMVBd4Q.561Bn3tbTLsyh8GDVw7sBUqxpRf9KccmbNSyBVUHyxFEGARIyyTBJjg27oWKInKZJ3XpIFLULZHzWnldB0oIkbEmlBsno7bDCpTNRAqFim1IjROeL9K0uUXIPi6YRfQAHqkq.YR4t0J+hxqT9jxjSKpe+oJSmLIE9lJ3SQr95d4YYXUdTPOPVCyO8ifLEw68JdwpyruXM+89tw414TTvayYp8GA7YccqURAA7WOp8VTEUeCbxbndXQQESCA6sfiv5sw2GuhyVP3yThQHRyphXYWVYjVI415GpKJZwv6jeOGS5p0ymz7ySZNdxf1M6i6XbaO50tOMxWYomqK6my0wzFMOl4oFNYBVyg.avvbMa8fl.RcTC6XWR600K4MZTWWmPeZe6n0wAKDjCqMi9aAqOYJXMFeN15Ixiaq4iUMUkxgzKex+nH8RylQw7vb3726kCmur2BhyWN9Lv4uZWDmoUVQcuf0uX8l3Ny+ScZh86J7h7ophMAq67OQ.l.WnaScGk7PlZb9WF7Noy34EtWwoCC6LY53coofWLk+cMdSdmQEms62GbUS.6xN678myOpvIFKkc1fS8GGBoulHcXiB3oUDhXYwHwW0riDKGhcgDWNLY5K1ztTQvWZ9JbOEt6.QjBu7eWpRxvDGm8hB5hgutl9Y3Xyl5f7kz0uiGWWOVCht.2yL3M3mDgMzisSD1HUXd+yGDeRtjSW7oClF5MjxGaFS9N5Q.49.Gj5HsFy5QwM+A1ql2GEOZteT79tJb6S5pJrvB2EBXGhEeByO4iBwm5A+zA5P+7yuofJmpnWeucvC4TsoqtERSNzFAhHtpPNSo4NP8uviyW9e0ON+7qhYo4CtukT8URwXWVvHeXa9QfO1SiAieT5UMoyVLtdWrE1QCEbladm9AXiyrAC.YdrO0CzFJE1G5jYtZyC.eflO.9Sa9PLviJQdBVPtnw7yEmk+5SbhgKQmLR9uwMck9e4McmKWbbdrGATWo3otwOTRGKeQyL34lmzo3t5wjFVlGOoaxr950sBvJhO00US2eAxOS2lar.17kKfM2bAr4VKfM2dAr4NKfM28LsQeYzFQJQPbpHNQmsMunz1dattObSTu0e.zpy6sH
```

#### **The HISE master clock**

This object will also grant you access to the master clock of HISE, which itself can be either free-running or synched to the host clock. This lets you control most time-synched modules in a very flexible way, including:

- MIDI Players
- Arpeggiators
- LFOs

In order to use the master clock with modules, you need to

1. enable the grid callback
2. set the synchronisation mode to one of the four available modes
3. turn on clock synching for every module that should be synched to the master clock.
4. start / stop the internal clock manually (or let the host do that for you when synching externally).

When the synchronisation is active, the following modules will change their behaviour:

##### **MIDI Players**

Starting and stopping the MIDI player will be ignored. Instead if the clock playback state changes, it will seek to the current position and start the playback on the next grid callback (this means that it you can start the DAW playback at the middle of a bar and it will jump to the correct position).

The grid callback will determine the resolution of when the MIDI player is started, so you can choose the time resolution that works best for you.

##### **Arpeggiator (not implemented yet)**

Pressing a note will not start the arpeggiator playback, but just add the list to the notes to play. If the clock is running, it will start the arpeggiator on the next grid event. If the playback is stopped, the arpeggiator will turn off.

##### **LFO**

The LFO will not move unless the clock is running. It will also be resynched on every audio callback to match the playback position.

#### **isNonRealtime**

This will return true if the DAW is currently bouncing the audio to a file. You can use this in the transport change callback to modify your processing chain. Edit on GitHub

```
TransportHandler.isNonRealtime()
```

#### **sendGridSyncOnNextCallback**

sends a message on the next grid callback to resync the external clock. Edit on GitHub

```
TransportHandler.sendGridSyncOnNextCallback()
```

#### **setEnableGrid**

Enables a high precision grid timer. Edit on GitHub

```
TransportHandler.setEnableGrid(bool shouldBeEnabled, int tempoFactor)
```

#### **setLinkBpmToSyncMode**

If enabled, this will link the internal / external BPM to the sync mode. Edit on GitHub

```
TransportHandler.setLinkBpmToSyncMode(bool shouldPrefer)
```

#### **setOnBeatChange**

Registers a callback to changes in the musical position (bars / beats).

```
TransportHandler.setOnBeatChange(var sync, var f)
```

Registers a callback that will be executed for every beat. The function must have two parameters:

1. a counter for the current beat index (`int` )
2. whether the beat is the beginning of a new bar (`bool` )

Be aware that a beat is defined by the denominator of the time signature (so a 6/8 time signature will call this method twice as often as a 3/4 time signature).

#### **setOnBypass**

Registers a callback that will be executed asynchronously when the plugin's bypass state changes.

```
TransportHandler.setOnBypass(var f)
```

This can be used to register a callback that will react on bypass changes of the plugin.

Almost every DAW has the ability to bypass plugins so they will not process the incoming audio. Unfortunately none
of the plugin architectures have a clear API to detect the bypass
state and my initial test show a success rate of 0% trying to catch this event across multiple hosts. Also there are multiple concepts of bypassing, some are called disabling, some rely on a hidden plugin parameter and in total it's complete crazy town over there.

So the solution I went for is a simple watchdog: at every audio buffer that is rendered, it will bump a watchdog timer and if that timer is not bumped for the duration of 10 audio buffers, then it will assume that the plugin was bypassed in whatever way the host decide it would be best. This is not a 100% accurate solution (because the bypass event will be detected with a delay of about 100 ms at 512 buffer size) but it let's you implement some UI features like clearing out peak meters
etc.

The function will simply expect a single parameter that should be a function with a single argument that will indicate whether the plugin is bypassed or not. The function will not be called on the audio thread but on the UI thread so you don't need to be cautious about realtime safety here.

```
const var th = Engine.createTransportHandler();

th.setOnBypass(function(isBypassed)
{
	if(isBypassed)
	{
		PeakMeter.clear(); // whatever...
		someTimer.stopTimer();
	}
	else
	{
		// resume the timer that detects the peak
		someTimer.startTimer(30);
	}
});
```

If you want to simulate the behaviour of bypassing the plugin during development, you can use the new bypass button at the top left of the HISE controller popup (next to the master clock controls).

#### **setOnGridChange**

Registers a callback to changes in the grid. Edit on GitHub

```
TransportHandler.setOnGridChange(var sync, var f)
```

#### **setOnSignatureChange**

Registers a callback to time signature changes.

```
TransportHandler.setOnSignatureChange(var sync, var f)
```

Registers a callback that will be executed as soon as the time signature changes. It expects a function with two parameters:

1. Nominator
2. Denominator

So for a 6/8 time signature, the first parameter will be 6 and the second one will be 8.

The callback you supply here is also executed once at registration (so that it will pick up the current time signature).

#### **setOnTempoChange**

Registers a callback to tempo changes.

```
TransportHandler.setOnTempoChange(var sync, var f)
```

Registers a callback that will be executed as soon as the host tempo changes. It expects a function with a single parameter that will contain the tempo value.

It will also be executed once when you register this callback so you can query the current tempo.

#### **setOnTransportChange**

Registers a callback to transport state changes (playing / stopping).

```
TransportHandler.setOnTransportChange(var sync, var f)
```

Registers a callback that will be executed as soon as the host playback is being started / stopped.

It expects a function with a single parameter that will contain the transport state as `bool`
value.

This function will also be called once at registration.

#### **setSyncMode**

Sets the sync mode for the global clock. Edit on GitHub

```
TransportHandler.setSyncMode(int syncMode)
```

#### **startInternalClock**

Starts the internal master clock. Edit on GitHub

```
TransportHandler.startInternalClock(int timestamp)
```

#### **stopInternalClock**

Stops the internal master clock. Edit on GitHub

```
TransportHandler.stopInternalClock(int timestamp)
```

#### **stopInternalClockOnExternalStop**

Sets the internal clock to stop when the external clock was stopped. Edit on GitHub

```
TransportHandler.stopInternalClockOnExternalStop(bool shouldStop)
```

### Unlocker

The `LicenseUnlocker`
will aid you in managing HISEs keyfile and unlocking system.You can create an `Unlocker`
object with Engine.createLicenseUnlocker().

```
const var Unlocker = Engine.createLicenseUnlocker();
```

#### **canExpire**

Checks if the unlocker's license system has an expiration date. Edit on GitHub

```
Unlocker.canExpire()
```

#### **checkExpirationData**

If the unlocker has an expiration date, it will check it against the RSA encoded time string from the server. Edit on GitHub

```
Unlocker.checkExpirationData( String encodedTimeString)
```

#### **checkMuseHub**

If you use the MuseHub SDK this will try to activate the plugin using their SDK. Edit on GitHub

```
Unlocker.checkMuseHub(var resultCallback)
```

#### **contains**

Checks if the string contains the given substring. Edit on GitHub

```
Unlocker.contains(String otherString)
```

#### **getLicenseKeyFile**

Returns the license key file as File object. Edit on GitHub

```
Unlocker.getLicenseKeyFile()
```

#### **getRegisteredMachineId**

Returns the machine ID that is encoded into the license file. This does not look in the encrypted blob, but just parses the header string. Edit on GitHub

```
Unlocker.getRegisteredMachineId()
```

#### **getUserEmail**

Returns the user email that was used for the registration. Edit on GitHub

```
Unlocker.getUserEmail()
```

#### **isUnlocked**

Checks if the registration went OK. Edit on GitHub

```
Unlocker.isUnlocked()
```

#### **isValidKeyFile**

Checks if the possibleKeyData might contain a key file. Edit on GitHub

```
Unlocker.isValidKeyFile(var possibleKeyData)
```

#### **keyFileExists**

Checks whether the key file exists. Edit on GitHub

```
Unlocker.keyFileExists()
```

#### **loadKeyFile**

This checks if there is a key file and applies it. Edit on GitHub

```
Unlocker.loadKeyFile()
```

#### **setProductCheckFunction**

Sets a function that performs a product name check and expects to return true or false for a match. Edit on GitHub

```
Unlocker.setProductCheckFunction(var f)
```

#### **writeKeyFile**

Writes the key data to the location. Edit on GitHub

```
Unlocker.writeKeyFile( String keyData)
```

### UnorderedStack

Create and modify an `UnorderedStack`
object with Engine.createUnorderedStack(), that can hold up to 128 unordered float numbers.

#### **asBuffer**

Returns a buffer that refers the data. Edit on GitHub

```
UnorderedStack.asBuffer(bool getAllElements)
```

#### **clear**

Clears the stack. Edit on GitHub

```
UnorderedStack.clear()
```

#### **contains**

checks if the number is in the stack. Edit on GitHub

```
UnorderedStack.contains(var value)
```

#### **copyTo**

Copies the stack into the given container. Edit on GitHub

```
UnorderedStack.copyTo(var target)
```

#### **insert**

Inserts a number at the end of the stack. Edit on GitHub

```
UnorderedStack.insert(var value)
```

#### **isEmpty**

Checks if any number is present in the stack. Edit on GitHub

```
UnorderedStack.isEmpty()
```

#### **remove**

removes the given number and fills the gap. Edit on GitHub

```
UnorderedStack.remove(var value)
```

#### **removeElement**

Removes the element at the given number and fills the gap. Edit on GitHub

```
UnorderedStack.removeElement(int index)
```

#### **removeIfEqual**

Removes the matching event from the stack and puts it in the holder. Edit on GitHub

```
UnorderedStack.removeIfEqual(var holder)
```

#### **setIsEventStack**

Sets this stack to hold HISE events rather than floating point numbers. Edit on GitHub

```
UnorderedStack.setIsEventStack(bool shouldBeEventStack, var eventCompareFunction)
```

#### **size**

Returns the number of values in the stack. Edit on GitHub

```
UnorderedStack.size()
```

#### **storeEvent**

Stores the event into the message holder. Edit on GitHub

```
UnorderedStack.storeEvent(int index, var holder)
```

### UserPresetHandler

The `UserPresetHandler`
object can be used to customize the data handling of your project. You can attach callbacks to certain events (eg. loading user presets), define a custom data object that will replace the default XML structure of a user preset and add custom automation parameters. In order to use it, create it with Engine.createUserPresetHandler()
and then use one of its methods.

```
const var UserPresetHandler = Engine.createUserPresetHandler();
```

It's considered best practice to only have one of these objects around.

#### **attachAutomationCallback**

Attaches a callback to automation changes. Pass a non-function as updateCallback to remove the callback for the given automation ID.

```
UserPresetHandler.attachAutomationCallback(String automationId, var updateCallback, var isSynchronous)
```

This attaches a script callback to an automation parameter that was previously registered using
Userpresethandler.setCustomAutomation().

The `automationId`
argument must match the `ID`
property of one of the existing automation parameters. The function you pass in as `updateFunction`
must have a single parameter that will contain the parameter value when the parameter is changed. You can decide whether the execution of the parameter should be done synchronously (in the audio thread) or deferred on the UI thread depenending on your use case.

Unlike the `setControlCallback()`
function, registering an additional callback will **not**
override the connections defined with the `connections`
property so it can be used to perform additional tasks.

Use `clearAttachedCallbacks()`
in order to remove previously registered functions.

#### **clearAttachedCallbacks**

Clears all attached callbacks. Edit on GitHub

```
UserPresetHandler.clearAttachedCallbacks()
```

#### **createObjectForAutomationValues**

Creates an object containing the values for every automation ID. Edit on GitHub

```
UserPresetHandler.createObjectForAutomationValues()
```

#### **createObjectForSaveInPresetComponents**

Creates an object containing all values of components with the `saveInPreset`
flag. Edit on GitHub

```
UserPresetHandler.createObjectForSaveInPresetComponents()
```

#### **getAutomationIndex**

Returns the automation index. Edit on GitHub

```
UserPresetHandler.getAutomationIndex(String automationID)
```

#### **getSecondsSinceLastPresetLoad**

Returns the amount of seconds since the last preset has been loaded. Edit on GitHub

```
UserPresetHandler.getSecondsSinceLastPresetLoad()
```

#### **isCurrentlyLoadingPreset**

Returns true if this is called somewhere inside a preset load. This takes the thread ID into account to avoid false positives when calling this on another thread. Edit on GitHub

```
UserPresetHandler.isCurrentlyLoadingPreset()
```

#### **isInternalPresetLoad**

Returns true if the user preset that is about to be loaded is a DAW state (or initial state). This function is only useful during the pre / post load callbacks. Edit on GitHub

```
UserPresetHandler.isInternalPresetLoad()
```

#### **isOldVersion**

Checks if the given version string is a older version than the current project version number. Edit on GitHub

```
UserPresetHandler.isOldVersion( String version)
```

#### **resetToDefaultUserPreset**

Loads the default user preset (if it's defined in the project). Edit on GitHub

```
UserPresetHandler.resetToDefaultUserPreset()
```

#### **runTest**

Runs a few tests that catches data persistency issues. Edit on GitHub

```
UserPresetHandler.runTest()
```

#### **sendParameterGesture**

Sends a parameter gesture change message to the host. Returns true if the parameter exists. Edit on GitHub

```
UserPresetHandler.sendParameterGesture(int automationType, int indexWithinType, bool gestureActive)
```

#### **setAutomationValue**

Sends an automation value change for the given index. Edit on GitHub

```
UserPresetHandler.setAutomationValue(int automationIndex, float newValue)
```

#### **setCustomAutomation**

Enables host / MIDI automation with the custom user preset model.

```
UserPresetHandler.setCustomAutomation(var automationData)
```

This method allows to define automation parameters that can be attached / detached to UI elements dynamically. If you use this mode, all MIDI CC automation and macro assignments will operate on the automation data model instead of the actual UI element (so assigning a MIDI CC to a UI element via drop down or learn mode will connect the automation data with the source).

This is useful when you're using an UI element that can be assigned to multiple targets dynamically. In order to use it, just call this method with a JSON object that describes all automatable parameters. Then use the `automationID`
property of a UI element to assign the control to one of the automation targets. This can be done dynamically.

Be aware that this function only works in combination with a custom user preset model, so you need to call `UserPresetHandler.setUseCustomDataModel()`
before using this method.

The JSON object you need to pass in here must be an array of objects where each array element describes one automation parameter. The automation object can / must have these properties:

**Property** | **Type** | **Default** | **Description** || `ID` | String | - | a unique identifier for the automation parameter |
| `min` | double | 0.0 | he minimum value |
| `max` | double | 1.0 | the maximum value |
| `middlePosition` | double | mid | the middle position |
| `stepSize` | double | 0.0 | the step size |
| `allowMidiAutomation` | bool | `true` | whether this parameter can be automated using MIDI CC messages |
| `allowHostAutomation` | bool | `true` | whether this parameter can be automated using host automation (plugin parameters) |
| `connections` | Array | `[]` | A list of parameter targets that are changed when the parameter is changed. Each element of this array must be a object with a `processorId` and `parameterId` property (just like the default UI element connections). |

Example object:

```
const var automationObject =
[
{
	"ID": "First Parameter",
	"min": 0.5,
	"max": 2.0,
	"middlePosition": 1.0,
	"stepSize": 0.0,
	"allowMidiAutomation": true,
	"allowHostAutomation": false,
	"connections": [
	  {
	  	"processorId": "SimpleGain1",
	  	"parameterId": "Gain"
	  },
	  {
	  	"processorId": "SimpleGain2",
	  	"parameterId": "Gain"
	  },
	]
}
]
```

The `connections`
property is not the only way to add logic to a automation parameter, you can alse use Userpresethandler.attachAutomationCallback()
in order to add a scripted callback (this is equivalent to `ScriptComponent.setControlCallback()`
vs. using the `processorId`
/ `parameterId`
connections).

#### **setEnableUserPresetPreprocessing**

Enables a preprocessing of every user preset that is being loaded. Edit on GitHub

```
UserPresetHandler.setEnableUserPresetPreprocessing(bool processBeforeLoading, bool shouldUnpackComplexData)
```

#### **setParameterGestureCallback**

Attaches a callback to the begin and end of parameter gestures. Edit on GitHub

```
UserPresetHandler.setParameterGestureCallback(var callbackFunction)
```

#### **setPluginParameterGroupNames**

Sets the available group names for plugin parameter groups. Edit on GitHub

```
UserPresetHandler.setPluginParameterGroupNames(var pluginParameterGroupNames)
```

#### **setPluginParameterSortFunction**

Sets a custom sort function for the plugin parameter order.

```
UserPresetHandler.setPluginParameterSortFunction(var customSortFunction)
```

This function is used if you need to maintain backwards compatibility with older versions: the order how plugin parameters are registered at the host might affect old DAW projects so if you change that order between updates, there is the chance of breaking user projects.

In order to prevent that problem, you can use this function to ensure that all plugin parameters that you've added in your update are put at the end of the list so that the old plugin parameters retain their index.

If you are free of the burden of backwards-compatibility, you can still use this function to prettify your plugin parameter list, which otherwise is created in a default sorting logic that may or may not align with your expected order.

By default the plugin parameters are sorted by type, and then within that type in order of definition. The type order is:

1. All dynamic plugin parameters (if `HISE_MACROS_ARE_PLUGIN_PARAMETERS=1` ) in ascending order
2. All custom automation parameters defined with UserPresetHandler.setCustomAutomation()
3. All script components that have the `isPluginParameter` flag set.

So if you have 3 macros, 2 custom automation slots and 4 script controls, the order would be:

```
Macro 1
Macro 2
Macro 3
Custom 1
Custom 2
Component 1
Component 2
Component 3
Component 4
```

If you need to change that default order, just pass in a function into this method. This function will be executed whenever the plugin parameters are rebuilt (so in HISE itself after each compilation and in your compiled plugin once at initialisation). It expects two parameters `p1`
and `p2`
which will be filled with two JSON objects with the following properties:;

**Property** | **Description** || `type` | the plugin parameter type. This is a magic number and will be `0` for macro controls, `1` for custom automation slots and `2` for UI components |
| `parameterIndex` | This is the index in the default sorting order. |
| `typeIndex` | This is the index within the type. So for the first custom automation slot it will be 0, no matter how many other parameters of a different type come before that. |
| `group` | If you have assigned this parameter to a group, it will contain the string with the group name, otherwise it will be an empty string. |
| `name` | the plugin parameter name as it will be shown in the host. |

Using the example list above, this would be the JSON object for two of the elements:

```
{
	"Macro 2": {
		type: 0,  // type is macro
		parameterIndex: 1, // index in full list
		typeIndex: 1 // second macro
		group: "", // no group
		name: "Macro 2" // macro name
	},
	"Component 1": {
		type: 2, // type is UI component
		parameterIndex: 5, // index in full list
		typeIndex: 0, // first UI component
		group: "", // no parameterGroupName set
		name: "Component 1" // pluginParameterName property
	}
}
```

You will now have to implement the sorting logic by writing a function that compares the two objects and returns one of the given values:

- `-1` if the first parameter should come before the second
- `1` if the second parameter should come before the first
- `0` if the parameters are supposed to be equal
- `undefined` if you want to resort to the default sorting logic between the two parameters.

Note that if you use parameter groups it will override this sorting mechanism and always put parameters without a group ID first followed by all parameters of a group (as this is how it's required by the hosts), so be cautious when adding parameter group IDs to an existing project.

##### **Examples**

Here is an example function that will keep the normal sorting logic but move all custom automation data slots at the beginning of the list.

You would use this function if you have added the ability of assigning dynamic plugin parameters in an update and want to ensure that the original order of the custom automation slots are not changed (because by default the macro parameters would be put at the beginning of the list).

```
const var CUSTOM_TYPE = 1;

// This function moves all custom automation parameters at the beginning (so they appear before the macros)
uph.setPluginParameterSortFunction(function(p1, p2)
{
	// If one of the parameters is a custom type, put it before
	// the other element.

	if(p1.type == CUSTOM_TYPE && p2.type != CUSTOM_TYPE)
		return -1;
	else if (p2.type == CUSTOM_TYPE && p1.type != CUSTOM_TYPE)
		return 1;

	// otherwise return undefined which uses the default sorting
	return undefined;
});
```

You can always check the order of the parameters in the Plugin Parameter Simulator
which will be rebuilt after each compilation and takes the sorting mechanism into account.

Another example that will put the plugin parameters from a given name list at the end can be used if your update contains new controls that you want to be put at the end of the list:

```
// These are the new controls in your update that you want to put at the end:
const var NEW_CONTROLS = [ "Close 2", "Far 1"];

// This function moves all custom automation parameters at the beginning (so they appear before the macros)
uph.setPluginParameterSortFunction(function(p1, p2)
{
	var c1 = NEW_CONTROLS.contains(p1.name);
	var c2 = NEW_CONTROLS.contains(p2.name);

	if(c1 && !c2) // p1 is a new control and p2 isn't
		return 1;
	else if (c2 && !c1) // p2 is a new control and p1 isn't
		return -1;

	// otherwise return undefined which uses the default sorting
	return undefined;
});
```

#### **setPostCallback**

Sets a callback that will be executed after the preset has been loaded. Edit on GitHub

```
UserPresetHandler.setPostCallback(var presetPostCallback)
```

#### **setPostSaveCallback**

Sets a callback that will be executed after a preset has been saved. Edit on GitHub

```
UserPresetHandler.setPostSaveCallback(var presetPostSaveCallback)
```

#### **setPreCallback**

Sets a callback that will be executed synchronously before the preset was loaded Edit on GitHub

```
UserPresetHandler.setPreCallback(var presetPreCallback)
```

#### **setUseCustomUserPresetModel**

Disables the default user preset data model and allows a manual data handling.

```
UserPresetHandler.setUseCustomUserPresetModel(var loadCallback, var saveCallback, bool usePersistentObject)
```

This function can be used to bypass the default HISE data model (one value per UI element) and roll your own data model with dedicated callbacks for loading and saving the state of your projects (eg. in user presets, DAW save files, init state, etc).

In order to use this function, you need to supply two methods for loading and saving with these signatures:

```
const var uph = Engine.createUserPresetHandler();

inline function onPresetLoad(var obj)
{
	// do something with `obj`
}

inline function onPresetSave()
{
	return { "MyObject": someContent };
}

uph.setUseCustomUserPresetModel(onPresetLoad, onPresetSave, false);
```

The load function contains a single parameter with a JSON object describing your plugin state. What the content of this object is is defined by your save function, which expects you to return a object that fully describes your plugin state.

Usually this means that you have one big JSON object that you return in your save function and restore in your load function.

During development, the `usePersistentObject`
flag might be helpful - if this is true, it will call the save function before recompiling and call the load function with the previous object after compiling, so that the values of your data object to not reset each time you compile. However this might overwrite the object you define, so at the beginning, you must use this function at least once without this flag. In the compiled project it won't make much of a difference as the recompilation does not happen after the plugin was instantiated.

Also be aware that if you want to use the custom automation model, you will need to enable this mode too.

#### **setUseUndoForPresetLoading**

Enables Engine.undo() to restore the previous user preset (default is disabled). Edit on GitHub

```
UserPresetHandler.setUseUndoForPresetLoading(bool shouldUseUndoManager)
```

#### **updateAutomationValues**

Updates the given automation values and optionally sends out a message. Edit on GitHub

```
UserPresetHandler.updateAutomationValues(var data, var sendMessage, bool useUndoManager)
```

#### **updateConnectedComponentsFromModuleState**

Restores the values for all UI elements that are connected to a processor with the `processorID`
/ `parameterId`
properties. Edit on GitHub

```
UserPresetHandler.updateConnectedComponentsFromModuleState()
```

#### **updateSaveInPresetComponents**

Restores all values of components with the `saveInPreset`
flag. Edit on GitHub

```
UserPresetHandler.updateSaveInPresetComponents(var obj)
```

### WavetableController

This API class will provide methods for customizing the resynthesis feature of the Wavetable Synthesiser.

Create this object with Synth.getWavetableController(), then call one of the methods to setup the resynthesis.

#### **getResynthesisOptions**

Returns a JSON object with the current resynthesis options.

```
WavetableController.getResynthesisOptions()
```

Returns a JSON object with the current resynthesis options. Usually you call this method, then make your changes and call setResynthesisOptions()
with the modified object.

#### **loadData**

Loads a file (or buffer) into the wavetable synth.

```
WavetableController.loadData(var bufferOrFile, var sampleRate, var loopRange)
```

This function allows you to programmatically create waveforms and send it to the wavetable synth.

The function expects three parameters:

1. the buffer with the wavetable signal
2. the sample rate (just use the current samplerate for the best sound quality).
3. the loop range that defines the length of a single cycle (this way you can create wavetables with more than one cycle)

Note that a wavetable synthesiser is also a AudioSampleProcessor
and this function is basically a duplicate / combination of the Audiofile.loadBuffer()
/ Audiofile.loadFile()
method

```
// Create a buffer with two cycles a 2048 samples
const var bf = Buffer.create(2048 * 2);

// Add a sine waveform in the first cycle
for(i = 0; i < 2048; i++)
	bf[i] = Math.sin(i / 2048.0 * 2.0 * Math.PI);

// Add a saw waveform in the second cycle
for(i = 2048; i < 4096; i++)
	bf[i] = 2.0 * Math.fmod(i / 2048.0 - 0.5, 1.0) - 1.0;

// Create a reference to the wavetable controller
const var wt = Synth.getWavetableController("Wavetable Synthesiser1");

// Pass the cycles into the wavetable synthesiser.;
// By supplying the `[0, 2048]` loop range the wavetable synthesiser will
// automatically create two cycles so you can morph between the sine and the saw wave
wt.loadData(bf, Engine.getSampleRate(), [0, 2048]);
```

Thanks to the mip-mapping process of the wavetable synthesiser, you do not need to care about band-limiting or aliasing at all as the wavetable synthesiser will automatically band limit the waveforms for each octave by removing the FFT bins that lie beyond the Nyquist frequency.

You can also use a FFT object to create a harmonic series, then use the inverse FFT to create the wavetable cycle data. This is much more faster than creating the cycles in HiseScript directly and can be used to create any complex harmonic series (eg. by assigning a slider pack to the phase / harmonic buffers)

```
// Create a buffer with two cycles a 2048 samples
const var bf = Buffer.create(2048 * 2);

// Create an FFT object
const var fft = Engine.createFFT();

// This enables the inverse FFT step
fft.setEnableInverseFFT(true);
// We don't need any windowing here as we
// directly synthesise the cycles on the frequency domain
fft.setWindowType(fft.Rectangle);

reg cycleIndex = 0;

// This function will be called on the frequency domain
// and contains a buffer with the frequency bins
fft.setMagnitudeFunction(function(data)
{
	if(cycleIndex++ == 0)
	{
		// Set the second FFT bin to 0dB
		// this will translate to a sine wave
		// with the root frequency
		data[1] = 1.0;
	}
	else
	{
		// create a few harmonics in the second cycle
		data[1] = 0.5;
		data[3] = 0.2;
		data[5] = 0.1;
	}

}, false);

// Here we pass in the cycle length, this means that
// the FFT will be processed twice for the full buffer
fft.prepare(2048, 1);

// Process the (empty) buffer and get the resynthesized
// data back
const var processed = fft.process(bf);

// Create a reference to the wavetable controller
const var wt = Synth.getWavetableController("Wavetable Synthesiser1");

// Pass the resynthesised cycles into the wavetable synthesiser.;
wt.loadData(processed, Engine.getSampleRate(), [0, 2048]);
```

#### **resynthesise**

Resynthesises the wavetables from the currently loaded audio file.

```
WavetableController.resynthesise()
```

This will resynthesise the wavetable based on the current options.

#### **saveAsAudioFile**

Saves the currently loaded wavetable as audio file. Edit on GitHub

```
WavetableController.saveAsAudioFile( var outputFile)
```

#### **saveAsHwt**

Saves the currently loaded wavetable as HWT file somewhere.

```
WavetableController.saveAsHwt( var outputFile)
```

You can use this function to bake the completely processed wavetable into a.hwt file that you then can load as standard wavetable.

Note that this will also include the post processing steps (and loading.hwt files will bypass the post processing to avoid duplication).

#### **setEnableResynthesisCache**

This will store all resynthesised wavetables to the given directory and reused if the same file is loaded again.

```
WavetableController.setEnableResynthesisCache( var cacheDirectory, bool clearCache)
```

The resynthesis step might take a few seconds so in order to increase the loading times of user generated patches (or during development) you can define a cache directory by passing in a file object (either a File, a String containing an absolute path or one of the constants of the FileSystem
object (eg. `FileSystem.AudioFiles`
)).

If this method is called with a directory, any time the wavetable synthesiser has resynthesised an audio file, it will create a cached version from this file and the (currently used Resynthesis options) in the provided directory. If the file is then loaded again with the same settings, it will skip the resynthesis process to speed up the loading time.

Note that the cache will not contain the post processing functions as they will be executed after loading the wavetable from the cache.

The second argument of this function can be used to clear out the directory (which might be helpful during development).

#### **setErrorHandler**

Sets up a function that will be executed when a error occurs during resynthesis. Edit on GitHub

```
WavetableController.setErrorHandler( var errorCallback)
```

#### **setPostFXProcessors**

Sets up a chain of post FX processors that will be applied to the loaded wavetable.

```
WavetableController.setPostFXProcessors( var postFXData)
```

This function can be used to add post-processing steps to the wavetable synthesiser. These are simple math functions with a single parameter that are applied on every wavetable after they have been loaded and can be used to customize the shape of the waveform:

```
wavetable_out = f(wavetable_in, parameter)
```

The functions are baked into the wavetables and are properly band limited using the same mip-map technique as when loading a normal wavetable, so these functions are not subject to realtime-manipulation, but will yield a alias-free sound.

##### **Post processing function definition**

You can use multiple post processing steps at once and they will be serially processed in order of definition. This function expects an array of JSON objects that describe every function. These are the supported properties:

**Property** | **Type** | **Description** || `Type` | String | The type of FX from a predefined list (see below). |
| `min` | double | the parameter value for the lowest table index. |
| `max` | double | the parameter value for the highest table index. |
| `middlePosition` | double | the parameter value for the middle table index. |
| `TableProcessor` | String | The name of the HISE module that provides the Table (see below) |
| `TableIndex` | int | the index of the table that should be used for the parameter lookup table. |

As you can see, with the exception of the `Type`
parameter that defines the function, all other properties are related to how the single `parameter`
will change for different table indexes, which allows you to create a dynamic function curve that you then can modulate through the `TableIndex`
parameter of the wavetable synth: for each cycle in the wavetable it will:

1. normalize the cycle position (so that if the wavetable has 100 cycles, the 50th cycle will have the position `0.5` )
2. Apply the Table (if defined) so that you can fully customize the curve if desired.
3. Scale it to the range provided by the `min`, `max` and `middlePosition` attributes
4. Apply the function to the entire cycle of the wavetable with the calculated `parameter` value

Here are a few examples that demonstrate the different use cases:

```
// A wavefold FX with a constant parameter of 0.8
{
	Type: "Fold",
	min: 0.8,
	max: 0.8
}

// A hard sync effect with a parameter of 0 at the first table
// and a parameter value of 0.5 at the last table
{
	Type: "Sync",
	min: 0.0,
	max: 0.5
}

// A FM effect using a sine wave with the same frequency as carrier
// and the first table of the main UI defining the curve from 0.0 to 16.0
{
	Type: "FM1",
	min: 0.0,
	max: 16.0,
	TableProcessor: "Interface",
	TableIndex: 0
}
```

##### **Available post processing functions**

These are the available post processing functions. They are all shown with a basic sine wave as starting point.

##### **"Sin"**

This is a sinusoidal waveshaper that multiplies the amplitude with a sine wave. It can be used to quickly add harmonics without introducing too much distortion. The `parameter`
defines the amplitude of the sine wave (a value of `0.0`
will not change the waveform)

##### **"Warp"**

This function skews the waveform to the start or end of the cycle and introduces very harsh harmonics. The `parameter`
defines how much the waveform is skewed towards either end (`0.0`
= left, `1.0`
= right, `0.5`
no change)

##### **"Fold"**

This function folds the amplitude of the waveform at the `parameter`
value (so that every value that lies above the `parameter`
value is folded back).

##### **"Clip"**

This function hard clips the waveform to the given amount. Note that this does not scale up the waveform, so if you want to clip it at 1.0, use the `"Normalise"`
step afterwards.

##### **"Tanh"**

This function applies a soft-clipping waveshaper (the standard tanh function) to the waveform.

##### **"Bitcrush"**

This function applies a amplitude quantisation (aka bitcrusher) FX on the waveform

##### **"SampleAndHold"**

This function applies a amplitude quantisation (aka samplerate downsampler) FX on the waveform

##### **"Sync";**

This function will apply a hard-sync effect to the waveform. The parameter will define how much of the original period length should be used (0.0 = no effect, 1.0 = almost zero length)

##### **"Phase"**

This function shifts the phase of the waveform. This will not change the harmonics of the cycle, but it will introduce phaseshifts when you start modulating the table index which will translate into subtle pitch changes.

##### **"FM1" / "FM2" / "FM3" / "FM4"**

These functions will apply a frequency modulation with a sinewave as carrier oscillator. The amount will define the amplitude of the carrier oscillator. The frequency of the carrier will be a multiple of the base frequency:

`"FM1"`
will use the root frequency of the waveform:

`"FM2"`
will use the first harmonic frequency of the waveform:

`"FM3"`
will use the second harmonic frequency of the waveform:

`"FM4"`
will use the third harmonic frequency of the waveform:

##### **"Root"**

This function simply adds a sine wave with the base frequency and zero phase to the waveform so that you can change the ratio between the root frequency and the harmonics. The `parameter`
is the amplitude of the root frequency that's added to the waveform (and by supplying a negative value you can subtract the root frequency from the waveform granted that the phase is zero).

The example now uses a saw wave as adding a sine wave to a sine wave would not yield an interesting graph:

#### **"Normalise"**

This function normalises the waveform to flatten out gain changes between the tables. Note that the final wavetable set is again normalised but this can be used to change the dynamics between the cycles. The `parameter`
value is a percentage of how strong the normalisation should be applied (`0.0`
= no change, `1.0`
= full normalisation).

For the example, we'll use a sine wave with a `"Clip"`
post processor and a clip value of `0.8`
so that you can see the difference:

#### **setResynthesisOptions**

Sets the current resynthesis options.

```
WavetableController.setResynthesisOptions( var optionData)
```

This will set the resynthesis options of the wavetable synthesiser based on the provided JSON object.

**Property** | **Type** | **Description** || PhaseMode | String | One of three modes that define how to process the phase information (see below). |
| MipMapSize | int | the amount of semitones that is used for the mip map (default is 12=1 octave). The wavetable will be internally recalculated and band limited based on this setting. If you are mainly working with organic material, you could increase this a bit to save memory. |
| CycleMultiplier | int | the amount of cycles that is used to calculate a single wavetable. Increasing this value will "smooth" the spectrum, but you'll loose a bit of high frequency material. If you are using Loris this setting will not have any effect. |
| UseTransientMode | bool | If enabled, this will turn off the cycle multiplier for the first 4 cycles to allow a non-smoothed resynthesis of the transient of the sample. This preserves the high frequency content of the transient and might be useful for some sounds. |
| NumCycles | int | the number of cycles to create. If this is `-1`, then it will create as much cycles as the provided audio material contains, but you can set this to a fixed size. |
| ForceResynthesis | bool | This is more of a debugging property and it forces the resynthesis algorithm to always process the incoming audio material - if you load in wave files that already have a power of two cycle length, then it will skip the entire process and directly create the wavetables. With this property you can deactivate this to enforce a resynthesis every time. |
| UseLoris | bool | If enabled (and HISE / your plugin is compiled with `HISE_INCLUDE_LORIS` ), then you can use the Loris library for resynthesis which offers a much better sound quality for organic material. Note that the Loris library is GPL licensed, so you cannot include this in a proprietary plugin without the explicit consent of the authors of this library! |
| ReverseOrder | bool | If enabled, it will reverse the order of the cycles of each wavetable which allows you to apply some modulation tricks that are not possible with the default order. |

##### **PhaseMode**

The `PhaseMode`
property defines how the resynthesis should cope with the phase information and has three options:

- `ZeroPhase` will ignore any phase information and treat every harmonic as sine wave starting at the zero position.
- `StaticPhase` will calculate the phase information of the very first cycle and then apply this to every cycle in the wavetable. This preserves the stereo field of the wavetable as well as the appearance of the waveform but removes all phase changes which can cause some pitch wobbling if the table index is automated
- `DynamicPhase` preserves the phase information of every cycle which is the best option for very organic material. It might sound a bit weird with some samples, so only use it if `StaticPhase` doesn't suit your material.

Note that calling will not cause a resynthesis of the currently loaded wavetable. If you want to do this, follow up this call with a call to resynthesise().
