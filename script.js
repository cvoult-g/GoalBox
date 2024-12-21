// Inicialización al cargar la página
document.addEventListener('DOMContentLoaded', function() {
    cargarProgreso();
    actualizarListaEstadisticas();
});

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
    const porcentaje = Math.min((valor / 100) * 100, 100);
    const progressBar = document.getElementById('progressBar');
    progressBar.style.width = porcentaje + '%';
    progressBar.setAttribute('data-progress', Math.round(porcentaje));
}

function manejarAhorro(isAddition) {
    const ahorroActual = parseFloat(document.getElementById('ahorro').value) || 0;
    const nuevoAhorro = parseFloat(document.getElementById('nuevoAhorro').value);

    if (!isNaN(nuevoAhorro) && nuevoAhorro > 0) {
        let nuevoTotal = isAddition ? 
            (ahorroActual + nuevoAhorro) : 
            Math.max(ahorroActual - nuevoAhorro, 0);
        
        nuevoTotal = parseFloat(nuevoTotal.toFixed(2));
        
        document.getElementById('ahorro').value = nuevoTotal;
        const falta = Math.max(100 - nuevoTotal, 0).toFixed(2);
        document.getElementById('faltaPorAhorar').value = falta;
        
        actualizarProgressBar(nuevoTotal);
        
        document.getElementById('resultado').innerHTML = 
            `Has ahorrado ${nuevoTotal.toFixed(2)}$ (${((nuevoTotal / 100) * 100).toFixed(1)}% de tu meta)`;
        
        guardarEnEstadisticas(nuevoTotal);
        document.getElementById('nuevoAhorro').value = '';
    } else {
        manejarError('Por favor ingresa una cantidad válida.');
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
        const li = document.createElement('li');
        li.innerHTML = `
            <i class="fas fa-chart-line"></i>
            $${item.ahorro.toFixed(2)} 
            <small>${item.fecha}</small>
        `;
        lista.appendChild(li);
    });
}

function guardarProgreso() {
    const ahorro = document.getElementById('ahorro').value;
    const estadisticas = JSON.parse(localStorage.getItem('estadisticas')) || [];
    localStorage.setItem('ahorro', JSON.stringify({ 
        ahorro, 
        estadisticas,
        ultimaActualizacion: new Date().toISOString()
    }));
    
    document.getElementById('resultado').innerHTML = 
        '<i class="fas fa-check"></i> Progreso guardado correctamente';
}

function cargarProgreso() {
    const datos = JSON.parse(localStorage.getItem('ahorro'));
    if (datos) {
        document.getElementById('ahorro').value = datos.ahorro;
        const falta = Math.max(100 - parseFloat(datos.ahorro), 0).toFixed(2);
        document.getElementById('faltaPorAhorar').value = falta;
        
        actualizarProgressBar(datos.ahorro);
        actualizarListaEstadisticas();
        
        document.getElementById('resultado').innerHTML = 
            `<i class="fas fa-sync-alt"></i> Datos cargados: ${new Date(datos.ultimaActualizacion).toLocaleDateString('es-ES')}`;
    } else {
        document.getElementById('resultado').innerHTML = 
            '<i class="fas fa-exclamation-triangle"></i> No hay datos guardados';
    }
}

function eliminarGuardado() {
    if (confirm('¿Estás seguro de que deseas eliminar todo tu progreso guardado?')) {
        localStorage.removeItem('ahorro');
        localStorage.removeItem('estadisticas');
        
        document.getElementById('ahorro').value = '';
        document.getElementById('faltaPorAhorar').value = '100';
        document.getElementById('nuevoAhorro').value = '';
        document.getElementById('estadisticasList').innerHTML = '';
        
        actualizarProgressBar(0);
        
        document.getElementById('resultado').innerHTML = 
            '<i class="fas fa-trash"></i> Progreso eliminado correctamente';
    }
}

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
    
    document.getElementById('jsonExportarLink').innerHTML = '';
    document.getElementById('jsonExportarLink').appendChild(downloadLink);
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
        manejarError('Por favor selecciona un archivo o pega el contenido JSON');
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
            
            document.getElementById('resultado').innerHTML = 
                '<i class="fas fa-check"></i> Datos importados correctamente';
        } else {
            manejarError('El formato del JSON no es válido');
        }
    } catch (e) {
        manejarError('Error al procesar el archivo JSON');
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

function manejarError(mensaje) {
    document.getElementById('resultado').innerHTML = 
        `<i class="fas fa-exclamation-triangle"></i> ${mensaje}`;
}