export const validateUserInfo = () => {
  const contactName = document.getElementById("contact-name").value;
  const contactEmail = document.getElementById("contact-email").value;
  const contactPhone = document.getElementById("contact-phone").value;

  if (!validateName(contactName)) {
    return null;
  }
  if (!validateEmail(contactEmail)) {
    return null;
  }
  if (!validatePhone(contactPhone)) {
    return null;
  }

  return { name: contactName, email: contactEmail, phone: contactPhone };
};

const validateName = (name) => {
  if (!name) {
    alert("請填寫姓名");
    return false;
  }
  return true;
};

const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email || !emailRegex.test(email)) {
    alert("請填寫正確的電子郵件地址");
    return false;
  }
  return true;
};

const validatePhone = (phone) => {
  const phoneRegex = /^09\d{8}$/;
  if (!phone || !phoneRegex.test(phone)) {
    alert("請填寫正確的手機號碼");
    return false;
  }
  return true;
};
