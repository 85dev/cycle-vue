// utils/dateFormatter.js

function formatReadableDate(dateString) {
    if (!dateString) return ''
    const date = new Date(dateString)
    return date.toLocaleDateString('fr-FR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

function formatISODate(date) {
  const d = new Date(date);
  return d.toISOString().split('T')[0]; // This will format the date to YYYY-MM-DD
}

function daysUntilDelivery (orderDeliveryTime) {
  const today = new Date()
  const deliveryDate = new Date(orderDeliveryTime)
  const timeDifference = deliveryDate - today
  return Math.ceil(timeDifference / (1000 * 60 * 60 * 24)) // Convert milliseconds to days
}

// Helper functions to calculate status
function isInTransit(item) {
  const now = new Date();
  const departure = new Date(item.real_departure_time);
  const arrival = new Date(item.delivery_date || item.arrival_time); // Use delivery_date or arrival_time

  return now >= departure && now <= arrival;
}

function isInProduction(item) {
  const now = new Date();
  const departure = new Date(item.real_departure_time);

  return now < departure;
}

function isLate(item) {
  const now = new Date();
  const arrival = new Date(item.delivery_date || item.arrival_time); // Use delivery_date or arrival_time

  return now > arrival;
}

function getStatus(item) {
  if (isInTransit(item)) {
    return { message: 'En transit', icon: 'mdi-ferry', color: 'blue' };
  } else if (isInProduction(item)) {
    return { message: 'En production', icon: 'mdi-factory', color: 'warning' };
  } else if (isLate(item)) {
    return { message: 'En retard', icon: 'mdi-alert-circle-outline', color: 'red' };
  }
  return { message: 'Inconnu', icon: 'mdi-help-circle-outline', color: 'grey' };
}

export default {
    formatReadableDate, formatISODate, daysUntilDelivery, isInTransit, isInProduction, isLate, getStatus
};
