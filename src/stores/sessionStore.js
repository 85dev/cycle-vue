const BASE_URL = import.meta.env.VITE_API_URL
import { ref } from 'vue'

const authToken = ref(null)
const accessToken = ref(null)
const refreshToken = ref(null)
const user = ref ({
  id: null,
  username: null,
  email: null,
})

const getters = {
  getAuthToken() {
    return authToken.value;
  },
  getUserEmail() {
    return user.value.email;
  },
  getUserID() {
    return user.value.id;  // Ensure you're accessing the correct key from the stored user object
  },
  isLoggedIn() {
    return authToken.value !== null;
  },
};

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

  initializeAuthState() {
    const savedUser = localStorage.getItem('user');
    const savedAuthToken = localStorage.getItem('auth_token');
    
    if (savedUser) {
      user.value = JSON.parse(savedUser);
    }
  
    if (savedAuthToken) {
      authToken.value = savedAuthToken;
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
      actions.setUserInfo(data, response.headers.get('Authorization'))
    } catch (error) {
      console.error('Error:', error)
      throw error
    }
  },

  async loginUserWithToken(token) {
    try {
      const response = await fetch(`${BASE_URL}member-data`, {
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

  // Mutations (actions that directly modify state)
  setUserInfo(data, token) {
    // Store user data in localStorage
    localStorage.setItem('user', JSON.stringify(data.user));  // Store the user data, not resource_owner
    localStorage.setItem('auth_token', token);  // Persist the auth token
    
    // Update reactive state
    user.value = data.user;
    authToken.value = token;
  
    // Log the current state of localStorage to verify
    console.log('Updated localStorage:', localStorage);
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
  
    // Clear reactive state
    user.value = {
      id: null,
      username: null,
      email: null,
    };
    authToken.value = null;
    accessToken.value = null;
    refreshToken.value = null;
  
    console.log('User logged out, localStorage cleared:', localStorage);
  },  
};

export default {
  getters,
  actions
};
