const AMAP_API_BASE_URL = "https://restapi.amap.com/v3";
const REQUEST_TIMEOUT = 8000;
const DEFAULT_LOCATION = { city: "广州黄埔", adcode: "440112" };

const request = async (path, params) => {
  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), REQUEST_TIMEOUT);

  try {
    const response = await fetch(
      `${AMAP_API_BASE_URL}${path}?${new URLSearchParams(params)}`,
      { signal: controller.signal }
    );
    if (!response.ok) throw new Error(`天气服务请求失败（HTTP ${response.status}）`);
    const data = await response.json();
    if (data.status !== "1") throw new Error(data.info || "天气服务返回异常");
    return data;
  } finally {
    window.clearTimeout(timeoutId);
  }
};

const getLocationByCoordinates = async (key, coordinates) => {
  const { latitude, longitude } = coordinates || {};
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null;

  const data = await request("/geocode/regeo", {
    key,
    location: `${longitude},${latitude}`,
    extensions: "base",
  });
  const address = data.regeocode?.addressComponent;
  if (!address?.adcode) return null;

  // 直辖市的 city 字段可能为空，依次使用区、城市、省份作为展示名称。
  const city = Array.isArray(address.city) ? address.city[0] : address.city;
  return {
    city: city || address.district || address.province,
    adcode: address.adcode,
  };
};

export const getCurrentWeather = async (key, coordinates) => {
  if (!key) throw new Error("天气服务尚未配置");

  let location = DEFAULT_LOCATION;
  try {
    const preciseLocation = await getLocationByCoordinates(key, coordinates);
    if (preciseLocation?.city) location = preciseLocation;
  } catch {
    // 浏览器定位反查不可用时，继续尝试 IP 定位。
  }

  if (location === DEFAULT_LOCATION) {
    try {
      const data = await request("/ip", { key });
      if (data.city && data.adcode) location = { city: data.city, adcode: data.adcode };
    } catch {
      // IP 定位不可用时使用默认城市，仍尝试获取天气。
    }
  }

  const data = await request("/weather/weatherInfo", { key, city: location.adcode });
  const weather = data.lives?.[0];
  if (!weather) throw new Error("天气服务未返回数据");
  return { adCode: location, weather };
};
