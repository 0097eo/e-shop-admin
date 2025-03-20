export const loginUser = async (email, password) => {
  try {
    const response = await fetch('/api/accounts/login/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email, password })
    });
    
    if (!response.ok) {
      return { success: false, data: await response.json() };
    }
    
    const data = await response.json();
    return { success: true, data };
  } catch (error) {
    console.error('Login error:', error);
    return { success: false, error };
  }
};

export const storeUserData = (userData) => {
  const { refresh, access, user } = userData;
  localStorage.setItem("refresh", refresh);
  localStorage.setItem("access", access);
  localStorage.setItem("user", JSON.stringify(user));
};

export const getUserData = () => {
  try {
    const refresh = localStorage.getItem('refresh');
    const access = localStorage.getItem('access');
    const user = JSON.parse(localStorage.getItem('user'));
    
    if (refresh && access && user) {
      return { refresh, access, ...user };
    }
    
    return null;
  } catch (error) {
    console.error('Error retrieving user data:', error);
    return null;
  }
};

export const clearUserData = () => {
  localStorage.removeItem('refresh');
  localStorage.removeItem('access');
  localStorage.removeItem('user');
};