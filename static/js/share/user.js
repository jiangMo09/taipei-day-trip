import { fetchData } from "../utils/fetchData.js";
import { loadHeader } from "./header.js";
import { handleLoginRegister } from "./loginRegister.js";

const checkLoginStatus = async (loginRegister) => {
  const authToken = localStorage.getItem("authToken");
  if (authToken) {
    const data = await fetchData("/api/user/auth", {
      headers: {
        authToken: authToken
      }
    });

    updateLoginRegisterText(data.data !== null, loginRegister);
  } else {
    updateLoginRegisterText(false, loginRegister);
  }
};

const updateLoginRegisterText = (isLoggedIn, loginRegister) => {
  if (!loginRegister) {
    return;
  }

  loginRegister.textContent = isLoggedIn ? "登出系統" : "登入/註冊";
};

window.addEventListener("load", async () => {
  await loadHeader();

  const loginRegister = document.getElementById("login-register");
  const loginDialog = document.getElementById("loginDialog");

  handleLoginRegister(loginRegister, loginDialog);
  checkLoginStatus(loginRegister);
});
