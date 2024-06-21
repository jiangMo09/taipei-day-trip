import { fetchData } from "../utils/fetchData.js";

const showResponseInfo = (message, isSuccess) => {
  const responseInfoDiv = document.querySelector(".response-info");
  if (!responseInfoDiv) {
    return;
  }

  responseInfoDiv.textContent = message;
  responseInfoDiv.style.display = "block";
  responseInfoDiv.style.color = isSuccess ? "green" : "red";
  setTimeout(() => {
    responseInfoDiv.style.display = "none";
  }, 5000);
};

const loadForm = async (url, formType, loginDialog) => {
  try {
    const response = await fetch(url);
    const html = await response.text();
    loginDialog.innerHTML = html;
    loginDialog.style.display = "block";

    loginDialog.addEventListener("click", (event) => {
      const { target } = event;
      if (target.classList.contains("close") || target === loginDialog) {
        loginDialog.style.display = "none";
      }
    });

    if (formType === "login") {
      const signupLink = document.getElementsByClassName("signup")[0];
      signupLink.onclick = () =>
        loadForm("/static/share/signup.html", "signup", loginDialog);

      document
        .getElementById("loginBtn")
        .addEventListener("click", async (event) => {
          event.preventDefault();

          const email = document.getElementById("email").value.trim();
          const password = document.getElementById("password").value.trim();

          if (!email || !password) {
            showResponseInfo("請填寫電子郵件和密碼", false);
            return;
          }

          const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (!emailPattern.test(email)) {
            showResponseInfo("請輸入有效的電子郵件地址", false);
            return;
          }

          const url = "/api/user/auth";
          try {
            const data = await fetchData(url, {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ email, password })
            });

            if (data.error) {
              showResponseInfo(data.message, false);
              return;
            }

            localStorage.setItem("authToken", data.token);
            location.reload();
          } catch (error) {
            console.error("Error logging in:", error);
            showResponseInfo("登入失敗，請稍後再試。", false);
          }
        });
    }

    if (formType === "signup") {
      const signinLink = document.getElementsByClassName("signin")[0];
      signinLink.onclick = () =>
        loadForm("/static/share/singin.html", "login", loginDialog);

      const nameInput = document.getElementById("name");
      const emailInput = document.getElementById("email");
      const passwordInput = document.getElementById("password");

      document
        .getElementById("signupBtn")
        .addEventListener("click", async (event) => {
          event.preventDefault();

          const name = nameInput.value.trim();
          const email = emailInput.value.trim();
          const password = passwordInput.value.trim();

          if (!name || !email || !password) {
            showResponseInfo("所有欄位都是必填的", false);
            return;
          }

          const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (!emailPattern.test(email)) {
            showResponseInfo("請輸入有效的電子郵件地址", false);
            return;
          }

          const url = "/api/user";
          try {
            const data = await fetchData(url, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ name, email, password })
            });

            if (data.ok) {
              showResponseInfo("註冊成功，請登入系統", true);
            }
            if (data.error) {
              showResponseInfo(data.message, false);
            }
          } catch (error) {
            showResponseInfo(error.message, false);
          }
        });
    }
  } catch (error) {
    console.error("Error fetching form:", error);
  }
};

export const handleLoginRegister = (loginRegister, loginDialog) => {
  loginRegister.onclick = () => {
    if (loginRegister.textContent !== "登出系統") {
      loadForm("/static/share/singin.html", "login", loginDialog);
      return;
    }

    localStorage.removeItem("authToken");
    location.reload();
  };
};
