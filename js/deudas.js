import { saveToLocalStorage, getFromLocalStorage, removeFromLocalStorage } from './localStorage.js';
import { showAlert } from './main.js';

document.addEventListener('DOMContentLoaded', () => {
    const deudas = getFromLocalStorage('deudas') || [];
    const pagos = getFromLocalStorage('pagos') || [];
    const deudaForm = document.getElementById('deudaForm');
    const deudaList = document.getElementById('deudaList');
    const categoriaDeuda = document.getElementById('categoriaDeuda');
    const categoriaPersonalizadaContainer = document.getElementById('categoriaPersonalizadaContainer');
    const nombrePagoDeuda = document.getElementById('nombrePagoDeuda');
    const registrarPagoBtn = document.getElementById('registrarPagoBtn');
    const resetearDeudasBtn = document.getElementById('resetearDeudasBtn');
    const tablaPagos = document.getElementById('tablaPagos')?.querySelector('tbody');
    const montoTotalDeuda = document.getElementById('montoTotalDeuda');
    const totalPagado = document.getElementById('totalPagado');
    const saldoPendiente = document.getElementById('saldoPendiente');
    const progressBar = document.getElementById('progressBar');
    const porcentajePagado = document.getElementById('porcentajePagado');
    const graficoDeuda = document.getElementById('graficoDeuda')?.getContext('2d');
    const graficoCategorias = document.getElementById('graficoCategorias')?.getContext('2d');
    let chartDeuda, chartCategorias;

    const renderDeudas = () => {
        if (!nombrePagoDeuda) return;
        nombrePagoDeuda.innerHTML = '<option value="" disabled selected>Seleccione una deuda</option>';
        deudas.forEach((deuda, index) => {
            const option = document.createElement('option');
            option.value = index;
            option.textContent = deuda.nombre;
            nombrePagoDeuda.appendChild(option);
        });

        actualizarResumen();
        actualizarHistorial(deudas);
        actualizarGraficos();
    };

    const actualizarResumen = () => {
        if (!montoTotalDeuda || !totalPagado || !saldoPendiente || !progressBar || !porcentajePagado) {
            console.warn('Algunos elementos del DOM no están disponibles para actualizar el resumen.');
            return;
        }

        const totalMonto = deudas.reduce((sum, deuda) => sum + deuda.monto, 0);
        const totalPagos = deudas.reduce((sum, deuda) => sum + deuda.pagado, 0);
        const saldo = totalMonto - totalPagos;
        const progreso = totalMonto > 0 ? (totalPagos / totalMonto) * 100 : 0;

        montoTotalDeuda.innerText = totalMonto.toFixed(2);
        totalPagado.innerText = totalPagos.toFixed(2);
        saldoPendiente.innerText = saldo.toFixed(2);
        progressBar.style.width = `${progreso}%`;
        progressBar.setAttribute('aria-valuenow', progreso.toFixed(2));
        porcentajePagado.innerText = `${progreso.toFixed(2)}%`;
    };

    const inicializarDataTable = (selector) => {
        if (!$.fn.DataTable.isDataTable(selector)) {
            // Inicializar DataTable solo si no está inicializado
            $(selector).DataTable({
                responsive: true,
                language: {
                    url: 'https://cdn.datatables.net/plug-ins/1.13.5/i18n/es-ES.json' // Cambiar a HTTPS para evitar problemas de CORS
                },
                autoWidth: false, // Asegurarse de que las columnas se ajusten correctamente
            });
        }
    };

    const actualizarHistorial = (pagos) => {
        const tablaPagos = document.getElementById('tablaPagos')?.querySelector('tbody');
        if (!tablaPagos) return;

        // Limpiar el contenido de la tabla
        tablaPagos.innerHTML = '';

        if (pagos.length === 0) {
            // Mostrar mensaje si no hay pagos registrados
            const row = document.createElement('tr');
            row.innerHTML = `
                <td colspan="5" class="text-center">No hay pagos registrados</td>
            `;
            tablaPagos.appendChild(row);
        } else {
            // Agregar filas con los pagos registrados
            const fragment = document.createDocumentFragment();
            pagos.forEach((pago) => {
                const montoTotal = pago.montoTotal || 0;
                const pagado = pago.pagado || 0;
                const pendiente = montoTotal - pagado;

                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${new Date(pago.fecha).toLocaleDateString()}</td>
                    <td>${pago.nombre || 'Sin nombre'}</td>
                    <td>$${montoTotal.toFixed(2)}</td>
                    <td>$${pagado.toFixed(2)}</td>
                    <td>$${pendiente.toFixed(2)}</td>
                `;
                fragment.appendChild(row);
            });
            tablaPagos.appendChild(fragment);
        }

        // Inicializar DataTable
        inicializarDataTable('#tablaPagos');
    };

    const actualizarGraficos = () => {
        if (!graficoDeuda || !graficoCategorias) return;
        const totalMonto = deudas.reduce((sum, deuda) => sum + deuda.monto, 0);
        const totalPagos = deudas.reduce((sum, deuda) => sum + deuda.pagado, 0);
        const categorias = deudas.reduce((acc, deuda) => {
            acc[deuda.categoria] = (acc[deuda.categoria] || 0) + deuda.monto;
            return acc;
        }, {});

        // Gráfico de Estado General de Deudas
        if (chartDeuda) chartDeuda.destroy();
        chartDeuda = new Chart(graficoDeuda, {
            type: 'doughnut',
            data: {
                labels: ['Pagado', 'Pendiente'],
                datasets: [{
                    data: [totalPagos, totalMonto - totalPagos],
                    backgroundColor: ['#4caf50', '#f44336']
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: { position: 'bottom' }
                }
            }
        });

        // Gráfico de Deudas por Categoría
        if (chartCategorias) chartCategorias.destroy();
        chartCategorias = new Chart(graficoCategorias, {
            type: 'bar',
            data: {
                labels: Object.keys(categorias),
                datasets: [{
                    label: 'Monto por Categoría',
                    data: Object.values(categorias),
                    backgroundColor: '#2196f3'
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: { display: false }
                }
            }
        });
    };

    const scheduleNotification = (nombre, fecha, hora) => {
        const recordatorio = new Date(`${fecha}T${hora}`);
        const ahora = new Date();

        if (recordatorio > ahora) {
            const tiempoRestante = recordatorio - ahora;
            setTimeout(() => {
                showAlert(`Recordatorio: Es hora de revisar la deuda "${nombre}".`, 'info');
            }, tiempoRestante);
        }
    };

    deudaForm?.addEventListener('submit', (e) => {
        e.preventDefault();
        const nombre = document.getElementById('nombreDeuda')?.value.trim();
        const monto = parseFloat(document.getElementById('montoDeuda')?.value);
        const categoria = categoriaDeuda?.value === 'Otro'
            ? document.getElementById('categoriaPersonalizada')?.value.trim()
            : categoriaDeuda?.value;
        const fechaRecordatorio = document.getElementById('fechaRecordatorio')?.value;
        const horaRecordatorio = document.getElementById('horaRecordatorio')?.value;

        if (!nombre || isNaN(monto) || monto <= 0 || !categoria || !fechaRecordatorio || !horaRecordatorio) {
            showAlert('Por favor, complete todos los campos correctamente.', 'danger');
            return;
        }

        deudas.push({ nombre, monto, pagado: 0, categoria, fechaRecordatorio, horaRecordatorio });
        saveToLocalStorage('deudas', deudas);
        scheduleNotification(nombre, fechaRecordatorio, horaRecordatorio);
        renderDeudas();
        deudaForm.reset();
        if (categoriaPersonalizadaContainer) categoriaPersonalizadaContainer.style.display = 'none';
        showAlert('Deuda registrada con éxito.', 'success');
    });

    categoriaDeuda?.addEventListener('change', () => {
        if (categoriaPersonalizadaContainer) {
            categoriaPersonalizadaContainer.style.display = categoriaDeuda.value === 'Otro' ? 'block' : 'none';
        }
    });

    const registrarPago = () => {
        const deudaIndex = parseInt(nombrePagoDeuda?.value);
        const pagoRealizado = parseFloat(document.getElementById('pagoRealizado')?.value);

        if (isNaN(deudaIndex) || isNaN(pagoRealizado) || pagoRealizado <= 0) {
            showAlert('Por favor, seleccione una deuda y un monto válido.', 'danger');
            return;
        }

        const deuda = deudas[deudaIndex];
        deuda.pagado += pagoRealizado;

        if (deuda.pagado > deuda.monto) {
            deuda.pagado = deuda.monto; // Evitar que el pago exceda el monto total
        }

        // Guardar el pago en el array de pagos
        const nuevoPago = {
            fecha: new Date().toISOString(),
            nombre: deuda.nombre,
            montoTotal: deuda.monto,
            pagado: pagoRealizado, // Registrar solo el monto del pago realizado
        };
        pagos.push(nuevoPago);

        // Guardar en localStorage
        saveToLocalStorage('deudas', deudas);
        saveToLocalStorage('pagos', pagos);

        // Actualizar la tabla de pagos
        actualizarHistorial(pagos);

        // Mostrar mensaje de éxito
        showAlert(`Pago registrado con éxito. Total pagado: $${deuda.pagado}`, 'success');

        // Limpiar el formulario de pagos
        document.getElementById('pagoRealizado').value = '';
        nombrePagoDeuda.value = '';
    };

    // Evento para registrar pagos
    registrarPagoBtn?.addEventListener('click', registrarPago);

    resetearDeudasBtn?.addEventListener('click', () => {
        if (confirm('¿Está seguro de que desea reiniciar todas las deudas?')) {
            deudas.length = 0;
            removeFromLocalStorage('deudas');
            renderDeudas(); // Actualizar la tabla y los gráficos
            showAlert('Todas las deudas han sido reiniciadas.', 'success');
        }
    });

    // Inicializar DataTable al cargar la página
    inicializarDataTable('#tablaPagos');

    renderDeudas();
});
