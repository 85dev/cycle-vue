<script setup>
import { ref, onMounted, watch, nextTick } from "vue";
import Chart from "chart.js/auto";
import apiCaller from "@/services/apiCaller";

const props = defineProps({
  companyId: Number,
});

const salesData = ref({ labels: [], datasets: [] });

async function fetchSalesData() {
  if (!props.companyId) return;

  try {
    const response = await apiCaller.get(`companies/${props.companyId}/sales_distribution`);
    processChartData(response);
  } catch (error) {
    console.error("Error fetching sales data:", error);
  }
}

async function processChartData(data) {
  if (!data || data.length === 0) {
    salesData.value = { labels: [], datasets: [] };
    return;
  }

  const colors = ["#F388A7", "#FEDF7A", "#4698CB", "#85E3FF", "#B3D4E0"];
  const labels = data.map(entry => entry.client);
  const values = data.map(entry => entry.total_sales);

  salesData.value = {
    labels,
    datasets: [
      {
        label: "Répartition des ventes par client",
        data: values,
        backgroundColor: colors.slice(0, labels.length),
        borderColor: "#fff",
        borderWidth: 2,
      },
    ],
  };

  await nextTick(); // Ensures the DOM is updated before rendering the chart
  renderChart();
}

function renderChart() {
  const ctx = document.getElementById("salesPolarChart")?.getContext("2d");

  new Chart(ctx, {
    type: "polarArea",
    data: salesData.value,
    options: {
      responsive: true,
      plugins: {
        legend: {
          position: "top",
        },
      },
      animation: {
        animateRotate: true,
        animateScale: true,
      },
    },
  });
}

watch(() => props.companyId, fetchSalesData);

onMounted(async() => {
    await fetchSalesData()
});
</script>

<template>
  <div>
    <canvas v-if="salesData.labels.length" id="salesPolarChart"></canvas>
    <v-chip v-else variant="text" color="secondary" class="informative-text" style="font-weight: 500;">
      Aucun client avec des ventes enregistrées
    </v-chip>
  </div>
</template>