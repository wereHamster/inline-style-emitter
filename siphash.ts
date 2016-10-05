
export type Key = [number, number, number, number];


export type I64 = { h: number, l: number };

export const i64Hex = ({h, l}: I64): string =>
    ("0000000" + h.toString(16)).substr(-8) +
    ("0000000" + l.toString(16)).substr(-8);


const _add = (a: I64, b: I64): void => {
    const rl = a.l + b.l;
    const h = a.h + b.h + (rl / 2 >>> 31) >>> 0, l =  rl >>> 0;

    a.h = h;
    a.l = l;
};

export const _xor = (a: I64, b: I64): void => {
    a.h ^= b.h; a.h >>>= 0;
    a.l ^= b.l; a.l >>>= 0;
};

const _rotl = (a: I64, n: number): void => {
    const h = a.h << n | a.l >>> (32 - n), l = a.l << n | a.h >>> (32 - n);

    a.h = h;
    a.l = l;
};

const _rotl32 = (a: I64): void => {
    const al = a.l;
    a.l = a.h;
    a.h = al;
};

const _compress = (v0: I64, v1: I64, v2: I64, v3: I64): void => {
    _add(v0, v1);
    _add(v2, v3);
    _rotl(v1, 13);
    _rotl(v3, 16);
    _xor(v1, v0);
    _xor(v3, v2);
    _rotl32(v0);
    _add(v2, v1);
    _add(v0, v3);
    _rotl(v1, 17);
    _rotl(v3, 21);
    _xor(v1, v2);
    _xor(v3, v0);
    _rotl32(v2);
};

const _get_int = (a: string, offset: number): number =>
    a.charCodeAt(offset + 3) << 24 |
    a.charCodeAt(offset + 2) << 16 |
    a.charCodeAt(offset + 1) << 8 |
    a.charCodeAt(offset);


export const hash = (key: Key, m: string): I64 => {
    let k0 = { h: key[1] >>> 0, l: key[0] >>> 0 },
        k1 = { h: key[3] >>> 0, l: key[2] >>> 0 },
        v0 = { h: k0.h, l: k0.l },
        v2 = k0,
        v1 = { h: k1.h, l: k1.l },
        v3 = k1,
        mi,
        mp = 0,
        ml = m.length,
        ml7 = ml - 7,
        buf = new Uint8Array(new ArrayBuffer(8));

    _xor(v0, { h: 0x736f6d65, l: 0x70736575 });
    _xor(v1, { h: 0x646f7261, l: 0x6e646f6d });
    _xor(v2, { h: 0x6c796765, l: 0x6e657261 });
    _xor(v3, { h: 0x74656462, l: 0x79746573 });
    while (mp < ml7) {
        mi = { h: _get_int(m, mp + 4), l: _get_int(m, mp) };
        _xor(v3, mi);
        _compress(v0, v1, v2, v3);
        _compress(v0, v1, v2, v3);
        _xor(v0, mi);
        mp += 8;
    }
    buf[7] = ml;
    let ic = 0;
    while (mp < ml) {
        buf[ic++] = m.charCodeAt(mp++);
    }
    while (ic < 7) {
        buf[ic++] = 0;
    }
    mi = { h: buf[7] << 24 | buf[6] << 16 | buf[5] << 8 | buf[4],
           l: buf[3] << 24 | buf[2] << 16 | buf[1] << 8 | buf[0] };
    _xor(v3, mi);
    _compress(v0, v1, v2, v3);
    _compress(v0, v1, v2, v3);
    _xor(v0, mi);
    _xor(v2, { h: 0, l: 0xff });
    _compress(v0, v1, v2, v3);
    _compress(v0, v1, v2, v3);
    _compress(v0, v1, v2, v3);
    _compress(v0, v1, v2, v3);

    let h = v0;
    _xor(h, v1);
    _xor(h, v2);
    _xor(h, v3);

    return h;
};

export const string16_to_key = (a: string): Key =>
    [ _get_int(a, 0)
    , _get_int(a, 4)
    , _get_int(a, 8)
    , _get_int(a, 12)
    ];

export const hash_hex = (key: Key, m: string): string =>
    i64Hex(hash(key, m));

export const hash_uint = (key: Key, m: string): number => {
    const {h, l} = hash(key, m);
    return (h & 0x1fffff) * 0x100000000 + l;
};
