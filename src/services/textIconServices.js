function statusIcon(status) {
    switch (status) {
      case 'transit':
        return 'mdi-ferry';
      case 'partial_sent_and_in_production':
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
        case 'partial_sent_and_in_production':
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
        case 'partial_sent_and_in_production':
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

export { statusIcon, statusIconColor, statusText }