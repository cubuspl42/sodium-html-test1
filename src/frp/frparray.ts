import { Cell, CellLoop, Operational, Stream, StreamLoop } from "sodiumjs";
import { MapUtils } from "../utils";
import { LazyGetter } from "lazy-get-decorator";

export class FrpArrayChange<A> {
    readonly updates?: ReadonlyMap<number, A>;
    readonly swaps?: ReadonlyMap<number, number>;
    readonly inserts?: ReadonlyMap<number, ReadonlyArray<A>>;
    readonly deletes?: ReadonlySet<number>;

    constructor(props: {
        updates?: ReadonlyMap<number, A>,
        swaps?: ReadonlyMap<number, number>,
        inserts?: ReadonlyMap<number, ReadonlyArray<A>>,
        deletes?: ReadonlySet<number>,
    }) {
        this.updates = props.updates;
        this.swaps = props.swaps;
        this.inserts = props.inserts;
        this.deletes = props.deletes;
    }

    static update<A>(index: number, element: A): FrpArrayChange<A> {
        return new FrpArrayChange<A>({
            updates: new Map([[index, element]]),
        });
    }

    static swap<A>(sourceIndex: number, targetIndex: number): FrpArrayChange<A> {
        return new FrpArrayChange<A>({
            swaps: new Map([[sourceIndex, targetIndex]]),
        });
    }

    static insert<A>(index: number, elements: ReadonlyArray<A>): FrpArrayChange<A> {
        return new FrpArrayChange<A>({
            inserts: new Map([[index, elements]]),
        });
    }

    static delete<A>(index: number): FrpArrayChange<A> {
        return new FrpArrayChange<A>({
            deletes: new Set([index]),
        });
    }

    apply(a: ReadonlyArray<A>): ReadonlyArray<A> {
        const copy = a.slice();

        this.updates?.forEach((element, index) => {
            copy[ index ] = element;
        });

        this.swaps?.forEach((targetIndex, sourceIndex) => {
            copy[ targetIndex ] = copy[ sourceIndex ];
        });

        // for (let i = 0; i < copy.length;) {
        //     const deletedCount = (this.deletes?.has(i) ?? false) ? 1 : 0;
        //
        //     const insertedElements = this.inserts?.get(i) ?? [];
        //
        //     copy.splice(i, deletedCount, ...insertedElements);
        //
        //     i += 1 + insertedElements.length - deletedCount;
        // }

        const copy2 = copy.flatMap(((value, i) =>
            (this.deletes?.has(i) ? [] : [value]).concat(this.inserts?.get(i) ?? [])),
        ).concat(this.inserts?.get(a.length) ?? []);

        // const pushedElements = this.inserts?.get(a.length) ?? [];
        // copy.push(...pushedElements);

        return copy2;
    }

    map<B>(f: (a: A) => B): FrpArrayChange<B> {
        return new FrpArrayChange<B>({
            updates: this.updates !== undefined ?
                MapUtils.mapValues(this.updates, f) :
                undefined,
            swaps: this.swaps,
            inserts: this.inserts !== undefined ?
                MapUtils.mapValues(this.inserts, (arr) => arr.map(f)) :
                undefined,
            deletes: this.deletes,
        });
    }

    union(other: FrpArrayChange<A>) {
        return new FrpArrayChange({
            updates: MapUtils.union(this.updates ?? new Map(), other.updates ?? new Map()),
            swaps: MapUtils.union(this.swaps ?? new Map(), other.swaps ?? new Map()),
            inserts: MapUtils.union(this.inserts ?? new Map(), other.inserts ?? new Map()),
            deletes: new Set([...this.deletes ?? new Set(), ...other.deletes ?? new Set()]),
        });
    }
}

export class FrpArray<A> {
    readonly _cell: Cell<ReadonlyArray<A>>;

    readonly sChange: Stream<FrpArrayChange<A>>;

    constructor(
        initial: Cell<ReadonlyArray<A>>,
        sChange?: Stream<FrpArrayChange<A>>,
    ) {
        this.sChange = sChange ?? new Stream<FrpArrayChange<A>>();
        this._cell = this.sChange.accumLazy(
            initial.sampleLazy(),
            (c, a) => c.apply(a),
        );

        // this.cell.listen(() => {
        // });
        // this.cLength.listen(() => {
        // });
    }

    static hold<A>(
        initial: ReadonlyArray<A>,
        sChange?: Stream<FrpArrayChange<A>>,
    ): FrpArray<A> {
        return new FrpArray<A>(new Cell(initial), sChange);
    }

    static fromCellArray<A>(cellArray: ReadonlyArray<Cell<A>>) {
        return FrpArray.hold(
            cellArray.map((c) => c.sample()),
            Operational.value(Cell.liftArray(cellArray as Array<Cell<A>>)).map((array) => {
                const entries = array.map((value, index): [number, A] => [index, value]);
                // TODO: Filter changed values
                return new FrpArrayChange<A>({ updates: new Map(entries) });
            })
        )
    }

    static accum<A, B>(
        stream: Stream<A>,
        initialArray: ReadonlyArray<B>,
        f: (a: A, frpArray: FrpArray<B>) => FrpArrayChange<B>,
    ) {
        const frpArrayLoop = new FrpArrayLoop<B>();
        const frpArray = FrpArray.hold(
            initialArray,
            stream.map((a) => f(a, frpArrayLoop)),
        );
        frpArrayLoop.loop(frpArray);
        return frpArray;
    }

    @LazyGetter()
    get cLength(): Cell<number> {
        return this._cell.map((arr) => arr.length);
    }

    sample(): ReadonlyArray<A> {
        return this._cell.sample();
    }

    map<B>(f: (a: A) => B): FrpArray<B> {
        return FrpArray.hold(
            this.sample().map(f),
            this.sChange.map((c) => c.map(f)),
        )
    }

    flatMapS<B>(f: (a: A) => Stream<B>): Stream<Map<number, B>> {
        return Cell.switchS(this._cell.map(
            (a) => traverseArrayS(a.map(f)),
        ));
    }

    filter(f: (a: A) => boolean): FrpArray<A> {
        return this; // FIXME

        // const initialArray = this.sample();
        //
        // const initialFilteredOut: Set<number> = new Set(
        //     initialArray
        //         .map((a, index) => f(a) ? null : index)
        //         .filter((i) => i !== null)
        //         .map((a) => a as number)
        // );
        //
        // const xx = this.sChange.accum(initialFilteredOut, (change, acc) => {
        //     const newAcc = new Set(acc);
        //
        // });
        //
        // const filteredOut = this.sChange.map((change) => {
        //     change.
        // });
        //
        // return new FrpArray(
        //     initialArray.filter(f),
        //     this.sChange.map((change) => {
        //         throw null;
        //     }),
        // )
    }

    static filterNotNull<A>(frpArray: FrpArray<A | null>): FrpArray<A> {
        return frpArray.filter((a) => a !== null).map((a) => a as A);
    }

    pushChange(elements: ReadonlyArray<A>): FrpArrayChange<A> {
        const length = this.cLength.sample();
        return new FrpArrayChange<A>({
            inserts: new Map([
                [length, elements],
            ]),
        });
    }
}

function traverseArrayS<A>(ca: ReadonlyArray<Stream<A>>): Stream<Map<number, A>> {
    return _traverseArrayS(ca, 0, ca.length);
}

function _traverseArrayS<A>(sa: ReadonlyArray<Stream<A>>, fromInc: number, toExc: number): Stream<Map<number, A>> {
    if (toExc - fromInc === 0) {
        return new Stream<Map<number, A>>();
    } else if (toExc - fromInc == 1) {
        return sa[ fromInc ].map(a => new Map([[fromInc, a]]));
    } else {
        const pivot = Math.floor((fromInc + toExc) / 2);
        return _traverseArrayS(sa, fromInc, pivot).merge(_traverseArrayS(sa, pivot, toExc),
            (map1, map2) => MapUtils.union(map1, map2)
        );
    }
}

export class FrpArrayLoop<A> extends FrpArray<A> {
    private readonly initialLoop: CellLoop<ReadonlyArray<A>>;

    private readonly sChangeLoop: StreamLoop<FrpArrayChange<A>>;

    constructor() {
        const initial = new CellLoop<ReadonlyArray<A>>();
        (initial as any).__name = "initial";
        const sChange = new StreamLoop<FrpArrayChange<A>>();

        super(
            initial,
            sChange,
        );

        this.initialLoop = initial;
        this.sChangeLoop = sChange;
    }

    loop(frpArray: FrpArray<A>) {
        this.initialLoop.loop(frpArray._cell);
        this.sChangeLoop.loop(frpArray.sChange);
    }
}
