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

// Barra de progreso
function actualizarProgressBar(valor) {
    const porcentaje = Math.min((valor / 100) * 100, 100);
    const progressBar = document.getElementById('progressBar');
    if (progressBar.getAttribute('data-progress') !== String(Math.round(porcentaje))) {
        progressBar.style.width = porcentaje + '%';
        progressBar.setAttribute('data-progress', Math.round(porcentaje));
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
        document.getElementById('faltaPorAhorar').value = falta;

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
    localStorage.setItem('ahorro', JSON.stringify({ 
        ahorro, 
        estadisticas,
        ultimaActualizacion: new Date().toISOString()
    }));

    mostrarMensaje('fa-check', 'Progreso guardado correctamente');
}

function cargarProgreso() {
    const ahorroInput = document.getElementById('ahorro');
    const faltaInput = document.getElementById("metaAhorro")
    const datos = JSON.parse(localStorage.getItem('ahorro'));

    if (!ahorroInput || !faltaInput) {
        console.error('Elemento del DOM no encontrado.');
        return;
    }

    if (datos) {
        ahorroInput.value = datos.ahorro || 0;

        const falta = Math.max(obtenerMetaAhorro() - parseFloat(datos.ahorro), 0).toFixed(2);
        faltaInput.value = falta;

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

        document.getElementById('ahorro').value = '';
        document.getElementById('faltaPorAhorar').value = '';
        document.getElementById('nuevoAhorro').value = '';
        document.getElementById('estadisticasList').innerHTML = '';

        actualizarProgressBar(0);

        mostrarMensaje('fa-trash', 'Progreso eliminado correctamente');
    }
}

// Exportar e importar JSON
function exportarJSON() {
    const datos = {
        ahorro: document.getElementById('ahorro').value,
        estadisticas: JSON.parse(localStorage.getItem('estadisticas')) || [],
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
    downloadLink.innerHTML = '<i class="fas fa-file-download"></i> Descargar JSON';

    mostrarMenu('exportar');
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

function actualizarMetaAhorro() {
    const nuevaMeta = parseFloat(document.getElementById("metaAhorro").value);
    if (esNumeroValido(nuevaMeta) && nuevaMeta > 0) {
        localStorage.setItem("metaAhorro", nuevaMeta);
        actualizarProgressBar(parseFloat(document.getElementById("ahorro").value || 0));
        mostrarMenu("fa-check", "Nueva meta establecida:  $${nuevaMeta.toFixed(2)}");
    } else {
        mostrarMensaje('fa-exclamation-triangle', 'Por favor ingresa una meta válida.');
    }
}

function obtenerMetaAhorro() {
    return parseFloat(localStorage.getItem('metaAhorro')) || 100;
}