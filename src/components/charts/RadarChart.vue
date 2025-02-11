<script setup>
import { ref, watch, onMounted } from 'vue';
import Chart from "chart.js/auto";
import apiCaller from "@/services/apiCaller";

// Props
const props = defineProps({
  selectedCompanyId: {
    type: Number,
    required: true
  }
});

const radarChartData = ref([]);

async function fetchRevenueVsCosts() {
  if (!props.selectedCompanyId) return;

  try {
    const response = await apiCaller.get(`companies/${props.selectedCompanyId}/revenue_vs_costs`);
    processChartData(response);
  } catch (error) {
    console.error("Error fetching revenue vs. costs:", error);
  }
}

function processChartData(data) {
  if (!data || data.length === 0) {
    radarChartData.value = { labels: [], datasets: [] };
    return;
  }

  const months = data.map(entry => entry.month || "Unknown");

  const revenueData = data.map(entry => entry.revenue || 0);
  const supplierCostsData = data.map(entry => entry.supplier_costs || 0);

  radarChartData.value = {
    labels: months,
    datasets: [
      {
        label: "Revenue",
        data: revenueData,
        borderColor: "#4698CB",
        backgroundColor: "rgba(70, 152, 203, 0.2)",
        borderWidth: 2
      },
      {
        label: "Supplier Costs",
        data: supplierCostsData,
        borderColor: "#F388A7",
        backgroundColor: "rgba(243, 136, 167, 0.2)",
        borderWidth: 2
      }
    ]
  };
}

watch(() => props.selectedCompanyId, async (newId, oldId) => {
  if (newId && newId !== oldId) {
    await fetchRevenueVsCosts();
  }
});

watch(radarChartData, () => {
  renderChart();
});

function renderChart() {
  const ctx = document.getElementById("revenueVsCostsChart")?.getContext("2d");

  new Chart(ctx, {
    type: "radar",
    data: radarChartData.value,
    options: {
      responsive: true,
      scales: {
        r: { beginAtZero: true }
      },
      plugins: {
        legend: { position: "top" }
      }
    }
  });
}

onMounted(async() => {
    await fetchRevenueVsCosts();
});
</script>

<template>
    <div>
      <canvas id="revenueVsCostsChart"></canvas>
    </div>
</template>