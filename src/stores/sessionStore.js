const BASE_URL = import.meta.env.VITE_API_URL

// Services
import apiCaller from '@/services/apiCaller'

// Vue essentials
import { ref, watch } from 'vue'

// Core data
const userAccount = ref(null)
const user = ref(
  localStorage.getItem('user') 
    ? JSON.parse(localStorage.getItem('user')) 
    : { id: null, username: null, email: null }
);
const authToken = ref(localStorage.getItem('auth_token') || null);
const accessToken = ref(localStorage.getItem('access_token') || null);
const refreshToken = ref(localStorage.getItem('refresh_token') || null);
const pendingRequests = ref([]);
const accessRequests = ref([]);
const companies = ref([]);
const selectedCompany = ref(localStorage.getItem('selected_company') ? JSON.parse(localStorage.getItem('selected_company')) : null);
const isOwner = ref(false);

// Get data
const getters = {
  getAuthToken() {
    return authToken.value;
  },
  isOwner() {
    return isOwner.value;
  },
  getUserEmail() {
    return user.value.email;
  },
  getUserID() {
    return user.value.id;
  },
  isLoggedIn() {
    return authToken.value !== null;
  },
  getUserCompanies() {
    return companies.value;
  },
  getSelectedCompany() {
    return selectedCompany.value;
  },
  getPendingRequests() {
    return pendingRequests.value;
  },
  getAccessRequests() {
    return accessRequests.value;
  }
};

// Handle data update based on selectedCompany : isOwner
watch(() => selectedCompany.value, async (newCompany, oldCompany) => {
  if (!newCompany || newCompany.id === oldCompany?.id) {
    return; // Avoid unnecessary API calls for the same company
  }

  const response = await apiCaller.get(
    `accounts/${user.value.id}/companies/${newCompany.id}/fetch_account`
  );
  userAccount.value = response;
  isOwner.value = userAccount.value.is_owner; // Update ownership status

  localStorage.setItem('selected_company', JSON.stringify(newCompany));
  }
);

// Actions over data
const actions = {
  async registerUser(payload) {
    try {
      const response = await fetch(`${BASE_URL}users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      })
      const data = await response.json()
      if (response.ok) {
        actions.setUserInfo(data, response.headers.get('Authorization'))
      } else {
        throw new Error(data.message || 'Error registering user')
      }
    } catch (error) {
      console.error('Error:', error)
      throw error
    }
  },

  async initializeAuthState() {
    try {
      const savedUser = localStorage.getItem('user');
      const savedAuthToken = localStorage.getItem('auth_token');
      const savedSelectedCompany = localStorage.getItem('selected_company');
      
      if (savedUser) {
        user.value = JSON.parse(savedUser);
      }
    
      if (savedAuthToken) {
        authToken.value = savedAuthToken;
        await actions.fetchUserCompanies(); // Ensure `companies` is loaded
      }
  
      if (savedSelectedCompany) {
        const parsedCompany = JSON.parse(savedSelectedCompany);
  
        // Directly set `selectedCompany` to avoid unnecessary re-fetches
        selectedCompany.value = parsedCompany;
      }
    } catch (error) {
      console.error('Error during initializeAuthState:', error);
    }
  },

  async fetchPendingAccounts() {
      const response = await apiCaller.get(`accounts/${user.value.id}/pending_requests`);
      pendingRequests.value = response;

      return response;
  },

  async fetchAccessRequestAccounts() {
    const response = await apiCaller.get(`accounts/${user.value.id}/access_requests`);
    accessRequests.value = response;

    return response;
},

  async loginUser(payload) {
    try {
      const response = await fetch(`${BASE_URL}users/sign_in`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      })
      const data = await response.json()
      actions.setUserInfo(data, response.headers.get('Authorization'))

      await actions.fetchUserCompanies()
    } catch (error) {
      console.error('Error:', error)
      throw error
    }
  },

  async loginUserWithToken(token) {
    try {
      const response = await fetch(`${BASE_URL}member_data`, {
        method: 'GET',
        headers: {
          Authorization: token,
        },
      })
      const data = await response.json()
      if (response.ok) {
        actions.setUserInfoFromToken(data)
      } else {
        throw new Error(data.message || 'Error logging in with token')
      }
    } catch (error) {
      console.error('Error:', error)
      throw error
    }
  },

  async fetchUserCompanies() {
    const response = await apiCaller.get(`accounts/${user.value.id}/validated_companies_accounts`)
    companies.value = response;
    
    // Automatically select the first company as default if none is selected
    if (!selectedCompany.value && companies.value.length > 0) {
      await actions.setSelectedCompany(companies.value[0]);
    } else if (companies.value.length === 0) {
      selectedCompany.value = null; // Clear selected company if no companies exist
    }
  },

  async setSelectedCompany(company) {
    try {
      const response = await apiCaller.get(
        `accounts/${user.value.id}/companies/${company.id}/fetch_account`
      );
      userAccount.value = response;
  
      if (userAccount.value.status === 'accepted' || userAccount.value.is_owner) {
        selectedCompany.value = company; // Update reactive state
        isOwner.value = userAccount.value.is_owner; // Update ownership status
  
        localStorage.setItem('selected_company', JSON.stringify(company)); // Persist in localStorage
      } else {
        console.warn('Invalid company selection.');
        selectedCompany.value = null; 
        isOwner.value = false;
        localStorage.removeItem('selected_company');
      }
    } catch (error) {
      console.error('Error setting selected company:', error);
    }
  },

  async setPreselectedCompany(company) {
    selectedCompany.value = company;

    localStorage.setItem('selected_company', JSON.stringify(company));

    // Re-fetch and reinitialize the session data for the selected company
    await actions.initializeAuthState();

    // Re-trigger the necessary data fetching functions
    await actions.fetchPendingAccounts();
    await actions.fetchAccessRequestAccounts();
  },

  // Mutations (actions that directly modify state)
  setUserInfo(data, token) {
    // Store user data in localStorage
    localStorage.setItem('user', JSON.stringify(data.user));  // Store the user data, not resource_owner
    localStorage.setItem('auth_token', token);  // Persist the auth token
    
    // Update reactive state
    user.value = data.user;
    authToken.value = token;
  },
  

  setUserInfoFromToken(data) {
    // Store token and refresh token in localStorage
    localStorage.setItem('resource_owner', JSON.stringify(data.resource_owner));
    localStorage.setItem('refresh_token', data.refresh_token);
    localStorage.setItem('auth_token', data.token);  // Persist the access token
  
    // Update reactive state
    accessToken.value = data.token;
    refreshToken.value = data.refresh_token;
    user.value = data.resource_owner;

    console.log(localStorage);
  },

  resetUserInfo() {
    // Clear user and token data from localStorage
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('selected_company');
  
    // Clear reactive state
    user.value = {
      id: null,
      username: null,
      email: null,
    };
    authToken.value = null;
    accessToken.value = null;
    refreshToken.value = null;
    selectedCompany.value = null;
    pendingRequests.value = [];
    accessRequests.value = [];
    companies.value = [];
  
    console.log('User logged out, localStorage cleared:', localStorage);
  }
};

export default {
  getters,
  actions
};
