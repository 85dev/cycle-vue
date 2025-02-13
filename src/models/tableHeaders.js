const clientOrdersHeaders = [
    { title: 'Numéro de commande', value: 'client_order_number' },
    { title: 'Quantité', value: 'quantity'},
    { title: 'Prix unitaire', value: 'price'},
    { title: 'Statut', value: 'status'},
    { title: 'Date de livraison souhaitée', value: 'delivery_date'},
    { title: 'Date de livraison réelle', value: 'real_delivery_time'},
    { title: 'Actions', value: 'actions', sortable: false }
  ]

const clientOrdersHeadersSPE = [
    { title: 'Client', value: 'client_name' },
    { title: 'Numéro de commande', value: 'order_number' },
    { title: 'Référence', value: 'reference_and_designation' },
    { title: 'Quantité', value: 'quantity'},
    { title: 'Prix unitaire', value: 'price'},
    { title: 'Date de livraison', value: 'delivery_date'},
    { title: 'Actions', value: 'actions', sortable: false }
]

const supplierOrdersHeadersSPE = [
  { title: 'Fournisseur', value: 'supplier_name' },
  { title: 'Numéro de commande', value: 'order_number' },
  { title: 'Référence', value: 'reference_and_designation' },
  { title: 'Quantité', value: 'quantity'},
  { title: 'Prix unitaire', value: 'price'},
  { title: 'Date de livraison', value: 'delivery_date'},
  { title: 'Actions', value: 'actions', sortable: false }
]

const partHeaders = [
  { title: 'Référence & désignation', value: 'reference'},
  { title: 'Actions requises', value: 'urgencies'},
  { title: 'Matière', value: 'material'},
  { title: 'Dessin', value: 'drawing'},
  { title: 'Prix fournisseur', value: 'latest_supplier_price'},
  { title: 'Prix client', value: 'latest_client_price'},
  { title: 'Actions', value: 'actions', sortable: false },
]

const stockHeaders = [
  { title: 'Référence & Désignation', value: 'reference_and_designation' },
  { title: 'Stock Consignation Client', value: 'consignment_stock' },
  { title: 'Stock Standard Client', value: 'standard_stock' },
  { title: 'Stock Sous-traitant', value: 'subcontractor_stock' },
  { title: 'Stock Logistique', value: 'logistic_place_stock' },
  { title: 'Stock Total', value: 'total_current_stock' },
  { title: 'Commandes Client', value: 'reserved_stock' },
  { title: 'Commandes Fournisseur', value: 'supplier_orders' },
  { title: 'Expéditions en cours', value: 'expeditions' },
  { title: 'Stock Disponible', value: 'total_available_stock' },
  { title: 'Stock à Terme', value: 'total_future_stock' },
  { title: 'Actions', value: 'actions', sortable: false }
];

const subcontractorHeaders = [
  { title: "Numéro d'expédition", value: 'expedition_number' },
  { title: 'Quantité', value: 'quantity' },
  { title: 'Actions', value: 'actions', sortable: false },
];

const logisticplacesHeaders = [
  { title: "Numéro d'expédition", value: 'expedition_number' },
  { title: 'Quantité', value: 'quantity' },
  { title: 'Actions', value: 'actions', sortable: false },
];

const supplierOrdersHeaders = [
  { title: 'Numéro de commande', value: 'supplier_order_number' },
  { title: 'Quantité commandée', value: 'original_quantity'},
  { title: 'Reste à livrer', value: 'quantity'},
  { title: 'Prix unitaire', value: 'price'},
  { title: 'Statut', value: 'status'},
  { title: 'Date de livraison souhaitée', value: 'delivery_date'},
  { title: 'Date de livraison réelle', value: 'real_delivery_date'},
  { title: 'Actions', value: 'actions', sortable: false },
]

const expeditionHeaders = [
  { title: 'Numéro de commande', value: 'supplier_order_number' },
  { title: 'Référence', value: 'part_reference'},
  { title: 'Désignation', value: 'part_designation'},
  { title: 'Commande partielle', value: 'partial'},
  { title: 'Quantité réelle expédiée', value: 'real_quantity'},
  { title: 'Quantité commandée', value: 'quantity'},
  { title: 'Fournisseur', value: 'supplier_name' },
]

const supplierHeaders = [
  { title: 'Nom', value: 'name' },
  { title: 'Savoir-faire', value: 'knowledge'},
  { title: 'Address', value: 'address'},
  { title: 'Contact', value: 'contact_name'},
  { title: 'Email', value: 'contact_email'},
  { title: 'Actions', value: 'actions', sortable: false }
]

const clientHeaders = [
  { title: 'Nom', value: 'name' },
  { title: 'Address', value: 'address'},
  { title: 'Contact', value: 'contact_name'},
  { title: 'Email', value: 'contact_email'},
  { title: 'Actions', value: 'actions', sortable: false }
]

const logisticplacesIndexHeaders = [
  { title: 'Nom', value: 'name' },
  { title: 'Address', value: 'address'},
  { title: 'Contact', value: 'contact_name'},
  { title: 'Email', value: 'contact_email'},
  { title: 'Actions', value: 'actions', sortable: false }
]

const subcontractorIndexHeaders = [
  { title: 'Nom', value: 'name' },
  { title: 'Address', value: 'address'},
  { title: 'Contact', value: 'contact_name'},
  { title: 'Email', value: 'contact_email'},
  { title: 'Actions', value: 'actions', sortable: false }
]

const multipleDestinationHeaders = [
  { title: 'Quantité', value: 'quantity' },
  { title: 'Sous-traitant', value: 'sub_contractor' },
  { title: 'Lieu de stockage', value: 'logistic_place' },     
  { title: 'Stockage chez client', value: 'client' },                 
  { title: 'Actions', value: 'actions', sortable: false }
]

const transferClientHeaders = [
  { title: 'Date du transfert', value: 'transfer_date' },
  { title: 'Quantité à transférer', value: 'quantity' },
  { title: 'Sous-traitant', value: 'sub_contractor' },
  { title: 'Lieu de stockage', value: 'logistic_place' }
]

const transferHeaders = [
  { title: 'Date du transfert', value: 'transfer_date' },
  { title: 'Quantité à transférer', value: 'quantity' },
  { title: 'Sous-traitant', value: 'sub_contractor' },
  { title: 'Lieu de stockage', value: 'logistic_place' },     
  { title: 'Stockage client', value: 'client' }
]

const clientStockPositionsHeaders = [
  { title: 'Quantité', value: 'quantity' },
  { title: 'Référence', value: 'reference_and_designation' },
  { title: 'Actions', value: 'actions', sortable: false }
]

const consumptionPositionsHeaders = [
  { title: 'Quantité', value: 'quantity' },
  { title: 'Référence', value: 'reference_and_designation' },
  { title: 'Période de consommation', value: 'consumption_period'}
]

const searchCompanyHeaders = [
  { title: 'Nom de l\'entreprise', value: 'name' },
  { title: 'Adresse', value: 'address' },
  { title: 'Structure légale', value: 'legal_structure' },
  { title: 'SIREN', value: 'registration_number' },
];

const accessRequestsHeaders = [
  { title: 'Société', value: 'company_name' },
  { title: 'Demandé par', value: 'requester_email' },
  { title: 'Rôle demandé', value: 'requested_owner_rights' },
  { title: 'Statut', value: 'request_status' },
  { title: 'Actions', value: 'actions', sortable: false }
]

const handleAccountHeaders = [
  { title: 'Email', value: 'user_email' },
  { title: 'Statut de l\'accès', value: 'account_status' },
  { title: 'Rôle', value: 'is_owner' },
  { title: 'Date de création de l\'accès', value: 'account_created_at' },
  { title: 'Actions', value: 'actions', sortable: false }
]

const pendingRequestsHeaders = [
  { title: 'Société', value: 'company_name' },
  { title: 'Rôle', value: 'requested_owner_rights' },
  { title: 'Demandé le', value: 'created_at' }
]

const globalConsumptionHeaders = [
  { title: 'Référence', value: 'part_reference' },
  { title: 'Quantité à disposition', value: 'current_quantity' },
  { title: 'Quantité consommée', value: 'quantity' },
  { title: 'Prix', value: 'price' },
  { title: 'Dernier prix facturé', value: 'latest_client_order_price' },
]

const sortingClientPositionHeaders = [
  { title: 'Quantité', value: 'quantity' },
  { title: 'Référence & désignation', value: 'reference_and_designation' },
  { title: 'Stock consignation', value: 'consignment_stock' },                 
  { title: 'Stock standard', value: 'standard_stock' }
]

const expeditionPositionHeaders = [
  { title: 'Référence', value: 'part_reference'},
  { title: 'Quantité', value: 'quantity'},
  { title: 'Sous-traitant', value: 'sub_contractor' },
  { title: 'Lieu de stockage', value: 'logistic_place'},
  { title: 'Stockage chez client', value: 'client'},
  { title: 'Actions', value: 'actions', sortable: false },
]

const expeditionsListHeaders = [
  { title: "Expédition", value: 'expedition_number'},
  { title: "Commande", value: 'supplier_order_number'},
  { title: "Date de départ", value: 'real_departure_time'},
  { title: "Date d'arrivée estimée", value: 'estimated_arrival_time' },
  { title: "Quantité", value: 'quantity' },
  { title: "Statut", value: 'status' },
  { title: 'Transporteur', value: 'transporter_name'},
  { title: 'Fournisseur', value: 'supplier_name'}
]

const detailedUndelExpeditionsHeaders = [
  { title: "Quantité", value: 'quantity' },
  { title: "Statut de la quantité", value: 'quantity_status' },
  { title: 'Référence', value: 'part_reference'},
  { title: 'Désignation', value: 'part_designation'},
  { title: 'Numéro de commande', value: 'supplier_order_number'},
]

const detailedDelExpeditionsHeaders = [
  { title: "Quantité", value: 'quantity' },
  { title: 'Référence', value: 'part_reference'},
  { title: 'Désignation', value: 'part_designation'},
  { title: 'Numéro de commande', value: 'supplier_order_number'},
]

const expeditionsIndexHeaders = [
  { title: "Numéro d'expédition", value: 'number' },
  { title: "Date de départ", value: 'real_departure_time'},
  { title: "Date d'arrivée estimée", value: 'estimated_arrival_time' },
  { title: "Statut", value: 'status' },
  { title: 'Transporteur', value: 'transporter_name'},
  { title: 'Fournisseur', value: 'supplier_name'},
  { title: 'Actions', value: 'actions', sortable: false }
]

const deliveredExpeditionsHeaders = [
  { title: "Numéro d'expédition", value: 'number' },
  { title: "Date de départ", value: 'real_departure_time'},
  { title: "Date d'arrivée", value: 'arrival_time' },
  { title: "Statut", value: 'status' },
  { title: 'Transporteur', value: 'transporter_name'},
  { title: 'Fournisseur', value: 'supplier_name'},
  { title: 'Actions', value: 'actions', sortable: false }
]

export { clientOrdersHeaders, stockHeaders, detailedUndelExpeditionsHeaders, detailedDelExpeditionsHeaders, deliveredExpeditionsHeaders, transferClientHeaders, clientOrdersHeadersSPE, supplierOrdersHeadersSPE, searchCompanyHeaders, handleAccountHeaders, pendingRequestsHeaders, accessRequestsHeaders, globalConsumptionHeaders, consumptionPositionsHeaders, transferHeaders, clientStockPositionsHeaders, sortingClientPositionHeaders, logisticplacesIndexHeaders, subcontractorIndexHeaders, supplierHeaders, clientHeaders, expeditionPositionHeaders, logisticplacesHeaders, subcontractorHeaders, multipleDestinationHeaders, partHeaders, supplierOrdersHeaders, expeditionHeaders, expeditionsListHeaders, expeditionsIndexHeaders };
