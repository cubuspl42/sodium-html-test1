import {Cell, Operational, Stream} from "sodiumjs";
import {MapUtils} from "../utils";

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
            copy[index] = element;
        });

        this.swaps?.forEach((targetIndex, sourceIndex) => {
            copy[targetIndex] = copy[sourceIndex];
        });

        for (let i = 0; i < a.length;) {
            const deletedCount = (this.deletes?.has(i) ?? false) ? 1 : 0;

            const insertedElements = this.inserts?.get(i) ?? [];

            copy.splice(i, deletedCount, ...insertedElements);

            i += 1 + insertedElements.length - deletedCount
        }

        return copy;
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
}

export class FrpArray<A> {
    private readonly cell: Cell<ReadonlyArray<A>>;

    readonly sChange: Stream<FrpArrayChange<A>>;

    constructor(
        initial: ReadonlyArray<A>,
        sChange?: Stream<FrpArrayChange<A>>,
    ) {
        this.sChange = sChange ?? new Stream<FrpArrayChange<A>>();
        this.cell = this.sChange.accum(
            initial,
            (c, a) => c.apply(a),
        );
    }

    static fromCellArray<A>(cellArray: ReadonlyArray<Cell<A>>) {
        return new FrpArray(
            cellArray.map((c) => c.sample()),
            Operational.value(Cell.liftArray(cellArray as Array<Cell<A>>)).map((array) => {
                const entries = array.map((value, index): [number, A] => [index, value]);
                // TODO: Filter changed values
                return new FrpArrayChange<A>({updates: new Map(entries)});
            })
        )
    }

    sample(): ReadonlyArray<A> {
        return this.cell.sample();
    }

    map<B>(f: (a: A) => B): FrpArray<B> {
        return new FrpArray<B>(
            this.sample().map(f),
            this.sChange.map((c) => c.map(f)),
        )
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
}
