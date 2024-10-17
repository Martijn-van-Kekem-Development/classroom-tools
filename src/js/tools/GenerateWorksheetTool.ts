import {ClassroomTool} from "./ClassroomTool.js";

export class GenerateWorksheetTool extends ClassroomTool {
    /**
     * @override
     */
    protected categoryPicked(categoryIndex: number): void {
        const questions = document.getElementById("exercises");
        const answers = document.getElementById("answers");
        const elaborations = document.getElementById("elaborations");
        let generateAmount = Number((document.getElementById("input_amount") as HTMLInputElement).value);

        questions.innerHTML = "";
        answers.innerHTML = "";

        for (let i = 0; i < generateAmount; i++) {
            // Pick a random exercise from this category
            let exercise = this.parser.generateExercise(categoryIndex);

            // Add question
            let el = document.createElement("li");
            el.innerHTML = exercise.text;
            questions.append(el);

            // Add elaboration
            let elaborationEl = document.createElement("li");
            if (exercise.steps.length > 0) {
                let innerEl = document.createElement("ol");
                let previousStep = null;
                for (let step of [exercise.text, ...exercise.steps]) {
                    if (step === previousStep) continue;

                    let stepEl = document.createElement("li");
                    stepEl.innerHTML = step;
                    previousStep = step;
                    innerEl.append(stepEl);
                }
                elaborationEl.append(innerEl);
            } else {
                elaborationEl.textContent = "Geen uitwerking beschikbaar.";
            }

            elaborations.append(elaborationEl);

            // Add answer
            let answerEl = document.createElement("li");

            if (exercise.answer !== exercise.roundedAnswer) {
                answerEl.innerHTML = `${exercise.answer} $$\\approx$$ ${exercise.roundedAnswer}`;
            } else {
                answerEl.innerHTML = exercise.answer;
            }

            answers.append(answerEl);
        }

        this.updateStep();
    }

    /**
     * @override
     */
    protected initListeners(): void {
        document.getElementById("button_printExercises").addEventListener("click", () => {
            document.body.classList.remove("print-exercises", "print-elaborations", "print-answers", "print");
            document.body.classList.add("print", "print-exercises");
            window.print();
        });

        document.getElementById("button_printAnswers").addEventListener("click", () => {
            document.body.classList.remove("print-exercises", "print-elaborations", "print-answers", "print");
            document.body.classList.add("print", "print-answers");
            window.print();
        });

        document.getElementById("button_printElaborations").addEventListener("click", () => {
            document.body.classList.remove("print-exercises", "print-elaborations", "print-answers", "print");
            document.body.classList.add("print", "print-elaborations");
            window.print();
        });

        window.addEventListener("afterprint", () => {
            document.body.classList.remove("print-exercises", "print-elaborations", "print-answers", "print");
        });
    }
}

(new GenerateWorksheetTool()).load();