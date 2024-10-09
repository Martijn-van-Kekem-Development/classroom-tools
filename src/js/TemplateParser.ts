export class TemplateParser {
    /**
     * The template data.
     * @private
     */
    private readonly data: Template;

    /**
     * Constructor for TemplateParser
     * @param json The JSON of the template to parse.
     */
    constructor(json: Template) {
        this.data = json;
        this.data.rounding = this.data.rounding ?? 2;
    }

    /**
     * Return the template data.
     */
    public getData(): Template {
        return this.data;
    }

    /**
     * Generate an exercise for this template.
     * @param categoryIndex The category index to generate an exercise for.
     * @param exerciseIndex The exercise index, or -1 to pick one at random.
     */
    public generateExercise(categoryIndex: number, exerciseIndex: number = -1) {
        if (categoryIndex >= this.data.categories.length)
            throw new Error("Invalid category index");

        const category = this.data.categories[categoryIndex];

        if (exerciseIndex >= category.exercises.length)
            throw new Error("Invalid exercise index");

        // Pick random exercise if not specified.
        exerciseIndex = (exerciseIndex >= 0) ? exerciseIndex :
            Math.floor(Math.random() * category.exercises.length);

        // Create a copy of this exercise.
        const exercise = JSON.parse(JSON.stringify(category.exercises[exerciseIndex])) as CategoryExercise;
        exercise.steps = exercise.steps ?? [];
        exercise.parameters = exercise.parameters ?? [];
        exercise.roundedAnswer = exercise.roundedAnswer ?? exercise.answer;

        // Replace parameters
        const existingValues = new Map();
        for (let parameter of exercise.parameters) {
            const value = TemplateParser.generateParameterValue(parameter, existingValues);

            // Update all strings with this new value
            exercise.text = exercise.text.replaceAll(`{${parameter.name}}`, value);
            exercise.answer = exercise.answer.replaceAll(`{${parameter.name}}`, value);
            exercise.roundedAnswer = exercise.roundedAnswer.replaceAll(`{${parameter.name}}`, value);
            for (let i = 0; i < exercise.steps.length; i++) {
                exercise.steps[i] = exercise.steps[i].replaceAll(`{${parameter.name}}`, value);
            }

            existingValues.set(parameter.name, value);
        }

        exercise.text = this.replaceCalculations(exercise.text);
        exercise.answer = this.replaceCalculations(exercise.answer);
        exercise.roundedAnswer = this.replaceCalculations(exercise.roundedAnswer, true);
        for (let i = 0; i < exercise.steps.length; i++)
            exercise.steps[i] = this.replaceCalculations(exercise.steps[i]);

        return exercise;
    }

    /**
     * Truncate a number to an amount of decimal places.
     * @param num The number to truncate.
     * @param finished Whether this is the final step of the calculation
     */
    private truncate(num: number, finished: boolean = false): string {
        let parsed = num * 1000;
        if (parsed !== Math.floor(parsed)) {
            if (finished)
                return `${num.toFixed(this.data.rounding)}`;
            else
                return `${Math.floor(parsed) / 1000}...`;
        } else {
            return `${Math.floor(parsed) / 1000}`;
        }
    }

    /**
     * Function to replace the calculations in a template.
     * @param input The input to replace the calculations in.
     * @param finished Whether this is the final calculation step.
     */
    private replaceCalculations(input: string, finished = false): string {
        let inputMatches = input.matchAll(/%%([^%]+)%%/g);
        for (let match of inputMatches) {
            let value = match[0];
            let calc = TemplateParser.sanitize(match[1]);
            let calcValue = this.truncate(Number(eval(calc)), finished);
            input = input.replace(value, calcValue);
        }

        return input;
    }

    /**
     * Function to generate a value for a template parameter.
     * @param parameter
     * @param existingValues
     * @returns {*|null}
     */
    private static generateParameterValue(parameter: ExerciseParameter,
                                          existingValues: Map<string, any>): any {
        let value = null;
        let notAllowed = [...(parameter.not ?? [])];
        for (let [key, val] of existingValues) {
            notAllowed = notAllowed.map(toReplace => ((typeof toReplace !== "string") ? toReplace : toReplace.replaceAll(`{${key}}`, val)));
        }

        if (Object.keys(parameter).includes("int")) {
            // Should be replaced by a random integer
            value = TemplateParser.getRandomInt(parameter.int.min ?? 0, (parameter.int.max ?? 9) + 1);
        } else if (Object.keys(parameter).includes("or")) {
            // Should be replaced by a random array value
            let values = parameter.or ?? [""];
            value = values[Math.floor(Math.random() * values.length)];
        }

        // Return value
        if (notAllowed.includes(value))
            return TemplateParser.generateParameterValue(parameter, existingValues);
        else
            return value;
    }


    /**
     * Get a random integer number.
     * @param min The minimum number (inclusive).
     * @param max The maximum number (exclusive).
     * @return A random integer between min and max.
     */
    private static getRandomInt(min: number, max: number): number {
        min = Math.ceil(min);
        max = Math.floor(max);
        return Math.floor(Math.random() * (max - min) + min);
    }

    /**
     * Sanitize duplicate symbols for mathematical expressions.
     * @param input The input to sanitize.
     */
    private static sanitize(input: string): string {
        return input.replaceAll("++", "+").replaceAll("--", "+");
    }
}


export interface Template {
    name: string,
    rounding: number,
    categories: TemplateCategory[]
}

export interface TemplateCategory {
    name: string,
    exercises: CategoryExercise[]
}

export interface CategoryExercise {
    text: string,
    answer: string,
    roundedAnswer?: string,
    steps?: string[],
    parameters?: ExerciseParameter[]
}

export interface ExerciseParameter {
    name: string,

    // Disallowed values
    not?: any[]

    // Random integer between min and max
    int?: {
        min: number,
        max: number,
    },

    // Random array item
    or?: string[],

}