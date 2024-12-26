// Inicialización
document.addEventListener('DOMContentLoaded', function() {
    cargarProgreso();
    actualizarListaEstadisticas();
    configurarNotificaciones();
    inicializarEventListeners();
    verificarDatosIniciales();
});

// Utilidades básicas
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

// Sistema de notificaciones
function configurarNotificaciones() {
    if (!("Notification" in window)) return;
    
    Notification.requestPermission().then(function(permission) {
        if (permission === "granted") {
            establecerRecordatorioAhorro();
        }
    });
}

function establecerRecordatorioAhorro() {
    const intervalo = 24 * 60 * 60 * 1000;
    setInterval(() => {
        const ultimoAhorro = obtenerUltimoAhorro();
        if (Date.now() - new Date(ultimoAhorro.fecha).getTime() > intervalo) {
            new Notification("Recordatorio de ahorro", {
                body: "¡No olvides registrar tu ahorro diario!",
                icon: "path-to-icon.png"
            });
        }
    }, intervalo);
}

// Gestión de menús
function mostrarMenu(tipo) {
    const menuExportar = document.getElementById('menuExportar');
    const menuImportar = document.getElementById('menuImportar');
    menuExportar.style.display = (tipo === 'exportar') ? 'block' : 'none';
    menuImportar.style.display = (tipo === 'importar') ? 'block' : 'none';
}

// Gestión de la barra de progreso
function actualizarProgressBar(valor) {
    const metaAhorroInput = document.getElementById("metaAhorroInput");
    const progressBar = document.getElementById('progressBar');
    const metaAhorroTexto = document.getElementById("metaAhorroTexto");
    const metaAhorro = parseFloat(metaAhorroInput?.value) || 0;

    if (!progressBar || metaAhorro <= 0) {
        console.error("Elemento de barra de progreso o meta no válidos.");
        return;
    }

    const porcentaje = Math.min((valor / metaAhorro) * 100, 100);
    progressBar.style.width = `${porcentaje}%`;
    progressBar.setAttribute('data-progress', Math.round(porcentaje));

    if (metaAhorroTexto) {
        metaAhorroTexto.textContent = porcentaje >= 100
            ? "¡Meta alcanzada!"
            : `Falta: $${(metaAhorro - valor).toFixed(2)}`;
    }
}

// Manejo de ahorros
function manejarAhorro(isAddition) {
    const ahorroInput = document.getElementById('ahorro');
    const nuevoAhorroInput = document.getElementById('nuevoAhorro');
    const metaAhorroInput = document.getElementById('metaAhorroInput');
    
    const ahorroActual = parseFloat(ahorroInput.value) || 0;
    const nuevoAhorro = parseFloat(nuevoAhorroInput.value);
    const nuevaMeta = parseFloat(metaAhorroInput.value) || 0;

    if (esNumeroValido(nuevoAhorro) && nuevoAhorro > 0) {
        const nuevoTotal = isAddition ? 
            (ahorroActual + nuevoAhorro) : 
            Math.max(ahorroActual - nuevoAhorro, 0);
        
        const totalRedondeado = parseFloat(nuevoTotal.toFixed(2));
        ahorroInput.value = totalRedondeado;
        
        actualizarProgressBar(totalRedondeado);
        mostrarMensaje('fa-info-circle', 
            `Has ahorrado $${totalRedondeado.toFixed(2)} (${((totalRedondeado / nuevaMeta) * 100).toFixed(1)}% de tu meta)`);
        
        guardarEnEstadisticas(totalRedondeado);
        nuevoAhorroInput.value = '';
    } else {
        mostrarMensaje('fa-exclamation-triangle', 'Por favor ingresa una cantidad válida.');
    }
}

function calcularTendencia(estadisticas) {
    const ultimos = estadisticas.slice(-3);
    if (ultimos.length < 2) return 'neutral';
    
    const diferencia = ultimos[ultimos.length - 1].ahorro - ultimos[0].ahorro;
    return diferencia > 0 ? 'positiva' : diferencia < 0 ? 'negativa' : 'neutral';
}

function calcularProyeccion(estadisticas) {
    const ultimos = estadisticas.slice(-3);
    if (ultimos.length < 2) return null;
    
    const cambioPromedio = (ultimos[ultimos.length - 1].ahorro - ultimos[0].ahorro) / (ultimos.length - 1);
    return ultimos[ultimos.length - 1].ahorro + (cambioPromedio * 3);
}

// Gestión de estadísticas
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
    lista.innerHTML = ''; // Limpia la lista

    estadisticas.slice(-10).reverse().forEach((item, index, arr) => {
        const li = document.createElement('li');
        
        // Calcular diferencia
        const anterior = index < arr.length - 1 ? arr[index + 1].ahorro : null;
        const diferencia = anterior !== null ? (item.ahorro - anterior).toFixed(2) : null;

        // Definir ícono y texto de diferencia
        let icono = diferencia > 0 
            ? '<i class="fas fa-arrow-up"></i>'
            : diferencia < 0 
                ? '<i class="fas fa-arrow-down"></i>'
                : '';

        // Formatear fecha
        const fechaValida = new Date();
        const fecha = isNaN(fechaValida.getTime())
            ? "Fecha no disponible"
            : fechaValida.toLocaleDateString('es-EC', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
            });

        // Construir contenido del elemento
        li.innerHTML = `
            <span>${icono} ${diferencia || "Inicio de ahorro"}</span>
            <small>${fecha}</small>
            <span class="total">$${item.ahorro.toFixed(2)}</span>
        `;

        lista.appendChild(li);
    });
}


// Gestión de almacenamiento
function guardarProgreso() {
    const ahorroInput = document.getElementById('ahorro');
    const metaAhorroInput = document.getElementById('metaAhorroInput');
    
    if (ahorroInput && metaAhorroInput) {
        const datos = {
            ahorro: parseFloat(ahorroInput.value) || 0,
            meta: parseFloat(metaAhorroInput.value) || 0
        };
        localStorage.setItem('ahorro', JSON.stringify(datos));
        mostrarMensaje('fa-check-circle', 'Progreso guardado correctamente.');
    }
}

function cargarProgreso() {
    const datos = JSON.parse(localStorage.getItem('ahorro'));
    if (!datos) {
        mostrarMensaje('fa-exclamation-triangle', 'No hay datos guardados');
        return;
    }

    const ahorroInput = document.getElementById('ahorro');
    const metaAhorroInput = document.getElementById('metaAhorroInput');
    const metaAhorroTexto = document.getElementById('metaAhorroTexto');

    if (ahorroInput) ahorroInput.value = datos.ahorro || 0;
    if (metaAhorroInput) metaAhorroInput.value = datos.meta || 0;
    if (metaAhorroTexto) {
        metaAhorroTexto.textContent = `Falta: $${(datos.meta - datos.ahorro).toFixed(2)}`;
    }

    actualizarProgressBar(datos.ahorro);
    actualizarListaEstadisticas();
    mostrarMensaje('fa-sync-alt', `Datos cargados: ${new Date().toLocaleDateString('es-ES')}`);
}

function eliminarGuardado() {
    if (confirm('¿Estás seguro de que deseas eliminar todo tu progreso guardado?')) {
        localStorage.removeItem('ahorro');
        localStorage.removeItem('estadisticas');
        localStorage.removeItem('ultimo_backup');

        // Limpia la interfaz
        ['ahorro', 'metaAhorroInput', 'nuevoAhorro'].forEach(id => {
            const elemento = document.getElementById(id);
            if (elemento) elemento.value = '';
        });

        const listaEstadisticas = document.getElementById('estadisticasList');
        if (listaEstadisticas) listaEstadisticas.innerHTML = '';

        const progressBar = document.getElementById('progressBar');
        if (progressBar) progressBar.style.width = '0%';

        const resultado = document.getElementById('resultado');
        if (resultado) resultado.textContent = 'Ingresa tu primer ahorro para comenzar.';

        // Muestra el formulario inicial nuevamente
        document.getElementById('modalInicial').style.display = 'flex';
    }
}

function exportarJSON() {
    try {
        const ahorro = parseFloat(document.getElementById('ahorro').value) || 0;
        const metaAhorro = parseFloat(document.getElementById('metaAhorroInput').value) || 0;
        const estadisticas = JSON.parse(localStorage.getItem('estadisticas')) || [];
        
        const datos = {
            ahorro,
            metaAhorro,
            estadisticas,
            fechaExportacion: new Date().toISOString(),
        };

        const blob = new Blob([JSON.stringify(datos, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `exportar_ahorros_${new Date().toISOString().slice(0, 10)}.json`;
        link.click();

        mostrarMensaje('fa-check-circle', 'Exportación completada correctamente.');
    } catch (error) {
        console.error("Error al exportar datos:", error);
        mostrarMensaje('fa-exclamation-circle', 'Error al exportar los datos.');
    }
}

function importarJSON() {
    const archivo = document.getElementById('importarArchivo')?.files[0];

    if (!archivo) {
        mostrarMensaje('fa-exclamation-triangle', 'Selecciona un archivo válido para importar.');
        return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
        try {
            const datos = JSON.parse(event.target.result);
            if (!datos.ahorro || !datos.metaAhorro) {
                throw new Error('Datos incompletos en el archivo.');
            }

            // Guardar datos en localStorage
            localStorage.setItem('ahorro', JSON.stringify({ ahorro: datos.ahorro, meta: datos.metaAhorro }));
            localStorage.setItem('estadisticas', JSON.stringify(datos.estadisticas || []));

            // Actualizar interfaz
            cargarProgreso();
            mostrarMensaje('fa-check-circle', 'Importación completada correctamente.');
        } catch (error) {
            console.error("Error al importar datos:", error);
            mostrarMensaje('fa-exclamation-triangle', 'Error al procesar el archivo JSON.');
        }
    };

    reader.readAsText(archivo);
}


function procesarDatosImportados(contenidoJSON) {
    try {
        const datos = JSON.parse(contenidoJSON);
        if (datos.ahorro === undefined || datos.metaAhorro === undefined) {
            throw new Error('Datos incompletos: Ahorro o Meta de Ahorro faltante');
        }

        // Almacenamiento de datos en localStorage
        localStorage.setItem('ahorro', JSON.stringify(datos));
        localStorage.setItem('estadisticas', JSON.stringify(datos.estadisticas || []));
        localStorage.setItem("metaAhorro", JSON.stringify(datos.metaAhorro));

        // Verificación si el elemento existe antes de acceder a su estilo
        const barraProgreso = document.getElementById('barraProgreso');
        if (barraProgreso) {
            const progresoPorcentaje = ((datos.ahorro / datos.metaAhorro) * 100).toFixed(2);
            barraProgreso.style.width = progresoPorcentaje + '%';
            document.getElementById('porcentajeProgreso').innerText = progresoPorcentaje + '%';
        }

        cerrarVentanaImportar();
        mostrarMensaje('fa-check', 'Datos importados correctamente');
    } catch (e) {
        mostrarMensaje('fa-exclamation-triangle', `Error al procesar el archivo JSON: ${e.message}`);
        console.error(e);
    }
}

// Gestión de ventanas
function cerrarVentanaImportar() {
    document.getElementById('menuImportar').style.display = 'none';
    document.getElementById('importarArchivo').value = '';
    document.getElementById('jsonImportar').value = '';
}

function cerrarVentanaExportar() {
    document.getElementById('menuExportar').style.display = 'none';
}

// Event Listeners
function inicializarEventListeners() {
    const metaAhorroInput = document.getElementById('metaAhorroInput');
    if (metaAhorroInput) {
        metaAhorroInput.addEventListener('input', actualizarMetaAhorro);
    }
}

function actualizarMetaAhorro() {
    const metaAhorroInput = document.getElementById('metaAhorroInput');
    const ahorroActual = parseFloat(document.getElementById('ahorro').value) || 0;
    const metaAhorro = parseFloat(metaAhorroInput.value) || 0;

    if (metaAhorro > 0) {
        // Cálculo del porcentaje de progreso
        let progreso = (ahorroActual / metaAhorro) * 100;
        progreso = Math.min(progreso, 100); // Asegura que no supere el 100%

        // Actualiza la barra de progreso
        const progressBar = document.getElementById('progressBar');
        if (progressBar) {
            progressBar.style.width = `${progreso}%`; // Ancho de la barra
            progressBar.setAttribute('data-progress', Math.round(progreso)); // Atributo de progreso
        }

        // Actualiza el texto del resultado
        const resultado = document.getElementById('resultado');
        if (resultado) {
            resultado.textContent = progreso >= 100 
                ? '¡Felicidades! Has alcanzado tu meta de ahorro.' 
                : `Progreso: ${progreso.toFixed(2)}%`; // Formatea el porcentaje

            // Cambia el estilo si se alcanza el 100%
            if (progreso >= 100) {
                resultado.classList.add('complete');
            } else {
                resultado.classList.remove('complete');
            }
        }

        // Actualiza el texto debajo del input de meta (meta restante)
        const metaAhorroTexto = document.getElementById('metaAhorroTexto');
        if (metaAhorroTexto) {
            const cantidadRestante = metaAhorro - ahorroActual;
            metaAhorroTexto.textContent = cantidadRestante > 0
                ? `Falta: $${cantidadRestante.toFixed(2)}`
                : "¡Meta cumplida!";
        }

    } else {
        console.error('Meta de ahorro no válida.');
        const resultado = document.getElementById('resultado');
        if (resultado) {
            resultado.textContent = 'Por favor, introduce una meta de ahorro válida.';
            resultado.classList.remove('complete');
        }
    }
}

// Sistema de etiquetas
function agregarEtiqueta(indice, etiqueta) {
    const estadisticas = JSON.parse(localStorage.getItem('estadisticas')) || [];
    if (estadisticas[indice]) {
        estadisticas[indice].etiqueta = etiqueta;
        localStorage.setItem('estadisticas', JSON.stringify(estadisticas));
        actualizarListaEstadisticas();
    }
}

// Funciones de ayuda
function obtenerUltimoAhorro() {
    const estadisticas = JSON.parse(localStorage.getItem('estadisticas')) || [];
    return estadisticas[estadisticas.length - 1] || { fecha: new Date() };
}

// Funciones de validación
function validarDatos(datos) {
    return datos && 
           typeof datos === 'object' &&
           !isNaN(datos.ahorro) &&
           !isNaN(datos.meta) &&
           datos.ahorro >= 0 &&
           datos.meta >= 0;
}

// Sistema de respaldo automático
function configurarBackupAutomatico() {
    setInterval(() => {
        const ultimoBackup = localStorage.getItem('ultimo_backup');
        if (!ultimoBackup || Date.now() - new Date(ultimoBackup).getTime() > 86400000) {
            guardarProgreso();
            localStorage.setItem('ultimo_backup', new Date().toISOString());
        }
    }, 3600000); // Verificar cada hora
}

// Funciones de formateo
function formatearMoneda(valor) {
    return new Intl.NumberFormat('es-ES', {
        style: 'currency',
        currency: 'EUR'
    }).format(valor);
}

function formatearFecha(fecha) {
    return new Date(fecha).toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

// Inicialización de la aplicación
window.addEventListener('load', () => {
    configurarBackupAutomatico();
    inicializarEventListeners();
    cargarProgreso();

    // Agregar event listener al input de metaAhorro para actualizar el progress bar
    const metaAhorroInput = document.getElementById('metaAhorroInput');
    if (metaAhorroInput) {
        metaAhorroInput.addEventListener('input', actualizarMetaAhorro);
    }
});

function guardarDatosIniciales() {
    const metaInicial = parseFloat(document.getElementById('metaInicial').value) || 0;
    const ahorroInicial = parseFloat(document.getElementById('ahorroInicial').value) || 0;

    if (metaInicial > 0 && ahorroInicial >= 0) {
        // Guardar en localStorage
        localStorage.setItem('ahorro', JSON.stringify({ ahorro: ahorroInicial, meta: metaInicial }));
        localStorage.setItem('estadisticas', JSON.stringify([{ ahorro: ahorroInicial, fecha: new Date().toISOString() }]));

        // Actualizar la interfaz
        document.getElementById('ahorro').value = ahorroInicial.toFixed(2);
        document.getElementById('metaAhorroInput').value = metaInicial.toFixed(2);

        // Cerrar el modal
        document.getElementById('modalInicial').style.display = 'none';
        actualizarMetaAhorro();
    } else {
        alert('Por favor, ingresa valores válidos.');
    }
}


// Manejo de errores global
window.onerror = function(mensaje, archivo, linea, columna, error) {
    console.error('Error en la aplicación:', {
        mensaje,
        archivo,
        linea,
        columna,
        error
    });
    
    mostrarMensaje('fa-exclamation-circle', 
        'Ha ocurrido un error. Por favor, recarga la página o contacta soporte.');
    
    return false;
};

function habilitarEdicion(campoId) {
    const campo = document.getElementById(campoId);
    const boton = document.getElementById('editarAhorroBtn');

    if (campo.readOnly) {
        campo.readOnly = false;
        boton.innerHTML = '<i class="fas fa-check"></i>';
        boton.onclick = () => guardarEdicion(campoId);
    }
}

function guardarEdicion(campoId) {
    const campo = document.getElementById(campoId);
    const boton = document.getElementById('editarAhorroBtn');
    const nuevoValor = parseFloat(campo.value) || 0;

    // Guardar el nuevo valor en localStorage
    const datos = JSON.parse(localStorage.getItem('ahorro'));
    datos.ahorro = nuevoValor;
    localStorage.setItem('ahorro', JSON.stringify(datos));

    // Actualizar estadísticas
    guardarEnEstadisticas(nuevoValor);

    // Deshabilitar el campo y restablecer el botón
    campo.readOnly = true;
    boton.innerHTML = '<i class="fas fa-edit"></i>';
    boton.onclick = () => habilitarEdicion(campoId);

    actualizarMetaAhorro();
}

function verificarDatosIniciales() {
    const datos = JSON.parse(localStorage.getItem('ahorro'));
    
    if (!datos) {
        // Si no hay datos, mostrar el formulario inicial
        document.getElementById('modalInicial').style.display = 'flex';
    } else {
        // Si ya hay datos, carga el progreso
        cargarProgreso();
    }
}
