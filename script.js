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
    document.getElementById('menuExportar').style.display = (tipo === 'exportar') ? 'block' : 'none';
    document.getElementById('menuImportar').style.display = (tipo === 'importar') ? 'block' : 'none';
}

function actualizarProgressBar(valor) {
    const metaAhorroInput = document.getElementById("metaAhorroInput");
    const progressBar = document.getElementById('progressBar');

    if (metaAhorroInput && progressBar) {
        const porcentaje = Math.min((valor / metaAhorroInput.value) * 100, 100);
        progressBar.style.width = porcentaje + '%';
        progressBar.setAttribute('data-progress', Math.round(porcentaje));

        const metaAhorroTexto = document.getElementById("metaAhorroTexto");
        if (metaAhorroTexto) {
            metaAhorroTexto.textContent = `Faltan: $${(metaAhorroInput.value - valor).toFixed(2)}`;
        }
    } else {
        console.error('Elementos no encontrados.');
    }
}

function manejarAhorro(isAddition) {
    const ahorroInput = document.getElementById('ahorro');
    const nuevoAhorroInput = document.getElementById('nuevoAhorro');
    const metaAhorroInput = document.getElementById('metaAhorroInput');

    const ahorroActual = parseFloat(ahorroInput.value) || 0;
    const nuevoAhorro = parseFloat(nuevoAhorroInput.value);

    if (esNumeroValido(nuevoAhorro) && nuevoAhorro > 0) {
        const nuevaMeta = parseFloat(metaAhorroInput.value) || 0;
        const nuevoTotal = isAddition ? 
            (ahorroActual + nuevoAhorro) : 
            Math.max(ahorroActual - nuevoAhorro, 0);

        const totalRedondeado = parseFloat(nuevoTotal.toFixed(2));
        const falta = Math.max(nuevaMeta - totalRedondeado, 0).toFixed(2);

        ahorroInput.value = totalRedondeado;
        actualizarProgressBar(totalRedondeado);

        mostrarMensaje('fa-info-circle', `Has ahorrado $${totalRedondeado.toFixed(2)} (${((totalRedondeado / nuevaMeta) * 100).toFixed(1)}% de tu meta)`);

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
        const ahorroFormatted = item.ahorro.toFixed(2);
        const li = document.createElement('li');
        li.innerHTML = `<i class="fas fa-chart-line"></i> $${escaparHTML(ahorroFormatted)} <small>${escaparHTML(item.fecha)}</small>`;
        lista.appendChild(li);
    });
}

function guardarProgreso() {
    const ahorroInput = document.getElementById('ahorro');
    const metaAhorroInput = document.getElementById('metaAhorroInput');

    if (ahorroInput && metaAhorroInput) {
        const ahorroActual = parseFloat(ahorroInput.value) || 0;
        const meta = parseFloat(metaAhorroInput.value) || 0;

        const datos = { ahorro: ahorroActual, meta };
        localStorage.setItem('ahorro', JSON.stringify(datos));
        mostrarMensaje('fa-check-circle', 'Progreso guardado correctamente.');
    } else {
        mostrarMensaje('fa-exclamation-triangle', 'No se pudo guardar el progreso.');
    }
}

function cargarProgreso() {
    const metaAhorroTexto = document.getElementById('metaAhorroTexto');
    const metaAhorroInput = document.getElementById('metaAhorroInput');
    const datos = JSON.parse(localStorage.getItem('ahorro'));

    if (datos) {
        metaAhorroInput.value = datos.meta || 0;
        metaAhorroTexto.textContent = `Faltan: $${(datos.meta - datos.ahorro).toFixed(2)}`;
        actualizarProgressBar(datos.ahorro);
        actualizarListaEstadisticas();
        mostrarMensaje('fa-sync-alt', `Datos cargados: ${new Date().toLocaleDateString('es-ES')}`);
    } else {
        mostrarMensaje('fa-exclamation-triangle', 'No hay datos guardados');
    }
}

function eliminarGuardado() {
    if (confirm('¿Estás seguro de que deseas eliminar todo tu progreso guardado?')) {
        localStorage.removeItem('ahorro');
        localStorage.removeItem('estadisticas');

        const ahorroInput = document.getElementById('ahorro');
        const nuevoAhorroInput = document.getElementById('nuevoAhorro');
        const estadisticasList = document.getElementById('estadisticasList');

        if (ahorroInput) ahorroInput.value = '';
        if (nuevoAhorroInput) nuevoAhorroInput.value = '';
        if (estadisticasList) estadisticasList.innerHTML = '';

        actualizarProgressBar(0);
        mostrarMensaje('fa-trash', 'Progreso eliminado correctamente');
    }
}

function exportarJSON() {
    const metaAhorroInput = document.getElementById("metaAhorroInput");
    const ahorroInput = document.getElementById('ahorro');

    if (metaAhorroInput && ahorroInput) {
        const metaAhorro = parseFloat(metaAhorroInput.value) || 0;
        const ahorro = parseFloat(ahorroInput.value) || 0;

        const deficit = Math.max(metaAhorro - ahorro, 0).toFixed(2);
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
        exportarLink.innerHTML = ''; // Limpia el contenido anterior
        exportarLink.appendChild(downloadLink);
        downloadLink.innerHTML = `<i class="fas fa-file-download"></i> Descargar JSON`;

        mostrarMensaje('fa-check-circle', 'Datos exportados correctamente. Haz clic en "Descargar JSON" para guardarlos.');
    } else {
        mostrarMensaje('fa-exclamation-circle', 'Error: No se pudo acceder a los datos de ahorro o meta.');
        console.error('No se pudo acceder a metaAhorro o ahorro.');
    }
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
    document.getElementById('jsonExportar').value = '';
    const exportarLink = document.getElementById('jsonExportarLink');
    exportarLink.innerHTML = ''; // Limpia el contenido del enlace
}

// Inicializar elementos DOM
document.getElementById('btnGuardar').addEventListener('click', () => manejarAhorro(true));
document.getElementById('btnRetirar').addEventListener('click', () => manejarAhorro(false));
document.getElementById('btnGuardarProgreso').addEventListener('click', guardarProgreso);
document.getElementById('btnEliminarProgreso').addEventListener('click', eliminarGuardado);
document.getElementById('btnExportarJSON').addEventListener('click', exportarJSON);
document.getElementById('btnImportarJSON').addEventListener('click', importarJSON);
document.getElementById('btnCerrarImportar').addEventListener('click', cerrarVentanaImportar);
document.getElementById('btnCerrarExportar').addEventListener('click', cerrarVentanaExportar);
