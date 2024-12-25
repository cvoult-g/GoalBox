// Constants
const STORAGE_KEYS = {
    SAVINGS: 'ahorro',
    STATS: 'estadisticas',
    GOAL: 'metaAhorro'
};

// DOM Elements Cache
const elements = {
    init() {
        this.form = document.getElementById('ahorroForm');
        this.savings = document.getElementById('ahorro');
        this.newSavings = document.getElementById('nuevoAhorro');
        this.goal = document.getElementById('metaAhorroInput');
        this.goalText = document.getElementById('metaAhorroTexto');
        this.progressBar = document.getElementById('progressBar');
        this.result = document.getElementById('resultado');
        this.statsList = document.getElementById('estadisticasList');
    }
};

// Utility Functions
const utils = {
    isValidNumber: value => !isNaN(value) && value >= 0,
    escapeHTML: text => {
        const div = document.createElement('div');
        div.innerText = text;
        return div.innerHTML;
    },
    formatCurrency: value => parseFloat(value).toFixed(2),
    showMessage: (icon, message) => {
        elements.result.innerHTML = `<i class="fas ${icon}"></i> ${message}`;
    }
};

// Storage Operations
const storage = {
    save: (key, data) => localStorage.setItem(key, JSON.stringify(data)),
    load: key => JSON.parse(localStorage.getItem(key)),
    clear: () => {
        Object.values(STORAGE_KEYS).forEach(key => localStorage.removeItem(key));
    }
};

// Progress Bar Management
const progressManager = {
    update(currentValue) {
        const goalValue = parseFloat(elements.goal.value) || 0;
        const percentage = Math.min((currentValue / goalValue) * 100, 100);
        const remaining = goalValue - currentValue;

        elements.goalText.textContent = `Falta: $${utils.formatCurrency(remaining)}`;
        elements.progressBar.style.width = `${percentage}%`;
        elements.progressBar.setAttribute('data-progress', Math.round(percentage));
    }
};

// Statistics Management
const statsManager = {
    add(amount) {
        const stats = storage.load(STORAGE_KEYS.STATS) || [];
        const entry = {
            ahorro: amount,
            fecha: new Date().toLocaleDateString('es-ES', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            })
        };
        
        stats.push(entry);
        storage.save(STORAGE_KEYS.STATS, stats);
        this.updateList();
    },

    updateList() {
        const stats = storage.load(STORAGE_KEYS.STATS) || [];
        elements.statsList.innerHTML = stats
            .slice(-10)
            .reverse()
            .map(item => `
                <li>
                    <i class="fas fa-chart-line"></i>
                    $${utils.escapeHTML(utils.formatCurrency(item.ahorro))}
                    <small>${utils.escapeHTML(item.fecha)}</small>
                </li>
            `)
            .join('');
    }
};

// Savings Operations
const savingsManager = {
    handle(isAddition) {
        const currentSavings = parseFloat(elements.savings.value) || 0;
        const newAmount = parseFloat(elements.newSavings.value);

        if (!utils.isValidNumber(newAmount) || newAmount <= 0) {
            utils.showMessage('fa-exclamation-triangle', 'Por favor ingresa una cantidad válida.');
            return;
        }

        const total = isAddition ? 
            currentSavings + newAmount : 
            Math.max(currentSavings - newAmount, 0);

        const goalValue = parseFloat(elements.goal.value) || 0;
        const percentage = ((total / goalValue) * 100).toFixed(1);

        elements.savings.value = total;
        elements.newSavings.value = '';

        progressManager.update(total);
        utils.showMessage('fa-info-circle', `Has ahorrado $${utils.formatCurrency(total)} (${percentage}% de tu meta)`);
        statsManager.add(total);
    }
};

// Import/Export Operations
const dataManager = {
    export() {
        const data = {
            metaAhorro: parseFloat(elements.goal.value) || 0,
            ahorro: parseFloat(elements.savings.value) || 0,
            deficit: Math.max(elements.goal.value - elements.savings.value, 0),
            estadisticas: storage.load(STORAGE_KEYS.STATS) || [],
            fecha_exportacion: new Date().toISOString()
        };

        const jsonString = JSON.stringify(data, null, 2);
        const downloadLink = document.createElement('a');
        downloadLink.href = 'data:text/json;charset=utf-8,' + encodeURIComponent(jsonString);
        downloadLink.download = 'mis_ahorros.json';
        downloadLink.innerHTML = '<i class="fas fa-file-download"></i> Descargar JSON';

        const exportLink = document.getElementById('jsonExportarLink');
        exportLink.innerHTML = '';
        exportLink.appendChild(downloadLink);

        document.getElementById('jsonExportar').value = jsonString;
        utils.showMessage('fa-check-circle', 'Datos exportados correctamente.');
    },

    import(content) {
        try {
            const data = JSON.parse(content);
            if (data.ahorro === undefined) throw new Error();

            Object.entries({
                [STORAGE_KEYS.SAVINGS]: data,
                [STORAGE_KEYS.STATS]: data.estadisticas,
                [STORAGE_KEYS.GOAL]: data.metaAhorro
            }).forEach(([key, value]) => storage.save(key, value));

            this.loadSavedData();
            utils.showMessage('fa-check', 'Datos importados correctamente');
        } catch (e) {
            utils.showMessage('fa-exclamation-triangle', 'Error al procesar el archivo JSON');
        }
    },

    loadSavedData() {
        const data = storage.load(STORAGE_KEYS.SAVINGS);
        if (!data) {
            utils.showMessage('fa-exclamation-triangle', 'No hay datos guardados');
            return;
        }

        elements.goal.value = data.meta || 0;
        progressManager.update(data.ahorro);
        statsManager.updateList();
        utils.showMessage('fa-sync-alt', `Datos cargados: ${new Date().toLocaleDateString('es-ES')}`);
    }
};

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    elements.init();
    dataManager.loadSavedData();
    statsManager.updateList();
});

// Export functions for HTML usage
window.manejarAhorro = isAddition => savingsManager.handle(isAddition);
window.mostrarMenu = type => {
    document.getElementById('menuExportar').style.display = type === 'exportar' ? 'block' : 'none';
    document.getElementById('menuImportar').style.display = type === 'importar' ? 'block' : 'none';
};
window.exportarJSON = () => dataManager.export();
window.importarJSON = () => {
    const file = document.getElementById('importarArchivo').files[0];
    const text = document.getElementById('jsonImportar').value;

    if (file) {
        const reader = new FileReader();
        reader.onload = e => dataManager.import(e.target.result);
        reader.readAsText(file);
    } else if (text) {
        dataManager.import(text);
    } else {
        utils.showMessage('fa-exclamation-triangle', 'Por favor selecciona un archivo o pega el contenido JSON');
    }
};
window.eliminarGuardado = () => {
    if (!confirm('¿Estás seguro de que deseas eliminar todo tu progreso guardado?')) return;
    
    storage.clear();
    elements.savings.value = '';
    elements.newSavings.value = '';
    elements.statsList.innerHTML = '';
    progressManager.update(0);
    utils.showMessage('fa-trash', 'Progreso eliminado correctamente');
};