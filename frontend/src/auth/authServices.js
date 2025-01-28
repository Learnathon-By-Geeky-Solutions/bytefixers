import axios from "axios";
import { appConfig } from "../common/config";

const saveAuthUser = (authUser) =>
  localStorage.setItem(appConfig.CURRENT_USER_KEY, JSON.stringify(authUser));

const getAuthUser = () =>
  JSON.parse(localStorage.getItem(appConfig.CURRENT_USER_KEY));

export const isUserLoggedIn = () => Boolean(getAuthUser());

export const getAccessToken = () => getAuthUser()?.accessToken;

export const getRefreshToken = () => getAuthUser()?.refreshToken;

console.log(appConfig.BASE_URL);
export const signup = ({ name, email, password }) =>
  axios.post("http://localhost:4000/api/user/sign-up", {
    name,
    email,
    password,
  });

export const login = async ({ type, email, password, refreshToken }) => {
  const authUser = (
    await axios.post(`${appConfig.BASE_URL}/api/user/login`, {
      type,
      email,
      password,
      refreshToken,
    })
  ).data;

  saveAuthUser(authUser);
  return authUser;
};

export const logout = () => {
  localStorage.removeItem(appConfig.CURRENT_USER_KEY);
};
