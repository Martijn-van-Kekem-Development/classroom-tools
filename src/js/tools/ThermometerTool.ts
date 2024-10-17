let startRange = -100;
let endRange = 100;
let stepSize = 10;

function init() {
    startRange = Number(prompt("Laagste temperatuur", "-50") ?? -50);
    endRange = Number(prompt("Hoogste temperatuur", "50") ?? 50);
    stepSize = Number(prompt("Stapgrootte", "10") ?? 10);
    let container = document.getElementById("list_steps");
    for (let i = endRange; i >= startRange; i -= stepSize) {
        let el = document.createElement("li");
        el.textContent = `${i}`;
        container.append(el);
    }
}

function getValue() {
    return Number(document.getElementById("label_value").textContent ?? "0");
}

function setValue(value: any) {
    value = Number(value);
    value = Math.min(endRange, Math.max(startRange, value));
    let progress = mapVal(value, startRange, endRange, 0, 100);

    document.getElementById("progress_value").style.setProperty("--bar-height", `${progress}%`);
    document.getElementById("label_value").textContent = `${value}`;
    document.getElementById("container_thermometer").classList.toggle("positive", value > 0);
    document.getElementById("container_thermometer").classList.toggle("negative", value <= 0);
}

window.onload = function() {
    init();
    for (let button of document.querySelectorAll("button[data-action]")) {
        button.addEventListener("click", () => {
            let value = Number(button.getAttribute("data-action"));
            setValue(getValue() + value);
        });
    }
}

function mapVal(val: number, inMin: number, inMax: number, outMin: number, outMax: number) {
    return (val - inMin) / (inMax - inMin) * (outMax - outMin) + outMin;
}