import {ClassroomTool} from "./ClassroomTool.js";
import {CategoryExercise, TemplateParser} from "../TemplateParser.js";

export class BingoTool extends ClassroomTool {
    /**
     * The local storage saved cards string
     * @private
     */
    private readonly SAVED_CARDS: string = "saved_cards";

    /**
     * The local storage saved exercises string.
     * @private
     */
    private readonly SAVED_EXERCISES: string = "saved_exercises";

    /**
     * The local storage drawn exercises string.
     * @private
     */
    private readonly DRAWN_EXERCISES: string = "drawn_exercises";

    /**
     * The local storage drawn exercises string.
     * @private
     */
    private readonly TO_DRAW_EXERCISES: string = "to_draw_exercises";

    /**
     * The local storage current drawn exercise string.
     * @private
     */
    private readonly CURRENT_DRAWN_EXERCISE: string = "current_drawn_exercise";

    /**
     * The available exercises.
     * @protected
     */
    protected exercises: CategoryExercise[] = [];

    /**
     * Exercises that are available to draw for the bingo.
     * @protected
     */
    protected exercisesToDraw: CategoryExercise[] = [];

    /**
     * The currently drawn item.
     * @protected
     */
    protected currentDraw: CategoryExercise = null;

    /**
     * The exercises that have been drawn.
     * @protected
     */
    protected drawHistory: CategoryExercise[] = [];

    /**
     * @override
     */
    protected categoryPicked(categoryIndex: number): void {
        const generateAmount = Number((document.getElementById("input_amount") as HTMLInputElement).value);
        const cardSize = Number((document.getElementById("input_rows") as HTMLInputElement).value);

        const exercises = [];
        const exercisesPerCard = [];
        const cardsToPopulate = [];

        // Add all cards as to-be-populated.
        for (let i = 0; i < generateAmount; i++)
            cardsToPopulate.push(i);

        for (let i = 0; i < (generateAmount + cardSize) * cardSize; i++) {
            const exercise = this.parser.generateExercise(categoryIndex);
            exercises.push(exercise);

            // Add this exercise to several random bingo cards.
            const possibleCards = [...cardsToPopulate];
            addLoop:
            for (let addIndex = 0; addIndex < cardSize; addIndex++) {
                let possibleIndex = Math.floor(Math.random() * possibleCards.length);
                let randomCardIndex = possibleCards[possibleIndex];
                if (typeof randomCardIndex === "undefined") break;

                exercisesPerCard[randomCardIndex] = exercisesPerCard[randomCardIndex] ?? [];

                // Check existing exercises for duplicate answers
                for (let existing of exercisesPerCard[randomCardIndex]) {
                    if (existing.answer !== exercise.answer) continue;

                    // Found duplicate
                    possibleCards.splice(possibleIndex, 1);
                    addIndex--;
                    continue addLoop;
                }

                exercisesPerCard[randomCardIndex].push(exercise);

                possibleCards.splice(possibleIndex, 1);

                // Check if card is full.
                if (exercisesPerCard[randomCardIndex].length === (cardSize * cardSize)) {
                    // Card is full, remove from possible options
                    cardsToPopulate.splice(cardsToPopulate.indexOf(randomCardIndex), 1);
                }
            }
        }

        this.exercises = exercises;
        localStorage.setItem(this.SAVED_CARDS, JSON.stringify(exercisesPerCard));
        localStorage.setItem(this.SAVED_EXERCISES, JSON.stringify(exercises));

        if (this.createCards(exercisesPerCard))
            this.updateStep();
        else {
            this.updateStep(-2);
            this.clearCards(false);
        }
    }

    /**
     * Create the bingo cards.
     * @param exercisesPerCard The exercises per card.
     * @private
     */
    private createCards(exercisesPerCard: Array<Array<CategoryExercise>>) {
        const container = document.getElementById("cards");
        let pageContainer = document.createElement("div");
        container.append(pageContainer);

        for (let i = 0; i < exercisesPerCard.length; i++) {
            const exercises = exercisesPerCard[i];

            // Create card
            const cardEl = this.createCardTable(exercises);
            if (!cardEl) return false;
            pageContainer.append(cardEl);

            if (i > 0 && i % 2 === 1 && i !== exercisesPerCard.length - 1) {
                pageContainer = document.createElement("div");
                container.append(pageContainer);
            }
        }

        BingoTool.renderMathInElement(container);
        return true;
    }

    /**
     * Create a card table.
     * @param exercises The exercises for the card.
     * @private
     */
    private createCardTable(exercises: CategoryExercise[]) {
        const container = document.createElement("table");
        const body = document.createElement("tbody");
        const size = Math.sqrt(exercises.length);

        if (size % 1 !== 0) return false;

        for (let i = 0; i < size; i++) {
            const row = document.createElement("tr");
            for (let j = 0; j < size; j++) {
                const col = document.createElement("td");
                col.setAttribute("data-row", `${i}`);
                col.setAttribute("data-col", `${j}`);
                col.setAttribute("data-value", exercises[i * size + j].answer)

                col.innerHTML = exercises[i * size + j].roundedAnswer;
                row.append(col);
            }
            body.append(row);
        }

        container.append(body);
        container.style.setProperty("--cols", `${size}`);
        container.style.setProperty("--rows", `${size}`);
        return container;
    }

    /**
     * Clear the bingo cards.
     * @protected
     */
    protected clearCards(refresh: boolean = true) {
        localStorage.removeItem(this.SAVED_CARDS);
        localStorage.removeItem(this.SAVED_EXERCISES);
        localStorage.removeItem(this.DRAWN_EXERCISES);
        localStorage.removeItem(this.TO_DRAW_EXERCISES);
        localStorage.removeItem(this.CURRENT_DRAWN_EXERCISE);
        if (refresh) window.location.reload();
    }

    /**
     * Restart playing the bingo.
     * @protected
     */
    protected restartPlaying() {
        localStorage.removeItem(this.DRAWN_EXERCISES);
        localStorage.removeItem(this.TO_DRAW_EXERCISES);
        localStorage.removeItem(this.CURRENT_DRAWN_EXERCISE);
        window.location.reload();
    }

    /**
     * Start playing the bingo.
     * @protected
     */
    protected startPlaying() {
        if (!localStorage.getItem(this.DRAWN_EXERCISES)) {
            this.exercisesToDraw = [...this.exercises];
            this.drawHistory = [];
            this.currentDraw = null;
        }

        this.updateDrawContainer();
        this.updateStep(3);
    }

    /**
     * Color the drawn answers.
     * @protected
     */
    protected colorDrawnAnswers() {
        for (let exercise of [this.currentDraw, ...this.drawHistory]) {
            const answerCells = document.querySelectorAll<HTMLElement>(
                `#cards td[data-value="${CSS.escape(exercise.answer)}"]`);

            for (let item of answerCells) {
                item.classList.add("completed");
            }
        }
    }

    /**
     * Update the previous draw container.
     * @protected
     */
    protected updateDrawContainer() {
        // Update current draw
        const currentDrawLabel = document.getElementById("label_currentDraw");
        currentDrawLabel.innerHTML = this.currentDraw?.text ?? "";

        // Update previous draws
        const container = document.getElementById("list_previousDraws");
        container.innerHTML = "";

        // Draw last 3 history items
        for (let i = 0; i < Math.min(this.drawHistory.length, 3); i++) {
            const item = document.createElement("li");
            item.innerHTML = this.drawHistory[this.drawHistory.length - 1 - i].text;
            container.append(item);
        }

        BingoTool.renderMathInElement(currentDrawLabel);
        BingoTool.renderMathInElement(container);
    }

    /**
     * Draw the next exercise.
     * @protected
     */
    protected nextDraw() {
        if (this.currentDraw)
            this.drawHistory.push(this.currentDraw);

        // Pick random next exercise
        const nextExerciseIndex = Math.floor(Math.random() * this.exercisesToDraw.length);
        this.currentDraw = this.exercisesToDraw.splice(nextExerciseIndex, 1)[0];

        // Set all completed exercises to green
        const answerCells = document.querySelectorAll<HTMLElement>(
            `#cards td[data-value="${CSS.escape(this.currentDraw.answer)}"]`);
        for (let item of answerCells) {
            item.classList.add("completed");
        }

        localStorage.setItem(this.CURRENT_DRAWN_EXERCISE, JSON.stringify(this.currentDraw));
        localStorage.setItem(this.DRAWN_EXERCISES, JSON.stringify(this.drawHistory));
        localStorage.setItem(this.TO_DRAW_EXERCISES, JSON.stringify(this.exercisesToDraw));
        this.updateDrawContainer();
    }

    /**
     * @override
     */
    protected initListeners(): void {
        window.addEventListener("beforeprint", () => {
            document.body.classList.remove("print-cards", "print");
            document.body.classList.add("print", "print-cards");
        });

        document.getElementById("button_printCards").addEventListener("click", () => {
            window.print();
        });

        document.getElementById("button_clearCards").addEventListener("click",
            () => this.clearCards());

        document.getElementById("button_nextDraw").addEventListener("click",
            () => this.nextDraw());

        document.getElementById("button_stopPlaying").addEventListener("click",
            () => this.updateStep(2));

        document.getElementById("button_restartPlaying").addEventListener("click",
            () => this.restartPlaying());

        document.getElementById("button_startBingo").addEventListener("click",
            () => this.startPlaying());

        window.addEventListener("afterprint", () => {
            document.body.classList.remove("print-cards", "print");
        });
    }

    /**
     * @override
     */
    load() {
        super.load();

        if (localStorage.getItem(this.SAVED_CARDS) && localStorage.getItem(this.TEMPLATE_JSON)) {
            // Has existing cards
            const exercisesPerCard = JSON.parse(localStorage.getItem(this.SAVED_CARDS));
            this.exercises = JSON.parse(localStorage.getItem(this.SAVED_EXERCISES));
            this.parser = new TemplateParser(JSON.parse(localStorage.getItem(this.TEMPLATE_JSON)));
            this.createCards(exercisesPerCard);

            if (localStorage.getItem(this.DRAWN_EXERCISES)) {
                this.exercisesToDraw = JSON.parse(localStorage.getItem(this.TO_DRAW_EXERCISES));
                this.drawHistory = JSON.parse(localStorage.getItem(this.DRAWN_EXERCISES));
                this.currentDraw = JSON.parse(localStorage.getItem(this.CURRENT_DRAWN_EXERCISE));
                this.colorDrawnAnswers();
            }

            this.updateStep(2);
        }
    }
}

(new BingoTool()).load();