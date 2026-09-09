/* ----------------------- KATAGO BOARD (pure) -----------------------
   A faithful port of KataGo's reference Python board (python/katago/game/board.py,
   MIT licence, David J Wu). It exists for one reason: KataGo's neural-net input
   features need two analyses that Sente's immutable board does not provide —
   ladder search (which stones are in an inescapable atari, and which moves capture
   them) and Benson pass-alive area. Both are implemented on this mutable, padded
   board with chain tracking so play/undo is cheap inside the ladder search.

   Layout: the board is padded by a wall of one point on every side. A point (x, y)
   with 0 <= x < xSize and 0 <= y < ySize lives at loc = (x + 1) + dy * (y + 1)
   where dy = xSize + 1. loc 0 doubles as PASS_LOC / "no location".

   Nothing here imports the rest of the engine; `fromCells` is the bridge from a
   Sente `{size, cells}` board. Framework-free, like everything in src/engine. */

export const EMPTY = 0;
export const BLACK = 1;
export const WHITE = 2;
export const WALL = 3;
export const PASS_LOC = 0;

export const getOpp = (pla) => 3 - pla;

export class KBoard {
  /** @param {number} size  square board size (2..50)
   *  @param {KBoard} [other]  copy source */
  constructor(size, other = null) {
    if (!Number.isInteger(size) || size < 2 || size > 50) throw new RangeError(`bad board size ${size}`);
    this.xSize = size;
    this.ySize = size;
    this.arrSize = (size + 1) * (size + 2) + 1;
    this.dy = size + 1;
    this.adj = [-this.dy, -1, 1, this.dy];

    if (other) {
      this.pla = other.pla;
      this.board = Int8Array.from(other.board);
      this.groupHead = Int16Array.from(other.groupHead);
      this.groupStoneCount = Int16Array.from(other.groupStoneCount);
      this.groupLibertyCount = Int16Array.from(other.groupLibertyCount);
      this.groupNext = Int16Array.from(other.groupNext);
      this.groupPrev = Int16Array.from(other.groupPrev);
      this.simpleKoPoint = other.simpleKoPoint;
      return;
    }

    this.pla = BLACK;
    this.board = new Int8Array(this.arrSize);
    this.groupHead = new Int16Array(this.arrSize);
    this.groupStoneCount = new Int16Array(this.arrSize);
    this.groupLibertyCount = new Int16Array(this.arrSize);
    this.groupNext = new Int16Array(this.arrSize);
    this.groupPrev = new Int16Array(this.arrSize);
    this.simpleKoPoint = null;

    for (let i = -1; i <= this.xSize; i++) {
      this.board[this.loc(i, -1)] = WALL;
      this.board[this.loc(i, this.ySize)] = WALL;
    }
    for (let i = -1; i <= this.ySize; i++) {
      this.board[this.loc(-1, i)] = WALL;
      this.board[this.loc(this.xSize, i)] = WALL;
    }
    this.groupHead[0] = -1;
    this.groupNext[0] = -1;
    this.groupPrev[0] = -1;
  }

  /** Build from a Sente board `{size, cells}` (cells of null | "b" | "w"). Stones are
   *  placed one by one, so chain data is consistent. No ko point is set. */
  static fromCells(board) {
    const kb = new KBoard(board.size);
    for (let r = 0; r < board.size; r++) for (let c = 0; c < board.size; c++) {
      const v = board.cells[r * board.size + c];
      if (v === "b") kb.addUnsafe(BLACK, kb.loc(c, r));
      else if (v === "w") kb.addUnsafe(WHITE, kb.loc(c, r));
    }
    return kb;
  }

  copy() { return new KBoard(this.xSize, this); }

  loc(x, y) { return (x + 1) + this.dy * (y + 1); }
  locX(loc) { return (loc % this.dy) - 1; }
  locY(loc) { return Math.floor(loc / this.dy) - 1; }
  isAdjacent(a, b) {
    return a === b + this.adj[0] || a === b + this.adj[1] || a === b + this.adj[2] || a === b + this.adj[3];
  }
  isOnBoard(loc) { return loc >= 0 && loc < this.arrSize && this.board[loc] !== WALL; }

  numLiberties(loc) {
    const v = this.board[loc];
    if (v === EMPTY || v === WALL) return 0;
    return this.groupLibertyCount[this.groupHead[loc]];
  }

  wouldBeLegal(pla, loc) {
    if (pla !== BLACK && pla !== WHITE) return false;
    if (loc === PASS_LOC) return true;
    if (!this.isOnBoard(loc)) return false;
    if (this.board[loc] !== EMPTY) return false;
    if (this.wouldBeSingleStoneSuicide(pla, loc)) return false;
    if (loc === this.simpleKoPoint) return false;
    return true;
  }

  wouldBeSingleStoneSuicide(pla, loc) {
    const b = this.board, gl = this.groupLibertyCount, gh = this.groupHead;
    const opp = getOpp(pla);
    for (let i = 0; i < 4; i++) {
      const a = loc + this.adj[i];
      if (b[a] === EMPTY) return false;
      if (b[a] === opp && gl[gh[a]] === 1) return false;
    }
    for (let i = 0; i < 4; i++) if (b[loc + this.adj[i]] === pla) return false;
    return true;
  }

  /** Liberties a new stone here would have, capped at maxLibs. */
  getLibertiesAfterPlay(pla, loc, maxLibs) {
    const opp = getOpp(pla);
    const libs = [];
    const capturedHeads = [];
    for (let i = 0; i < 4; i++) {
      const a = loc + this.adj[i];
      if (this.board[a] === EMPTY) {
        libs.push(a);
        if (libs.length >= maxLibs) return maxLibs;
      } else if (this.board[a] === opp && this.numLiberties(a) === 1) {
        libs.push(a);
        if (libs.length >= maxLibs) return maxLibs;
        const head = this.groupHead[a];
        if (!capturedHeads.includes(head)) capturedHeads.push(head);
      }
    }
    const wouldBeEmpty = (p) => {
      if (this.board[p] === EMPTY) return true;
      if (this.board[p] === opp) return capturedHeads.includes(this.groupHead[p]);
      return false;
    };
    const connecting = [];
    for (let i = 0; i < 4; i++) {
      const a = loc + this.adj[i];
      if (this.board[a] !== pla) continue;
      const head = this.groupHead[a];
      if (connecting.includes(head)) continue;
      connecting.push(head);
      let cur = a;
      do {
        for (let k = 0; k < 4; k++) {
          const p = cur + this.adj[k];
          if (p !== loc && wouldBeEmpty(p) && !libs.includes(p)) {
            libs.push(p);
            if (libs.length >= maxLibs) return maxLibs;
          }
        }
        cur = this.groupNext[cur];
      } while (cur !== a);
    }
    return libs.length;
  }

  /* ----- play / undo ----- */

  /** Play with simple-ko and single-stone-suicide checks. Multi-stone suicide is allowed
   *  (it is only reachable inside searches that never generate it on this rule set). */
  play(pla, loc) {
    if (pla !== BLACK && pla !== WHITE) throw new Error("bad pla");
    if (loc !== PASS_LOC) {
      if (!this.isOnBoard(loc)) throw new Error("off board");
      if (this.board[loc] !== EMPTY) throw new Error("occupied");
      if (this.wouldBeSingleStoneSuicide(pla, loc)) throw new Error("suicide");
      if (loc === this.simpleKoPoint) throw new Error("ko");
    }
    this.playUnsafe(pla, loc);
  }

  playUnsafe(pla, loc) {
    if (loc === PASS_LOC) this.simpleKoPoint = null;
    else this.addUnsafe(pla, loc);
    this.pla = getOpp(pla);
  }

  playRecordedUnsafe(pla, loc) {
    const capDirs = [];
    const opp = getOpp(pla);
    const oldKo = this.simpleKoPoint;
    for (let i = 0; i < 4; i++) {
      const a = loc + this.adj[i];
      if (this.board[a] === opp && this.groupLibertyCount[this.groupHead[a]] === 1) capDirs.push(i);
    }
    this.playUnsafe(pla, loc);
    const selfCap = this.board[loc] === EMPTY;
    return { pla, loc, oldKo, capDirs, selfCap };
  }

  undo(rec) {
    const { pla, loc, oldKo, capDirs, selfCap } = rec;
    const opp = getOpp(pla);
    this.simpleKoPoint = oldKo;
    this.pla = pla;
    if (loc === PASS_LOC) return;

    for (const d of capDirs) {
      const a = loc + this.adj[d];
      if (this.board[a] === EMPTY) this.floodFillStones(opp, a);
    }
    if (selfCap) this.floodFillStones(pla, loc);

    this.board[loc] = EMPTY;
    const head = this.groupHead[loc];
    const stoneCount = this.groupStoneCount[head];
    this.groupStoneCount[head] = 0;
    this.groupLibertyCount[head] = 0;

    this.changeSurroundingLiberties(loc, opp, +1);

    if (stoneCount > 1) {
      let cur = loc;
      do { this.groupHead[cur] = PASS_LOC; cur = this.groupNext[cur]; } while (cur !== loc);
      for (let i = 0; i < 4; i++) {
        const a = loc + this.adj[i];
        if (this.board[a] === pla && this.groupHead[a] === PASS_LOC) this.rebuildChain(pla, a);
      }
    }
    this.groupHead[loc] = 0;
    this.groupNext[loc] = 0;
    this.groupPrev[loc] = 0;
  }

  floodFillStones(pla, loc) {
    const head = loc;
    this.groupLibertyCount[head] = 0;
    this.groupStoneCount[head] = 0;
    const front = this.floodFillStonesHelper(head, head, head, pla);
    this.groupNext[head] = front;
    this.groupPrev[front] = head;
  }

  floodFillStonesHelper(head, tailTarget, loc, pla) {
    this.board[loc] = pla;
    this.groupHead[loc] = head;
    this.groupStoneCount[head] += 1;
    this.groupNext[loc] = tailTarget;
    this.groupPrev[tailTarget] = loc;
    this.changeSurroundingLiberties(loc, getOpp(pla), -1);
    let next = loc;
    for (let i = 0; i < 4; i++) {
      const a = loc + this.adj[i];
      if (this.board[a] === EMPTY) next = this.floodFillStonesHelper(head, next, a, pla);
    }
    return next;
  }

  rebuildChain(pla, loc) {
    const head = loc;
    this.groupLibertyCount[head] = 0;
    this.groupStoneCount[head] = 0;
    const front = this.rebuildChainHelper(head, head, head, pla);
    this.groupNext[head] = front;
    this.groupPrev[front] = head;
  }

  rebuildChainHelper(head, tailTarget, loc, pla) {
    for (let i = 0; i < 4; i++) {
      const a = loc + this.adj[i];
      if (this.board[a] === EMPTY && !this.isGroupAdjacent(head, a)) this.groupLibertyCount[head] += 1;
    }
    this.groupHead[loc] = head;
    this.groupStoneCount[head] += 1;
    this.groupNext[loc] = tailTarget;
    this.groupPrev[tailTarget] = loc;
    let next = loc;
    for (let i = 0; i < 4; i++) {
      const a = loc + this.adj[i];
      if (this.board[a] === pla && this.groupHead[a] !== head) next = this.rebuildChainHelper(head, next, a, pla);
    }
    return next;
  }

  addUnsafe(pla, loc) {
    const opp = getOpp(pla);
    const b = this.board, gh = this.groupHead, gl = this.groupLibertyCount;
    b[loc] = pla;
    gh[loc] = loc;
    this.groupStoneCount[loc] = 1;
    let libs = 0;
    for (let i = 0; i < 4; i++) if (b[loc + this.adj[i]] === EMPTY) libs++;
    gl[loc] = libs;
    this.groupNext[loc] = loc;
    this.groupPrev[loc] = loc;

    const a0 = loc + this.adj[0], a1 = loc + this.adj[1], a2 = loc + this.adj[2], a3 = loc + this.adj[3];
    if (b[a0] === BLACK || b[a0] === WHITE) gl[gh[a0]] -= 1;
    if (b[a1] === BLACK || b[a1] === WHITE) { if (gh[a1] !== gh[a0]) gl[gh[a1]] -= 1; }
    if (b[a2] === BLACK || b[a2] === WHITE) { if (gh[a2] !== gh[a0] && gh[a2] !== gh[a1]) gl[gh[a2]] -= 1; }
    if (b[a3] === BLACK || b[a3] === WHITE) {
      if (gh[a3] !== gh[a0] && gh[a3] !== gh[a1] && gh[a3] !== gh[a2]) gl[gh[a3]] -= 1;
    }

    if (b[a0] === pla) this.mergeUnsafe(loc, a0);
    if (b[a1] === pla) this.mergeUnsafe(loc, a1);
    if (b[a2] === pla) this.mergeUnsafe(loc, a2);
    if (b[a3] === pla) this.mergeUnsafe(loc, a3);

    let oppCaptured = 0;
    let capLoc = 0;
    for (const a of [a0, a1, a2, a3]) {
      if (b[a] === opp && gl[gh[a]] === 0) {
        oppCaptured += this.groupStoneCount[gh[a]];
        capLoc = a;
        this.removeUnsafe(a);
      }
    }
    if (gl[gh[loc]] === 0) this.removeUnsafe(loc);

    if (oppCaptured === 1 && this.groupStoneCount[gh[loc]] === 1 && gl[gh[loc]] === 1) this.simpleKoPoint = capLoc;
    else this.simpleKoPoint = null;
  }

  changeSurroundingLiberties(loc, pla, delta) {
    const b = this.board, gh = this.groupHead, gl = this.groupLibertyCount;
    const a0 = loc + this.adj[0], a1 = loc + this.adj[1], a2 = loc + this.adj[2], a3 = loc + this.adj[3];
    if (b[a0] === pla) gl[gh[a0]] += delta;
    if (b[a1] === pla) { if (gh[a1] !== gh[a0]) gl[gh[a1]] += delta; }
    if (b[a2] === pla) { if (gh[a2] !== gh[a0] && gh[a2] !== gh[a1]) gl[gh[a2]] += delta; }
    if (b[a3] === pla) { if (gh[a3] !== gh[a0] && gh[a3] !== gh[a1] && gh[a3] !== gh[a2]) gl[gh[a3]] += delta; }
  }

  countImmediateLiberties(loc) {
    let n = 0;
    for (let i = 0; i < 4; i++) if (this.board[loc + this.adj[i]] === EMPTY) n++;
    return n;
  }

  isGroupAdjacent(head, loc) {
    const gh = this.groupHead;
    return gh[loc + this.adj[0]] === head || gh[loc + this.adj[1]] === head ||
      gh[loc + this.adj[2]] === head || gh[loc + this.adj[3]] === head;
  }

  mergeUnsafe(loc0, loc1) {
    const gh = this.groupHead, gs = this.groupStoneCount, gl = this.groupLibertyCount;
    let parent, child;
    if (gs[gh[loc0]] >= gs[gh[loc1]]) { parent = loc0; child = loc1; } else { child = loc0; parent = loc1; }
    const phead = gh[parent], chead = gh[child];
    if (phead === chead) return;

    const newStoneCount = gs[phead] + gs[chead];
    let newLibs = gl[phead];
    let loc = child;
    do {
      for (let i = 0; i < 4; i++) {
        const a = loc + this.adj[i];
        if (this.board[a] === EMPTY && !this.isGroupAdjacent(phead, a)) newLibs++;
      }
      gh[loc] = phead;
      loc = this.groupNext[loc];
    } while (loc !== child);

    gs[chead] = 0;
    gl[chead] = 0;
    gs[phead] = newStoneCount;
    gl[phead] = newLibs;

    const plast = this.groupPrev[phead], clast = this.groupPrev[chead];
    this.groupNext[clast] = phead;
    this.groupNext[plast] = chead;
    this.groupPrev[chead] = plast;
    this.groupPrev[phead] = clast;
  }

  removeUnsafe(group) {
    const b = this.board, gh = this.groupHead, gl = this.groupLibertyCount;
    const head = gh[group];
    const pla = b[group];
    const opp = getOpp(pla);
    let loc = group;
    do {
      const a0 = loc + this.adj[0], a1 = loc + this.adj[1], a2 = loc + this.adj[2], a3 = loc + this.adj[3];
      if (b[a0] === opp) gl[gh[a0]] += 1;
      if (b[a1] === opp) { if (gh[a1] !== gh[a0]) gl[gh[a1]] += 1; }
      if (b[a2] === opp) { if (gh[a2] !== gh[a0] && gh[a2] !== gh[a1]) gl[gh[a2]] += 1; }
      if (b[a3] === opp) { if (gh[a3] !== gh[a0] && gh[a3] !== gh[a1] && gh[a3] !== gh[a2]) gl[gh[a3]] += 1; }
      const next = this.groupNext[loc];
      b[loc] = EMPTY;
      gh[loc] = 0;
      this.groupNext[loc] = 0;
      this.groupPrev[loc] = 0;
      loc = next;
    } while (loc !== group);
    this.groupStoneCount[head] = 0;
    gl[head] = 0;
  }

  /* ----- ladder helpers ----- */

  findLiberties(loc, buf) {
    let cur = loc;
    do {
      for (let i = 0; i < 4; i++) {
        const lib = cur + this.adj[i];
        if (this.board[lib] === EMPTY && !buf.includes(lib)) buf.push(lib);
      }
      cur = this.groupNext[cur];
    } while (cur !== loc);
  }

  findLibertyGainingCaptures(loc, buf) {
    const opp = getOpp(this.board[loc]);
    const checked = [];
    let cur = loc;
    do {
      for (let i = 0; i < 4; i++) {
        const a = cur + this.adj[i];
        if (this.board[a] === opp) {
          const head = this.groupHead[a];
          if (this.groupLibertyCount[head] === 1 && !checked.includes(head)) {
            this.findLiberties(a, buf);
            checked.push(head);
          }
        }
      }
      cur = this.groupNext[cur];
    } while (cur !== loc);
  }

  hasLibertyGainingCaptures(loc) {
    const opp = getOpp(this.board[loc]);
    let cur = loc;
    do {
      for (let i = 0; i < 4; i++) {
        const a = cur + this.adj[i];
        if (this.board[a] === opp && this.groupLibertyCount[this.groupHead[a]] === 1) return true;
      }
      cur = this.groupNext[cur];
    } while (cur !== loc);
    return false;
  }

  wouldBeKoCapture(loc, pla) {
    if (this.board[loc] !== EMPTY) return false;
    const opp = getOpp(pla);
    let capturable = null;
    for (let i = 0; i < 4; i++) {
      const a = loc + this.adj[i];
      if (this.board[a] !== WALL && this.board[a] !== opp) return false;
      if (this.board[a] === opp && this.groupLibertyCount[this.groupHead[a]] === 1) {
        if (capturable !== null) return false;
        capturable = a;
      }
    }
    if (capturable === null) return false;
    return this.groupStoneCount[this.groupHead[capturable]] === 1;
  }

  countHeuristicConnectionLiberties(loc, pla) {
    let n = 0;
    for (let i = 0; i < 4; i++) {
      const a = loc + this.adj[i];
      if (this.board[a] === pla) n += Math.max(0, this.groupLibertyCount[this.groupHead[a]] - 1.5);
    }
    return n;
  }

  /** For a two-liberty group: which attacker moves start a working ladder. */
  searchIsLadderCapturedAttackerFirst2Libs(loc) {
    if (!this.isOnBoard(loc)) return [];
    const v = this.board[loc];
    if (v !== BLACK && v !== WHITE) return [];
    if (this.groupLibertyCount[this.groupHead[loc]] !== 2) return [];
    const opp = getOpp(v);
    const moves = [];
    this.findLiberties(loc, moves);
    const working = [];
    for (const m of moves) {
      if (!this.wouldBeLegal(opp, m)) continue;
      const rec = this.playRecordedUnsafe(opp, m);
      const works = this.searchIsLadderCaptured(loc, true);
      this.undo(rec);
      if (works) working.push(m);
    }
    return working;
  }

  /** Is the group at loc captured in a ladder? Iterative alpha-beta over atari
   *  sequences, exactly as in KataGo: attacker moves on liberties, defender moves on
   *  liberties and liberty-gaining captures; kos count as escapes for the defender. */
  searchIsLadderCaptured(loc, defenderFirst) {
    if (!this.isOnBoard(loc)) return false;
    const v = this.board[loc];
    if (v !== BLACK && v !== WHITE) return false;
    const libs0 = this.groupLibertyCount[this.groupHead[loc]];
    if (libs0 > 2 || (defenderFirst && libs0 > 1)) return false;

    const pla = v;
    const opp = getOpp(pla);
    const arrSize = this.xSize * this.ySize * 2;
    const moveLists = new Array(arrSize);
    const moveListCur = new Int32Array(arrSize);
    const records = new Array(arrSize);
    let stackIdx = 0;
    moveLists[0] = [];
    moveListCur[0] = -1;
    let returnValue = false;
    let returnedFromDeeper = false;

    const savedKo = this.simpleKoPoint;
    if (defenderFirst) this.simpleKoPoint = null;

    for (;;) {
      if (stackIdx <= -1) {
        this.simpleKoPoint = savedKo;
        return returnValue;
      }
      const isDefender = (defenderFirst && stackIdx % 2 === 0) || (!defenderFirst && stackIdx % 2 === 1);

      if (moveListCur[stackIdx] === -1) {
        const libs = this.groupLibertyCount[this.groupHead[loc]];
        if (!isDefender && libs <= 1) { returnValue = true; returnedFromDeeper = true; stackIdx--; continue; }
        if (!isDefender && libs >= 3) { returnValue = false; returnedFromDeeper = true; stackIdx--; continue; }
        if (isDefender && libs >= 2) { returnValue = false; returnedFromDeeper = true; stackIdx--; continue; }
        if (isDefender && this.simpleKoPoint !== null) {
          returnValue = false; returnedFromDeeper = true; stackIdx--; continue;
        }

        if (isDefender) {
          moveLists[stackIdx] = [];
          this.findLibertyGainingCaptures(loc, moveLists[stackIdx]);
          this.findLiberties(loc, moveLists[stackIdx]);
        } else {
          moveLists[stackIdx] = [];
          this.findLiberties(loc, moveLists[stackIdx]);
          const move0 = moveLists[stackIdx][0], move1 = moveLists[stackIdx][1];
          let l0 = this.countImmediateLiberties(move0);
          let l1 = this.countImmediateLiberties(move1);

          if (l0 === 0 && l1 === 0 && this.wouldBeKoCapture(move0, opp) && this.wouldBeKoCapture(move1, opp)) {
            if (this.getLibertiesAfterPlay(pla, move0, 3) <= 2 && this.getLibertiesAfterPlay(pla, move1, 3) <= 2) {
              if (this.hasLibertyGainingCaptures(loc)) {
                returnValue = true; returnedFromDeeper = true; stackIdx--; continue;
              }
            }
          }

          if (!this.isAdjacent(move0, move1)) {
            if (l0 >= 3 && l1 >= 3) { returnValue = false; returnedFromDeeper = true; stackIdx--; continue; }
            else if (l0 >= 3) moveLists[stackIdx] = [move0];
            else if (l1 >= 3) moveLists[stackIdx] = [move1];
          }

          if (moveLists[stackIdx].length > 1) {
            l0 += this.countHeuristicConnectionLiberties(move0, pla);
            l1 += this.countHeuristicConnectionLiberties(move1, pla);
            if (l1 > l0) { moveLists[stackIdx][0] = move1; moveLists[stackIdx][1] = move0; }
          }
        }
        moveListCur[stackIdx] = 0;
      } else {
        if (returnedFromDeeper) this.undo(records[stackIdx]);
        if (isDefender && !returnValue) { returnedFromDeeper = true; stackIdx--; continue; }
        if (!isDefender && returnValue) { returnedFromDeeper = true; stackIdx--; continue; }
        moveListCur[stackIdx] += 1;
      }

      if (moveListCur[stackIdx] >= moveLists[stackIdx].length) {
        returnValue = isDefender;
        returnedFromDeeper = true;
        stackIdx--;
        continue;
      }

      const move = moveLists[stackIdx][moveListCur[stackIdx]];
      const p = isDefender ? pla : opp;
      if (!this.wouldBeLegal(p, move)) {
        returnValue = isDefender;
        returnedFromDeeper = false;
        continue;
      }
      records[stackIdx] = this.playRecordedUnsafe(p, move);
      stackIdx++;
      moveListCur[stackIdx] = -1;
      moveLists[stackIdx] = [];
    }
  }

  /* ----- pass-alive area (Benson) ----- */

  /** Fill `result` (Int8Array of arrSize) with the area owner per KataGo's
   *  calculateArea under area scoring with no group tax. */
  calculateArea(result, nonPassAliveStones, safeBigTerritories, unsafeBigTerritories, multiStoneSuicideLegal) {
    result.fill(EMPTY);
    this.calculateAreaForPla(BLACK, safeBigTerritories, unsafeBigTerritories, multiStoneSuicideLegal, result);
    this.calculateAreaForPla(WHITE, safeBigTerritories, unsafeBigTerritories, multiStoneSuicideLegal, result);
    if (nonPassAliveStones) {
      for (let y = 0; y < this.ySize; y++) for (let x = 0; x < this.xSize; x++) {
        const loc = this.loc(x, y);
        if (result[loc] === EMPTY) result[loc] = this.board[loc];
      }
    }
  }

  calculateAreaForPla(pla, safeBigTerritories, unsafeBigTerritories, multiStoneSuicideLegal, result) {
    const opp = getOpp(pla);
    const b = this.board;
    const regionHeadByLoc = new Int16Array(this.arrSize).fill(PASS_LOC);
    const nextEmptyOrOpp = new Int16Array(this.arrSize).fill(PASS_LOC);
    const bordersNonPassAlivePlaByHead = new Uint8Array(this.arrSize);

    const maxRegions = Math.floor((this.xSize * this.ySize + 1) / 2) + 1;
    const vitalLists = new Int16Array(maxRegions * 4).fill(-1);
    let vitalTotal = 0;
    let numRegions = 0;
    const regionHeads = new Int16Array(maxRegions).fill(-1);
    const vitalStart = new Int32Array(maxRegions).fill(-1);
    const vitalLen = new Int32Array(maxRegions).fill(-1);
    const numInternalSpacesMax2 = new Int32Array(maxRegions).fill(-1);
    const containsOpp = new Uint8Array(maxRegions);

    const isAdjacentToPlaHead = (loc, plaHead) => {
      for (let i = 0; i < 4; i++) {
        const a = loc + this.adj[i];
        if (b[a] === pla && this.groupHead[a] === plaHead) return true;
      }
      return false;
    };

    const buildRegion = (head, tailTarget, loc, regionIdx) => {
      if (regionHeadByLoc[loc] !== PASS_LOC) return tailTarget;
      regionHeadByLoc[loc] = head;

      if (multiStoneSuicideLegal || b[loc] === EMPTY) {
        const vStart = vitalStart[regionIdx];
        const oldLen = vitalLen[regionIdx];
        let newLen = 0;
        for (let i = 0; i < oldLen; i++) {
          if (isAdjacentToPlaHead(loc, vitalLists[vStart + i])) {
            vitalLists[vStart + newLen] = vitalLists[vStart + i];
            newLen++;
          }
        }
        vitalLen[regionIdx] = newLen;
      }

      if (numInternalSpacesMax2[regionIdx] < 2) {
        let internal = true;
        for (let i = 0; i < 4; i++) if (b[loc + this.adj[i]] === pla) { internal = false; break; }
        if (internal) numInternalSpacesMax2[regionIdx]++;
      }
      if (b[loc] === opp) containsOpp[regionIdx] = 1;

      nextEmptyOrOpp[loc] = tailTarget;
      let nextTail = loc;
      for (let i = 0; i < 4; i++) {
        const a = loc + this.adj[i];
        if (b[a] === EMPTY || b[a] === opp) nextTail = buildRegion(head, nextTail, a, regionIdx);
      }
      return nextTail;
    };

    let atLeastOnePla = false;
    for (let y = 0; y < this.ySize; y++) for (let x = 0; x < this.xSize; x++) {
      const loc = this.loc(x, y);
      if (regionHeadByLoc[loc] !== PASS_LOC) continue;
      if (b[loc] !== EMPTY) { atLeastOnePla = atLeastOnePla || b[loc] === pla; continue; }

      const regionIdx = numRegions++;
      const head = loc;
      regionHeads[regionIdx] = head;
      vitalStart[regionIdx] = vitalTotal;
      vitalLen[regionIdx] = 0;
      numInternalSpacesMax2[regionIdx] = 0;
      containsOpp[regionIdx] = 0;

      const vStart = vitalStart[regionIdx];
      let initialLen = 0;
      for (let i = 0; i < 4; i++) {
        const a = loc + this.adj[i];
        if (b[a] !== pla) continue;
        const plaHead = this.groupHead[a];
        let present = false;
        for (let j = 0; j < initialLen; j++) if (vitalLists[vStart + j] === plaHead) { present = true; break; }
        if (!present) vitalLists[vStart + initialLen++] = plaHead;
      }
      vitalLen[regionIdx] = initialLen;

      const tail = buildRegion(head, head, loc, regionIdx);
      nextEmptyOrOpp[head] = tail;
      vitalTotal += vitalLen[regionIdx];
    }

    const headSet = new Set();
    for (let y = 0; y < this.ySize; y++) for (let x = 0; x < this.xSize; x++) {
      const loc = this.loc(x, y);
      if (b[loc] === pla) headSet.add(this.groupHead[loc]);
    }
    const allPlaHeads = [...headSet];
    const numPlaHeads = allPlaHeads.length;
    const killed = new Uint8Array(numPlaHeads);
    const vitalCountByPlaHead = new Int32Array(this.arrSize);

    for (;;) {
      for (let i = 0; i < numPlaHeads; i++) vitalCountByPlaHead[allPlaHeads[i]] = 0;
      for (let i = 0; i < numRegions; i++) {
        const head = regionHeads[i];
        if (bordersNonPassAlivePlaByHead[head]) continue;
        const vStart = vitalStart[i], vLen = vitalLen[i];
        for (let j = 0; j < vLen; j++) vitalCountByPlaHead[vitalLists[vStart + j]]++;
      }
      let killedAnything = false;
      for (let i = 0; i < numPlaHeads; i++) {
        if (killed[i]) continue;
        const plaHead = allPlaHeads[i];
        if (vitalCountByPlaHead[plaHead] < 2) {
          killed[i] = 1;
          killedAnything = true;
          let cur = plaHead;
          do {
            for (let j = 0; j < 4; j++) {
              const a = cur + this.adj[j];
              if (b[a] === EMPTY || b[a] === opp) bordersNonPassAlivePlaByHead[regionHeadByLoc[a]] = 1;
            }
            cur = this.groupNext[cur];
          } while (cur !== plaHead);
        }
      }
      if (!killedAnything) break;
    }

    for (let i = 0; i < numPlaHeads; i++) {
      if (killed[i]) continue;
      const plaHead = allPlaHeads[i];
      let cur = plaHead;
      do { result[cur] = pla; cur = this.groupNext[cur]; } while (cur !== plaHead);
    }

    for (let i = 0; i < numRegions; i++) {
      const head = regionHeads[i];
      let mark = numInternalSpacesMax2[i] <= 1 && atLeastOnePla && !bordersNonPassAlivePlaByHead[head];
      mark = mark || (safeBigTerritories && atLeastOnePla && !containsOpp[i] && !bordersNonPassAlivePlaByHead[head]);
      mark = mark || (unsafeBigTerritories && atLeastOnePla && !containsOpp[i]);
      if (!mark) continue;
      let cur = head;
      do { result[cur] = pla; cur = nextEmptyOrOpp[cur]; } while (cur !== head);
    }
  }
}

/** Call f(loc, workingMoves) for every stone that is in an inescapable atari or in a
 *  group the attacker can put into one (KataGo's iterLadders). `workingMoves` is the
 *  list of attacker moves that start the ladder for two-liberty groups, else empty. */
export function iterLadders(board, f) {
  const solved = new Map();
  const copy = board.copy();
  for (let y = 0; y < board.ySize; y++) for (let x = 0; x < board.xSize; x++) {
    const loc = board.loc(x, y);
    const stone = board.board[loc];
    if (stone !== BLACK && stone !== WHITE) continue;
    const libs = board.numLiberties(loc);
    if (libs !== 1 && libs !== 2) continue;
    const head = board.groupHead[loc];
    if (solved.has(head)) {
      if (solved.get(head)) f(loc, []);
      continue;
    }
    let working = [];
    let laddered;
    if (libs === 1) laddered = copy.searchIsLadderCaptured(loc, true);
    else { working = copy.searchIsLadderCapturedAttackerFirst2Libs(loc); laddered = working.length > 0; }
    solved.set(head, laddered);
    if (laddered) f(loc, working);
  }
}
