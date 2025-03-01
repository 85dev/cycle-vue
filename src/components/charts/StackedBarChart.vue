<script setup>
import { ref, watch, onMounted, nextTick } from 'vue';
import Chart from "chart.js/auto";

// Props
const props = defineProps({
  companyId: { 
        type: Number, 
        required: true 
    },
    data: {
        type: String,
    },
})

let chartInstance = null; 
const chartData = ref({ labels: [], datasets: [] });

async function processChartData(data) {
  if (! data ||  data.length === 0 ||  data.error) {
    chartData.value = { labels: [], datasets: [] };
    return;
  }

  const partLabels = data.map(entry => `${entry.part_reference} ${entry.part_designation}`);
  const clientPrices = data.map(entry => entry.last_client_price);
  const supplierCosts =  data.map(entry => entry.last_supplier_price);
  const margins =  data.map(entry => entry.margin);

  chartData.value = {
    labels: partLabels,
    datasets: [
      {
        label: "Client Price",
        data: clientPrices,
        backgroundColor: "rgba(70, 152, 203, 0.7)", // Blue
        borderWidth: 1
      },
      {
        label: "Supplier Cost",
        data: supplierCosts,
        backgroundColor: "rgba(243, 136, 167, 0.7)", // Pink
        borderWidth: 1
      },
      {
        label: "Margin",
        data: margins,
        backgroundColor: "rgba(92, 184, 92, 0.7)", // Green
        borderWidth: 1
      }
    ]
  };

  await nextTick();
  renderChart();
}

watch(() => props.companyId, processChartData(props.data));

watch(chartData, () => {
  renderChart();
});

async function renderChart() {  
  await nextTick();

  const ctx = document.getElementById("marginChart")?.getContext("2d");
  if (!ctx) return;
  
  if (chartInstance) {
    chartInstance.destroy();
  }

  chartInstance = new Chart(ctx, {
    type: "bar",
    data: chartData.value,
    options: {
      responsive: true,
      plugins: {
        legend: { position: "top" }
      },
      scales: {
        x: { stacked: true },
        y: { stacked: true, beginAtZero: true }
      }
    }
  });
}

onMounted(async () => {
    processChartData(props.data)
});
</script>

<template>
  <div>
    <canvas v-show="chartData.labels.length" id="marginChart"></canvas>
    <v-chip v-if="!chartData.labels.length" variant="text" color="secondary" class="informative-text">
      Aucune pièce avec des commandes client et des commandes fournisseur n'est enregistrée
    </v-chip>
  </div>
</template>