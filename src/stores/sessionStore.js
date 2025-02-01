const BASE_URL = import.meta.env.VITE_API_URL

import router from '@/router';
// Services
import apiCaller from '@/services/apiCaller'

// Vue essentials
import { ref, watch } from 'vue'

// Core data
const userAccount = ref(null)
const user = ref(localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')) : { id: null, username: null, email: null });
const authToken = ref(localStorage.getItem('auth_token') || null);
const accessToken = ref(localStorage.getItem('access_token') || null);
const refreshToken = ref(localStorage.getItem('refresh_token') || null);
const pendingRequests = ref(localStorage.getItem('pending_requests') ? JSON.parse(localStorage.getItem('pending_requests')) : []);
const accessRequests = ref(localStorage.getItem('access_requests') ? JSON.parse(localStorage.getItem('access_requests')) : []);
const companies = ref([]);
const selectedCompany = ref(localStorage.getItem('selected_company') ? JSON.parse(localStorage.getItem('selected_company')) : null);
const isOwner = ref(localStorage.getItem('is_owner') === 'true'); // Load from localStorage

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
    return user.value?.id || 0;
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

watch(isOwner, (newValue) => {
  localStorage.setItem('is_owner', newValue.toString()); // Persist as string ('true'/'false')
});

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
        router.push('/dashboard')
        return response
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
      const savedPendingRequests = localStorage.getItem('pending_requests');
      const savedAccessRequests = localStorage.getItem('access_requests');  
      
      if (savedUser) {
        user.value = JSON.parse(savedUser);
      }
    
      if (savedAuthToken) {
        authToken.value = savedAuthToken;
        await actions.fetchUserCompanies(); // Ensure `companies` is loaded
      }
  
      if (savedSelectedCompany) {
        const parsedCompany = JSON.parse(savedSelectedCompany);
        selectedCompany.value = parsedCompany;
      }

      if (savedPendingRequests) {
        pendingRequests.value = JSON.parse(savedPendingRequests); // Initialize pending requests
      }
      
      if (savedAccessRequests) {
        accessRequests.value = JSON.parse(savedAccessRequests); // Initialize access requests
      }
    } catch (error) {
      console.error('Error during initializeAuthState:', error);
    }
  },

  async fetchPendingAccounts() {
    if (user.value.id !== 0) { // Check if userId is not 0
      const response = await apiCaller.get(`accounts/${user.value.id}/pending_requests`);
      pendingRequests.value = response;
      localStorage.setItem('pending_requests', JSON.stringify(response)); // Persist to localStorage
  
      return response;
    } else {
      console.warn('fetchPendingAccounts: userId is 0. Skipping fetch.');
      return []; // Return an empty array if userId is 0
    }
  },
  
  async fetchAccessRequestAccounts() {
    if (user.value?.id) {
      const response = await apiCaller.get(`accounts/${user.value.id}/access_requests`);
      accessRequests.value = response;
      localStorage.setItem('access_requests', JSON.stringify(response)); // Persist to localStorage
  
      return response;
    } else {
      console.warn('fetchAccessRequestAccounts: userId is 0. Skipping fetch.');
      return []; // Return an empty array if userId is 0
    }
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
      if (response.ok) {
        actions.setUserInfo(data, response.headers.get('Authorization'))
        await actions.fetchUserCompanies()
        router.push('/dashboard')
        return { success: true, message: 'Login successful', data };
      } else {
        return { success: false, message: data.message || 'Login failed' };
      }
    } catch (error) {
      console.error('Error:', error)
      throw error
    }
  },

  async loginUserWithToken(token) {
    if (!accessToken.value && !refreshToken.value &&!authToken.value) {
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

    await actions.fetchPendingAccounts();
    await actions.fetchAccessRequestAccounts();
  },

  // Mutations (actions that directly modify state)
  setUserInfo(data, token) {
    localStorage.setItem('user', JSON.stringify(data.user));
    localStorage.setItem('auth_token', token);

    user.value = data.user;
    authToken.value = token;
  },
  

  setUserInfoFromToken(data) {
    localStorage.setItem('resource_owner', JSON.stringify(data.resource_owner));
    localStorage.setItem('refresh_token', data.refresh_token);
    localStorage.setItem('auth_token', data.token);
  
    accessToken.value = data.token;
    refreshToken.value = data.refresh_token;
    user.value = data.resource_owner;
  },

  resetUserInfo() {
    // Clear user and token data from localStorage
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('selected_company');
    localStorage.removeItem('pending_requests');
    localStorage.removeItem('access_requests');
  
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
    }
};

export default {
  getters,
  actions
};
