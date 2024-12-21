// Función para agregar ahorro
function agregarAhorro() {
    const ahorroActual = parseFloat(document.getElementById('ahorro').value);
    const nuevoAhorro = parseFloat(document.getElementById('nuevoAhorro').value);

    if (!isNaN(nuevoAhorro) && nuevoAhorro > 0) {
        const nuevoTotal = (ahorroActual + nuevoAhorro).toFixed(2);
        document.getElementById('ahorro').value = nuevoTotal;

        const falta = 100 - nuevoTotal;
        document.getElementById('faltaPorAhorar').value = Math.max(falta.toFixed(2), 0);

        document.getElementById('resultado').innerHTML = `Has ahorrado aproximadamente ${(nuevoTotal / 100) * 100}% de tu meta.`;

        const progressBar = document.getElementById('progressBar');
        progressBar.style.width = ((nuevoTotal / 100) * 100) + '%';

        guardarEnEstadisticas(nuevoTotal, new Date().toLocaleDateString());
    } else {
        manejarError('Por favor ingresa una cantidad válida.');
    }
}

function manejarAhorro(isAddition) {
    const ahorroActual = parseFloat(document.getElementById('ahorro').value);
    const nuevoAhorro = parseFloat(document.getElementById('nuevoAhorro').value);

    if (!isNaN(nuevoAhorro) && nuevoAhorro > 0) {
        let nuevoTotal;
        if (isAddition) {
            nuevoTotal = (ahorroActual + nuevoAhorro).toFixed(2);
        } else {
            nuevoTotal = (ahorroActual - nuevoAhorro).toFixed(2);
            nuevoTotal = Math.max(nuevoTotal, 0); // No permitir valores negativos
        }

        document.getElementById('ahorro').value = nuevoTotal;

        const falta = 100 - nuevoTotal;
        document.getElementById('faltaPorAhorar').value = Math.max(falta.toFixed(2), 0);

        document.getElementById('resultado').innerHTML = `Has ahorrado aproximadamente ${(nuevoTotal / 100) * 100}% de tu meta.`;

        const progressBar = document.getElementById('progressBar');
        progressBar.style.width = ((nuevoTotal / 100) * 100) + '%';

        // Guardar estadísticas siempre que se actualice el ahorro
        guardarEnEstadisticas(nuevoTotal, new Date().toLocaleDateString());
    } else {
        manejarError('Por favor ingresa una cantidad válida.');
    }
}

// Función para guardar estadísticas
function guardarEnEstadisticas(ahorro, fecha) {
    const estadisticas = JSON.parse(localStorage.getItem('estadisticas')) || [];
    estadisticas.push({ ahorro: ahorro, fecha: fecha });
    localStorage.setItem('estadisticas', JSON.stringify(estadisticas));

    const listaEstadisticas = document.getElementById('estadisticasList');
    const nuevoItem = document.createElement('li');
    nuevoItem.textContent = `Ahorro: $${ahorro} el ${fecha}`;
    listaEstadisticas.appendChild(nuevoItem);
}

function eliminarGuardado() {
    if (confirm('¿Estás seguro de que deseas eliminar tu progreso guardado?')) {
        localStorage.removeItem('ahorro');
        localStorage.removeItem('estadisticas');
        document.getElementById('ahorro').value = '';
        document.getElementById('faltaPorAhorar').value = '100';
        document.getElementById('resultado').innerHTML = 'Progreso eliminado correctamente.';
    }
}

// Función para guardar progreso en local storage
function guardarProgreso() {
    const ahorro = document.getElementById('ahorro').value;
    const estadisticas = JSON.parse(localStorage.getItem('estadisticas')) || [];
    localStorage.setItem('ahorro', JSON.stringify({ ahorro: ahorro, estadisticas: estadisticas }));

    document.getElementById('resultado').innerHTML = 'Progreso guardado correctamente.';
}

// Función para cargar progreso desde local storage
function cargarProgreso() {
    const data = JSON.parse(localStorage.getItem('ahorro'));
    if (data) {
        document.getElementById('ahorro').value = data.ahorro;

        const falta = 100 - parseFloat(data.ahorro);
        document.getElementById('faltaPorAhorar').value = Math.max(falta.toFixed(2), 0);

        const progressBar = document.getElementById('progressBar');
        progressBar.style.width = ((data.ahorro / 100) * 100) + '%';

        const listaEstadisticas = document.getElementById('estadisticasList');
        listaEstadisticas.innerHTML = '';
        data.estadisticas.forEach(item => {
            const nuevoItem = document.createElement('li');
            nuevoItem.textContent = `Ahorro: $${item.ahorro} el ${item.fecha}`;
            listaEstadisticas.appendChild(nuevoItem);
        });
    } else {
        document.getElementById('resultado').innerHTML = 'No hay progreso guardado.';
    }
}

// Función para mostrar/ocultar los menús de exportar e importar
function mostrarMenu(tipo) {
    const menuExportar = document.getElementById('menuExportar');
    const menuImportar = document.getElementById('menuImportar');

    if (tipo === 'exportar') {
        menuExportar.style.display = 'block';
        menuImportar.style.display = 'none';
    } else if (tipo === 'importar') {
        menuExportar.style.display = 'none';
        menuImportar.style.display = 'block';
    }
}

function exportarJSON() {
    const ahorroInicialInput = document.getElementById('ahorroInicial');
    const ahorroInput = document.getElementById('ahorro');

    if (ahorroInicialInput && ahorroInput) {
        const ahorroInicial = parseFloat(ahorroInicialInput.value) || 2.78;
        const data = {
            ahorro: ahorroInput.value,
            ahorroInicial: ahorroInicial,
            estadisticas: JSON.parse(localStorage.getItem('estadisticas')) || []
        };

        const jsonData = JSON.stringify(data);
        const jsonContent = document.getElementById('jsonExportar');
        jsonContent.innerHTML = `${jsonData}`;

        const downloadLink = document.createElement('a');
        downloadLink.href = 'data:text/json;charset=utf-8,' + encodeURIComponent(jsonData);
        downloadLink.download = 'ahorro.json';
        downloadLink.textContent = 'Descargar JSON';

        document.getElementById('jsonExportarLink').innerHTML = '';
        document.getElementById('jsonExportarLink').appendChild(downloadLink);

        const mensaje = document.createElement('p');
        mensaje.innerHTML = 'Datos copiados al portapapeles. Puedes pegarlos en otro lugar.';
        jsonContent.appendChild(mensaje);

        const cerrarBtn = document.createElement('button');
        cerrarBtn.textContent = 'Cerrar';
        cerrarBtn.addEventListener('click', cerrarVentanaExportar);
        jsonContent.appendChild(cerrarBtn);
    } else {
        manejarError('Por favor completa todos los campos requeridos.');
    }
}



// Función para importar JSON
function importarJSON() {
    const inputFile = document.getElementById('importarArchivo');
    const textareaData = document.getElementById('jsonImportar').value;

    if (inputFile.files && inputFile.files[0]) {
        const reader = new FileReader();
        reader.onload = function(e) {
            try {
                const jsonData = JSON.parse(e.target.result);
                if (jsonData.ahorro !== undefined) {
                    document.getElementById('ahorro').value = jsonData.ahorro;
                    const falta = 100 - parseFloat(jsonData.ahorro);
                    document.getElementById('faltaPorAhorar').value = Math.max(falta.toFixed(2), 0);
                    document.getElementById('resultado').innerHTML = 'Datos importados correctamente.';
                    calcularProgreso();
                } else {
                    manejarError('Formato JSON inválido.');
                }
            } catch (e) {
                manejarError('Error al procesar el JSON.');
            }
        };
        reader.readAsText(inputFile.files[0]);
    } else if (textareaData) {
        try {
            const jsonData = JSON.parse(textareaData);
            if (jsonData.ahorro !== undefined) {
                document.getElementById('ahorro').value = jsonData.ahorro;
                const falta = 100 - parseFloat(jsonData.ahorro);
                document.getElementById('faltaPorAhorar').value = Math.max(falta.toFixed(2), 0);
                document.getElementById('resultado').innerHTML = 'Datos importados correctamente.';
                calcularProgreso();
            } else {
                manejarError('Formato JSON inválido.');
            }
        } catch (e) {
            manejarError('Error al procesar el JSON.');
        }
    } else {
        manejarError('Por favor selecciona o pega un archivo JSON válido.');
    }
}


function cerrarVentanaImportar() {
    const menuImportar = document.getElementById('menuImportar');
    if (menuImportar) {
        menuImportar.style.display = 'none';
    }
}

function cerrarVentanaExportar() {
    const jsonExportar = document.getElementById('jsonExportar');
    if (jsonExportar) {
        jsonExportar.innerHTML = '';
    }

    const menuExportar = document.getElementById('menuExportar');
    if (menuExportar) {
        menuExportar.style.display = 'none';
    }
}

// Función para manejar errores con mensajes específicos
function manejarError(mensaje) {
    alert(mensaje);
}
