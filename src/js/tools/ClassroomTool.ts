import {TemplateParser} from "../TemplateParser.js";

export abstract class ClassroomTool {
    /**
     * The template parser
     * @protected
     */
    protected parser: TemplateParser;

    /**
     * The current step.
     * @protected
     */
    protected currentStep: number = 0;

    /**
     * The template JSON save key.
     * @private
     */
    protected readonly TEMPLATE_JSON: string = "template_json";

    /**
     * When a file has been picked.
     * @private
     */
    private onFilePicked() {
        const fileEl = document.getElementById("file") as HTMLInputElement;
        const file = fileEl.files[0] ?? null;
        if (!file) return;

        const reader = new FileReader()
        reader.onload = event => {
            try {
                const jsonString = event.target.result as string;
                this.parser = new TemplateParser(JSON.parse(jsonString));
                localStorage.setItem(this.TEMPLATE_JSON, jsonString);
            } catch (e) {
                this.updateStep(-1);
                return;
            }

            if (!this.parser.getData() || !this.parser.getData().name) {
                this.updateStep(-1);
                return;
            }

            this.updateStep();
        }
        reader.readAsText(file)
    }

    /**
     * Update the active step.
     * @param force
     * @protected
     */
    protected updateStep(force = null) {
        let currentStep = document.querySelector(".step.active[data-step]");
        let newStep = Number(currentStep.getAttribute("data-step")) + 1;

        if (force !== null) {
            newStep = Number(force);
        }

        this.currentStep = newStep;

        currentStep.classList.remove("active");
        document.querySelector(`.step[data-step="${newStep}"]`)?.classList.add("active");
        this.prepareStep(newStep);
    }

    /**
     * Prepare the next step.
     * @param step The step number.
     * @protected
     */
    protected prepareStep(step: number) {
        const data = this.parser.getData();
        if (step === 1) {
            document.getElementById("label_templateName").textContent =
                `Template: ${data.name}`;

            let categoryContainer = document.getElementById("container_categories");
            for (let i = 0; i < data.categories.length; i++) {
                let button = document.createElement("button");
                button.addEventListener("click", () => this.categoryPicked(i));
                button.textContent = data.categories[i].name;
                categoryContainer.append(button);
            }
        } else if (step === 2) {
            ClassroomTool.renderMathInElement(
                document.querySelector(`.step[data-step="${step}"]`));
        }
    }

    /**
     * Render all mathematical expressions in an element.
     * @param element
     */
    static renderMathInElement(element: HTMLElement) {
        renderMathInElement(element, {
            delimiters: [
                {left: '$$', right: '$$', display: false},
            ],
            throwOnError : false
        });
    }

    /**
     * When a category has been picked.
     * @param categoryIndex The picked category index.
     * @protected
     */
    protected abstract categoryPicked(categoryIndex: number): void;

    /**
     * Create event listeners for on-page elements
     * @protected
     */
    protected abstract initListeners(): void;

    /**
     * Load the current tool
     * @protected
     */
    public load() {
        this.initListeners();

        document.getElementById("file").addEventListener("change",
            () => this.onFilePicked())
    }
}

declare let renderMathInElement: ((el: HTMLElement, options: any) => void)