document.addEventListener('DOMContentLoaded', function() {
    cargarProgreso();
    actualizarListaEstadisticas();
});

// Utilidades
function esNumeroValido(valor) {
    return !isNaN(valor) && valor >= 0;
}

function escaparHTML(texto) {
    const div = document.createElement('div');
    div.innerText = texto;
    return div.innerHTML;
}

function mostrarMensaje(icono, mensaje) {
    document.getElementById('resultado').innerHTML = `<i class="fas ${icono}"></i> ${mensaje}`;
}

// Menú
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

function actualizarProgressBar(valor) {
    const metaAhorro = document.getElementById("metaAhorro");  // Ajuste directo a metaAhorro

    if (isNaN(valor) || valor < 0) {
        console.error('El valor proporcionado no es válido:', valor);
        return;
    }

    const progressBar = document.getElementById('progressBar');
    if (!progressBar) {
        console.error('Elemento progressBar no encontrado.');
        return;
    }

    const porcentaje = Math.min((valor / metaAhorro.value) * 100, 100);
    console.log('Progreso calculado:', porcentaje, '%');

    if (progressBar.getAttribute('data-progress') !== String(Math.round(porcentaje))) {
        progressBar.style.width = porcentaje + '%';
        progressBar.setAttribute('data-progress', Math.round(porcentaje));
        console.log('Progreso actualizado a:', porcentaje, '%');
    } else {
        console.log('El progreso ya está actualizado.');
    }
}

// Manejo de ahorro
function manejarAhorro(isAddition) {
    const ahorroInput = document.getElementById('ahorro');
    const nuevoAhorroInput = document.getElementById('nuevoAhorro');
    const nuevaMeta = parseFloat(document.getElementById("metaAhorro").value);

    const ahorroActual = parseFloat(ahorroInput.value) || 0;
    const nuevoAhorro = parseFloat(nuevoAhorroInput.value);

    if (esNumeroValido(nuevoAhorro) && nuevoAhorro > 0) {
        const nuevoTotal = isAddition ? 
            (ahorroActual + nuevoAhorro) : 
            Math.max(ahorroActual - nuevoAhorro, 0);

        const totalRedondeado = parseFloat(nuevoTotal.toFixed(2));
        const falta = Math.max(nuevaMeta - totalRedondeado, 0).toFixed(2);

        ahorroInput.value = totalRedondeado;
        document.getElementById('faltaInput').value = falta;

        actualizarProgressBar(totalRedondeado);

        mostrarMensaje('fa-info-circle', `Has ahorrado ${totalRedondeado.toFixed(2)}$ (${((totalRedondeado / 100) * 100).toFixed(1)}% de tu meta)`);

        guardarEnEstadisticas(totalRedondeado);
        nuevoAhorroInput.value = '';
    } else {
        mostrarMensaje('fa-exclamation-triangle', 'Por favor ingresa una cantidad válida.');
    }
}

function guardarEnEstadisticas(ahorro) {
    const fecha = new Date().toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });

    const estadisticas = JSON.parse(localStorage.getItem('estadisticas')) || [];
    estadisticas.push({ ahorro, fecha });
    localStorage.setItem('estadisticas', JSON.stringify(estadisticas));

    actualizarListaEstadisticas();
}

function actualizarListaEstadisticas() {
    const estadisticas = JSON.parse(localStorage.getItem('estadisticas')) || [];
    const lista = document.getElementById('estadisticasList');
    lista.innerHTML = '';

    estadisticas.slice(-10).reverse().forEach(item => {
        const ahorroFormatted = typeof item.ahorro === 'number' ? item.ahorro.toFixed(2) : '0.00';

        const li = document.createElement('li');
        li.innerHTML = `
            <i class="fas fa-chart-line"></i>
            $${escaparHTML(ahorroFormatted)} 
            <small>${escaparHTML(item.fecha)}</small>
        `;
        lista.appendChild(li);
    });
}

// Guardar y cargar progreso
function guardarProgreso() {
    const ahorro = document.getElementById('ahorro').value;
    const estadisticas = JSON.parse(localStorage.getItem('estadisticas')) || [];
    const faltaInput = parseFloat(document.getElementById("metaAhorro").value);
    localStorage.setItem('ahorro', JSON.stringify({ 
        ahorro,
        metaAhorro,
        estadisticas,
        ultimaActualizacion: new Date().toISOString()
    }));

    mostrarMensaje('fa-check', 'Progreso guardado correctamente');
}

function cargarProgreso() {
    const metaAhorroTexto = document.getElementById('metaAhorroTexto');
    const metaAhorroInput = document.getElementById('metaAhorroInput');
    const datos = JSON.parse(localStorage.getItem('ahorro'));

    if (!metaAhorroTexto || !metaAhorroInput) {
        console.error('Elemento del DOM no encontrado.');
        return;
    }

    if (datos) {
        metaAhorroTexto.textContent = datos.metaAhorro || 0;

        actualizarProgressBar(datos.ahorro);
        actualizarListaEstadisticas();

        mostrarMensaje('fa-sync-alt', `Datos cargados: ${new Date(datos.ultimaActualizacion).toLocaleDateString('es-ES')}`);
    } else {
        mostrarMensaje('fa-exclamation-triangle', 'No hay datos guardados');
    }
}

function eliminarGuardado() {
    if (confirm('¿Estás seguro de que deseas eliminar todo tu progreso guardado?')) {
        localStorage.removeItem('ahorro');
        localStorage.removeItem('estadisticas');

        const ahorroInput = document.getElementById('ahorro');
        const faltaInput = document.getElementById('faltaPorAhorar');
        const nuevoAhorroInput = document.getElementById('nuevoAhorro');
        const estadisticasList = document.getElementById('estadisticasList');

        if (ahorroInput) ahorroInput.value = '';
        if (faltaInput) faltaInput.value = '';
        if (nuevoAhorroInput) nuevoAhorroInput.value = '';
        if (estadisticasList) estadisticasList.innerHTML = '';

        actualizarProgressBar(0);

        mostrarMensaje('fa-trash', 'Progreso eliminado correctamente');
    }
}

// Exportar e importar JSON
function exportarJSON() {
    const metaAhorro = parseFloat(document.getElementById("metaAhorro").value);
    const ahorro = document.getElementById('ahorro').value;
    const deficit = Math.max(metaAhorro - parseFloat(ahorro), 0).toFixed(2);
    const estadisticas = JSON.parse(localStorage.getItem('estadisticas')) || [];

    const datos = {
        metaAhorro,
        ahorro,
        deficit,
        estadisticas,
        fecha_exportacion: new Date().toISOString()
    };

    const jsonString = JSON.stringify(datos, null, 2);
    document.getElementById('jsonExportar').value = jsonString;

    const downloadLink = document.createElement('a');
    downloadLink.href = 'data:text/json;charset=utf-8,' + encodeURIComponent(jsonString);
    downloadLink.download = 'mis_ahorros.json';

    const exportarLink = document.getElementById('jsonExportarLink');
    exportarLink.innerHTML = '';
    exportarLink.appendChild(downloadLink);
    downloadLink.innerHTML = `<i class="fas fa-file-download"></i> Descargar JSON`;
}

function importarJSON() {
    const archivo = document.getElementById('importarArchivo').files[0];
    const textoJSON = document.getElementById('jsonImportar').value;

    if (archivo) {
        const reader = new FileReader();
        reader.onload = function(e) {
            procesarDatosImportados(e.target.result);
        };
        reader.readAsText(archivo);
    } else if (textoJSON) {
        procesarDatosImportados(textoJSON);
    } else {
        mostrarMensaje('fa-exclamation-triangle', 'Por favor selecciona un archivo o pega el contenido JSON');
    }
}

function procesarDatosImportados(contenidoJSON) {
    try {
        const datos = JSON.parse(contenidoJSON);
        if (datos.ahorro !== undefined) {
            localStorage.setItem('ahorro', JSON.stringify(datos));
            localStorage.setItem('estadisticas', JSON.stringify(datos.estadisticas || []));
            localStorage.setItem("metaAhorro", JSON.stringify(datos.metaAhorro));

            cargarProgreso();
            cerrarVentanaImportar();

            mostrarMensaje('fa-check', 'Datos importados correctamente');
        } else {
            mostrarMensaje('fa-exclamation-triangle', 'El formato del JSON no es válido');
        }
    } catch (e) {
        mostrarMensaje('fa-exclamation-triangle', 'Error al procesar el archivo JSON');
    }
}


function cerrarVentanaImportar() {
    document.getElementById('menuImportar').style.display = 'none';
    document.getElementById('importarArchivo').value = '';
    document.getElementById('jsonImportar').value = '';
}

function cerrarVentanaExportar() {
    document.getElementById('menuExportar').style.display = 'none';
}

// Accediendo al elemento 'metaAhorroInput' mediante su ID
const metaAhorroInput = document.getElementById('metaAhorroInput');

// Función para actualizar el progreso basándose en la meta de ahorro
function actualizarMetaAhorro() {
    const metaAhorro = parseFloat(metaAhorroInput.value) || 0;
    const ahorroActual = parseFloat(document.getElementById('ahorro').value) || 0;
    const progreso = (ahorroActual / metaAhorro) * 100;

    // Actualizar la barra de progreso
    const progressBar = document.getElementById('progressBar');
    progressBar.style.width = `${progreso}%`;

    // Mostrar mensaje o resultados dependiendo del progreso
    const resultado = document.getElementById('resultado');
    if (progreso >= 100) {
        resultado.textContent = '¡Felicidades! Has alcanzado tu meta de ahorro.';
    } else {
        resultado.textContent = `Progreso: ${progreso.toFixed(2)}%`;
    }
}

// Escuchar cambios en 'metaAhorroInput' para actualizar la meta de ahorro
metaAhorroInput.addEventListener('input', actualizarMetaAhorro);

function obtenerMetaAhorro() {
    return parseFloat(localStorage.getItem('metaAhorro')) || 100;
}