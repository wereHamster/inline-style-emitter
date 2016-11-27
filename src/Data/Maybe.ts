// -----------------------------------------------------------------------------
// For the purposes of this library Maybe<T> is defined as 'undefined | T'.
// Here be functions which deal with such types.

export type Maybe<T> = undefined | T

export const fromMaybe = <A>(a: A, m: Maybe<A>): A =>
    m === undefined ? a : m;

// Strict in the first argument!
export const maybe = <A, B>(b: B, f: (a: A) => B, m: Maybe<A>): B =>
    m === undefined ? b : f(m);

export const catMaybes = <A>(xs: Maybe<A>[]): A[] =>
    xs.reduce((acc, x) => maybe(acc, a => [...acc, a], x), []);

