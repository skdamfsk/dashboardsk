// Variables globales
let currentTab = 'registro';
let lastUpdateDate = null;

// Inicialización
document.addEventListener("DOMContentLoaded", function () {
    mostrarFecha();
    cargarDatos();
    verificarRegistroDiario();
    setInterval(verificarRegistroDiario, 3600000); // Verificar cada hora
});

// Funciones de utilidad
function mostrarFecha() {
    let fecha = new Date();
    let opciones = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    let fechaFormateada = fecha.toLocaleDateString('es-ES', opciones);
    document.getElementById("fechaActual").innerText = `Fecha actual: ${fechaFormateada}`;
}

function obtenerSemanaActual() {
    let fecha = new Date();
    let primeraSemana = new Date(fecha.getFullYear(), 0, 1);
    let diferencia = fecha - primeraSemana;
    return Math.ceil(diferencia / (1000 * 60 * 60 * 24 * 7));
}

function cambiarTab(tabId) {
    // Ocultar todos los contenidos
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.remove('active');
    });
    
    // Desactivar todos los botones
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    // Mostrar el contenido seleccionado
    document.getElementById(tabId).classList.add('active');
    
    // Activar el botón seleccionado
    document.querySelector(`.tab-btn[onclick*="${tabId}"]`).classList.add('active');
    
    currentTab = tabId;
    
    // Actualizar la visualización según la pestaña
    switch(tabId) {
        case 'registro':
            actualizarResumen();
            break;
        case 'doordash':
            actualizarResumenDoorDash();
            break;
        case 'fondeo':
            actualizarFondeo();
            break;
        case 'metricas':
            actualizarMetricas();
            break;
    }
}

// Funciones de datos
function guardarDatos() {
    let ingresos = parseFloat(document.getElementById("ingresos").value) || 0;
    let gastos = parseFloat(document.getElementById("gastos").value) || 0;
    let gasolina = parseFloat(document.getElementById("gasolina").value) || 0;
    
    let fecha = new Date();
    let registro = {
        fecha: fecha.toISOString(),
        ingresos,
        gastos,
        gasolina
    };
    
    let registros = JSON.parse(localStorage.getItem("registros")) || [];
    registros.push(registro);
    localStorage.setItem("registros", JSON.stringify(registros));
    
    // Actualizar última fecha de registro
    lastUpdateDate = fecha;
    localStorage.setItem("lastUpdateDate", fecha.toISOString());
    
    // Limpiar campos
    document.getElementById("ingresos").value = "";
    document.getElementById("gastos").value = "";
    document.getElementById("gasolina").value = "";
    
    actualizarResumen();
    mostrarNotificacion("Datos guardados correctamente", "success");
}

function guardarDatosDoorDash() {
    let horas = parseFloat(document.getElementById("horasDash").value) || 0;
    let ingresos = parseFloat(document.getElementById("ingresosDash").value) || 0;
    
    let registro = {
        fecha: new Date().toISOString(),
        horas,
        ingresos
    };
    
    let registrosDash = JSON.parse(localStorage.getItem("registrosDash")) || [];
    registrosDash.push(registro);
    localStorage.setItem("registrosDash", JSON.stringify(registrosDash));
    
    document.getElementById("horasDash").value = "";
    document.getElementById("ingresosDash").value = "";
    
    actualizarResumenDoorDash();
    mostrarNotificacion("Registro DoorDash guardado", "success");
}

function actualizarResumen() {
    let registros = JSON.parse(localStorage.getItem("registros")) || [];
    let hoy = new Date();
    let inicioMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
    
    let registrosMes = registros.filter(r => new Date(r.fecha) >= inicioMes);
    
    let totalIngresos = registrosMes.reduce((acc, r) => acc + r.ingresos, 0);
    let totalGastos = registrosMes.reduce((acc, r) => acc + r.gastos, 0);
    let totalGasolina = registrosMes.reduce((acc, r) => acc + r.gasolina, 0);
    
    document.getElementById("resumen").innerHTML = `
        <div class="stats-grid">
            <div class="stat-card">
                <h4>Ingresos del Mes</h4>
                <p>$${totalIngresos.toFixed(2)}</p>
            </div>
            <div class="stat-card">
                <h4>Gastos del Mes</h4>
                <p>$${totalGastos.toFixed(2)}</p>
            </div>
            <div class="stat-card">
                <h4>Gasolina del Mes</h4>
                <p>$${totalGasolina.toFixed(2)}</p>
            </div>
        </div>
        <canvas id="graficoResumen"></canvas>
    `;
    
    generarGraficoResumen(totalIngresos, totalGastos, totalGasolina);
}

function actualizarResumenDoorDash() {
    let registros = JSON.parse(localStorage.getItem("registrosDash")) || [];
    let hoy = new Date();
    let inicioMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
    
    let registrosMes = registros.filter(r => new Date(r.fecha) >= inicioMes);
    
    let totalHoras = registrosMes.reduce((acc, r) => acc + r.horas, 0);
    let totalIngresos = registrosMes.reduce((acc, r) => acc + r.ingresos, 0);
    let promedioPorHora = totalHoras > 0 ? totalIngresos / totalHoras : 0;
    
    document.getElementById("resumenDoorDash").innerHTML = `
        <div class="stats-grid">
            <div class="stat-card">
                <h4>Horas Trabajadas</h4>
                <p>${totalHoras.toFixed(1)} hrs</p>
            </div>
            <div class="stat-card">
                <h4>Ingresos Totales</h4>
                <p>$${totalIngresos.toFixed(2)}</p>
            </div>
            <div class="stat-card">
                <h4>Promedio por Hora</h4>
                <p>$${promedioPorHora.toFixed(2)}/hr</p>
            </div>
        </div>
        <canvas id="graficoDoorDash"></canvas>
    `;
    
    generarGraficoDoorDash(registrosMes);
}

function actualizarFondeo() {
    let registros = JSON.parse(localStorage.getItem("registros")) || [];
    let metaMensual = parseFloat(localStorage.getItem("metaMensual")) || 0;
    let hoy = new Date();
    let inicioMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
    
    let registrosMes = registros.filter(r => new Date(r.fecha) >= inicioMes);
    let totalIngresos = registrosMes.reduce((acc, r) => acc + r.ingresos, 0);
    let progreso = (totalIngresos / metaMensual) * 100;
    
    document.getElementById("progresoFondeo").innerHTML = `
        <div class="progress-bar">
            <div class="progress" style="width: ${Math.min(progreso, 100)}%"></div>
        </div>
        <p>${progreso.toFixed(1)}% de la meta ($${metaMensual})</p>
    `;
    
    generarGraficoFondeo(registrosMes, metaMensual);
}

function actualizarMetricas() {
    let registros = JSON.parse(localStorage.getItem("registros")) || [];
    let hoy = new Date();
    let inicioMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
    
    let registrosMes = registros.filter(r => new Date(r.fecha) >= inicioMes);
    let totalIngresos = registrosMes.reduce((acc, r) => acc + r.ingresos, 0);
    let totalGastos = registrosMes.reduce((acc, r) => acc + (r.gastos + r.gasolina), 0);
    let ahorro = totalIngresos - totalGastos;
    
    let diasTranscurridos = Math.ceil((hoy - inicioMes) / (1000 * 60 * 60 * 24));
    let promedioDiario = ahorro / diasTranscurridos;
    
    document.getElementById("ahorroMensual").innerHTML = `$${ahorro.toFixed(2)}`;
    document.getElementById("promedioDiario").innerHTML = `$${promedioDiario.toFixed(2)}/día`;
    
    generarGraficoTendencia(registrosMes);
}

// Funciones de gráficos
function generarGraficoResumen(ingresos, gastos, gasolina) {
    let ctx = document.getElementById("graficoResumen").getContext("2d");
    new Chart(ctx, {
        type: "bar",
        data: {
            labels: ["Ingresos", "Gastos", "Gasolina"],
            datasets: [{
                data: [ingresos, gastos, gasolina],
                backgroundColor: ["#28a745", "#dc3545", "#ffc107"]
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    display: false
                }
            }
        }
    });
}

function generarGraficoDoorDash(registros) {
    let ctx = document.getElementById("graficoDoorDash").getContext("2d");
    
    let datos = registros.map(r => ({
        x: new Date(r.fecha),
        y: r.ingresos / r.horas
    }));
    
    new Chart(ctx, {
        type: "line",
        data: {
            datasets: [{
                label: "Ingresos por Hora",
                data: datos,
                borderColor: "#28a745",
                fill: false
            }]
        },
        options: {
            responsive: true,
            scales: {
                x: {
                    type: 'time',
                    time: {
                        unit: 'day'
                    }
                }
            }
        }
    });
}

function generarGraficoFondeo(registros, meta) {
    let ctx = document.getElementById("graficoFondeo").getContext("2d");
    
    let datos = registros.map(r => ({
        x: new Date(r.fecha),
        y: r.ingresos
    }));
    
    new Chart(ctx, {
        type: "line",
        data: {
            datasets: [{
                label: "Ingresos Diarios",
                data: datos,
                borderColor: "#28a745",
                fill: false
            }]
        },
        options: {
            responsive: true,
            scales: {
                x: {
                    type: 'time',
                    time: {
                        unit: 'day'
                    }
                },
                y: {
                    suggestedMax: meta / 30
                }
            }
        }
    });
}

function generarGraficoTendencia(registros) {
    let ctx = document.getElementById("graficoTendencia").getContext("2d");
    
    let datos = registros.map(r => ({
        x: new Date(r.fecha),
        y: r.ingresos - (r.gastos + r.gasolina)
    }));
    
    new Chart(ctx, {
        type: "line",
        data: {
            datasets: [{
                label: "Ahorro Diario",
                data: datos,
                borderColor: "#28a745",
                fill: false
            }]
        },
        options: {
            responsive: true,
            scales: {
                x: {
                    type: 'time',
                    time: {
                        unit: 'day'
                    }
                }
            }
        }
    });
}

// Funciones de exportación
function exportarDatos() {
    let registros = JSON.parse(localStorage.getItem("registros")) || [];
    let csv = "Fecha,Ingresos,Gastos,Gasolina\n";
    
    registros.forEach(r => {
        let fecha = new Date(r.fecha).toLocaleDateString();
        csv += `${fecha},${r.ingresos},${r.gastos},${r.gasolina}\n`;
    });
    
    let blob = new Blob([csv], { type: 'text/csv' });
    let url = window.URL.createObjectURL(blob);
    let a = document.createElement('a');
    a.href = url;
    a.download = 'registros_financieros.csv';
    a.click();
}

// Función para descargar el proyecto completo
function descargarProyecto() {
    // Crear un objeto con todos los archivos del proyecto
    const archivosProyecto = {
        'index.html': document.querySelector('html').outerHTML,
        'styles.css': Array.from(document.styleSheets)
            .filter(sheet => !sheet.href)
            .map(sheet => Array.from(sheet.cssRules)
                .map(rule => rule.cssText)
                .join('\n'))
            .join('\n'),
        'app.js': document.querySelector('script[src="app.js"]').textContent,
        'package.json': JSON.stringify({
            name: "dashboard-financiero",
            version: "1.0.0",
            private: true,
            type: "module",
            scripts: {
                dev: "vite",
                build: "vite build",
                preview: "vite preview"
            },
            dependencies: {
                "chart.js": "^4.4.1"
            },
            devDependencies: {
                "vite": "^5.1.0"
            }
        }, null, 2)
    };

    // Crear un archivo ZIP
    const zip = new JSZip();
    
    // Agregar archivos al ZIP
    Object.entries(archivosProyecto).forEach(([nombre, contenido]) => {
        zip.file(nombre, contenido);
    });
    
    // Generar y descargar el ZIP
    zip.generateAsync({ type: "blob" })
        .then(function(content) {
            const url = window.URL.createObjectURL(content);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'dashboard-financiero.zip';
            a.click();
            window.URL.revokeObjectURL(url);
        });
}

// Funciones de alertas y notificaciones
function verificarRegistroDiario() {
    let ultimaFecha = localStorage.getItem("lastUpdateDate");
    if (!ultimaFecha) {
        mostrarNotificacion("No has registrado datos hoy", "warning");
        return;
    }
    
    let ultima = new Date(ultimaFecha);
    let hoy = new Date();
    
    if (ultima.toDateString() !== hoy.toDateString()) {
        mostrarNotificacion("No has registrado datos hoy", "warning");
    }
}

function mostrarNotificacion(mensaje, tipo) {
    let div = document.createElement('div');
    div.className = `notificacion ${tipo}`;
    div.textContent = mensaje;
    
    document.body.appendChild(div);
    
    setTimeout(() => {
        div.remove();
    }, 3000);
}

// Función de reinicio
function resetearDatos() {
    if (confirm("¿Estás seguro de que quieres reiniciar todos los datos? Esta acción no se puede deshacer.")) {
        localStorage.clear();
        actualizarResumen();
        actualizarResumenDoorDash();
        actualizarFondeo();
        actualizarMetricas();
        mostrarNotificacion("Datos reiniciados correctamente", "success");
    }
}

// Actualización inicial
function cargarDatos() {
    // Cargar meta mensual desde localStorage
    let metaMensual = localStorage.getItem("metaMensual");
    if (metaMensual) {
        document.getElementById("metaMensual").value = metaMensual;
    }
    
    // Escuchar cambios en la meta mensual
    document.getElementById("metaMensual").addEventListener("change", function(e) {
        localStorage.setItem("metaMensual", e.target.value);
        actualizarFondeo();
    });
    
    actualizarResumen();
    actualizarResumenDoorDash();
    actualizarFondeo();
    actualizarMetricas();
}