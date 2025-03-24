document.addEventListener("DOMContentLoaded", function () {
    mostrarFecha();
    if (window.location.pathname.includes("index.html") || window.location.pathname === "/") {
        cargarDatos();
        verificarRegistroDiario();
    } else if (window.location.pathname.includes("historial.html")) {
        cargarHistorial();
    } else if (window.location.pathname.includes("track-record.html")) {
        iniciarTrackRecord();
    } else if (window.location.pathname.includes("deudas.html")) {
        iniciarDeudas();
    }

    // Cargar el tema desde localStorage
    const theme = localStorage.getItem("theme") || "light";
    if (theme === "dark") {
        document.body.classList.add("dark-mode");
        actualizarIconoTema();
    }
});

// Función para cambiar entre temas claro/oscuro
function toggleTheme() {
    document.body.classList.toggle("dark-mode");
    const newTheme = document.body.classList.contains("dark-mode") ? "dark" : "light";
    localStorage.setItem("theme", newTheme);
    actualizarIconoTema();
}

// Actualizar el icono del botón de tema
function actualizarIconoTema() {
    const themeButtons = document.querySelectorAll('.toggle-theme-btn');
    themeButtons.forEach(btn => {
        btn.innerHTML = document.body.classList.contains("dark-mode") ? "🌙" : "☀️";
    });
}

// Función para mostrar la fecha actual
function mostrarFecha() {
    const fechaElement = document.getElementById("fechaActual");
    if (!fechaElement) return;

    const fecha = new Date();
    const opciones = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    const fechaFormateada = fecha.toLocaleDateString('es-ES', opciones);
    fechaElement.innerText = `Fecha actual: ${fechaFormateada}`;
}

// Verificar si se ha registrado datos hoy
function verificarRegistroDiario() {
    const hoy = new Date().toDateString();
    const ultimoRegistro = localStorage.getItem("ultimoRegistro");
    
    if (!ultimoRegistro || ultimoRegistro !== hoy) {
        mostrarNotificacion("No has registrado datos hoy", "warning");
    }
}

// Función para mostrar notificaciones
function mostrarNotificacion(mensaje, tipo) {
    // Eliminar notificaciones existentes
    const notificacionesExistentes = document.querySelectorAll('.notificacion');
    notificacionesExistentes.forEach(n => n.remove());
    
    const notificacion = document.createElement('div');
    notificacion.className = `notificacion ${tipo}`;
    notificacion.textContent = mensaje;
    document.body.appendChild(notificacion);
    
    // Auto-eliminar después de 3 segundos
    setTimeout(() => {
        notificacion.classList.add('fadeOut');
        setTimeout(() => notificacion.remove(), 500);
    }, 3000);
}

// Funciones para index.html
function guardarDatos() {
    const ingresosInput = document.getElementById("ingresos");
    const montoGastoInput = document.getElementById("montoGasto");
    const gasolinaInput = document.getElementById("gasolina");

    if (!ingresosInput || !montoGastoInput || !gasolinaInput) return;

    const ingresos = parseFloat(ingresosInput.value) || 0;
    const categoriaGasto = document.getElementById("categoriaGasto").value.trim() || "Otros";
    const gasolina = parseFloat(gasolinaInput.value) || 0;

    // Validación básica
    if (ingresos === 0 && parseFloat(montoGastoInput.value) === 0 && gasolina === 0) {
        mostrarNotificacion("Por favor, ingresa al menos un valor", "warning");
        return;
    }

    const semana = obtenerSemanaActual();
    let registros = JSON.parse(localStorage.getItem("registros")) || {};

    if (!registros[semana]) {
        registros[semana] = [];
    }

    const montoGasto = parseFloat(montoGastoInput.value) || 0;
    const fechaActual = new Date();
    
    registros[semana].push({
        ingresos,
        gastos: montoGasto,
        categoria: categoriaGasto,
        gasolina,
        fecha: fechaActual.toLocaleDateString('es-ES'),
        timestamp: fechaActual.getTime() // Guardar timestamp para ordenar
    });

    localStorage.setItem("registros", JSON.stringify(registros));
    
    // Guardar la fecha del último registro
    localStorage.setItem("ultimoRegistro", fechaActual.toDateString());

    ingresosInput.value = "";
    montoGastoInput.value = "";
    gasolinaInput.value = "";

    mostrarResumen();
    actualizarRegistrosRecientes();
    actualizarResumenFinanciero();
    mostrarNotificacion("Datos guardados correctamente", "success");
}

function actualizarRegistrosRecientes() {
    const tbody = document.querySelector("#registrosRecientes tbody");
    if (!tbody) return;

    const registros = JSON.parse(localStorage.getItem("registros")) || {};
    const semanaActual = obtenerSemanaActual();
    const registrosSemana = registros[semanaActual] || [];

    // Ordenar registros por fecha (más reciente primero)
    const registrosOrdenados = [...registrosSemana].sort((a, b) => b.timestamp - a.timestamp);

    tbody.innerHTML = "";
    
    // Mostrar solo los últimos 5 registros
    registrosOrdenados.slice(0, 5).forEach(registro => {
        const fila = `
            <tr>
                <td>${registro.fecha}</td>
                <td>$${registro.ingresos.toFixed(2)}</td>
                <td>$${registro.gastos.toFixed(2)}</td>
                <td>${registro.categoria} <span class="categoria-icon">💰</span></td>
                <td>$${registro.gasolina.toFixed(2)}</td>
            </tr>
        `;
        tbody.innerHTML += fila;
    });

    if (registrosOrdenados.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="5" class="text-center">No hay registros esta semana</td>
            </tr>
        `;
    }
}

function mostrarResumen() {
    const resumenSemanalElement = document.getElementById("resumenSemanal");
    if (!resumenSemanalElement) return;

    const registros = JSON.parse(localStorage.getItem("registros")) || {};
    const semana = obtenerSemanaActual();
    const data = registros[semana] || [];

    const totalIngresos = data.reduce((acc, item) => acc + item.ingresos, 0);
    const totalGastos = data.reduce((acc, item) => acc + item.gastos, 0);
    const totalGasolina = data.reduce((acc, item) => acc + item.gasolina, 0);
    const balance = totalIngresos - (totalGastos + totalGasolina);

    resumenSemanalElement.innerHTML = `
        <div class="stats-grid">
            <div class="stat-card">
                <h4>Ingresos</h4>
                <p>$${totalIngresos.toFixed(2)}</p>
            </div>
            <div class="stat-card">
                <h4>Gastos</h4>
                <p>$${totalGastos.toFixed(2)}</p>
            </div>
            <div class="stat-card">
                <h4>Gasolina</h4>
                <p>$${totalGasolina.toFixed(2)}</p>
            </div>
            <div class="stat-card ${balance >= 0 ? 'positive' : 'negative'}">
                <h4>Balance</h4>
                <p>$${balance.toFixed(2)}</p>
            </div>
        </div>
        <canvas id="grafico" class="chart-animation"></canvas>
    `;
    generarGraficoDonut("grafico", totalIngresos, totalGastos, totalGasolina);
}

function obtenerSemanaActual() {
    const fecha = new Date();
    const primeraSemana = new Date(fecha.getFullYear(), 0, 1);
    const diferencia = fecha - primeraSemana;
    const semana = Math.ceil(diferencia / (1000 * 60 * 60 * 24 * 7));
    return `Semana ${semana}`;
}

function cargarDatos() {
    const registros = JSON.parse(localStorage.getItem("registros")) || {}; // Retrieve saved data
    const semanaActual = obtenerSemanaActual();

    if (!registros[semanaActual]) {
        registros[semanaActual] = []; // Ensure the current week's data exists
    }

    localStorage.setItem("registros", JSON.stringify(registros)); // Save back to ensure persistence

    mostrarResumen(); // Update the weekly summary
    actualizarRegistrosRecientes(); // Update the recent records table
    actualizarResumenFinanciero(); // Update the financial analysis
}

function generarGraficoDonut(canvasId, ingresos, gastos, gasolina) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;

    if (canvas.chart) {
        canvas.chart.destroy();
    }

    const ctx = canvas.getContext("2d");
    canvas.chart = new Chart(ctx, {
        type: "doughnut",
        data: {
            labels: ["Ingresos", "Gastos", "Gasolina"],
            datasets: [{
                data: [ingresos, gastos, gasolina],
                backgroundColor: ["#007bff", "#ff4500", "#111"],
                borderColor: ["#0056b3", "#cc3700", "#333"],
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            animation: {
                duration: 1000
            },
            plugins: {
                legend: {
                    display: true,
                    position: "bottom"
                },
                tooltip: {
                    callbacks: {
                        label: function (context) {
                            let label = context.label || '';
                            if (label) {
                                label += ': ';
                            }
                            label += `$${context.raw.toFixed(2)}`;
                            return label;
                        }
                    }
                }
            }
        }
    });
}

function verHistorial() {
    window.location.href = "historial.html";
}

function resetearDatos() {
    if (!confirm("¿Estás seguro de que quieres reiniciar todos los datos? Esta acción no se puede deshacer.")) {
        return;
    }
    
    localStorage.removeItem("registros");
    localStorage.removeItem("ultimoRegistro");
    mostrarResumen();
    mostrarNotificacion("Datos reseteados con éxito", "success");
}

function toggleOtroGasto() {
    const categoriaGastoSelect = document.getElementById("categoriaGasto");
    const otroGastoInput = document.getElementById("otroGasto");
    if (!categoriaGastoSelect || !otroGastoInput) return;

    otroGastoInput.style.display = categoriaGastoSelect.value === "Otro" ? "block" : "none";
}

// Funciones para historial.html
function cargarHistorial() {
    const historialContainer = document.getElementById("historial");
    if (!historialContainer) return;

    const registros = JSON.parse(localStorage.getItem("registros")) || {};
    if (Object.keys(registros).length === 0) {
        historialContainer.innerHTML = "<p>No hay datos disponibles en el historial.</p>";
        return;
    }

    // Ordenar semanas cronológicamente (más reciente primero)
    const semanas = Object.keys(registros).sort((a, b) => {
        const numA = parseInt(a.replace('Semana ', ''));
        const numB = parseInt(b.replace('Semana ', ''));
        return numB - numA;
    });

    let contenido = "";
    semanas.forEach(semana => {
        const data = registros[semana];
        const totales = calcularTotales(data);

        const gastosPorCategoria = {};
        data.forEach(item => {
            if (!gastosPorCategoria[item.categoria]) {
                gastosPorCategoria[item.categoria] = 0;
            }
            gastosPorCategoria[item.categoria] += item.gastos;
        });

        let tablaCategorias = "<table class='tabla-gastos'>";
        tablaCategorias += "<tr><th>Categoría</th><th>Monto Gastado</th></tr>";
        
        // Ordenar categorías por monto (mayor a menor)
        const categorias = Object.keys(gastosPorCategoria).sort((a, b) => 
            gastosPorCategoria[b] - gastosPorCategoria[a]
        );
        
        categorias.forEach(categoria => {
            const icon = getCategoriaIcon(categoria);
            tablaCategorias += `<tr><td>${icon} ${categoria}</td><td>$${gastosPorCategoria[categoria].toFixed(2)}</td></tr>`;
        });
        tablaCategorias += "</table>";

        const saldoSemana = totales.ingresos - (totales.gastos + totales.gasolina);
        let resultadoSemanal = "Pobre";
        if (saldoSemana > 500 && saldoSemana <= 900) {
            resultadoSemanal = "Regular";
        } else if (saldoSemana > 900) {
            resultadoSemanal = "Excelente";
        }

        contenido += `
            <div class="semana">
                <h3>${semana}</h3>
                <div class="stats-grid">
                    <div class="stat-card">
                        <h4>Ingresos</h4>
                        <p>$${totales.ingresos.toFixed(2)}</p>
                    </div>
                    <div class="stat-card">
                        <h4>Gastos</h4>
                        <p>$${totales.gasolina.toFixed(2)}</p>
                    </div>
                    <div class="stat-card">
                        <h4>Gasolina</h4>
                        <p>$${totales.gasolina.toFixed(2)}</p>
                    </div>
                    <div class="stat-card ${saldoSemana >= 0 ? 'positive' : 'negative'}">
                        <h4>Balance</h4>
                        <p>$${saldoSemana.toFixed(2)}</p>
                    </div>
                </div>
                <p class="resultado-semanal">Resultado Semanal: <span style="color: ${
                    saldoSemana > 900 ? 'var(--success-color)' : saldoSemana > 500 ? '#ffeb3b' : 'var(--error-color)'
                };">${resultadoSemanal}</span></p>
                <div class="historial-charts">
                    <div class="chart-container">
                        <h4>Resumen</h4>
                        <canvas id="grafico-${semana.replace(/\s+/g, '-')}" class="grafico-historial chart-animation"></canvas>
                    </div>
                    <div class="chart-container">
                        <h4>Gastos por Categoría</h4>
                        <canvas id="grafico-cat-${semana.replace(/\s+/g, '-')}" class="grafico-historial chart-animation"></canvas>
                    </div>
                </div>
                <h4>Detalle de Gastos por Categoría</h4>
                ${tablaCategorias}
            </div>
        `;
    });

    historialContainer.innerHTML = contenido;

    // Generar gráficos para cada semana
    semanas.forEach(semana => {
        const data = registros[semana];
        const totales = calcularTotales(data);

        // Gráfico de barras para ingresos/gastos/gasolina
        const categorias = ["Ingresos", "Gastos", "Gasolina"];
        const montos = [totales.ingresos, totales.gastos, totales.gasolina];
        generarGraficoBarras(`grafico-${semana.replace(/\s+/g, '-')}`, categorias, montos);
        
        // Gráfico de pastel para gastos por categoría
        const gastosPorCategoria = {};
        data.forEach(item => {
            if (!gastosPorCategoria[item.categoria]) {
                gastosPorCategoria[item.categoria] = 0;
            }
            gastosPorCategoria[item.categoria] += item.gastos;
        });
        
        const nombresCategorias = Object.keys(gastosPorCategoria);
        const valoresCategorias = Object.values(gastosPorCategoria);
        
        generarGraficoPastel(`grafico-cat-${semana.replace(/\s+/g, '-')}`, nombresCategorias, valoresCategorias);
    });
}

function generarGraficoBarras(canvasId, categorias, montos) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;

    if (canvas.chart) {
        canvas.chart.destroy();
    }

    const ctx = canvas.getContext("2d");
    canvas.chart = new Chart(ctx, {
        type: "bar",
        data: {
            labels: categorias,
            datasets: [{
                label: "Métricas Financieras",
                data: montos,
                backgroundColor: ["#007bff", "#ff4500", "#111"],
                borderColor: ["#0056b3", "#cc3700", "#333"],
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            animation: {
                duration: 1000
            },
            plugins: {
                legend: { display: false },
                tooltip: {
                    callbacks: {
                        label: function (context) {
                            let label = context.label || '';
                            if (label) {
                                label += ': ';
                            }
                            label += `$${context.raw.toFixed(2)}`;
                            return label;
                        }
                    }
                }
            },
            scales: {
                x: {
                    grid: { display: false }
                },
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function (value) {
                            return `$${value}`;
                        }
                    }
                }
            }
        }
    });
}

function generarGraficoPastel(canvasId, categorias, valores) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;

    if (canvas.chart) {
        canvas.chart.destroy();
    }

    // Generar colores dinámicamente
    const colores = generarColores(categorias.length);

    const ctx = canvas.getContext("2d");
    canvas.chart = new Chart(ctx, {
        type: "pie",
        data: {
            labels: categorias,
            datasets: [{
                data: valores,
                backgroundColor: colores.background,
                borderColor: colores.border,
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            animation: {
                duration: 1000
            },
            plugins: {
                legend: {
                    display: true,
                    position: "bottom",
                    labels: {
                        boxWidth: 15,
                        padding: 10
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function (context) {
                            let label = context.label || '';
                            if (label) {
                                label += ': ';
                            }
                            label += `$${context.raw.toFixed(2)}`;
                            return label;
                        }
                    }
                }
            }
        }
    });
}

// Función para generar colores dinámicamente
function generarColores(cantidad) {
    const coloresBase = [
        { bg: "#FF6384", border: "#FF5370" },
        { bg: "#36A2EB", border: "#2E8BC0" },
        { bg: "#FFCE56", border: "#E6B800" },
        { bg: "#4BC0C0", border: "#3AA7A7" },
        { bg: "#9966FF", border: "#8A50F5" },
        { bg: "#FF9F40", border: "#F28C28" }
    ];
    
    const background = [];
    const border = [];
    
    for (let i = 0; i < cantidad; i++) {
        const index = i % coloresBase.length;
        background.push(coloresBase[index].bg);
        border.push(coloresBase[index].border);
    }
    
    return { background, border };
}

function calcularTotales(data) {
    return {
        ingresos: data.reduce((acc, item) => acc + item.ingresos, 0),
        gastos: data.reduce((acc, item) => acc + item.gastos, 0),
        gasolina: data.reduce((acc, item) => acc + item.gasolina, 0)
    };
}

// Funciones para track-record.html
let montoInicialChallenge = 0;
let trades = [];

function iniciarTrackRecord() {
    montoInicialChallenge = parseFloat(localStorage.getItem("montoInicialChallenge")) || 0;
    trades = JSON.parse(localStorage.getItem("trades")) || [];

    actualizarTablaTrades();
    actualizarResumenTrackRecord();
}

function iniciarChallenge() {
    const montoInicialInput = document.getElementById("montoInicial");
    if (!montoInicialInput) return;

    const montoInicial = parseFloat(montoInicialInput.value);
    if (isNaN(montoInicial) || montoInicial <= 0) {
        mostrarNotificacion("Por favor, ingresa un monto inicial válido", "warning");
        return;
    }

    montoInicialChallenge = montoInicial;
    localStorage.setItem("montoInicialChallenge", montoInicialChallenge);

    trades = [];
    localStorage.removeItem("trades");

    document.getElementById("montoInicialDisplay").innerText = montoInicialChallenge.toFixed(2);
    actualizarResumenTrackRecord();
    mostrarNotificacion("Challenge iniciado con éxito", "success");
}

// Update registrarTrade to use dropdown for "PARES"
function registrarTrade() {
    const tradeResultadoInput = document.getElementById("tradeResultado");
    const paresSelect = document.getElementById("paresSelect");
    const pipsGananciaInput = document.getElementById("pipsGanancia");
    const pipsStopLossInput = document.getElementById("pipsStopLoss");

    if (!tradeResultadoInput || !paresSelect || !pipsGananciaInput || !pipsStopLossInput) return;

    const resultado = parseFloat(tradeResultadoInput.value);
    const par = paresSelect.value;
    const pipsGanancia = parseFloat(pipsGananciaInput.value) || 0;
    const pipsStopLoss = parseFloat(pipsStopLossInput.value) || 0;

    if (isNaN(resultado) || resultado === 0) {
        mostrarNotificacion("Por favor, ingresa un resultado válido para el trade", "warning");
        return;
    }

    const fechaActual = new Date();
    trades.push({
        fecha: fechaActual.toLocaleDateString('es-ES'),
        resultado,
        par,
        pipsGanancia,
        pipsStopLoss,
        timestamp: fechaActual.getTime()
    });

    tradeResultadoInput.value = "";
    pipsGananciaInput.value = "";
    pipsStopLossInput.value = "";

    localStorage.setItem("trades", JSON.stringify(trades));
    actualizarTablaTrades();
    actualizarResumenTrackRecord();
    mostrarNotificacion("Trade registrado correctamente", "success");
}

function actualizarTablaTrades() {
    const tbody = document.querySelector("#tablaTrades tbody");
    if (!tbody) return;

    tbody.innerHTML = "";
    
    // Ordenar trades por fecha (más reciente primero)
    const tradesOrdenados = [...trades].sort((a, b) => {
        const timeA = a.timestamp || 0;
        const timeB = b.timestamp || 0;
        return timeB - timeA;
    });
    
    tradesOrdenados.forEach(trade => {
        const fila = `
            <tr class="${trade.resultado > 0 ? 'trade-positivo' : 'trade-negativo'}">
                <td>${trade.fecha}</td>
                <td>$${trade.resultado.toFixed(2)}</td>
                <td>${trade.par}</td>
            </tr>
        `;
        tbody.innerHTML += fila;
    });
}

// Update resumen to include new metrics
function actualizarResumenTrackRecord() {
    const gananciasTotales = trades.reduce((acc, trade) => acc + Math.max(trade.resultado, 0), 0);
    const perdidasTotales = trades.reduce((acc, trade) => acc + Math.min(trade.resultado, 0), 0);
    const balanceActual = montoInicialChallenge + trades.reduce((acc, trade) => acc + trade.resultado, 0);
    
    // Calcular estadísticas adicionales
    const totalTrades = trades.length;
    const tradesProfitables = trades.filter(t => t.resultado > 0).length;
    const tradesNegativos = trades.filter(t => t.resultado < 0).length;
    const winRate = totalTrades > 0 ? (tradesProfitables / totalTrades) * 100 : 0;
    
    // Calcular promedio de ganancias y pérdidas
    const avgGanancia = tradesProfitables > 0 ? gananciasTotales / tradesProfitables : 0;
    const avgPerdida = tradesNegativos > 0 ? Math.abs(perdidasTotales) / tradesNegativos : 0;
    const profitFactor = avgPerdida > 0 ? gananciasTotales / Math.abs(perdidasTotales) : null;

    const returns = trades.map(t => t.resultado);
    const sharpeRatio = calcularSharpeRatio(returns);
    const sortinoRatio = calcularSortinoRatio(returns);
    const drawdown = calcularDrawdown(returns);

    // Actualizar métricas en el DOM
    document.getElementById("montoInicialDisplay").innerText = montoInicialChallenge.toFixed(2);
    document.getElementById("gananciasTotales").innerText = gananciasTotales.toFixed(2);
    document.getElementById("perdidasTotales").innerText = Math.abs(perdidasTotales).toFixed(2);
    document.getElementById("balanceActual").innerText = balanceActual.toFixed(2);
    document.getElementById("winRate").innerText = (isNaN(winRate) ? 0 : winRate).toFixed(1);
    document.getElementById("profitFactor").innerText = (profitFactor === null ? "N/A" : profitFactor.toFixed(2));
    document.getElementById("sharpeRatio").innerText = (isNaN(sharpeRatio) ? 0 : sharpeRatio).toFixed(2);
    document.getElementById("sortinoRatio").innerText = (isNaN(sortinoRatio) ? 0 : sortinoRatio).toFixed(2);
    document.getElementById("drawdown").innerText = (isNaN(drawdown) ? 0 : drawdown).toFixed(2);

    generarResultadosMensuales();
    generarGraficoTrackRecord(gananciasTotales, perdidasTotales);
    generarGraficoEvolucionBalance();
}

// Calculate Sharpe ratio
function calcularSharpeRatio(returns) {
    const avgReturn = returns.reduce((acc, r) => acc + r, 0) / returns.length || 0;
    const stdDev = Math.sqrt(returns.reduce((acc, r) => acc + Math.pow(r - avgReturn, 2), 0) / returns.length || 1);
    return avgReturn / stdDev;
}

// Calculate Sortino ratio
function calcularSortinoRatio(returns) {
    const avgReturn = returns.reduce((acc, r) => acc + r, 0) / returns.length || 0;
    const downsideDev = Math.sqrt(returns.filter(r => r < 0).reduce((acc, r) => acc + Math.pow(r, 2), 0) / returns.length || 1);
    return avgReturn / downsideDev;
}

// Calculate drawdown
function calcularDrawdown(returns) {
    let peak = 0;
    let maxDrawdown = 0;
    let balance = montoInicialChallenge;

    returns.forEach(r => {
        balance += r;
        peak = Math.max(peak, balance);
        maxDrawdown = Math.min(maxDrawdown, (balance - peak) / peak);
    });

    return Math.abs(maxDrawdown * 100);
}

// Generate monthly results
function generarResultadosMensuales() {
    const resultadosMensuales = {};
    trades.forEach(trade => {
        const mes = new Date(trade.timestamp).toLocaleString('es-ES', { month: 'long', year: 'numeric' });
        if (!resultadosMensuales[mes]) resultadosMensuales[mes] = 0;
        resultadosMensuales[mes] += trade.resultado;
    });

    const container = document.getElementById("resultadosMensuales");
    if (container) {
        container.innerHTML = Object.entries(resultadosMensuales).map(([mes, resultado]) => `
            <div class="mes">
                <h4>${mes}</h4>
                <p>${resultado.toFixed(2)}</p>
            </div>
        `).join('');
    }
}

// Improve chart visuals
function generarGraficoTrackRecord(ganancias, perdidas) {
    const canvas = document.getElementById("graficoTrackRecord");
    if (!canvas) return;

    if (canvas.chart) {
        canvas.chart.destroy();
    }

    const ctx = canvas.getContext("2d");
    canvas.chart = new Chart(ctx, {
        type: "doughnut",
        data: {
            labels: ["Ganancias", "Pérdidas"],
            datasets: [{
                data: [ganancias, Math.abs(perdidas)],
                backgroundColor: ["#4caf50", "#f44336"],
                borderColor: ["#388e3c", "#d32f2f"],
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    display: true,
                    position: "bottom",
                    labels: {
                        font: { size: 14 },
                        color: "#333"
                    }
                },
                tooltip: {
                    callbacks: {
                        label: context => `${context.label}: $${context.raw.toFixed(2)}`
                    }
                }
            },
            animation: {
                animateScale: true,
                animateRotate: true
            }
        }
    });
}

function generarGraficoEvolucionBalance() {
    const canvas = document.getElementById("graficoEvolucionBalance");
    if (!canvas) return;

    if (canvas.chart) {
        canvas.chart.destroy();
    }

    const tradesOrdenados = [...trades].sort((a, b) => a.timestamp - b.timestamp);

    let balance = montoInicialChallenge;
    const datos = tradesOrdenados.map((trade, index) => {
        balance += trade.resultado;
        return { x: index + 1, y: balance };
    });

    const ctx = canvas.getContext("2d");
    canvas.chart = new Chart(ctx, {
        type: "line",
        data: {
            datasets: [{
                label: "Evolución del Balance",
                data: datos,
                borderColor: "#007bff",
                backgroundColor: "rgba(0, 123, 255, 0.1)",
                fill: true,
                tension: 0.3,
                pointRadius: 4,
                pointBackgroundColor: "#007bff"
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    callbacks: {
                        label: context => `Balance: $${context.parsed.y.toFixed(2)}`
                    }
                }
            },
            scales: {
                x: {
                    type: "linear",
                    title: {
                        display: true,
                        text: "Número de Trades",
                        font: { size: 14 }
                    },
                    grid: { display: false }
                },
                y: {
                    beginAtZero: false,
                    title: {
                        display: true,
                        text: "Balance ($)",
                        font: { size: 14 }
                    },
                    ticks: {
                        callback: value => `$${value}`
                    }
                }
            },
            animation: {
                duration: 1000,
                easing: "easeInOutQuad"
            }
        }
    });
}

// Función para reiniciar el challenge
function resetearChallenge() {
    if (!confirm("¿Estás seguro de que quieres reiniciar el challenge? Esta acción no se puede deshacer.")) {
        return;
    }
    
    localStorage.removeItem("montoInicialChallenge");
    localStorage.removeItem("trades");

    montoInicialChallenge = 0;
    trades = [];

    document.getElementById("montoInicialDisplay").innerText = "0";
    document.getElementById("gananciasTotales").innerText = "0";
    document.getElementById("perdidasTotales").innerText = "0";
    document.getElementById("balanceActual").innerText = "0";

    const tbody = document.querySelector("#tablaTrades tbody");
    if (tbody) {
        tbody.innerHTML = ""; // Limpiar tabla
    }

    const canvas = document.getElementById("graficoTrackRecord");
    if (canvas && canvas.chart) {
        canvas.chart.destroy(); // Destruir el gráfico existente
    }
    
    const canvasEvolucion = document.getElementById("graficoEvolucionBalance");
    if (canvasEvolucion && canvasEvolucion.chart) {
        canvasEvolucion.chart.destroy();
    }
    
    const statsContainer = document.getElementById("estadisticasTrading");
    if (statsContainer) {
        statsContainer.innerHTML = "";
    }

    mostrarNotificacion("Challenge reseteado con éxito", "success");
}

// Funciones para deudas.html
let deudas = JSON.parse(localStorage.getItem("deudas")) || [];

function iniciarDeudas() {
    deudas = JSON.parse(localStorage.getItem("deudas")) || [];
    actualizarResumenDeuda();
    actualizarTablaPagos();
}

function iniciarDeuda() {
    const nombreDeudaInput = document.getElementById("nombreDeuda");
    const montoDeudaInput = document.getElementById("montoDeuda");
    const categoriaDeudaInput = document.getElementById("categoriaDeuda");

    if (!nombreDeudaInput || !montoDeudaInput || !categoriaDeudaInput) return;

    const nombreDeuda = nombreDeudaInput.value.trim();
    const montoDeuda = parseFloat(montoDeudaInput.value);
    const categoriaDeuda = categoriaDeudaInput.value.trim();

    if (!nombreDeuda || isNaN(montoDeuda) || montoDeuda <= 0 || !categoriaDeuda) {
        mostrarNotificacion("Por favor, completa todos los campos correctamente", "warning");
        return;
    }

    // Verificar si ya existe una deuda con el mismo nombre
    const deudaExistente = deudas.find(d => d.nombre.toLowerCase() === nombreDeuda.toLowerCase());
    if (deudaExistente) {
        mostrarNotificacion("Ya existe una deuda con ese nombre", "warning");
        return;
    }

    const nuevaDeuda = {
        nombre: nombreDeuda,
        monto: montoDeuda,
        categoria: categoriaDeuda,
        pagado: 0,
        fecha: new Date().toLocaleDateString('es-ES')
    };

    deudas.push(nuevaDeuda);
    localStorage.setItem("deudas", JSON.stringify(deudas));

    nombreDeudaInput.value = "";
    montoDeudaInput.value = "";
    categoriaDeudaInput.value = "";

    actualizarResumenDeuda();
    actualizarTablaPagos();
    mostrarNotificacion("Deuda registrada con éxito", "success");
}

function registrarPago() {
    const nombrePagoDeudaInput = document.getElementById("nombrePagoDeuda");
    const pagoRealizadoInput = document.getElementById("pagoRealizado");

    if (!nombrePagoDeudaInput || !pagoRealizadoInput) return;

    const nombreDeuda = nombrePagoDeudaInput.value.trim();
    const montoPago = parseFloat(pagoRealizadoInput.value);

    if (!nombreDeuda || isNaN(montoPago) || montoPago <= 0) {
        mostrarNotificacion("Por favor, completa todos los campos correctamente", "warning");
        return;
    }

    const deuda = deudas.find(d => d.nombre === nombreDeuda);

    if (!deuda) {
        mostrarNotificacion("No se encontró una deuda con ese nombre", "error");
        return;
    }

    deuda.pagado += montoPago;
    if (deuda.pagado > deuda.monto) deuda.pagado = deuda.monto;

    localStorage.setItem("deudas", JSON.stringify(deudas));

    nombrePagoDeudaInput.value = "";
    pagoRealizadoInput.value = "";

    actualizarResumenDeuda();
    mostrarNotificacion("Pago registrado con éxito", "success");
}

function actualizarResumenDeuda() {
    if (!deudas || deudas.length === 0) {
        document.getElementById("montoTotalDeuda").innerText = "0.00";
        document.getElementById("totalPagado").innerText = "0.00";
        document.getElementById("saldoPendiente").innerText = "0.00";
        document.getElementById("diasEstimados").innerText = "0";
        document.getElementById("porcentajePagado").innerText = "0%";
        document.getElementById("progressBar").style.width = "0%";
        return;
    }

    const totalDeudas = deudas.reduce((acc, deuda) => acc + (deuda.monto || 0), 0);
    const totalPagado = deudas.reduce((acc, deuda) => acc + (deuda.pagado || 0), 0);
    const saldoPendiente = totalDeudas - totalPagado;
    const porcentajePagado = (totalPagado / totalDeudas) * 100;

    document.getElementById("montoTotalDeuda").innerText = totalDeudas.toFixed(2);
    document.getElementById("totalPagado").innerText = totalPagado.toFixed(2);
    document.getElementById("saldoPendiente").innerText = saldoPendiente.toFixed(2);
    document.getElementById("diasEstimados").innerText = calcularDiasEstimados(totalDeudas, totalPagado);
    document.getElementById("porcentajePagado").innerText = `${porcentajePagado.toFixed(1)}%`;
    document.getElementById("progressBar").style.width = `${Math.min(porcentajePagado, 100)}%`;

    generarGraficoDeuda(totalPagado, saldoPendiente);
    generarGraficoCategorias();
    generarGraficoProgresoDeuda();
}

function calcularDiasEstimados(totalDeudas, totalPagado) {
    const promedioPago = deudas.length > 0 ? totalPagado / deudas.length : 0;
    return promedioPago > 0 ? Math.ceil((totalDeudas - totalPagado) / promedioPago) : 0;
}

function actualizarTablaPagos() {
    const tbody = document.querySelector("#tablaPagos tbody");
    if (!tbody) return;

    tbody.innerHTML = "";
    
    deudas.forEach(deuda => {
        const fila = `
            <tr>
                <td>${deuda.fecha || ''}</td>
                <td>${deuda.nombre} (${deuda.categoria})</td>
                <td>$${deuda.monto.toFixed(2)}</td>
                <td>$${deuda.pagado.toFixed(2)}</td>
                <td>$${(deuda.monto - deuda.pagado).toFixed(2)}</td>
            </tr>
        `;
        tbody.innerHTML += fila;
    });
}

function generarGraficoDeuda(pagado, pendiente) {
    const canvas = document.getElementById("graficoDeuda");
    if (!canvas) return;

    if (canvas.chart) {
        canvas.chart.destroy();
    }

    const ctx = canvas.getContext("2d");
    canvas.chart = new Chart(ctx, {
        type: "doughnut",
        data: {
            labels: ["Pagado", "Pendiente"],
            datasets: [{
                data: [pagado, pendiente],
                backgroundColor: ["#4caf50", "#f44336"],
                borderColor: ["#388e3c", "#d32f2f"],
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: "bottom",
                    labels: {
                        padding: 20,
                        font: { size: 12 }
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const total = pagado + pendiente;
                            const porcentaje = ((context.raw / total) * 100).toFixed(1);
                            return `${context.label}: $${context.raw.toFixed(2)} (${porcentaje}%)`;
                        }
                    }
                }
            }
        }
    });
}

function generarGraficoCategorias() {
    const canvas = document.getElementById("graficoCategorias");
    if (!canvas) return;

    if (canvas.chart) {
        canvas.chart.destroy();
    }

    // Agrupar deudas por categoría y calcular totales
    const categorias = {};
    deudas.forEach(deuda => {
        if (!categorias[deuda.categoria]) {
            categorias[deuda.categoria] = 0;
        }
        categorias[deuda.categoria] += deuda.monto;
    });

    const data = Object.entries(categorias)
        .sort((a, b) => b[1] - a[1]); // Ordenar por monto descendente
    const colores = generarColores(data.length);

    const ctx = canvas.getContext("2d");
    canvas.chart = new Chart(ctx, {
        type: "pie",
        data: {
            labels: data.map(([cat]) => cat),
            datasets: [{
                data: data.map(([_, monto]) => monto),
                backgroundColor: colores.background,
                borderColor: colores.border,
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: "bottom",
                    labels: {
                        padding: 20,
                        font: { size: 11 }
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const valor = context.raw.toFixed(2);
                            const total = data.reduce((acc, [_, monto]) => acc + monto, 0);
                            const porcentaje = ((context.raw / total) * 100).toFixed(1);
                            return `${context.label}: $${valor} (${porcentaje}%)`;
                        }
                    }
                }
            }
        }
    });
}

function generarGraficoProgresoDeuda() {
    const canvas = document.getElementById("graficoProgresoDeuda");
    if (!canvas) return;

    if (canvas.chart) {
        canvas.chart.destroy();
    }

    // Ordenar deudas por porcentaje de pago completado
    const deudasOrdenadas = [...deudas].sort((a, b) => {
        const porcentajeA = (a.pagado / a.monto) * 100;
        const porcentajeB = (b.pagado / b.monto) * 100;
        return porcentajeB - porcentajeA;
    });

    const ctx = canvas.getContext("2d");
    canvas.chart = new Chart(ctx, {
        type: "bar",
        data: {
            labels: deudasOrdenadas.map(d => d.nombre),
            datasets: [
                {
                    label: "Pagado",
                    data: deudasOrdenadas.map(d => d.pagado),
                    backgroundColor: "#4caf50",
                    borderColor: "#388e3c",
                    borderWidth: 1
                },
                {
                    label: "Pendiente",
                    data: deudasOrdenadas.map(d => d.monto - d.pagado),
                    backgroundColor: "#f44336",
                    borderColor: "#d32f2f",
                    borderWidth: 1
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: {
                    stacked: true,
                    grid: {
                        display: false
                    },
                    ticks: {
                        font: { size: 11 }
                    }
                },
                y: {
                    stacked: true,
                    ticks: {
                        callback: value => `$${value}`,
                        font: { size: 11 }
                    }
                }
            },
            plugins: {
                legend: {
                    position: "bottom",
                    labels: {
                        font: { size: 12 }
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const deuda = deudasOrdenadas[context.dataIndex];
                            const porcentaje = ((deuda.pagado / deuda.monto) * 100).toFixed(1);
                            return `${context.dataset.label}: $${context.raw.toFixed(2)} (${porcentaje}%)`;
                        }
                    }
                }
            }
        }
    });
}

// Función para reiniciar las deudas
function resetearDeudas() {
    if (!confirm("¿Estás seguro de que quieres reiniciar los datos de deudas? Esta acción no se puede deshacer.")) {
        return;
    }
    
    localStorage.removeItem("deudas");
    deudas = [];
    
    actualizarResumenDeuda();
    actualizarTablaPagos();
    mostrarNotificacion("Deudas reseteadas con éxito", "success");
}

// Función para volver al dashboard
function volverAlDashboard() {
    window.location.href = "dashboard.html";
}

// Función para obtener iconos según la categoría
function getCategoriaIcon() {
    return "💰"; // General icon for all categories
}

// Función para exportar datos a CSV
function exportarDatos() {
    const registros = JSON.parse(localStorage.getItem("registros")) || {};
    let csv = "Semana,Fecha,Ingresos,Gastos,Categoría,Gasolina\n";
    
    for (const semana in registros) {
        registros[semana].forEach(r => {
            csv += `${semana},${r.fecha},${r.ingresos},${r.gastos},"${r.categoria}",${r.gasolina}\n`;
        });
    }
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'registros_financieros.csv';
    a.click();
    window.URL.revokeObjectURL(url);
    
    mostrarNotificacion("Datos exportados correctamente", "success");
}

/**
 * Function to create a chart
 * @param {string} ctxId - The ID of the canvas element
 * @param {string} type - The type of the chart (e.g., 'bar', 'line')
 * @param {Array} labels - The labels for the chart
 * @param {Array} data - The data for the chart
 * @param {string} label - The label for the dataset
 * @param {Array} backgroundColor - The background colors for the dataset
 * @param {Array} borderColor - The border colors for the dataset
 */
function createChart(ctxId, type, labels, data, label, backgroundColor, borderColor) {
    const ctx = document.getElementById(ctxId).getContext('2d');
    new Chart(ctx, {
        type: type,
        data: {
            labels: labels,
            datasets: [{
                label: label,
                data: data,
                backgroundColor: backgroundColor,
                borderColor: borderColor,
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    display: true
                }
            }
        }
    });
}

// Example usage of createChart function
function generateExampleChart() {
    createChart(
        'exampleChart', // Canvas ID
        'bar',          // Chart type
        ['Enero', 'Febrero', 'Marzo'], // Labels
        [10, 20, 30],   // Data
        'Ingresos',     // Dataset label
        ['rgba(75, 192, 192, 0.2)'], // Background color
        ['rgba(75, 192, 192, 1)']    // Border color
    );
}

// Call the function where necessary

let registrosDoorDash = JSON.parse(localStorage.getItem("registrosDoorDash")) || [];

function registrarDoorDash() {
    const ingresos = parseFloat(document.getElementById("ingresosDoorDash").value) || 0;
    const gastos = parseFloat(document.getElementById("gastosDoorDash").value) || 0;
    const millas = parseFloat(document.getElementById("millasRecorridas").value) || 0;
    const horas = parseFloat(document.getElementById("horasTrabajadas").value) || 0;

    if (ingresos === 0 && gastos === 0 && millas === 0 && horas === 0) {
        mostrarNotificacion("Por favor, ingresa al menos un valor", "warning");
        return;
    }

    const fechaActual = new Date();
    registrosDoorDash.push({
        fecha: fechaActual.toLocaleDateString('es-ES'),
        ingresos,
        gastos,
        millas,
        horas,
        timestamp: fechaActual.getTime()
    });

    localStorage.setItem("registrosDoorDash", JSON.stringify(registrosDoorDash));
    actualizarEstadisticasDoorDash();
    mostrarNotificacion("Registro guardado correctamente", "success");
}

function actualizarEstadisticasDoorDash() {
    const totalIngresos = registrosDoorDash.reduce((acc, reg) => acc + reg.ingresos, 0);
    const totalGastos = registrosDoorDash.reduce((acc, reg) => acc + reg.gastos, 0);
    const totalMillas = registrosDoorDash.reduce((acc, reg) => acc + reg.millas, 0);
    const totalHoras = registrosDoorDash.reduce((acc, reg) => acc + reg.horas, 0);
    const totalEntregas = registrosDoorDash.reduce((acc, reg) => acc + (reg.entregas || 0), 0); // Suma las entregas registradas

    const promedioIngresoEntrega = totalEntregas > 0 ? totalIngresos / totalEntregas : 0;
    const ingresosPorHora = totalHoras > 0 ? totalIngresos / totalHoras : 0;
    const ingresosPorMilla = totalMillas > 0 ? totalIngresos / totalMillas : 0;

    document.getElementById("totalEntregas").innerText = totalEntregas; // Actualiza el total de entregas
    document.getElementById("promedioIngresoEntrega").innerText = promedioIngresoEntrega.toFixed(2);
    document.getElementById("ingresosPorHora").innerText = ingresosPorHora.toFixed(2);
    document.getElementById("ingresosPorMilla").innerText = ingresosPorMilla.toFixed(2);

    generarGraficoIngresosGastos(totalIngresos, totalGastos);
    generarGraficoEficiencia(ingresosPorHora, ingresosPorMilla);
    actualizarTablaDoorDash();
}

function actualizarTablaDoorDash() {
    const tbody = document.querySelector("#tablaDoorDash tbody");
    tbody.innerHTML = "";

    registrosDoorDash.forEach(reg => {
        const fila = `
            <tr>
                <td>${reg.fecha}</td>
                <td>$${reg.ingresos.toFixed(2)}</td>
                <td>$${reg.gastos.toFixed(2)}</td>
                <td>${reg.millas.toFixed(2)}</td>
                <td>${reg.horas.toFixed(2)}</td>
                <td>${reg.entregas || 0}</td>
            </tr>
        `;
        tbody.innerHTML += fila;
    });
}

function generarGraficoIngresosGastos(ingresos, gastos) {
    const canvas = document.getElementById("graficoIngresosGastos");
    if (!canvas) return;

    if (canvas.chart) {
        canvas.chart.destroy();
    }

    const ctx = canvas.getContext("2d");
    canvas.chart = new Chart(ctx, {
        type: "doughnut",
        data: {
            labels: ["Ingresos", "Gastos"],
            datasets: [{
                data: [ingresos, gastos],
                backgroundColor: ["#4caf50", "#f44336"],
                borderColor: ["#388e3c", "#d32f2f"],
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            animation: {
                animateScale: true,
                animateRotate: true
            },
            plugins: {
                legend: {
                    display: true,
                    position: "bottom"
                },
                tooltip: {
                    callbacks: {
                        label: function (context) {
                            const label = context.label || '';
                            const value = context.raw || 0;
                            return `${label}: $${value.toFixed(2)}`;
                        }
                    }
                }
            }
        }
    });
}

function generarGraficoEficiencia(ingresosPorHora, ingresosPorMilla) {
    const canvas = document.getElementById("graficoEficiencia");
    if (!canvas) return;

    if (canvas.chart) {
        canvas.chart.destroy();
    }

    const ctx = canvas.getContext("2d");
    canvas.chart = new Chart(ctx, {
        type: "bar",
        data: {
            labels: ["Ingresos/Hora", "Ingresos/Milla"],
            datasets: [{
                label: "Eficiencia",
                data: [ingresosPorHora, ingresosPorMilla],
                backgroundColor: ["#007bff", "#ff9800"],
                borderColor: ["#0056b3", "#e65100"],
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            animation: {
                duration: 1500,
                easing: "easeInOutQuad"
            },
            plugins: {
                legend: { display: false },
                tooltip: {
                    callbacks: {
                        label: function (context) {
                            const label = context.label || '';
                            const value = context.raw || 0;
                            return `${label}: $${value.toFixed(2)}`;
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function (value) {
                            return `$${value}`;
                        }
                    }
                }
            }
        }
    });
}

function exportarDoorDash() {
    let csv = "Fecha,Ingresos,Gastos,Millas,Horas\n";
    registrosDoorDash.forEach(reg => {
        csv += `${reg.fecha},${reg.ingresos},${reg.gastos},${reg.millas},${reg.horas}\n`;
    });

    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "doordash_registros.csv";
    a.click();
    window.URL.revokeObjectURL(url);
    mostrarNotificacion("Datos exportados correctamente", "success");
}

function resetearDoorDash() {
    if (!confirm("¿Estás seguro de que quieres reiniciar los datos de DoorDash? Esta acción no se puede deshacer.")) {
        return;
    }

    localStorage.removeItem("registrosDoorDash");
    registrosDoorDash = [];

    document.getElementById("totalEntregas").innerText = "0";
    document.getElementById("promedioIngresoEntrega").innerText = "0";
    document.getElementById("ingresosPorHora").innerText = "0";
    document.getElementById("ingresosPorMilla").innerText = "0";

    const tbody = document.querySelector("#tablaDoorDash tbody");
    if (tbody) {
        tbody.innerHTML = "";
    }

    const canvasIngresosGastos = document.getElementById("graficoIngresosGastos");
    if (canvasIngresosGastos && canvasIngresosGastos.chart) {
        canvasIngresosGastos.chart.destroy();
    }

    const canvasEficiencia = document.getElementById("graficoEficiencia");
    if (canvasEficiencia && canvasEficiencia.chart) {
        canvasEficiencia.chart.destroy();
    }

    mostrarNotificacion("Datos de DoorDash reiniciados con éxito", "success");
}

function actualizarResumen() {
    const resumenElement = document.getElementById("resumen");
    if (!resumenElement) return; // Add this check to prevent null error

    const ingresos = parseFloat(document.getElementById("ingresos").value) || 0;
    const montoGasto = parseFloat(document.getElementById("montoGasto").value) || 0;
    const gasolina = parseFloat(document.getElementById("gasolina").value) || 0;

    const totalGastos = montoGasto + gasolina;
    const balance = ingresos - totalGastos;

    resumenElement.innerHTML = `
        <div class="row g-3">
            <div class="col-md-4">
                <div class="card text-center">
                    <div class="card-body">
                        <h5 class="card-title">Ingresos</h5>
                        <p class="card-text">$${ingresos.toFixed(2)}</p>
                    </div>
                </div>
            </div>
            <div class="col-md-4">
                <div class="card text-center">
                    <div class="card-body">
                        <h5 class="card-title">Gastos</h5>
                        <p class="card-text">$${totalGastos.toFixed(2)}</p>
                    </div>
                </div>
            </div>
            <div class="col-md-4">
                <div class="card text-center ${balance >= 0 ? 'bg-success text-white' : 'bg-danger text-white'}">
                    <div class="card-body">
                        <h5 class="card-title">Balance</h5>
                        <p class="card-text">$${balance.toFixed(2)}</p>
                    </div>
                </div>
            </div>
        </div>
    `;
}

// Añade la funcionalidad para registrar el número de entregas realizadas.

function registrarEntregas() {
    const entregasInput = document.getElementById("entregasRealizadas");
    if (!entregasInput) return;

    const entregas = parseInt(entregasInput.value) || 0;
    if (entregas <= 0) {
        mostrarNotificacion("Por favor, ingresa un número válido de entregas", "warning");
        return;
    }

    const fechaActual = new Date().toLocaleDateString('es-ES');
    const registroExistente = registrosDoorDash.find(reg => reg.fecha === fechaActual);

    if (registroExistente) {
        registroExistente.entregas = entregas;
    } else {
        registrosDoorDash.push({
            fecha: fechaActual,
            ingresos: 0,
            gastos: 0,
            millas: 0,
            horas: 0,
            entregas,
            timestamp: new Date().getTime()
        });
    }

    localStorage.setItem("registrosDoorDash", JSON.stringify(registrosDoorDash));
    actualizarEstadisticasDoorDash();
    mostrarNotificacion("Entregas registradas correctamente", "success");
    entregasInput.value = "";
}

// Actualiza la tabla para incluir el número de entregas
function actualizarTablaDoorDash() {
    const tbody = document.querySelector("#tablaDoorDash tbody");
    tbody.innerHTML = "";

    registrosDoorDash.forEach(reg => {
        const fila = `
            <tr>
                <td>${reg.fecha}</td>
                <td>$${reg.ingresos.toFixed(2)}</td>
                <td>$${reg.gastos.toFixed(2)}</td>
                <td>${reg.millas.toFixed(2)}</td>
                <td>${reg.horas.toFixed(2)}</td>
                <td>${reg.entregas || 0}</td>
            </tr>
        `;
        tbody.innerHTML += fila;
    });
}

function analizarFinanzas() {
    const registros = JSON.parse(localStorage.getItem("registros")) || {};
    const semanaActual = obtenerSemanaActual();
    const dataActual = registros[semanaActual] || [];
    
    // Obtener fecha actual
    const hoy = new Date().toLocaleDateString('es-ES');
    
    // Análisis diario
    const registrosHoy = dataActual.filter(r => r.fecha === hoy);
    const ingresosHoy = registrosHoy.reduce((acc, r) => acc + r.ingresos, 0);
    const gastosHoy = registrosHoy.reduce((acc, r) => acc + r.gastos + r.gasolina, 0);
    
    // Análisis semanal
    const ingresosSemana = dataActual.reduce((acc, r) => acc + r.ingresos, 0);
    const gastosSemana = dataActual.reduce((acc, r) => acc + r.gastos + r.gasolina, 0);
    
    // Categorías de gastos
    const gastosPorCategoria = {};
    dataActual.forEach(r => {
        if (!gastosPorCategoria[r.categoria]) {
            gastosPorCategoria[r.categoria] = 0;
        }
        gastosPorCategoria[r.categoria] += r.gastos;
    });
    
    // Calcular porcentajes y tendencias
    const balanceHoy = ingresosHoy - gastosHoy;
    const balanceSemana = ingresosSemana - gastosSemana;
    const tasaAhorro = ingresosSemana > 0 ? ((ingresosSemana - gastosSemana) / ingresosSemana) * 100 : 0;
    
    // Generar sugerencias
    const sugerencias = generarSugerencias(tasaAhorro, gastosPorCategoria, balanceSemana);
    
    return {
        diario: { ingresos: ingresosHoy, gastos: gastosHoy, balance: balanceHoy },
        semanal: { ingresos: ingresosSemana, gastos: gastosSemana, balance: balanceSemana },
        categorias: gastosPorCategoria,
        metricas: { tasaAhorro },
        sugerencias
    };
}

function generarSugerencias(tasaAhorro, categorias, balance) {
    const sugerencias = [];
    
    // Sugerencias basadas en la tasa de ahorro
    if (tasaAhorro < 20) {
        sugerencias.push("📊 Tu tasa de ahorro está por debajo del 20%. Considera reducir gastos no esenciales.");
    } else if (tasaAhorro >= 40) {
        sugerencias.push("🌟 ¡Excelente tasa de ahorro! Considera invertir el excedente.");
    }
    
    // Sugerencias basadas en categorías de gastos
    const categoriasOrdenadas = Object.entries(categorias)
        .sort(([,a], [,b]) => b - a);
    
    if (categoriasOrdenadas.length > 0) {
        const [categoriaMaxGasto, montoMaxGasto] = categoriasOrdenadas[0];
        sugerencias.push(`💡 Tu mayor gasto es en "${categoriaMaxGasto}". Revisa si puedes optimizar este aspecto.`);
    }
    
    // Sugerencias basadas en el balance
    if (balance < 0) {
        sugerencias.push("⚠️ Tu balance es negativo. Prioriza reducir gastos no esenciales.");
    } else if (balance > 1000) {
        sugerencias.push("💰 Tienes un buen excedente. Considera opciones de inversión o ahorro.");
    }
    
    return sugerencias;
}

function actualizarResumenFinanciero() {
    const resumen = analizarFinanzas();
    const resumenElement = document.getElementById("resumenFinanciero");
    if (!resumenElement) return;

    resumenElement.innerHTML = `
        <div class="card-modern p-4 mb-4">
            <h3 class="mb-3"><i class="fas fa-chart-line"></i> Análisis Financiero</h3>
            
            <div class="row g-3 mb-4">
                <div class="col-md-6">
                    <div class="card">
                        <div class="card-header bg-primary text-white">
                            <h5 class="mb-0">Hoy</h5>
                        </div>
                        <div class="card-body">
                            <p>Ingresos: $${resumen.diario.ingresos.toFixed(2)}</p>
                            <p>Gastos: $${resumen.diario.gastos.toFixed(2)}</p>
                            <p class="${resumen.diario.balance >= 0 ? 'text-success' : 'text-danger'}">
                                Balance: $${resumen.diario.balance.toFixed(2)}
                            </p>
                        </div>
                    </div>
                </div>
                
                <div class="col-md-6">
                    <div class="card">
                        <div class="card-header bg-info text-white">
                            <h5 class="mb-0">Esta Semana</h5>
                        </div>
                        <div class="card-body">
                            <p>Ingresos: $${resumen.semanal.ingresos.toFixed(2)}</p>
                            <p>Gastos: $${resumen.semanal.gastos.toFixed(2)}</p>
                            <p class="${resumen.semanal.balance >= 0 ? 'text-success' : 'text-danger'}">
                                Balance: $${resumen.semanal.balance.toFixed(2)}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            <div class="sugerencias-container p-3 bg-light rounded">
                <h4 class="mb-3"><i class="fas fa-lightbulb"></i> Sugerencias</h4>
                <ul class="list-unstyled">
                    ${resumen.sugerencias.map(s => `<li class="mb-2">${s}</li>`).join('')}
                </ul>
            </div>
        </div>
    `;
}