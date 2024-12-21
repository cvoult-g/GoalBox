class SavingsManager {
    constructor() {
        this.currentSavings = 0;
        this.goal = 100;
        this.history = [];
        this.init();
    }

    init() {
        // Inicializa los elementos y eventos
        this.ahorroInput = document.getElementById("ahorro");
        this.nuevoAhorroInput = document.getElementById("nuevoAhorro");
        this.faltaPorAhorarInput = document.getElementById("faltaPorAhorar");
        this.progressBar = document.getElementById("progressBar");
        this.resultadoDiv = document.getElementById("resultado");
        this.estadisticasList = document.getElementById("estadisticasList");

        this.setupEventListeners();
        this.updateUI();
    }

    setupEventListeners() {
        document.getElementById("nuevoAhorro").addEventListener("input", () => this.updateInputFields());
        document.querySelector(".add-btn").addEventListener("click", () => this.manejarAhorro(true));
        document.querySelector(".subtract-btn").addEventListener("click", () => this.manejarAhorro(false));
    }

    manejarAhorro(isAdding) {
        const nuevoAhorro = parseFloat(this.nuevoAhorroInput.value) || 0;

        if (nuevoAhorro <= 0) {
            alert("Ingresa una cantidad válida.");
            return;
        }

        if (isAdding) {
            this.currentSavings += nuevoAhorro;
            this.history.push(`Agregaste $${nuevoAhorro.toFixed(2)}`);
        } else {
            if (this.currentSavings < nuevoAhorro) {
                alert("No puedes restar más de lo que tienes ahorrado.");
                return;
            }
            this.currentSavings -= nuevoAhorro;
            this.history.push(`Restaste $${nuevoAhorro.toFixed(2)}`);
        }

        this.updateUI();
    }

    updateInputFields() {
        this.faltaPorAhorarInput.value = Math.max(this.goal - this.currentSavings, 0).toFixed(2);
    }

    updateUI() {
        this.ahorroInput.value = this.currentSavings.toFixed(2);
        this.updateInputFields();
        this.updateProgressBar();
        this.updateHistory();
        this.updateMessage();
    }

    updateProgressBar() {
        const progress = Math.min((this.currentSavings / this.goal) * 100, 100);
        this.progressBar.style.width = `${progress}%`;
        this.progressBar.setAttribute("data-progress", progress.toFixed(2));
    }

    updateHistory() {
        this.estadisticasList.innerHTML = "";
        this.history.forEach((entry) => {
            const li = document.createElement("li");
            li.textContent = entry;
            this.estadisticasList.appendChild(li);
        });
    }

    updateMessage() {
        if (this.currentSavings >= this.goal) {
            this.resultadoDiv.textContent = "¡Felicidades! Has alcanzado tu meta de ahorro.";
        } else {
            const falta = this.goal - this.currentSavings;
            this.resultadoDiv.textContent = `Te faltan $${falta.toFixed(2)} para alcanzar tu meta.`;
        }
    }

    exportarJSON() {
        const data = {
            ahorroActual: this.currentSavings,
            meta: this.goal,
            historial: this.history,
        };
        const json = JSON.stringify(data, null, 2);
        const blob = new Blob([json], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "ahorros.json";
        a.click();
    }

    importarJSON(jsonData) {
        try {
            const data = JSON.parse(jsonData);
            if (data.ahorroActual !== undefined && data.meta !== undefined && Array.isArray(data.historial)) {
                this.currentSavings = data.ahorroActual;
                this.goal = data.meta;
                this.history = data.historial;
                this.updateUI();
            } else {
                alert("El archivo JSON no es válido.");
            }
        } catch (error) {
            alert("Error al importar el archivo JSON.");
        }
    }

    guardarProgreso() {
        const data = {
            ahorroActual: this.currentSavings,
            meta: this.goal,
            historial: this.history,
        };
        localStorage.setItem("ahorros", JSON.stringify(data));
        alert("Progreso guardado con éxito.");
    }

    cargarProgreso() {
        const savedData = localStorage.getItem("ahorros");
        if (savedData) {
            this.importarJSON(savedData);
            alert("Progreso cargado con éxito.");
        } else {
            alert("No hay progreso guardado.");
        }
    }

    eliminarGuardado() {
        localStorage.removeItem("ahorros");
        alert("Progreso eliminado.");
    }
}

// Instancia y arranque de la aplicación
document.addEventListener("DOMContentLoaded", () => {
    const app = new SavingsManager();

    // Vincular botones adicionales
    document.querySelector(".export-btn").addEventListener("click", () => app.exportarJSON());
    document.querySelector(".import-btn").addEventListener("click", () => {
        const jsonData = prompt("Pega aquí el contenido JSON:");
        if (jsonData) app.importarJSON(jsonData);
    });
    document.querySelector(".save-btn").addEventListener("click", () => app.guardarProgreso());
    document.querySelector(".load-btn").addEventListener("click", () => app.cargarProgreso());
    document.querySelector(".delete-btn").addEventListener("click", () => app.eliminarGuardado());
});
