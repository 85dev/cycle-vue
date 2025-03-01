import { createRouter, createWebHistory } from 'vue-router'

import Dashboard from '@/views/Dashboard.vue'
import SessionManager from '../views/SessionManager.vue'
import PartRelatedData from '../views/PartRelatedData.vue'
import Expeditions from '@/views/Expeditions.vue'
import PartIndex from '@/views/PartIndex.vue'
// import SuppliersIndex from '@/views/SuppliersIndex.vue'
// import ClientsIndex from '@/views/ClientsIndex.vue'
// import SubContractorsIndex from '@/views/SubContractorsIndex.vue'
// import LogisticPlacesIndex from '@/views/LogisticPlacesIndex.vue'
import HandleConsumptions from '@/views/HandleConsumptions.vue'
import HandleOrders from '@/views/HandleOrders.vue'
import PdfCreations from '@/views/PdfCreations.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/', redirect: `/login` },
    { path: '/login', name: 'SessionManager', component: SessionManager },
    { path: '/dashboard', name: 'Dashboard', component: Dashboard },
    { path: '/handle_orders', name: 'Orders', component: HandleOrders },
    { path: '/part_related_data/:id', name: 'PartRelatedData', component: PartRelatedData, props: true },
    { path: '/expeditions', name: 'Expeditions', component: Expeditions },
    { path: '/parts', name: 'PartIndex', component: PartIndex },
    // { path: '/suppliers', name: 'SupplierIndex', component: SuppliersIndex },
    // { path: '/clients', name: 'ClientIndex', component: ClientsIndex },
    // { path: '/subcontractors', name: 'SubContractorIndex', component: SubContractorsIndex },
    // { path: '/logistic-places', name: 'LogisticPlacesIndex', component: LogisticPlacesIndex },
    { path: '/handle_consumptions', name: 'HandleConsumptions', component: HandleConsumptions },
    { path: '/pdf_creations', name: 'PdfCreations', component: PdfCreations },
  ],
})

export default router
