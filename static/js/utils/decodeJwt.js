export const decodeJWT = (authToken) => {
  const [encodedHeader, encodedPayload, encodedSignature] =
    authToken.split(".");
  const decodedPayload = JSON.parse(atob(encodedPayload));
  return decodedPayload;
};
