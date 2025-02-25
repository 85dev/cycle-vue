export function setCache(key, value, expirationMinutes = 10) {
    const now = new Date().getTime();
    const expiration = now + expirationMinutes * 60 * 1000; // Convert minutes to milliseconds
    const cacheData = { value, expiration };
    localStorage.setItem(key, JSON.stringify(cacheData));
  }
  
  export function getCache(key) {
    const cacheData = localStorage.getItem(key);
    if (!cacheData) return null;
  
    const { value, expiration } = JSON.parse(cacheData);
    if (new Date().getTime() > expiration) {
      localStorage.removeItem(key); // Remove expired cache
      return null;
    }
    return value;
  }