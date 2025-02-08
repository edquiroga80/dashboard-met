document.addEventListener("DOMContentLoaded", () => {
  const startDateInput = document.getElementById("startDate");
  const endDateInput = document.getElementById("endDate");
  const updateBtn = document.getElementById("updateBtn");

  let tempChart, humidityChart, heatIndexChart, tempVarianceChart;
  let fullData = {};

  // Definir fechas iniciales (últimos 7 días)
  const today = new Date().toISOString().split("T")[0];
  const lastWeek = new Date();
  lastWeek.setDate(lastWeek.getDate() - 7);
  startDateInput.value = lastWeek.toISOString().split("T")[0];
  endDateInput.value = today;

  updateBtn.addEventListener("click", () => {
    console.log("🔄 Botón Actualizar presionado. Filtrando datos...");
    updateFilteredData();
  });

  async function fetchWeatherData() {
    const url = "https://api.open-meteo.com/v1/forecast";
    const params = {
      latitude: -34.61,
      longitude: -58.38,
      hourly: "temperature_2m,relative_humidity_2m",
      timezone: "America/Argentina/Buenos_Aires",
    };

    try {
      const response = await fetch(
        `${url}?latitude=${params.latitude}&longitude=${params.longitude}&hourly=${params.hourly}&timezone=${params.timezone}`
      );
      const data = await response.json();

      // Convertir fechas al formato YYYY-MM-DD
      fullData.dates = data.hourly.time.map(
        (t) => new Date(t).toISOString().split("T")[0]
      );
      fullData.temperatures = data.hourly.temperature_2m;
      fullData.humidity = data.hourly.relative_humidity_2m;

      console.log("📌 Fechas descargadas:", fullData.dates);

      updateFilteredData();
    } catch (error) {
      console.error("❌ Error al obtener los datos:", error);
    }
  }

  function updateFilteredData() {
    const startDate = startDateInput.value;
    const endDate = endDateInput.value;

    console.log("🔍 Rango seleccionado:", startDate, "→", endDate);

    if (!fullData.dates || fullData.dates.length === 0) {
      console.warn("⚠️ No se han cargado datos aún.");
      return;
    }

    // Filtrar datos que estén dentro del rango de fechas seleccionadas
    const filteredIndexes = fullData.dates
      .map((date, index) => ({ date, index }))
      .filter((entry) => entry.date >= startDate && entry.date <= endDate)
      .map((entry) => entry.index);

    if (filteredIndexes.length === 0) {
      console.warn("⛔ No hay datos en este rango de fechas.");
      return;
    }

    // Obtener datos filtrados
    const filteredDates = filteredIndexes.map((i) => fullData.dates[i]);
    const filteredTemperatures = filteredIndexes.map(
      (i) => fullData.temperatures[i]
    );
    const filteredHumidity = filteredIndexes.map((i) => fullData.humidity[i]);

    console.log("📊 Datos filtrados:");
    console.log("📆 Fechas:", filteredDates);
    console.log("🌡️ Temperaturas:", filteredTemperatures);
    console.log("💧 Humedad:", filteredHumidity);

    const heatIndex = calculateHeatIndex(
      filteredTemperatures,
      filteredHumidity
    );
    const tempVariance = calculateTemperatureVariance(filteredTemperatures);

    updateCharts(
      filteredDates,
      filteredTemperatures,
      filteredHumidity,
      heatIndex,
      tempVariance
    );
  }

  function calculateHeatIndex(temperatures, humidity) {
    return temperatures.map((temp, i) => {
      const RH = humidity[i];
      return (
        -42.379 +
        2.04901523 * temp +
        10.14333127 * RH -
        0.22475541 * temp * RH -
        6.83783 * 10 ** -3 * temp ** 2 -
        5.481717 * 10 ** -2 * RH ** 2 +
        1.22874 * 10 ** -3 * temp ** 2 * RH +
        8.5282 * 10 ** -4 * temp * RH ** 2 -
        1.99 * 10 ** -6 * temp ** 2 * RH ** 2
      );
    });
  }

  function calculateTemperatureVariance(temperatures) {
    const meanTemp =
      temperatures.reduce((a, b) => a + b, 0) / temperatures.length;
    return temperatures.map((temp) => Math.abs(temp - meanTemp));
  }

  function updateCharts(
    dates,
    temperatures,
    humidity,
    heatIndex,
    tempVariance
  ) {
    if (tempChart) tempChart.destroy();
    if (humidityChart) humidityChart.destroy();
    if (heatIndexChart) heatIndexChart.destroy();
    if (tempVarianceChart) tempVarianceChart.destroy();

    tempChart = new Chart(document.getElementById("temperatureChart"), {
      type: "line",
      data: {
        labels: dates,
        datasets: [
          {
            label: "Temperatura (°C)",
            data: temperatures,
            borderColor: "red",
            borderWidth: 2,
          },
        ],
      },
    });

    humidityChart = new Chart(document.getElementById("humidityChart"), {
      type: "line",
      data: {
        labels: dates,
        datasets: [
          {
            label: "Humedad (%)",
            data: humidity,
            borderColor: "blue",
            borderWidth: 2,
          },
        ],
      },
    });

    heatIndexChart = new Chart(document.getElementById("heatIndexChart"), {
      type: "line",
      data: {
        labels: dates,
        datasets: [
          {
            label: "Índice de Calor",
            data: heatIndex,
            borderColor: "orange",
            borderWidth: 2,
          },
        ],
      },
    });

    tempVarianceChart = new Chart(
      document.getElementById("tempVarianceChart"),
      {
        type: "bar",
        data: {
          labels: dates,
          datasets: [
            {
              label: "Variabilidad de Temperatura",
              data: tempVariance,
              backgroundColor: "green",
              borderWidth: 2,
            },
          ],
        },
      }
    );
  }

  fetchWeatherData();
});
