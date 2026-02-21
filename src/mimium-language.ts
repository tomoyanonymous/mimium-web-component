/**
 * Monaco Editor language definition for mimium
 * Based on mimium.tmLanguage.json
 */
import * as monaco from "monaco-editor";

export const MIMIUM_LANGUAGE_ID = "mimium";

/**
 * Register mimium language with Monaco Editor
 */
export function registerMimiumLanguage(): void {
  // Register the language
  monaco.languages.register({ id: MIMIUM_LANGUAGE_ID, extensions: [".mmm"] });

  // Set language configuration (brackets, comments, auto-closing pairs)
  monaco.languages.setLanguageConfiguration(MIMIUM_LANGUAGE_ID, {
    comments: {
      lineComment: "//",
      blockComment: ["/*", "*/"],
    },
    brackets: [
      ["{", "}"],
      ["[", "]"],
      ["(", ")"],
    ],
    autoClosingPairs: [
      { open: "{", close: "}" },
      { open: "[", close: "]" },
      { open: "(", close: ")" },
      { open: '"', close: '"' },
      { open: "'", close: "'" },
      { open: "/*", close: "*/" },
    ],
    surroundingPairs: [
      { open: "{", close: "}" },
      { open: "[", close: "]" },
      { open: "(", close: ")" },
      { open: '"', close: '"' },
      { open: "'", close: "'" },
    ],
    folding: {
      markers: {
        start: /\{/,
        end: /\}/,
      },
    },
    indentationRules: {
      increaseIndentPattern: /\{[^}]*$/,
      decreaseIndentPattern: /^\s*\}/,
    },
  });

  // Set Monarch tokenizer
  monaco.languages.setMonarchTokensProvider(MIMIUM_LANGUAGE_ID, mimiumTokens);
}

/**
 * Monarch tokenizer definition for mimium
 * Derived from mimium.tmLanguage.json
 */
const mimiumTokens: monaco.languages.IMonarchLanguage = {
  defaultToken: "",
  tokenPostfix: ".mimium",

  // Language keywords (from tmLanguage: keyword.control, keyword.other, storage, etc.)
  keywords: [
    "fn",
    "let",
    "letrec",
    "if",
    "else",
    "type",
    "const",
    "mod",
    "use",
    "pub",
    "as",
    "macro",
    "include",
  ],

  // Built-in types (from tmLanguage: storage.type.core)
  typeKeywords: ["bool", "float", "int", "string", "void"],

  // Special language variables (from tmLanguage: variable.language)
  builtinVariables: ["self", "now", "samplerate", "main"],

  // Built-in functions commonly used in mimium
  builtinFunctions: [
    "sin",
    "cos",
    "tan",
    "asin",
    "acos",
    "atan",
    "atan2",
    "sinh",
    "cosh",
    "tanh",
    "log",
    "log2",
    "log10",
    "exp",
    "exp2",
    "pow",
    "sqrt",
    "abs",
    "ceil",
    "floor",
    "round",
    "fmod",
    "remainder",
    "min",
    "max",
    "sign",
    "rand",
    "random",
    "delay",
    "mem",
    "print",
    "println",
    "probe",
    "assert_eq",
    "dsp",
    "map",
    "fold",
    "lift_f",
  ],

  // Operators
  operators: [
    "=",
    ">",
    "<",
    "!",
    "~",
    "?",
    ":",
    "==",
    "<=",
    ">=",
    "!=",
    "&&",
    "||",
    "++",
    "--",
    "+",
    "-",
    "*",
    "/",
    "&",
    "|",
    "^",
    "%",
    "<<",
    ">>",
    "+=",
    "-=",
    "*=",
    "/=",
    "&=",
    "|=",
    "^=",
    "%=",
    "<<=",
    ">>=",
    "|>",
    "@",
  ],

  // we include these common regular expressions
  symbols: /[=><!~?:&|+\-*/^%@]+/,
  escapes: /\\(?:[abfnrtv\\"']|x[0-9A-Fa-f]{1,4}|u[0-9A-Fa-f]{4}|U[0-9A-Fa-f]{8})/,

  // The main tokenizer for mimium
  tokenizer: {
    root: [
      // Stage directive (#stage)
      [/#stage\b/, "keyword.other"],

      // Quasiquoting (backtick expressions with $)
      [/`/, "keyword.operator"],
      [/\$/, "keyword.operator"],

      // Identifiers and keywords
      [
        /[a-zA-Z_]\w*/,
        {
          cases: {
            "@keywords": "keyword",
            "@typeKeywords": "type",
            "@builtinVariables": "variable.predefined",
            "@builtinFunctions": "support.function",
            "@default": "identifier",
          },
        },
      ],

      // Whitespace
      { include: "@whitespace" },

      // Pipe operator |> (must come before generic @symbols rule)
      [/\|>/, "keyword.operator"],

      // Delimiters
      [/[{}()[\]]/, "@brackets"],

      [
        /@symbols/,
        {
          cases: {
            "@operators": "operator",
            "@default": "",
          },
        },
      ],

      // @ symbol for scheduling
      [/@/, "constant.language"],

      // Numbers
      [/\d*\.\d+([eE][-+]?\d+)?/, "number.float"],
      [/0[xX][0-9a-fA-F]+/, "number.hex"],
      [/0[oO][0-7]+/, "number.octal"],
      [/0[bB][01]+/, "number.binary"],
      [/\d+/, "number"],

      // Delimiter: after number because of .\d floats
      [/[;,.]/, "delimiter"],

      // Strings
      [/"([^"\\]|\\.)*$/, "string.invalid"], // non-terminated string
      [/"/, { token: "string.quote", bracket: "@open", next: "@string" }],

      // Characters
      [/'[^\\']'/, "string"],
      [/(')(@escapes)(')/, ["string", "string.escape", "string"]],
      [/'/, "string.invalid"],
    ],

    comment: [
      [/[^/*]+/, "comment"],
      [/\/\*/, "comment", "@push"], // nested comment
      [/\*\//, "comment", "@pop"],
      [/[/*]/, "comment"],
    ],

    string: [
      [/[^\\"]+/, "string"],
      [/@escapes/, "string.escape"],
      [/\\./, "string.escape.invalid"],
      [/"/, { token: "string.quote", bracket: "@close", next: "@pop" }],
    ],

    whitespace: [
      [/[ \t\r\n]+/, "white"],
      [/\/\*/, "comment", "@comment"],
      [/\/\/.*$/, "comment"],
    ],
  },
};

/**
 * Define a dark theme for mimium
 */
export function registerMimiumTheme(): void {
  monaco.editor.defineTheme("mimium-dark", {
    base: "vs-dark",
    inherit: true,
    rules: [
      { token: "keyword.operator.mimium", foreground: "C586C0", fontStyle: "bold" },
      { token: "keyword.mimium", foreground: "C586C0" },
      { token: "keyword.other.mimium", foreground: "C586C0" },
      { token: "type.mimium", foreground: "4EC9B0" },
      { token: "variable.predefined.mimium", foreground: "9CDCFE", fontStyle: "italic" },
      { token: "support.function.mimium", foreground: "DCDCAA" },
      { token: "number.mimium", foreground: "B5CEA8" },
      { token: "number.float.mimium", foreground: "B5CEA8" },
      { token: "number.hex.mimium", foreground: "B5CEA8" },
      { token: "string.mimium", foreground: "CE9178" },
      { token: "comment.mimium", foreground: "6A9955" },
      { token: "operator.mimium", foreground: "D4D4D4" },
      { token: "constant.language.mimium", foreground: "569CD6" },
    ],
    colors: {
      "editor.background": "#1E1E2E",
      "editor.foreground": "#D4D4D4",
    },
  });

  monaco.editor.defineTheme("mimium-light", {
    base: "vs",
    inherit: true,
    rules: [
      { token: "keyword.operator.mimium", foreground: "AF00DB", fontStyle: "bold" },
      { token: "keyword.mimium", foreground: "AF00DB" },
      { token: "keyword.other.mimium", foreground: "AF00DB" },
      { token: "type.mimium", foreground: "267F99" },
      { token: "variable.predefined.mimium", foreground: "001080", fontStyle: "italic" },
      { token: "support.function.mimium", foreground: "795E26" },
      { token: "number.mimium", foreground: "098658" },
      { token: "number.float.mimium", foreground: "098658" },
      { token: "string.mimium", foreground: "A31515" },
      { token: "comment.mimium", foreground: "008000" },
      { token: "operator.mimium", foreground: "000000" },
      { token: "constant.language.mimium", foreground: "0000FF" },
    ],
    colors: {},
  });
}
