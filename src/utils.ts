export class MapUtils {
    static mapValues<K, V1, V2>(m: ReadonlyMap<K, V1>, f: (v1: V1) => V2): ReadonlyMap<K, V2> {
        return new Map(Array.from(m).map(([k, v]): [K, V2] => [k, f(v)]));
    }

    static fromArray<A>(array: ReadonlyArray<A>): Map<number, A> {
        return new Map(array.map((value, index) => [index, value]));
    }
}
