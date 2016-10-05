
export type Key = [number, number, number, number];


export type I64 = { h: number, l: number };

export const i64Hex = ({h, l}: I64): string =>
    ("0000000" + h.toString(16)).substr(-8) +
    ("0000000" + l.toString(16)).substr(-8);


export const _set = (x: I64, h: number, l: number): void => {
    x.h = h; x.l = l;
};

const _add = (a: I64, b: I64): void => {
    const rl = a.l + b.l;
    _set(a, a.h + b.h + (rl / 2 >>> 31) >>> 0, rl >>> 0);
};

export const _xor = (a: I64, b: I64): void => {
    _set(a, (a.h ^ b.h) >>> 0, (a.l ^ b.l) >>> 0);
};

const _rotl = (a: I64, n: number): void => {
    _set(a, a.h << n | a.l >>> (32 - n), a.l << n | a.h >>> (32 - n));
};

const _rotl32 = (a: I64): void => {
    _set(a, a.l, a.h);
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



export const hash = (() => {
    const v0K = {h: 0x736f6d65, l: 0x70736575};
    const v1K = {h: 0x646f7261, l: 0x6e646f6d};
    const v2K = {h: 0x6c796765, l: 0x6e657261};
    const v3K = {h: 0x74656462, l: 0x79746573};

    const i64_0_ff = {h: 0, l: 0xff};
    const buf = new Uint8Array(new ArrayBuffer(8));
    const mi = {h: 0, l: 0};

    const k0 = {h: 0, l: 0};
    const k1 = {h: 0, l: 0};

    const v0 = {h: 0, l: 0};
    const v1 = {h: 0, l: 0};
    const v2 = {h: 0, l: 0};
    const v3 = {h: 0, l: 0};

    return (key: Key, m: string): I64 => {
        _set(k0, key[1] >>> 0, key[0] >>> 0);
        _set(k1, key[3] >>> 0, key[2] >>> 0);
        _set(v0, k0.h, k0.l);
        _set(v1, k1.h, k1.l);
        _set(v2, k0.h, k0.l);
        _set(v3, k1.h, k1.l);

        let mp = 0, ml = m.length, ml7 = ml - 7;

        _xor(v0, v0K);
        _xor(v1, v1K);
        _xor(v2, v2K);
        _xor(v3, v3K);
        while (mp < ml7) {
            _set(mi, _get_int(m, mp + 4), _get_int(m, mp));
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
        _set(mi,
            buf[7] << 24 | buf[6] << 16 | buf[5] << 8 | buf[4],
            buf[3] << 24 | buf[2] << 16 | buf[1] << 8 | buf[0]);
        _xor(v3, mi);
        _compress(v0, v1, v2, v3);
        _compress(v0, v1, v2, v3);
        _xor(v0, mi);
        _xor(v2, i64_0_ff);
        _compress(v0, v1, v2, v3);
        _compress(v0, v1, v2, v3);
        _compress(v0, v1, v2, v3);
        _compress(v0, v1, v2, v3);

        const h = {h: 0, l: 0};
        _set(h, v0.h, v0.l);
        _xor(h, v1);
        _xor(h, v2);
        _xor(h, v3);

        return h;
    };
})();

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
