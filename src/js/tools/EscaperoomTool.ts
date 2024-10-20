let wordToGuess = "";
let activeInput = null;

window.onload = () => {
    wordToGuess = prompt("Welk woord moeten ze raden?").toLowerCase();
    for (let el of document.querySelectorAll(".letter")) {
        el.addEventListener("click", e => onKeyboardClick(e));
    }

    document.querySelector(".letter-container .button").addEventListener("click",
        () => onSubmit());

    loadWord();
}

function loadWord() {
    let container = document.querySelector(".letter-container .letters");

    for (let i = 0; i < wordToGuess.length; i++) {
        let insertEl = createLetterElement();
        insertEl.setAttribute("data-num", `${i+1}`);
        if (i === 0) {
            insertEl.classList.add("focus");
            activeInput = insertEl;
        }
        container.appendChild(insertEl);
    }
}

function onSubmit() {
    let lettersCorrect = 0;
    let letterEls = document.querySelectorAll(".letter-container .letters div");
    for (let i = 0; i < letterEls.length; i++) {
        if (letterEls[i].innerHTML === wordToGuess[i]) {
            // Letter correct
            letterEls[i].classList.add("status-correct");
            letterEls[i].classList.remove("status-incorrect");
            lettersCorrect++;
        } else {
            letterEls[i].classList.remove("status-correct");
            letterEls[i].classList.add("status-incorrect");
        }
    }

    if (lettersCorrect === wordToGuess.length) {
        document.querySelector(".success-container").classList.add("visible");
    }
}

function onKeyboardClick(e: Event) {
    if (!activeInput) {
        for (let input of document.querySelectorAll(".letter-container .letters div")) {
            if (input.innerHTML === "") {
                activeInput = input;
                break;
            }
        }
        if (!activeInput) return;
    }


    activeInput.innerHTML = (e.target as HTMLElement).innerHTML;
    activeInput.classList.remove("focus");
    activeInput.classList.remove("status-incorrect", "status-correct");

    let emptyLetters = document.querySelectorAll(".letter-container .letters div:empty");
    if (emptyLetters.length > 0) {
        activeInput = emptyLetters[0];
        activeInput.classList.add("focus");
    } else {
        activeInput = null;
    }

    checkCompleted();
}

function checkCompleted() {
    if (document.querySelectorAll(".letter-container .letters div:empty").length === 0)
        document.querySelector(".letter-container .button").classList.remove("disabled");
    else
        document.querySelector(".letter-container .button").classList.add("disabled");
}

function onInputClick(e: MouseEvent) {
    if (activeInput)
        activeInput.classList.remove("focus");
    activeInput = e.target;
    activeInput.classList.add("focus");
    activeInput.classList.remove("status-incorrect", "status-correct");
    activeInput.innerHTML = "";

    checkCompleted();
}

function createLetterElement() {
    let el = document.createElement("div");
    el.addEventListener("click", e => onInputClick(e));
    return el;
}