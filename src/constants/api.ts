import { Platform } from 'react-native';

// Android emulator uses 10.0.2.2 to reach host localhost
// iOS simulator uses localhost directly
const getBaseUrl = () => {
  // if (Platform.OS === 'android') return 'http://10.0.2.2:5000';
  // return 'http://localhost:5000';
  return 'https://meat-delivery-backend.jayantachungkrang3.workers.dev';
};

export const API_BASE_URL = getBaseUrl();
export const API_URL = `${API_BASE_URL}/api`;
export const SOCKET_URL = API_BASE_URL;
