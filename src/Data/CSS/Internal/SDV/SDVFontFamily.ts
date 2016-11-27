// fontFamily

export type CSSFontFaceDeclarationEx = {
    // The string with which you can refer to this fontface. It is optional,
    // if not provided we'll create a hash from the object and use that.
    fontFamily?: string;

    // One or more of "url(...)" or "local(...)". Is required!
    src: string | string[];

    fontStyle?: "normal" | "italic" | "oblique";
    fontWeight?: string | number;
    fontVariant?: string;
}


export type SDVFontFamily
    = string
      // ^ string (with quotes) or ident.
    | CSSFontFaceDeclarationEx
      // ^ A single font-face declaration.
    | (string | CSSFontFaceDeclarationEx)[];
      // ^ A list of the previous two values.
