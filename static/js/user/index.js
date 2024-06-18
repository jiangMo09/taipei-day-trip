const loginRegister = document.getElementById("login-register");
const loginDialog = document.getElementById("loginDialog");

loginRegister.onclick = () => {
  loadLoginForm();
};

const loadLoginForm = () => {
  const xhttp = new XMLHttpRequest();
  xhttp.onreadystatechange = function () {
    if (this.readyState == 4 && this.status == 200) {
      loginDialog.innerHTML = this.responseText;
      loginDialog.style.display = "block";

      let closeBtn = document.getElementsByClassName("close")[0];
      closeBtn.onclick = function () {
        loginDialog.style.display = "none";
      };
      window.onclick = function (event) {
        if (event.target == loginDialog) {
          loginDialog.style.display = "none";
        }
      };

      const signupLink = document.getElementsByClassName("signup")[0];
      signupLink.onclick = function () {
        loadSignupForm();
      };
    }
  };
  xhttp.open("GET", "/static/singin.html", true);
  xhttp.send();
};

const loadSignupForm = () => {
  const xhttp = new XMLHttpRequest();
  xhttp.onreadystatechange = function () {
    if (this.readyState == 4 && this.status == 200) {
      loginDialog.innerHTML = this.responseText;

      const closeBtn = document.getElementsByClassName("close")[0];
      closeBtn.onclick = function () {
        loginDialog.style.display = "none";
      };
      window.onclick = function (event) {
        if (event.target == loginDialog) {
          loginDialog.style.display = "none";
        }
      };

      const signinLink = document.getElementsByClassName("signin")[0];
      signinLink.onclick = function () {
        loadLoginForm();
      };
    }
  };
  xhttp.open("GET", "/static/signup.html", true);
  xhttp.send();
};
