<template>
  <div
    class="weather"
    v-if="weatherData.adCode.city && weatherData.weather.weather"
  >
    <span>{{ weatherData.adCode.city }}&nbsp;</span>
    <span>{{ weatherData.weather.weather }}&nbsp;</span>
    <span>{{ weatherData.weather.temperature }}℃</span>
    <span class="sm-hidden">
      &nbsp;{{
        weatherData.weather.winddirection?.endsWith("风")
          ? weatherData.weather.winddirection
          : weatherData.weather.winddirection + "风"
      }}&nbsp;
    </span>
    <span class="sm-hidden">{{ weatherData.weather.windpower }}&nbsp;级</span>
    <span v-if="isCached" class="sm-hidden">（上次缓存）</span>
  </div>
  <div class="weather" v-else>
    <span>{{ errorMessage }}</span>
  </div>
</template>

<script setup>
import { onMounted, reactive, ref } from "vue";
import { getCurrentWeather } from "@/api";

const mainKey = import.meta.env.VITE_WEATHER_KEY;
const WEATHER_CACHE_KEY = "homepage-weather-cache";
const WEATHER_CACHE_TTL = 30 * 60 * 1000;
const errorMessage = ref("正在获取天气数据…");
const isCached = ref(false);

const weatherData = reactive({
  adCode: { city: null, adcode: null },
  weather: {
    weather: null,
    temperature: null,
    winddirection: null,
    windpower: null,
  },
});

const applyWeather = (data, cached = false) => {
  if (!data?.adCode || !data?.weather) return;
  weatherData.adCode = { ...weatherData.adCode, ...data.adCode };
  weatherData.weather = { ...weatherData.weather, ...data.weather };
  isCached.value = cached;
  if (weatherData.adCode.city && weatherData.weather.weather) {
    errorMessage.value = "";
  }
};

const getCachedWeather = () => {
  try {
    const raw = localStorage.getItem(WEATHER_CACHE_KEY);
    if (!raw) return null;
    const cached = JSON.parse(raw);
    if (
      cached?.updatedAt &&
      Date.now() - cached.updatedAt < WEATHER_CACHE_TTL &&
      cached?.adCode?.city &&
      cached?.weather?.weather
    ) {
      return cached;
    }
    localStorage.removeItem(WEATHER_CACHE_KEY);
    return null;
  } catch (error) {
    console.warn("天气缓存读取失败:", error);
    return null;
  }
};

const restoreCachedWeather = () => {
  const cached = getCachedWeather();
  if (cached) applyWeather(cached, true);
};

const cacheWeather = (data) => {
  try {
    localStorage.setItem(
      WEATHER_CACHE_KEY,
      JSON.stringify({ ...data, updatedAt: Date.now() })
    );
  } catch (error) {
    console.warn("天气缓存写入失败:", error);
  }
};

const getBrowserCoordinates = () =>
  new Promise((resolve) => {
    if (!navigator.geolocation) {
      resolve(null);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      ({ coords }) =>
        resolve({ latitude: coords.latitude, longitude: coords.longitude }),
      () => resolve(null),
      { enableHighAccuracy: false, timeout: 6000, maximumAge: 10 * 60 * 1000 }
    );
  });

const getWeatherData = async () => {
  if (!mainKey) {
    errorMessage.value = "天气服务暂未配置";
    return;
  }

  const cached = getCachedWeather();
  if (cached) {
    applyWeather(cached, true);
  }

  try {
    const coordinates = await getBrowserCoordinates();
    const data = await getCurrentWeather(mainKey, coordinates);
    applyWeather(data, false);
    cacheWeather(data);
  } catch (error) {
    if (!cached) {
      errorMessage.value = error?.message || "天气数据获取失败";
    }
    console.warn("天气信息获取失败:", error);
  }
};

onMounted(() => {
  restoreCachedWeather();
  getWeatherData();
});
</script>
