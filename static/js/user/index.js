import { fetchData } from "../utils/fetchData.js";

const loginRegister = document.getElementById("login-register");
const loginDialog = document.getElementById("loginDialog");

loginRegister.onclick = () => {
  loadForm("/static/singin.html", "login");
};

const loadForm = async (url, formType) => {
  try {
    const response = await fetch(url);
    const html = await response.text();
    loginDialog.innerHTML = html;
    loginDialog.style.display = "block";

    const closeBtn = document.getElementsByClassName("close")[0];
    closeBtn.onclick = () => {
      loginDialog.style.display = "none";
    };
    window.onclick = (event) => {
      if (event.target === loginDialog) {
        loginDialog.style.display = "none";
      }
    };

    if (formType === "login") {
      const signupLink = document.getElementsByClassName("signup")[0];
      signupLink.onclick = () => {
        loadForm("/static/signup.html", "signup");
      };
    }

    if (formType === "signup") {
      const signinLink = document.getElementsByClassName("signin")[0];
      signinLink.onclick = () => {
        loadForm("/static/singin.html", "login");
      };

      const nameInput = document.getElementById("name");
      const emailInput = document.getElementById("email");
      const passwordInput = document.getElementById("password");

      document
        .getElementById("signupBtn")
        .addEventListener("click", async (event) => {
          event.preventDefault();

          const name = nameInput.value;
          const email = emailInput.value;
          const password = passwordInput.value;

          if (!name.trim() || !email.trim() || !password.trim()) {
            alert("所有欄位都是必填的");
            return;
          }

          const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (!emailPattern.test(email)) {
            alert("請輸入有效的電子郵件地址");
            return;
          }

          const url = "/api/user";
          try {
            const data = await fetchData(url, {
              method: "POST",
              headers: {
                "Content-Type": "application/json"
              },
              body: JSON.stringify({
                name: name,
                email: email,
                password: password
              })
            });

            const responseInfoDiv = document.querySelector(".response-info");
            if (!responseInfoDiv) {
              return;
            }

            if (data.ok) {
              responseInfoDiv.textContent = "註冊成功，請登入系統";
              responseInfoDiv.style.display = "block";
              responseInfoDiv.style.color = "green";
            } else if (data.error) {
              responseInfoDiv.textContent = data.message;
              responseInfoDiv.style.display = "block";
              responseInfoDiv.style.color = "red";
            }

            setTimeout(() => {
              responseInfoDiv.style.display = "none";
            }, 5000);
          } catch (error) {
            alert(error.message);
          }
        });
    }
  } catch (error) {
    console.error("Error fetching form:", error);
  }
};
