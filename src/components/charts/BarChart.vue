<script setup>
import { ref, watch, onMounted } from "vue";
import Chart from "chart.js/auto";

const props = defineProps({
  chartData: {
    type: Object,
    required: true
  }
});

watch(() => props.chartData, (newData) => {
  if (newData && newData.labels.length > 0) {
    renderChart(newData);
  }
}, { deep: true });

function renderChart(data) {
  const ctx = document.getElementById("partsSoldChart").getContext("2d");

  new Chart(ctx, {
    type: "bar",
    data: {
      labels: data.labels,
      datasets: data.datasets
    },
    options: {
      responsive: true,
      plugins: {
        legend: {
          display: true,
          position: "top"
        }
      }
    }
  });
}

watch(() => props.chartData, renderChart, { deep: true });

onMounted(() => {
  if (props.chartData && props.chartData.labels.length > 0) {
    renderChart(props.chartData);
  }
});
</script>

<template>
  <div>
    <canvas id="partsSoldChart"></canvas>
  </div>
</template>