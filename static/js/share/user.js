import { fetchData } from "../utils/fetchData.js";
import { loadHeader } from "./header.js";
import { handleLoginRegister } from "./loginRegister.js";
import { createState } from "../utils/createState.js";

const isLoggedIn = createState(false);

const checkLoginStatus = async (loginRegister) => {
  const authToken = localStorage.getItem("authToken");
  if (!authToken) {
    return;
  }

  const data = await fetchData("/api/user/auth", {
    headers: {
      authToken: authToken
    }
  });

  isLoggedIn.setState(data.data !== null);
  updateLoginRegisterText(loginRegister);
};

const updateLoginRegisterText = (loginRegister) => {
  if (!loginRegister) {
    return;
  }

  loginRegister.textContent = isLoggedIn.getState() ? "登出系統" : "登入/註冊";
};

window.addEventListener("load", async () => {
  await loadHeader();

  const loginRegister = document.getElementById("login-register");
  const loginDialog = document.getElementById("loginDialog");
  const headerBooking = document.getElementById("headerBooking");

  const isBookingPage = window.location.pathname === "/booking";

  await checkLoginStatus(loginRegister);

  if (isBookingPage && !isLoggedIn.getState()) {
    window.location.href = "/";
    return;
  }

  headerBooking.onclick = () => {
    if (isLoggedIn.getState()) {
      window.location.href = "/booking";
      return;
    }

    handleLoginRegister(loginRegister, loginDialog, true);
    return;
  };

  handleLoginRegister(loginRegister, loginDialog);
});
