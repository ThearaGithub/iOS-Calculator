/* iOS-style Calculator — app logic */
(() => {
  "use strict";

  const resultEl = document.getElementById("result");
  const historyEl = document.getElementById("history");
  const clearBtn = document.getElementById("btn-clear");
  const keys = document.querySelectorAll(".key");

  const MAX_DIGITS = 9;

  // --- State (mirrors iOS calculator behaviour) ---
  let displayValue = "0";      // what the user sees
  let firstOperand = null;     // stored operand
  let operator = null;         // pending operator: + - * /
  let waitingForSecond = false; // true right after pressing an operator
  let lastOperand = null;      // for repeated "=" presses
  let lastOperator = null;
  let justEvaluated = false;   // true right after "="

  const OP_SYMBOL = { "+": "+", "-": "−", "*": "×", "/": "÷" };

  // --- Number formatting ---
  function formatNumber(value) {
    if (typeof value === "string") return value; // raw typing buffer
    if (!isFinite(value)) return "Error";
    if (Number.isNaN(value)) return "Error";

    // Round to avoid floating point noise
    let num = parseFloat(value.toPrecision(12));
    if (Object.is(num, -0)) num = 0;

    let str;
    const abs = Math.abs(num);
    if (abs !== 0 && (abs >= 1e9 || abs < 1e-8)) {
      str = num.toExponential(5).replace(/(\.\d*?)0+e/, "$1e").replace(/\.e/, "e");
      return str;
    }

    str = String(num);
    if (str.includes("e")) return str;

    // Limit total digits like iOS (grouped with commas for display)
    const [intPart, decPart] = str.split(".");
    let intOut = groupDigits(intPart);
    if (decPart) {
      let dec = decPart.slice(0, MAX_DIGITS - intPart.length + 3);
      dec = dec.replace(/0+$/, "");
      return dec.length ? `${intOut}.${dec}` : intOut;
    }
    return intOut;
  }

  function groupDigits(intStr) {
    const sign = intStr.startsWith("-") ? "-" : "";
    const digits = sign ? intStr.slice(1) : intStr;
    return sign + digits.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  }

  function rawDisplay() {
    // strip grouping when we need to parse back
    return displayValue.replace(/,/g, "");
  }

  function currentNumeric() {
    return parseFloat(rawDisplay()) || 0;
  }

  // --- Rendering ---
  function render() {
    resultEl.textContent = displayValue;
    // shrink font for long numbers
    resultEl.classList.remove("shrink-1", "shrink-2", "shrink-3");
    const len = displayValue.length;
    if (len > 14) resultEl.classList.add("shrink-3");
    else if (len > 11) resultEl.classList.add("shrink-2");
    else if (len > 9) resultEl.classList.add("shrink-1");

    clearBtn.textContent = rawDisplay() === "0" && !operator ? "AC" : "C";

    // highlight active operator key
    document.querySelectorAll(".key.op.active").forEach((k) => k.classList.remove("active"));
    if (operator && waitingForSecond) {
      const btn = document.querySelector(`.key.op[data-op="${operator}"]`);
      if (btn) btn.classList.add("active");
    }
  }

  function updateHistory(text) {
    historyEl.innerHTML = text || "&nbsp;";
  }

  // --- Core operations ---
  function compute(a, b, op) {
    switch (op) {
      case "+": return a + b;
      case "-": return a - b;
      case "*": return a * b;
      case "/": return b === 0 ? Infinity : a / b;
    }
  }

  function inputDigit(d) {
    if (justEvaluated) {
      // start fresh after "="
      firstOperand = null;
      operator = null;
      updateHistory("");
      justEvaluated = false;
      waitingForSecond = false;
    }
    if (waitingForSecond) {
      displayValue = d;
      waitingForSecond = false;
    } else {
      const raw = rawDisplay();
      const digitCount = raw.replace(/[^0-9]/g, "").length;
      if (digitCount >= MAX_DIGITS) return;
      displayValue = raw === "0" ? d : raw + d;
      displayValue = keepTyping();
    }
    render();
  }

  // helper to re-group typed digits without rounding surprises
  function keepTyping() {
    const raw = rawDisplay();
    if (raw.includes(".")) {
      const [i, d] = raw.split(".");
      return groupDigits(i) + "." + d;
    }
    return groupDigits(raw);
  }

  function inputDecimal() {
    if (justEvaluated) {
      firstOperand = null; operator = null; updateHistory("");
      justEvaluated = false; waitingForSecond = false;
    }
    if (waitingForSecond) {
      displayValue = "0.";
      waitingForSecond = false;
    } else if (!rawDisplay().includes(".")) {
      displayValue = rawDisplay() + ".";
    }
    render();
  }

  function setOperator(op) {
    justEvaluated = false;
    if (operator && waitingForSecond) {
      // swap operator
      operator = op;
      render();
      return;
    }
    if (firstOperand !== null && operator) {
      // chain: evaluate previous first
      const result = compute(firstOperand, currentNumeric(), operator);
      const shown = formatNumber(result);
      if (shown === "Error") { showError(); return; }
      firstOperand = typeof result === "number" ? parseFloat(String(result)) : result;
      displayValue = shown;
      updateHistory(`${shown} ${OP_SYMBOL[op]}`);
    } else {
      firstOperand = currentNumeric();
      updateHistory(`${displayValue} ${OP_SYMBOL[op]}`);
    }
    operator = op;
    waitingForSecond = true;
    render();
  }

  function equals() {
    if (operator !== null && !waitingForSecond) {
      const b = currentNumeric();
      const result = compute(firstOperand, b, operator);
      lastOperand = b;
      lastOperator = operator;
      const shown = formatNumber(result);
      if (shown === "Error") { showError(); return; }
      updateHistory(`${formatNumber(firstOperand)} ${OP_SYMBOL[operator]} ${formatNumber(b)} =`);
      displayValue = shown;
      firstOperand = result;
      operator = null;
      waitingForSecond = false;
      justEvaluated = true;
      render();
    } else if (lastOperand !== null && lastOperator !== null) {
      // repeated "="
      const b = currentNumeric();
      const result = compute(b, lastOperand, lastOperator);
      const shown = formatNumber(result);
      if (shown === "Error") { showError(); return; }
      updateHistory(`${displayValue} ${OP_SYMBOL[lastOperator]} ${formatNumber(lastOperand)} =`);
      displayValue = shown;
      firstOperand = result;
      justEvaluated = true;
      render();
    }
  }

  function percent() {
    const val = currentNumeric() / 100;
    displayValue = formatNumber(val);
    justEvaluated = false;
    render();
  }

  function toggleSign() {
    if (rawDisplay() === "0") return;
    displayValue = rawDisplay().startsWith("-")
      ? rawDisplay().slice(1)
      : "-" + rawDisplay();
    displayValue = keepTypingSafe();
    render();
  }

  function keepTypingSafe() {
    const raw = rawDisplay();
    const neg = raw.startsWith("-");
    const body = neg ? raw.slice(1) : raw;
    return (neg ? "-" : "") + (body.includes(".")
      ? groupDigits(body.split(".")[0]) + "." + body.split(".")[1]
      : groupDigits(body));
  }

  function clearEntry() {
    displayValue = "0";
    render();
  }

  function allClear() {
    displayValue = "0";
    firstOperand = null;
    operator = null;
    waitingForSecond = false;
    lastOperand = null;
    lastOperator = null;
    justEvaluated = false;
    updateHistory("");
    render();
  }

  function clearPressed() {
    // AC vs C behaviour
    if (clearBtn.textContent === "C") {
      clearEntry();
    } else {
      allClear();
    }
  }

  function showError() {
    displayValue = "Error";
    firstOperand = null;
    operator = null;
    waitingForSecond = false;
    justEvaluated = false;
    render();
  }

  // --- Event wiring ---
  keys.forEach((key) => {
    key.addEventListener("click", () => {
      const { digit, action, op } = key.dataset;
      if (displayValue === "Error" && action !== "clear") {
        allClear();
        if (!digit) return;
      }
      if (digit) return inputDigit(digit);
      switch (action) {
        case "decimal": return inputDecimal();
        case "operator": return setOperator(op);
        case "equals": return equals();
        case "percent": return percent();
        case "sign": return toggleSign();
        case "clear": return clearPressed();
      }
    });
  });

  // Keyboard support
  window.addEventListener("keydown", (e) => {
    const k = e.key;
    if (/^[0-9]$/.test(k)) { highlight(`[data-digit="${k}"]`); inputDigit(k); }
    else if (k === ".") { highlight('[data-action="decimal"]'); inputDecimal(); }
    else if (["+", "-", "*", "/"].includes(k)) {
      e.preventDefault();
      highlight(`[data-op="${k}"]`); setOperator(k);
    }
    else if (k === "Enter" || k === "=") { e.preventDefault(); highlight('[data-action="equals"]'); equals(); }
    else if (k === "%") { highlight('[data-action="percent"]'); percent(); }
    else if (k === "Backspace") { backspace(); }
    else if (k === "Escape") { highlight("#btn-clear"); allClear(); }
  });

  function highlight(selector) {
    const el = document.querySelector(`.keys ${selector}`);
    if (!el) return;
    el.style.filter = "brightness(1.45)";
    setTimeout(() => (el.style.filter = ""), 120);
  }

  function backspace() {
    if (waitingForSecond || justEvaluated || displayValue === "Error") return;
    let raw = rawDisplay();
    raw = raw.length > 1 ? raw.slice(0, -1) : "0";
    if (raw === "" || raw === "-") raw = "0";
    displayValue = raw.includes(".") ? raw : groupDigits(raw);
    if (raw.includes(".")) displayValue = keepTypingSafe();
    render();
  }

  render();
})();
