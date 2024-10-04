// app.js

// Función para registrar un nuevo usuario
function register() {
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    if (!email || !password) {
        document.getElementById('auth-message').innerText = 'Por favor, complete todos los campos.';
        return;
    }

    auth.createUserWithEmailAndPassword(email, password)
        .then((userCredential) => {
            const user = userCredential.user;
            document.getElementById('auth-message').innerText = 'Usuario registrado exitosamente.';

            // Guardar el usuario en Firestore
            db.collection('users').doc(user.uid).set({
                email: user.email,
                role: 'user',  // Rol por defecto
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            }).then(() => {
                document.getElementById('auth-message').innerText = 'Datos de usuario guardados en Firestore.';
                showServiceSelection();  // Mostrar selección de categoría y servicio
            }).catch((error) => {
                document.getElementById('auth-message').innerText = `Error al guardar datos: ${error.message}`;
            });
        })
        .catch((error) => {
            document.getElementById('auth-message').innerText = `Error al registrar usuario: ${error.message}`;
        });
}

// Función para iniciar sesión
function login() {
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    if (!email || !password) {
        document.getElementById('auth-message').innerText = 'Por favor, complete todos los campos.';
        return;
    }

    auth.signInWithEmailAndPassword(email, password)
        .then((userCredential) => {
            document.getElementById('auth-message').innerText = 'Sesión iniciada exitosamente.';
            showServiceSelection();  // Mostrar selección de categoría y servicio después de iniciar sesión
            loadAppointments();  // Cargar las citas del usuario
        })
        .catch((error) => {
            document.getElementById('auth-message').innerText = `Error al iniciar sesión: ${error.message}`;
        });
}

// Mostrar opciones tras iniciar sesión
function showUserOptions() {
    const optionsModal = document.getElementById('user-options-modal');
    optionsModal.style.display = 'block';
}

// Mostrar citas programadas
function showUserAppointments() {
    const appointmentsModal = document.getElementById('appointments-modal');
    appointmentsModal.style.display = 'block';
    loadUserAppointments(); // Cargar citas
}

// Cargar las citas del usuario (futuras e históricas)
function loadUserAppointments() {
    const user = auth.currentUser;
    if (user) {
        const upcomingAppointments = [];
        const pastAppointments = [];
        
        db.collection('appointments').where('userId', '==', user.uid).get()
            .then(snapshot => {
                snapshot.forEach(doc => {
                    const appointment = doc.data();
                    const appointmentDate = new Date(appointment.date);
                    const now = new Date();
                    
                    if (appointmentDate >= now) {
                        upcomingAppointments.push(appointment);
                    } else {
                        pastAppointments.push(appointment);
                    }
                });
                displayAppointments(upcomingAppointments, 'upcoming');
                displayAppointments(pastAppointments, 'history');
            });
    }
}

// Mostrar citas en pantalla
function displayAppointments(appointments, type) {
    const container = document.getElementById(type === 'upcoming' ? 'upcoming-appointments' : 'historical-appointments');
    container.innerHTML = '';
    
    appointments.forEach(app => {
        const appointmentDiv = document.createElement('div');
        appointmentDiv.textContent = `${app.date} - ${app.time} - Servicio: ${app.serviceId}`;
        container.appendChild(appointmentDiv);
    });
}

// Mostrar formulario de reserva
function showNewReservationOptions() {
    const reservationModal = document.getElementById('reservation-modal');
    reservationModal.style.display = 'block';
}

// Buscar citas por día o por rango
function searchByTime() {
    const searchType = document.querySelector('input[name="search-type"]:checked').value;
    if (searchType === 'day') {
        showCalendar();
    } else if (searchType === 'time-range') {
        showTimeRangePicker();
    }
}

// Función para agregar múltiples servicios
function addAnotherService() {
    const serviceSelectSection = document.getElementById('service-selection-section');
    const newService = document.createElement('div');
    newService.innerHTML = serviceSelectSection.innerHTML; // Clonar la sección de servicio
    serviceSelectSection.appendChild(newService);
}


// *****
// Función para mostrar la selección de categoría y servicio 
function showServiceSelection() {
    document.getElementById('auth-section').style.display = 'none';
    document.getElementById('service-selection-section').style.display = 'block';
}

// Función para cargar las categorías desde Firestore (con botones grandes)
function loadCategories() {
    const categoryContainer = document.getElementById('category-buttons');
    db.collection('services').get().then(snapshot => {
        const categories = new Set();
        snapshot.forEach(doc => {
            const service = doc.data();
            categories.add(service.category);  // Agregar categorías únicas
        });

        categories.forEach(category => {
            const button = document.createElement('button');
            button.textContent = category;
            button.onclick = function() {
                loadServices(category);
            };
            categoryContainer.appendChild(button);
        });
    });
}

let selectedServiceId = null;
let selectedServiceDuration = null;

// Función para cargar los servicios según la categoría seleccionada
function loadServices(category) {
    const serviceButtons = document.getElementById('service-buttons');
    serviceButtons.innerHTML = '';  // Limpiar los botones anteriores

    db.collection('services').where('category', '==', category).get().then(snapshot => {
        snapshot.forEach(doc => {
            const service = doc.data();
            const serviceId = doc.id;

            // Crear un botón para cada servicio
            const button = document.createElement('button');
            button.textContent = service.name;

            // Evento onclick para seleccionar el servicio
            button.onclick = () => {
                // Actualizar el servicio seleccionado en las variables globales
                selectedServiceId = serviceId;
                selectedServiceDuration = service.duration;

                // Depuración para verificar si se actualizan correctamente
                console.log("Servicio seleccionado:", selectedServiceId, "Duración:", selectedServiceDuration);

                // Mostrar detalles del servicio
                document.getElementById('service-duration').textContent = `Duración del servicio: ${service.duration} minutos`;
                document.getElementById('service-description').textContent = `Descripción: ${service.description}`;

                // Mostrar la selección de fecha y hora
                document.getElementById('calendar-section').style.display = 'block';
                showCalendar(serviceId, service.duration);  // Mostrar el calendario y los horarios disponibles
            };

            // Añadir el botón a la lista
            serviceButtons.appendChild(button);
        });

        serviceButtons.style.display = 'block';  // Mostrar los botones de servicio
    });
}



// Cargar la duración y descripción del servicio seleccionado y mostrar el calendario
function loadServiceDetails(serviceId) {
    const durationElement = document.getElementById('service-duration');
    const descriptionElement = document.getElementById('service-description');

    if (serviceId) {
        db.collection('services').doc(serviceId).get().then(doc => {
            if (doc.exists) {
                const service = doc.data();
                const duration = service.duration;
                const description = service.description;

                // Mostrar duración y descripción
                durationElement.textContent = `Duración del servicio: ${duration} minutos`;
                durationElement.dataset.duration = duration;
                descriptionElement.textContent = `Descripción: ${description}`;

                // Mostrar la selección de fecha y hora
                document.getElementById('calendar-section').style.display = 'block';
                showCalendar(serviceId, duration);  // Mostrar calendario con los horarios disponibles
            }
        });
    }
}

// Variable global para almacenar la fecha seleccionada
let selectedDate = null;
let selectedTime = null;

// Mostrar el calendario con FullCalendar y cargar los horarios disponibles
function showCalendar(serviceId, duration) {
    var calendarEl = document.getElementById('calendar');

    var calendar = new FullCalendar.Calendar(calendarEl, {
        initialView: 'dayGridMonth',
        selectable: true,  // Permitir selección de días
        dateClick: function(info) {
            selectedDate = info.dateStr;  // Guardar la fecha seleccionada en formato YYYY-MM-DD
            loadWorkSchedule(selectedDate, serviceId, duration);  // Cargar horarios según el día seleccionado
        }
    });

    calendar.render();
}

// Cargar los horarios de trabajo del día seleccionado
function loadWorkSchedule(date, serviceId, duration) {
    const dayOfWeek = new Date(date).toLocaleString('en-US', { weekday: 'long' }).toLowerCase();

    db.collection('schedule').doc(dayOfWeek).get().then(doc => {
        if (doc.exists && doc.data().working_day) {
            const schedule = doc.data();
            generateTimeSlotsWithBreak(schedule.morning_open, schedule.morning_close, schedule.afternoon_open, schedule.afternoon_close, duration, date);
        } else {
            alert("Este día no está disponible para reservas.");
        }
    });
}


// Función para seleccionar una hora
function selectTime(time) {
    selectedTime = time;  // Guardar la hora seleccionada
    closeTimeModal();  // Cerrar el modal de horas
    showConfirmationModal();  // Mostrar la confirmación
}

// Función para generar intervalos de tiempo
function generateIntervals(start, end, duration, breakTime) {
    let [startHour, startMinute] = start.split(':').map(Number);
    let [endHour, endMinute] = end.split(':').map(Number);
    const times = [];

    // Convertir las horas de inicio y fin a minutos totales
    let startInMinutes = startHour * 60 + startMinute;
    let endInMinutes = endHour * 60 + endMinute;

    console.log(`Rango de tiempo: ${start} (${startInMinutes} minutos) - ${end} (${endInMinutes} minutos)`);

    // Generar los intervalos de tiempo basados en la duración del servicio y el impás de 15 minutos
    while (startInMinutes + duration <= endInMinutes) {
        let hours = Math.floor(startInMinutes / 60);
        let minutes = startInMinutes % 60;

        // Formatear el tiempo como HH:MM
        const time = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
        times.push(time);

        console.log(`Nuevo intervalo generado: ${time}`);

        // Sumar la duración del servicio y el impás de descanso
        startInMinutes += duration + breakTime;
    }

    return times;
}


// Generar horarios disponibles basados en los horarios de apertura y cierre, con impás de 15 minutos
function generateTimeSlotsWithBreak(morning_open, morning_close, afternoon_open, afternoon_close, duration, selectedDate) {
    // Verificar si 'selectedDate' está definido
    if (!selectedDate) {
        console.error("Error: 'selectedDate' no está definido.");
        return;
    }

    const timeSelectSection = document.getElementById('time-select-section');
    const timeSelect = document.getElementById('time-select');

    // Asegurarse de que el selector existe en el DOM
    if (!timeSelect) {
        console.error("Error: No se encontró el elemento con ID 'time-select'.");
        return;
    }

    // Reiniciar las opciones del select y ocultar por si no hay horarios
    timeSelect.innerHTML = '<option value="">Seleccione una hora</option>';
    timeSelectSection.style.display = 'none';  // Ocultar al principio
    timeSelect.disabled = true;

    console.log(`Generando horarios para la mañana: ${morning_open} - ${morning_close}`);
    console.log(`Generando horarios para la tarde: ${afternoon_open} - ${afternoon_close}`);

    // Asegurarse de que la duración sea un número
    const serviceDuration = typeof duration === 'string' ? parseInt(duration, 10) : duration;

    const breakTime = 15;  // Impás entre servicios

    // Obtener citas reservadas desde Firestore para el día seleccionado
    db.collection('appointments').where('date', '==', selectedDate).get()
    .then(snapshot => {
        const reservedTimes = [];

        // Extraer los horarios de las citas reservadas
        snapshot.forEach(doc => {
            const appointment = doc.data();
            reservedTimes.push(appointment.time);  // Guardar el horario reservado
        });

        console.log('Horarios reservados:', reservedTimes);

        // Generar intervalos de tiempo para la mañana
        const morningTimes = generateIntervals(morning_open, morning_close, serviceDuration, breakTime);

        // Generar intervalos de tiempo para la tarde
        const afternoonTimes = generateIntervals(afternoon_open, afternoon_close, serviceDuration, breakTime);

        const allTimes = [...morningTimes, ...afternoonTimes];

        console.log('Horarios generados:', allTimes);

        // Filtrar las horas que ya están reservadas
        const availableTimes = allTimes.filter(time => !reservedTimes.includes(time));

        console.log('Horarios disponibles:', availableTimes);

        // Mostrar la sección del selector de horas solo si hay horarios disponibles
        if (availableTimes.length > 0) {
            timeSelectSection.style.display = 'block';  // Mostrar la sección del selector de horas
            timeSelect.disabled = false;  // Habilitar el select de horas

            // Añadir las horas disponibles al select
            availableTimes.forEach(time => {
                const option = document.createElement('option');
                option.value = time;
                option.textContent = time;
                timeSelect.appendChild(option);
            });

            // Aquí llamas a la función para mostrar el modal
            showTimeModal(availableTimes);  // Llama a showTimeModal aquí
        } else {
            console.log('No se generaron horarios disponibles.');
            alert('No hay horarios disponibles para este día.');
        }
    })
    .catch(error => {
        console.error('Error al obtener citas reservadas:', error);
    });
}


// Mostrar el modal con las horas disponibles
function showTimeModal(availableTimes) {
    const timeOptions = document.getElementById('time-options');
    timeOptions.innerHTML = '';  // Limpiar las opciones anteriores

    if (availableTimes.length > 0) {
        availableTimes.forEach(time => {
            const button = document.createElement('button');
            button.textContent = time;
            button.onclick = function() {
                selectTime(time);
            };
            timeOptions.appendChild(button);
        });
        const modal = document.getElementById('time-modal');
        modal.style.display = 'block';
    } else {
        alert('No hay horarios disponibles para este día.');
    }
}


// Función para cerrar el modal de horas, ya sea al hacer clic fuera o desde un botón
function closeTimeModal(event = null) {
    const modal = document.getElementById('time-modal');

    // Si se proporciona un evento y el objetivo del clic es el modal (es decir, fuera del contenido), cerrarlo
    if (event && event.target !== modal) return;

    modal.style.display = 'none';
}

// Asignar la función al hacer clic fuera del contenido del modal
window.onclick = function(event) {
    closeTimeModal(event);
};


// Función para seleccionar una hora
function selectTime(time) {
    selectedTime = time;  // Guardar la hora seleccionada
    closeTimeModal();  // Cerrar el modal de horas
    showConfirmationModal();  // Mostrar la confirmación
}


// Mostrar el modal de confirmación
function showConfirmationModal() {
    const serviceSummary = document.getElementById('service-summary');
    const dateSummary = document.getElementById('date-summary');
    const timeSummary = document.getElementById('time-summary');

    serviceSummary.textContent = `Fecha: ${selectedDate}`;
    timeSummary.textContent = `Hora: ${selectedTime}`;

    const modal = document.getElementById('confirmation-modal');
    modal.style.display = 'block';
}

// Cerrar el modal de confirmación
function closeConfirmationModal() {
    const modal = document.getElementById('confirmation-modal');
    modal.style.display = 'none';
}

// Función para confirmar la cita
function confirmAppointment() {
    // Verificar que haya un servicio seleccionado, una fecha y una hora seleccionados
    console.log("Confirmación de cita - Servicio:", selectedServiceId, "Fecha:", selectedDate, "Hora:", selectedTime);

    if (!selectedServiceId || !selectedDate || !selectedTime) {
        alert("Por favor, selecciona un servicio, una fecha y una hora.");
        return;
    }

    // Llamar a la función para guardar la cita con el servicio y horario seleccionados
    scheduleAppointment(selectedServiceId, selectedDate, selectedTime, selectedServiceDuration);
}



// Función para guardar una reserva en Firestore
function scheduleAppointment(serviceId, date, time, duration) {
    const user = auth.currentUser;

    if (user) {
        db.collection('appointments').add({
            userId: user.uid,
            serviceId: serviceId,
            date: date,
            time: time,
            duration: duration,
            status: "pending"
        }).then(() => {
            alert(`Cita agendada exitosamente para el servicio el ${date} a las ${time}`);
            closeConfirmationModal();  // Cerrar el modal de confirmación
        }).catch(error => {
            console.log("Error al agendar la cita:", error);
        });
    } else {
        alert("Debes iniciar sesión para reservar una cita.");
    }
}

// Cargar las citas del usuario autenticado
function loadAppointments() {
    const user = auth.currentUser;
    if (user) {
        db.collection('appointments').where('userId', '==', user.uid)
            .get()
            .then(snapshot => {
                const appointmentsList = document.createElement('ul');
                snapshot.forEach(doc => {
                    const appointment = doc.data();
                    const listItem = document.createElement('li');
                    listItem.textContent = `Cita: ${appointment.date} - ${appointment.time}`;
                    appointmentsList.appendChild(listItem);
                });
                document.body.appendChild(appointmentsList); // Cambiar según dónde quieras mostrar las citas
            })
            .catch(error => {
                console.error("Error al cargar citas:", error);
            });
    }
}


// Inicializar categorías al cargar la página
window.onload = function() {
    loadCategories();
};
