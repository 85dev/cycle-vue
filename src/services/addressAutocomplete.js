const VITE_GEOAPIFY_KEY = import.meta.env.VITE_GEOAPIFY_KEY;
let timeout = null;

async function fetchAddressAutocomplete(address) {
  if (address === '') {
    return [];
  }

  if (timeout !== null) {
    clearTimeout(timeout);
  }

  return new Promise((resolve, reject) => {
    timeout = setTimeout(async () => {
      const url = `https://api.geoapify.com/v1/geocode/autocomplete?text=${address}&apiKey=${VITE_GEOAPIFY_KEY}`;

      try {
        const response = await fetch(url, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        const formattedAddresses = result.features.map(
          (feature) => feature.properties.formatted
        );
        resolve(formattedAddresses);
      } catch (error) {
        console.log('error', error);
        reject(error);
      }
    }, 350);
  });
}

export default { fetchAddressAutocomplete };