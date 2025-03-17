// @ts-ignore
let engine = self.Module ??= {
    locateFile: (path: string) => {
        if (path.endsWith(".wasm")) {
            return "../engine/mancala_engine.wasm";
        }
        return path;
    }
};

function createMancalaState(pits: bigint, homePits: number) {
    let statePtr = engine._malloc(10);

    engine.HEAPU32[statePtr / 4] = Number(pits & 0xFFFFFFFFn);
    engine.HEAPU32[statePtr / 4 + 1] = Number(pits >> 32n);

    engine.HEAPU16[(statePtr + 8) / 2] = homePits;

    return statePtr;
}

engine.onRuntimeInitialized = () => {
    addEventListener("message", ({data}) => {
        if (data.type === "bestMove") {
            let state = createMancalaState(BigInt(data.pits), data.homePits);
            let evalPtr = engine._malloc(4);
            let bestMove = engine._get_best_move(state, data.depth, !!data.turn, evalPtr);
            postMessage({id: data.id, bestMove, eval: engine.HEAP32[evalPtr / 4]});
        }
    });

    postMessage("ready");
}

importScripts("../engine/mancala_engine.js");