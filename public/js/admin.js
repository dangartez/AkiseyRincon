// admin.js
const db = firebase.firestore();

// Agregar un nuevo servicio
function addService() {
    const serviceName = document.getElementById('service-name').value;
    const serviceDuration = document.getElementById('service-duration').value;

    db.collection('services').add({
        name: serviceName,
        duration: parseInt(serviceDuration)
    }).then(() => {
        alert('Servicio agregado');
        loadServices();
    }).catch(error => {
        console.log('Error al agregar el servicio:', error);
    });
}

// Cargar la lista de servicios
function loadServices() {
    db.collection('services').get().then((snapshot) => {
        const serviceList = document.getElementById('service-list');
        serviceList.innerHTML = '';
        snapshot.forEach(doc => {
            const service = doc.data();
            const li = document.createElement('li');
            li.textContent = `${service.name} - ${service.duration} minutos`;
            serviceList.appendChild(li);
        });
    });
}

document.addEventListener('DOMContentLoaded', loadServices);
