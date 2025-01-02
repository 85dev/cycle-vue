function statusIcon(status) {
    switch (status) {
      case 'transit':
        return 'mdi-ferry';
      case 'partial_sent_and_production':
        return 'mdi-truck-delivery-outline';
      case 'production':
        return 'mdi-factory';
      case 'partial':
        return 'mdi-circle-half-full'
      case 'stock':
        return 'mdi-warehouse';
      case 'completed':
        return 'mdi-check-circle-outline';
      default:
        return 'mdi-alert-circle-outline';
    }
  }
  
function statusText(status) {
    switch (status) {
        case 'transit':
          return 'Transit';
        case 'partial_sent_and_production':
          return 'Partiel envoyé & production';
        case 'production':
          return 'Production';
        case 'partial':
          return 'Partiel envoyé'
        case 'stock':
          return 'Stock';
        case 'completed':
          return 'Commande envoyée';
        default:
          return 'Statut inconnu';
    }
}

function statusIconColor(status) {
    switch (status) {
        case 'transit':
          return 'primary';
        case 'partial_sent_and_production':
          return 'orange';
        case 'production':
          return 'orange';
        case 'partial':
          return 'primary';
        case 'stock':
          return 'green';
        case 'completed':
          return 'success';
        default:
        return 'red';
    }
}

function getStatusRequestColor(status) {
  switch (status) {
    case 'pending':
      return 'warning'; // Yellow chip for pending
    case 'accepted':
      return 'success'; // Green chip for accepted
    case 'rejected':
      return 'error'; // Red chip for rejected
    default:
      return 'secondary'; // Default color if status is unknown
  }
}

function getStatusRequestIcon(status) {
  switch (status) {
    case 'pending':
      return 'mdi-progress-clock'; // Clock icon for pending
    case 'accepted':
      return 'mdi-check-circle-outline'; // Check icon for accepted
    case 'rejected':
      return 'mdi-close-circle-outline'; // Close icon for rejected
    default:
      return 'mdi-alert-circle-outline'; // Default icon for unknown status
  }
}

function formatStatusRequest(status) {
  switch (status) {
    case 'pending':
      return 'En attente'; // Translate or format status
    case 'accepted':
      return 'Accepté';
    case 'rejected':
      return 'Rejeté';
    default:
      return 'Inconnu'; // Default if the status is not recognized
  }
}

export { statusIcon, statusIconColor, statusText, getStatusRequestColor, getStatusRequestIcon, formatStatusRequest }