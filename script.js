/* MIT Copyright (c) 2026 [Marco4413](https://github.com/Marco4413/WordGame) */

/** @enum {number} */
const CharState = Object.freeze({
    Correct:    0,
    WrongPlace: 1,
    NotFound:   2,
});

class Keyboard {
    #$domElement;
    /** @type {Record<string, HTMLElement>} */
    #charMap;
    /** @type {Record<string, HTMLElement>} */
    #keyMap;
    #onKeyPress;

    /** @param {"QWERTY"|"AZERTY"} layoutStr */
    constructor(layoutStr="QWERTY") {
        this.#createStandardKeyboard(layoutStr);
    }

    /** @param {"QWERTY"|"AZERTY"} layoutStr */
    #createStandardKeyboard(layoutStr) {
        const LAYOUTS = Object.freeze({
            "QWERTY": [
                "QWERTYUIOP",
                "ASDFGHJKL",
                "ZXCVBNM",
            ],
            "AZERTY": [
                "AZERTYUIOP",
                "QSDFGHJKLM",
                "WXCVBN",
            ],
        });
        this.#createKeyboard(LAYOUTS[layoutStr] ?? LAYOUTS["QWERTY"]);
    }

    /** @param {string[]} layout */
    #createKeyboard(layout) {
        const onKeyPress = (key) => {
            if (this.#onKeyPress != null) {
                this.#onKeyPress(key);
            }
        };

        const charMap = {};
        const $keyboard = document.createElement("div");
        $keyboard.classList.add("keyboard");
        for (const keyRow of layout) {
            const $keyRow = document.createElement("div");
            $keyRow.classList.add("keyboard-row");
            for (const char of keyRow) {
                const $char = document.createElement("div");
                $char.classList.add("keyboard-char");
                $char.innerText = char;
                charMap[char] = $char;
                $keyRow.appendChild($char);

                $char.addEventListener("click", () => {
                    onKeyPress(char);
                });
            }
            $keyboard.appendChild($keyRow);
        }

        const keyMap = {};
        const $enter = document.createElement("div");
        const enterIndex = Math.min($keyboard.children.length, 1);
        $enter.classList.add("keyboard-key");
        $enter.innerText = "Enter";
        keyMap["Enter"] = $enter;
        $keyboard.children.item(enterIndex)
                .appendChild($enter);

        const $backspace = document.createElement("div");
        const backspaceIndex = Math.min($keyboard.children.length, 0);
        $backspace.classList.add("keyboard-key");
        $backspace.innerText = "<-";
        keyMap["Backspace"] = $backspace;
        $keyboard.children.item(backspaceIndex)
                .appendChild($backspace);

        $enter.addEventListener("click", () => {
            onKeyPress("Enter");
        });
        $backspace.addEventListener("click", () => {
            onKeyPress("Backspace");
        });

        this.#$domElement = $keyboard;
        this.#charMap = charMap;
        this.#keyMap = keyMap;
    }

    /**
     * @param {(key: string) => void} listener
     */
    setKeyPressListener(listener) {
        this.#onKeyPress = listener;
    }

    /**
     * Sets `key` to down for animation
     * @param {string} key
     */
    setKeyDown(key) {
        const $key = this.#charMap[key.toUpperCase()] ?? this.#keyMap[key];
        if ($key == null) return;
        $key.classList.add("keyboard-key-down");
    }

    /**
     * Sets `key` to up for animation
     * @param {string} key
     */
    setKeyUp(key) {
        const $key = this.#charMap[key.toUpperCase()] ?? this.#keyMap[key];
        if ($key == null) return;
        $key.classList.remove("keyboard-key-down");
    }

    /** @param {Record<string, CharState>} charStateMap */
    setCharStates(charStateMap) {
        for (const [ char, $key ] of Object.entries(this.#charMap)) {
            const charState = charStateMap[char];

            $key.classList.remove("char-correct");
            $key.classList.remove("char-wrong-place");
            $key.classList.remove("char-not-found");
            if (charState == null) continue;

            switch (charState) {
            case CharState.Correct:
                $key.classList.add("char-correct");
                break;
            case CharState.WrongPlace:
                $key.classList.add("char-wrong-place");
                break;
            case CharState.NotFound:
                $key.classList.add("char-not-found");
                break;
            default:
                throw new Error("unreachable");
            }
        }
    }

    clearCharStates() {
        for (const $key of Object.values(this.#charMap)) {
            $key.classList.remove("char-correct");
            $key.classList.remove("char-wrong-place");
            $key.classList.remove("char-not-found");
        }
    }

    get $domElement() { return this.#$domElement; }
}

class BoardRow {
    #word;
    #currentCharIndex;
    /** @type {HTMLElement} */
    #$domElement;

    /**
     * @param {string} word
     */
    constructor(word) {
        this.#word = word;
        this.#currentCharIndex = 0;

        const $row = document.createElement("div");
        $row.classList.add("board-row");
        for (let i = 0; i < this.#word.length; ++i) {
            const $item = document.createElement("div");
            $item.classList.add("board-item");
            $row.appendChild($item);
        }
        this.#$domElement = $row;
    }

    handleBackspace() {
        if (this.#currentCharIndex <= 0) return;
        --this.#currentCharIndex;
        const $char = this.#$domElement.children.item(this.#currentCharIndex);
        $char.innerText = "";
    }

    handleCharInput(char) {
        if (this.#currentCharIndex >= this.#word.length) return;
        const $char = this.#$domElement.children.item(this.#currentCharIndex);
        $char.innerText = char;
        ++this.#currentCharIndex;
    }

    getContent() {
        let content = "";
        for (const $el of this.#$domElement.children) {
            content += $el.innerText;
        }
        return content;
    }

    /** @returns {CharState[]} */
    getContentCharStates() {
        const content = this.getContent();
        if (content.length != this.#word.length) throw new Error("str.length != word.length");

        const charStates = new Array(content.length).fill(CharState.NotFound);
        const wordChars = this.#word.split("");

        for (let i = 0; i < content.length; ++i) {
            if (content[i] === wordChars[i]) {
                wordChars[i] = "";
                charStates[i] = CharState.Correct;
            }
        }

        for (let i = 0; i < content.length; ++i) {
            const wordCharIndex = wordChars.findIndex(char => (char === content[i]));
            if (wordCharIndex >= 0) {
                wordChars[wordCharIndex] = "";
                if (charStates[i] === CharState.NotFound) {
                    charStates[i] = CharState.WrongPlace;
                }
            }
        }

        return charStates;
    }

    verifyContent() {
        let correct = true;
        const charStates = this.getContentCharStates();
        for (let i = 0; i < charStates.length; ++i) {
            const $char = this.#$domElement.children.item(i);
            switch (charStates[i]) {
            case CharState.Correct:
                $char.classList.add("char-correct");
                break;
            case CharState.WrongPlace:
                correct = false;
                $char.classList.add("char-wrong-place");
                break;
            case CharState.NotFound:
                correct = false;
                $char.classList.add("char-not-found");
                break;
            default:
                throw new Error("unreachable");
            }
        }
        return correct;
    }

    getShareableString() {
        // 🟩 🟧 ⬛
        return this.getContentCharStates().map(charState => {
            switch (charState) {
            case CharState.Correct:    return "🟩";
            case CharState.WrongPlace: return "🟧";
            case CharState.NotFound:   return "⬛";
            default:
                throw new Error("unreachable");
            }
        }).join("");
    }

    get word() { return this.#word; }
    get $domElement() { return this.#$domElement; }

    get isFilled() { return this.#currentCharIndex >= this.#word.length; }
}

class Board {
    /** @type {string} */
    #word;
    /** @type {number} */
    #activeRowIndex;
    /** @type {boolean} */
    #isGameOver;
    /** @type {BoardRow[]} */
    #rows;
    /** @type {HTMLElement} */
    #$domElement;

    /** @type {Keyboard?} */
    #keyboard;

    /**
     * @param {string} word
     * @param {number} [attempts]
     * @param {Keyboard} [keyboard]
     */
    constructor(word, attempts, keyboard) {
        const $board = document.createElement("div");
        $board.classList.add("board");
        this.#$domElement = $board;
        this.setWord(word, attempts);
        this.#keyboard = keyboard ?? null;
    }

    /**
     * @param {string} word
     * @param {number} [attempts]
     */
    setWord(word, attempts) {
        attempts ??= word.length + 1;

        this.#word = word.toUpperCase();
        this.#activeRowIndex = 0;
        this.#isGameOver = false;
        this.#rows = [];

        const $board = this.#$domElement;
        $board.innerHTML = "";
        for (let i = 0; i < attempts; ++i) {
            const row = new BoardRow(this.#word);
            this.#rows.push(row);
            $board.appendChild(row.$domElement);
        }

        if (this.#keyboard != null) {
            this.#keyboard.clearCharStates();
        }
    }

    getShareableString() {
        return this.#rows
                .slice(0, this.#activeRowIndex)
                .map(row => row.getShareableString())
                .join("\n");
    }

    getCharStates() {
        const charStates = {};
        for (let i = 0; i < this.#activeRowIndex; ++i) {
            const row = this.#rows[i];
            const content = row.getContent();
            const contentCharStates = row.getContentCharStates();
            for (let j = 0; j < content.length; ++j) {
                charStates[content[j]] = Math.min(
                        charStates[content[j]] ?? contentCharStates[j],
                        contentCharStates[j]);
            }
        }
        return charStates;
    }

    /** @param {string} key */
    handleKeyPress(key) {
        if (this.#isGameOver) return;
        const activeRow = this.#rows[this.#activeRowIndex];
        switch (key) {
        case "Enter":
            if (activeRow.isFilled) {
                ++this.#activeRowIndex;
                const isCorrect = activeRow.verifyContent();
                if (isCorrect || this.#activeRowIndex >= this.#rows.length) {
                    this.#isGameOver = true;
                }

                if (this.#keyboard != null) {
                    this.#keyboard.setCharStates(this.getCharStates());
                }
            }
            break;
        case "Backspace":
            activeRow.handleBackspace();
            break;
        default:
            if (key.match(/^[a-z]$/gi) != null) {
                activeRow.handleCharInput(key.toUpperCase());
            }
        }
    }

    /** @param {string} key */
    handleKeyDown(key) {
        if (this.#isGameOver) return;
        const activeRow = this.#rows[this.#activeRowIndex];
        switch (key) {
        case "Backspace":
            activeRow.handleBackspace();
            break;
        }
    }

    get word() { return this.#word; }
    get attempts() { return this.#rows.length; }
    get $domElement() { return this.#$domElement; }

    get isGameOver() { return this.#isGameOver; }
}

window.addEventListener("load", () => {
    // https://www.fiveforks.com/wordle/block/
    fetch("./words.txt").then(resp => resp.text()).then(words => {
        const wordsList = words.split(/\s+/g);
        const initWord  = wordsList[Math.floor(Math.random() * wordsList.length)];

        const keyboard = new Keyboard();

        const board = new Board(initWord, undefined, keyboard);
        window.__board = board;
        window.addEventListener("keypress", ev => board.handleKeyPress(ev.key));
        window.addEventListener("keyup", ev => {
            keyboard.setKeyUp(ev.key);
        });
        window.addEventListener("keydown", ev => {
            keyboard.setKeyDown(ev.key);
            if (ev.key === "Delete") {
                const word = wordsList[Math.floor(Math.random() * wordsList.length)];
                board.setWord(word);
            } else {
                board.handleKeyDown(ev.key);
            }
        });

        keyboard.setKeyPressListener(key => board.handleKeyPress(key));

        const $board = document.getElementById("board");
        $board.replaceWith(board.$domElement);
    
        const $keyboard = document.getElementById("keyboard");
        $keyboard.replaceWith(keyboard.$domElement);

        const $share = document.getElementById("share");
        $share.addEventListener("click", () => {
            navigator.clipboard.writeText(board.getShareableString());
        });

        const $newWord = document.getElementById("new-word");
        $newWord.addEventListener("click", () => {
            const word = wordsList[Math.floor(Math.random() * wordsList.length)];
            board.setWord(word);
        });
    })
});
