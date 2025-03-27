import axios from "axios";

const API_BASE_URL = "http://localhost:8000/api/v1";

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface SignUpData {
  username: string;
  email: string;
  password: string;
  role: "buyer" | "seller";
  street: string;
  city: string;
  country: string;
  postal_code: string;
}

export interface User {
  id: number;
  username: string;
  email: string;
  role: "buyer" | "seller";
  street: string;
  city: string;
  country: string;
  postal_code: string;
}

export const login = async (credentials: LoginCredentials): Promise<User> => {
  try {
    const response = await axios.post(`${API_BASE_URL}/user/login`, credentials);
    return response.data;
  } catch (error) {
    console.error("Login error:", error);
    throw error;
  }
};

export const signUp = async (data: SignUpData): Promise<User> => {
  try {
    const response = await axios.post(`${API_BASE_URL}/user`, data);
    return response.data;
  } catch (error) {
    console.error("Signup error:", error);
    throw error;
  }
}; 