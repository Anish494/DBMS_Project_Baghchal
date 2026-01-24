import axios from "axios";

const BASE_URL = "http://127.0.0.1:8000/api";

// USER APIs
export const createUser = async (data) => {
  return axios.post(`${BASE_URL}/users/`, data);
};

export const getUsers = async () => {
  return axios.get(`${BASE_URL}/users/`);
};

// GAME APIs
export const createGame = async (data) => {
  return axios.post(`${BASE_URL}/games/`, data);
};

export const getGames = async () => {
  return axios.get(`${BASE_URL}/games/`);
};

// MOVE APIs
export const createMove = async (data) => {
  return axios.post(`${BASE_URL}/moves/`, data);
};

export const getMoves = async (gameId) => {
  return axios.get(`${BASE_URL}/moves/?game=${gameId}`);
};

// STATISTICS APIs
export const updateStatistics = async (data) => {
  return axios.post(`${BASE_URL}/statistics/`, data);
};

export const getStatistics = async (userId) => {
  return axios.get(`${BASE_URL}/statistics/?user=${userId}`);
};
