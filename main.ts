type Div = HTMLDivElement;
type Span = HTMLSpanElement;

const pitNodes = [...document.querySelectorAll(".pit"), ...document.querySelectorAll(".home")];

const pitImages: Div[] = [];
const pitTexts: Span[] = [];
const pitDivs: Div[] = [];
const indices = [0, 1, 2, 3, 4, 5, 12, 6, 7, 8, 9, 10, 11, 13];

const holding = <Div>document.querySelector(".holding");
const spread = <Div>document.querySelector(".spread");

for (let i = 0; i <= 30; i++) {
    const img = new Image;
    img.src = `./assets/stones/${i}.webp`;
}

const game = JSON.parse(localStorage.getItem("mancala.game") ?? JSON.stringify({
    depth: 3,
    turn: false,
    pits: [4, 4, 4, 4, 4, 4, 0, 4, 4, 4, 4, 4, 4, 0]
}));

function resetGame() {
    game.turn = false;

    for (let i = 0; i < 14; i++) {
        setPit(i, i === 13 || i === 6 ? 0 : 4);
    }

    renderPits();
}

function getPit(index: number) {
    return game.pits[index];
}

function setPit(index: number, value: number) {
    return game.pits[index] = value;
}

function renderPitImage(div: Div, value: number) {
    div.style.backgroundImage = `url("./assets/stones/${Math.min(30, value)}.webp")`;
}

function renderPits() {
    for (let index = 0; index < 14; index++) {
        const value = getPit(index);
        pitTexts[index].innerText = value.toString();
        const img = pitImages[index];
        img.style.cursor = game.turn !== (index < 6) && value > 0 ? "pointer" : "default";
        renderPitImage(img, value);
    }

    localStorage.setItem("mancala.game", JSON.stringify(game));
}

function addPit(index: number, value: number) {
    return setPit(index, getPit(index) + value);
}

function wait(ms: number) {
    return new Promise(r => setTimeout(r, ms));
}

async function waitRender(amount = 1) {
    for (let i = 0; i < amount; i++) {
        await new Promise(r => requestAnimationFrame(r));
    }
}

async function moveToDiv(from: Div, to: Div, animationMs: number, waitMovement = false) {
    const rect = to.getBoundingClientRect();

    if (animationMs) from.style.transition = "all " + (animationMs / 1000) + "s ease";
    else from.style.transition = "";

    await waitRender();

    from.style.left = rect.left + "px";
    from.style.top = rect.top + "px";

    if (waitMovement) await wait(animationMs);
}

let moving = false;

async function checkEnd() {
    let cleaned = true;

    for (let i = 0; i <= 5; i++) {
        if (getPit(i)) {
            cleaned = false;
            break;
        }
    }

    if (!cleaned) {
        for (let i = 7; i <= 12; i++) {
            if (getPit(i)) return;
        }
    }

    let accumulated = 0;
    await moveToDiv(spread, pitImages[0], 0);
    accumulated += getPit(0);
    renderPitImage(spread, accumulated);
    setPit(0, 0);
    renderPits();

    for (let i = 1; i <= 12; i++) {
        if (i === 6 || getPit(i) === 0) continue;
        await moveToDiv(spread, pitImages[i], 75, true);
        accumulated += getPit(i);
        renderPitImage(spread, accumulated);
        setPit(i, 0);
        renderPits();
    }

    await moveToDiv(spread, pitImages[game.turn ? 13 : 6], 300, true);
    addPit(game.turn ? 13 : 6, accumulated);
    renderPitImage(spread, 0);
}

async function makeMoveAnimation(index: number) {
    if (moving) return;
    moving = true;

    let value = getPit(index);
    const div = pitImages[index];
    setPit(index, 0);
    renderPits();
    await moveToDiv(spread, div, 0);
    renderPitImage(spread, value);
    await moveToDiv(spread, holding, 300, true);
    renderPitImage(holding, value);
    renderPitImage(spread, 0);
    await wait(500);

    let pos = index + (value === 1 ? 0 : -1);

    while (value > 0) {
        pos = (pos + 1) % 14;

        if ((pos === 6 && game.turn) || (pos === 13 && !game.turn)) continue;

        await moveToDiv(spread, holding, 0);
        renderPitImage(spread, 1);
        value--;
        renderPitImage(holding, value);
        await moveToDiv(spread, pitImages[pos], 300, true);
        renderPitImage(spread, 0);
        addPit(pos, 1);
        renderPits();
        await wait(200);
    }

    if (pos === 6 || pos === 13) {
        await checkEnd();
        moving = false;
        return;
    }

    const endStones = getPit(pos);

    if (endStones % 2 === 0 && ((pos > 6) !== game.turn)) {
        await moveToDiv(spread, pitImages[pos], 0);
        renderPitImage(spread, endStones);
        setPit(pos, 0);
        renderPits();
        const homePit = game.turn ? 13 : 6;
        await moveToDiv(spread, pitImages[homePit], 300, true);
        renderPitImage(spread, 0);
        addPit(homePit, endStones);
        renderPits();
        await checkEnd();
        moving = false;
        game.turn = !game.turn;
        renderPits();
        return;
    }

    const across = 12 - pos;
    const acrossStones = getPit(across);

    if (endStones === 1 && ((pos > 6) === game.turn) && acrossStones > 0) {
        await moveToDiv(spread, pitImages[across], 0);
        renderPitImage(spread, acrossStones);
        setPit(across, 0);
        renderPits();
        await moveToDiv(spread, pitImages[pos], 300, true);
        renderPitImage(spread, acrossStones + endStones);
        setPit(pos, 0);
        renderPits();
        const homePit = game.turn ? 13 : 6;
        await moveToDiv(spread, pitImages[homePit], 300, true);
        renderPitImage(spread, 0);
        addPit(homePit, acrossStones + endStones);
        renderPits();
        await checkEnd();
        moving = false;
        game.turn = !game.turn;
        renderPits();
        return;
    }

    await checkEnd();
    moving = false;
    game.turn = !game.turn;
    renderPits();
}

for (const [i, divIndex] of indices.entries()) {
    const div = <Div>pitNodes[divIndex];
    const img = document.createElement("div");
    const span = document.createElement("span");
    span.style.position = "absolute";
    span.style.fontSize = "1.5vw";
    span.style.width = "3vw";
    span.style.left = "calc(50% - 1.5vw)";
    span.style[i > 6 ? "top" : "bottom"] = "0";
    div.appendChild(span);
    div.appendChild(img);

    pitTexts.push(span);
    pitDivs.push(div);
    pitImages.push(img);

    img.addEventListener("click", async () => {
        if (i === 6 || i === 13 || (i > 6) !== game.turn || getPit(i) === 0 || game.turn) return;
        await makeMoveAnimation(i);
        while (game.turn) await playAI();
    });
}

addEventListener("contextmenu", e => {
    e.preventDefault();
});

const worker = new Worker(new URL("./worker.ts", import.meta.url));

const requests: Record<string, (data: unknown) => void> = {};
let _id = 0;

async function getBestMove(depth = 3) {
    await aiReady;
    let pits = 0n;
    for (let i = 0; i <= 12; i++) {
        if (i === 6) continue;
        const ind = i > 6 ? i - 1 : i;
        pits |= BigInt(getPit(i)) << BigInt(ind * 5);
    }

    const homePits = getPit(6) | (getPit(13) << 6);

    return new Promise<any>(r => {
        const id = _id++;
        requests[id] = r;
        worker.postMessage({id, type: "bestMove", pits: pits.toString(), homePits, turn: game.turn, depth});
    });
}

renderPits();

async function playAI() {
    let move = (await getBestMove()).bestMove;
    await makeMoveAnimation(move > 5 ? move + 1 : move);
}

const aiReady = new Promise(r => {
    worker.onmessage = ({data}) => {
        if (typeof data === "object" && data.id in requests) {
            requests[data.id](data);
            delete requests[data.id];
        } else if (data === "ready") r(null);
    };
});

document.querySelector(".reset")!.addEventListener("click", () => {
    resetGame();
});

document.querySelector(".depth > input")!.addEventListener("input", e => {
    game.depth = (<HTMLInputElement>e.target).value;
    document.getElementById("depth")!.textContent = game.depth.toString();
});

document.getElementById("depth")!.textContent = game.depth.toString();
(<HTMLInputElement>document.querySelector(".depth > input")).value = game.depth.toString();